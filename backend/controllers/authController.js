const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const SecurityLog = require("../models/SecurityLog");

const {
  recordSecurityEvent,
  checkFailedLoginThreshold,
  checkUnusualIp,
} = require("../services/securityAlertService");

// =====================================================
// CREATE JWT TOKEN
// =====================================================

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    }
  );
}

// =====================================================
// GET DEVICE INFORMATION
// =====================================================

function getDeviceInfo(req) {
  return req.headers["user-agent"] || "Unknown device";
}

// =====================================================
// GET CLIENT IP
// =====================================================

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "Unknown IP"
  );
}

// =====================================================
// CREATE SECURITY LOG
// =====================================================

async function logEvent({
  email,
  event,
  success,
  ipAddress,
  device,
  details,
  status,
}) {
  try {
    await recordSecurityEvent({
      email,
      event,
      success,
      ipAddress,
      device,
      details,
      status: status || (success ? "success" : "failed"),
    });
  } catch (error) {
    console.error("Security log error:", error.message);
  }
}

// =====================================================
// REGISTER
// =====================================================

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "user",
    });

    await logEvent({
      email: user.email,
      event: "USER_CREATED",
      success: true,
      ipAddress: getClientIp(req),
      device: getDeviceInfo(req),
      details: "New user account created.",
      status: "success",
    });

    return res.status(201).json({
      message: "Registration successful.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Server error during registration.",
    });
  }
}

// =====================================================
// LOGIN
// =====================================================

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const clientIp = getClientIp(req);
    const device = getDeviceInfo(req);

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    // -------------------------------------------------
    // USER DOES NOT EXIST
    // -------------------------------------------------

    if (!user) {
      await logEvent({
        email: normalizedEmail,
        event: "LOGIN_FAILED",
        success: false,
        ipAddress: clientIp,
        device,
        details: "Login attempt for non-existing account.",
        status: "failed",
      });

      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // -------------------------------------------------
    // PERMANENTLY BLOCKED
    // -------------------------------------------------

    if (user.isBlocked) {
      await logEvent({
        email: user.email,
        event: "LOGIN_BLOCKED",
        success: false,
        ipAddress: clientIp,
        device,
        details: "Login attempt on permanently blocked account.",
        status: "blocked",
      });

      return res.status(403).json({
        message:
          "Your account has been permanently blocked. Please contact an administrator.",
      });
    }

    // -------------------------------------------------
    // TEMPORARY LOCK
    // -------------------------------------------------

    if (
      user.lockUntil &&
      new Date(user.lockUntil).getTime() > Date.now()
    ) {
      await logEvent({
        email: user.email,
        event: "LOGIN_BLOCKED",
        success: false,
        ipAddress: clientIp,
        device,
        details: `Account temporarily locked until ${user.lockUntil}.`,
        status: "blocked",
      });

      return res.status(403).json({
        message: `Your account is temporarily locked until ${new Date(
          user.lockUntil
        ).toLocaleString()}.`,
      });
    }

    // -------------------------------------------------
    // CLEAR EXPIRED TEMPORARY LOCK
    // -------------------------------------------------

    if (
      user.lockUntil &&
      new Date(user.lockUntil).getTime() <= Date.now()
    ) {
      user.lockUntil = null;
      user.failedLoginAttempts = 0;

      await user.save();
    }

    // -------------------------------------------------
    // CHECK PASSWORD
    // -------------------------------------------------

    const passwordCorrect = await user.comparePassword(password);

    // -------------------------------------------------
    // WRONG PASSWORD
    // -------------------------------------------------

    if (!passwordCorrect) {
      user.failedLoginAttempts =
        (user.failedLoginAttempts || 0) + 1;

      await user.save();

      await logEvent({
        email: user.email,
        event: "LOGIN_FAILED",
        success: false,
        ipAddress: clientIp,
        device,
        details: `Incorrect password. Failed attempt ${user.failedLoginAttempts}.`,
        status: "failed",
      });

      await checkFailedLoginThreshold({
        email: user.email,
        ipAddress: clientIp,
        device,
      });

      return res.status(401).json({
        message: "Invalid email or password.",
        failedAttempts: user.failedLoginAttempts,
      });
    }

    // -------------------------------------------------
    // SUCCESSFUL LOGIN
    // -------------------------------------------------

    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();

    await user.save();

    await logEvent({
      email: user.email,
      event: "LOGIN_SUCCESS",
      success: true,
      ipAddress: clientIp,
      device,
      details: "Successful login.",
      status: "success",
    });

    await checkUnusualIp({
      email: user.email,
      ipAddress: clientIp,
      device,
    });

    const token = signToken(user);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Server error during login.",
    });
  }
}

// =====================================================
// GET CURRENT USER PROFILE
// =====================================================

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    let accountStatus = "Active";

    if (user.isBlocked) {
      accountStatus = "Permanently Blocked";
    } else if (
      user.lockUntil &&
      new Date(user.lockUntil).getTime() > Date.now()
    ) {
      accountStatus = "Temporarily Locked";
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus,
        isBlocked: user.isBlocked,
        lockUntil: user.lockUntil,
        failedLoginAttempts: user.failedLoginAttempts,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      message: "Server error while getting profile.",
    });
  }
}

// =====================================================
// GET CURRENT USER ACTIVITY
// =====================================================

async function getUserActivity(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const logs = await SecurityLog.find({
      email: user.email,
    })
      .sort({
        createdAt: -1,
      })
      .limit(100);

    let accountStatus = "Active";

    if (user.isBlocked) {
      accountStatus = "Permanently Blocked";
    } else if (
      user.lockUntil &&
      new Date(user.lockUntil).getTime() > Date.now()
    ) {
      accountStatus = "Temporarily Locked";
    }

    return res.status(200).json({
      accountStatus,
      logs,
    });
  } catch (error) {
    console.error("Get user activity error:", error);

    return res.status(500).json({
      message: "Server error while getting activity.",
    });
  }
}

// =====================================================
// CHANGE PASSWORD
// =====================================================

async function changePassword(req, res) {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message:
          "Current password, new password and confirmation are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters long.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New passwords do not match.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message:
          "New password must be different from your current password.",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const passwordCorrect =
      await user.comparePassword(currentPassword);

    if (!passwordCorrect) {
      await logEvent({
        email: user.email,
        event: "PASSWORD_CHANGE_FAILED",
        success: false,
        ipAddress: getClientIp(req),
        device: getDeviceInfo(req),
        details: "Incorrect current password.",
        status: "failed",
      });

      return res.status(401).json({
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;

    await user.save();

    await logEvent({
      email: user.email,
      event: "PASSWORD_CHANGED",
      success: true,
      ipAddress: getClientIp(req),
      device: getDeviceInfo(req),
      details: "User successfully changed their password.",
      status: "success",
    });

    return res.status(200).json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Server error while changing password.",
    });
  }
}

// =====================================================
// FORGOT PASSWORD
// =====================================================

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!email) {
      return res.status(400).json({
        message: "Email address is required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    console.log("=================================");
    console.log("PASSWORD RESET REQUEST RECEIVED");
    console.log("Requested Email:", normalizedEmail);
    console.log("=================================");

    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // -------------------------------------------------
    // USER NOT FOUND
    // -------------------------------------------------

    if (!user) {
      console.log("❌ USER NOT FOUND");
      console.log("Email:", normalizedEmail);
      console.log(
        "No password reset link was generated."
      );
      console.log("=================================");

      return res.status(200).json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // -------------------------------------------------
    // USER FOUND
    // -------------------------------------------------

    console.log("✅ USER FOUND");
    console.log("Name:", user.name);
    console.log("Email:", user.email);

    // -------------------------------------------------
    // CREATE RESET TOKEN
    // -------------------------------------------------

    const resetToken =
      crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetTokenExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = resetTokenExpires;

    await user.save({
      validateBeforeSave: false,
    });

    // -------------------------------------------------
    // CREATE RESET URL
    // -------------------------------------------------

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const resetUrl =
      `${frontendUrl}/reset-password/${resetToken}`;

    console.log("=================================");
    console.log("PASSWORD RESET LINK GENERATED");
    console.log("Email:", user.email);
    console.log("Reset URL:", resetUrl);
    console.log("Expires:", resetTokenExpires);
    console.log("=================================");

    // -------------------------------------------------
    // CHECK ENVIRONMENT VARIABLES
    // -------------------------------------------------

    console.log("EMAIL USER:", process.env.EMAIL_USER);

    console.log(
      "EMAIL PASS EXISTS:",
      !!process.env.EMAIL_PASS
    );

    console.log(
      "EMAIL PASS LENGTH:",
      process.env.EMAIL_PASS
        ? process.env.EMAIL_PASS.length
        : 0
    );

    // -------------------------------------------------
    // CREATE EMAIL TRANSPORTER
    // -------------------------------------------------

    const transporter =
      nodemailer.createTransport({
        host:
          process.env.EMAIL_HOST ||
          "smtp.gmail.com",

        port:
          Number(process.env.EMAIL_PORT) ||
          587,

        secure: false,

        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

    // -------------------------------------------------
    // VERIFY SMTP CONNECTION
    // -------------------------------------------------

    await transporter.verify();

    console.log("SMTP CONNECTION SUCCESSFUL");

    // -------------------------------------------------
    // SEND EMAIL
    // -------------------------------------------------

    const info = await transporter.sendMail({
      from:
        `"SecurePulse" <${process.env.EMAIL_USER}>`,

      to: user.email,

      subject:
        "SecurePulse - Password Reset Request",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 30px auto;
          padding: 30px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        ">

          <h2 style="
            color: #2563eb;
            margin-bottom: 20px;
          ">
            SecurePulse
          </h2>

          <h3>
            Password Reset Request
          </h3>

          <p>
            Hello ${user.name},
          </p>

          <p>
            We received a request to reset your
            SecurePulse account password.
          </p>

          <p>
            Click the button below to create a new password.
          </p>

          <div style="
            margin: 30px 0;
          ">

            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 13px 25px;
                background: #2563eb;
                color: #ffffff;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              "
            >
              Reset Password
            </a>

          </div>

          <p>
            This password reset link will expire in
            <strong>15 minutes</strong>.
          </p>

          <p>
            If you did not request a password reset,
            you can safely ignore this email.
          </p>

          <hr style="
            margin: 25px 0;
            border: none;
            border-top: 1px solid #e2e8f0;
          ">

          <p style="
            color: #64748b;
            font-size: 13px;
          ">
            SecurePulse Security System
          </p>

        </div>
      `,
    });

    // -------------------------------------------------
    // EMAIL DEBUG
    // -------------------------------------------------

    console.log("=================================");
    console.log("EMAIL SENT SUCCESSFULLY");
    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    console.log("Response:", info.response);
    console.log("=================================");

    // -------------------------------------------------
    // SECURITY LOG
    // -------------------------------------------------

    await logEvent({
      email: user.email,
      event: "PASSWORD_RESET_REQUESTED",
      success: true,
      ipAddress: getClientIp(req),
      device: getDeviceInfo(req),
      details: "Password reset email requested.",
      status: "success",
    });

    // -------------------------------------------------
    // FINAL RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });

  } catch (error) {

    console.error("=================================");
    console.error("FORGOT PASSWORD EMAIL ERROR");
    console.error("Error:", error.message);
    console.error("Code:", error.code);
    console.error("Command:", error.command);
    console.error("Response:", error.response);
    console.error("=================================");

    return res.status(500).json({
      message:
        "Unable to process the password reset request.",
    });
  }
}

// =====================================================
// RESET PASSWORD
// =====================================================

async function resetPassword(req, res) {
  try {
    const { token } = req.params;

    const {
      password,
      confirmPassword,
    } = req.body;

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!token) {
      return res.status(400).json({
        message:
          "Password reset token is required.",
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        message:
          "New password and confirmation are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match.",
      });
    }

    // -------------------------------------------------
    // HASH TOKEN
    // -------------------------------------------------

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // -------------------------------------------------
    // FIND USER
    // -------------------------------------------------

    const user = await User.findOne({
      passwordResetToken: hashedToken,

      passwordResetExpires: {
        $gt: new Date(),
      },
    }).select(
      "+passwordResetToken +passwordResetExpires"
    );

    // -------------------------------------------------
    // INVALID / EXPIRED TOKEN
    // -------------------------------------------------

    if (!user) {
      return res.status(400).json({
        message:
          "Password reset link is invalid or has expired.",
      });
    }

    // -------------------------------------------------
    // SET NEW PASSWORD
    // -------------------------------------------------

    user.password = password;

    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    user.failedLoginAttempts = 0;

    await user.save();

    // -------------------------------------------------
    // SECURITY LOG
    // -------------------------------------------------

    await logEvent({
      email: user.email,
      event: "PASSWORD_CHANGED",
      success: true,
      ipAddress: getClientIp(req),
      device: getDeviceInfo(req),
      details:
        "Password successfully reset using password reset link.",
      status: "success",
    });

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      message:
        "Password reset successfully. You can now log in with your new password.",
    });

  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message:
        "Server error while resetting password.",
    });
  }
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  register,
  login,
  getProfile,
  getUserActivity,
  changePassword,
  forgotPassword,
  resetPassword,
};