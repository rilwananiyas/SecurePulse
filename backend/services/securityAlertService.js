const SecurityLog = require("../models/SecurityLog");
const Notification = require("../models/Notification");
const User = require("../models/User");

// ==================================================
// SECURITY THRESHOLDS
// ==================================================

const FAILED_LOGIN_THRESHOLD = 5;
const FAILED_LOGIN_WINDOW_MINUTES = 5;

const UNAUTHORIZED_ACCESS_THRESHOLD = 3;
const UNAUTHORIZED_ACCESS_WINDOW_MINUTES = 5;

// ==================================================
// TIME HELPER
// ==================================================

function getTimeAgo(minutes) {
  const date = new Date(Date.now() - minutes * 60 * 1000);
  return date;
}

// ==================================================
// CREATE ADMIN NOTIFICATION
// ==================================================
// Admin notifications are visible to administrators.
// They contain security events from users across the system.
// ==================================================

async function createAdminNotification({
  type,
  event,
  title,
  message,
  email,
  name,
  ipAddress,
  securityLogId,
}) {
  try {
    const notification = await Notification.create({
      recipientRole: "admin",
      recipientEmail: null,

      name: name || "Unknown User",
      email: email || "Unknown",

      type,
      event: event || type,

      title,
      message,

      ipAddress: ipAddress || "Unknown IP",

      securityLogId: securityLogId || null,

      isRead: false,
    });

    console.log(
      "ADMIN NOTIFICATION CREATED:",
      notification._id.toString()
    );

    return notification;
  } catch (error) {
    console.error(
      "Create admin notification error:",
      error.message
    );

    return null;
  }
}

// ==================================================
// CREATE USER NOTIFICATION
// ==================================================
// User notifications are ONLY visible to the affected user.
// ==================================================

async function createUserNotification({
  type,
  event,
  title,
  message,
  email,
  name,
  ipAddress,
  securityLogId,
}) {
  try {
    if (!email || email === "Unknown") {
      console.log(
        "USER NOTIFICATION SKIPPED: No valid user email."
      );

      return null;
    }

    const notification = await Notification.create({
      recipientRole: "user",
      recipientEmail: email.toLowerCase().trim(),

      name: name || "User",
      email: email.toLowerCase().trim(),

      type,
      event: event || type,

      title,
      message,

      ipAddress: ipAddress || "Unknown IP",

      securityLogId: securityLogId || null,

      isRead: false,
    });

    console.log(
      "USER NOTIFICATION CREATED:",
      notification._id.toString(),
      "FOR:",
      email
    );

    return notification;
  } catch (error) {
    console.error(
      "Create user notification error:",
      error.message
    );

    return null;
  }
}

// ==================================================
// GET USER DETAILS
// ==================================================
// Used when a security event only contains an email.
// This allows notifications to show the user's name.
// ==================================================

async function getUserDetails(email) {
  try {
    if (!email || email === "Unknown") {
      return {
        name: "Unknown User",
        email: email || "Unknown",
      };
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    })
      .select("name email role")
      .lean();

    if (!user) {
      return {
        name: "Unknown User",
        email,
      };
    }

    return {
      name: user.name || "Unknown User",
      email: user.email || email,
      role: user.role || "user",
    };
  } catch (error) {
    console.error(
      "Get user details error:",
      error.message
    );

    return {
      name: "Unknown User",
      email: email || "Unknown",
    };
  }
}

// ==================================================
// RECORD SECURITY EVENT
// ==================================================
// Stores security events in the SecurityLog collection.
// ==================================================

async function recordSecurityEvent({
  email,
  event,
  eventType,
  success,
  status,
  message,
  details,
  ip,
  device,
}) {
  try {
    const securityLog = await SecurityLog.create({
      email: email || "Unknown",
      event: event || "UNKNOWN_EVENT",
      eventType: eventType || event || "UNKNOWN_EVENT",

      success:
        typeof success === "boolean"
          ? success
          : status === "success",

      status:
        status ||
        (success === true ? "success" : "failed"),

      message:
        message ||
        details ||
        "Security event recorded.",

      details: details || message || "",

      ip: ip || "Unknown IP",

      device: device || "Unknown Device",
    });

    console.log(
      "SECURITY EVENT RECORDED:",
      securityLog.event,
      securityLog.email
    );

    return securityLog;
  } catch (error) {
    console.error(
      "Record security event error:",
      error.message
    );

    return null;
  }
}

// ==================================================
// FAILED LOGIN THRESHOLD
// ==================================================
// Detects 5 failed login attempts within 5 minutes.
//
// Admin:
//   Receives security alert.
//
// User:
//   Receives notification about multiple failed attempts.
//
// IMPORTANT:
// This keeps your existing working threshold logic.
// ==================================================

async function checkFailedLoginThreshold(email, ip) {
  try {
    console.log("");
    console.log("==========================================");
    console.log("CHECKING FAILED LOGIN THRESHOLD");
    console.log("==========================================");
    console.log("Email:", email);
    console.log("IP:", ip);

    if (!email) {
      console.log(
        "FAILED LOGIN CHECK SKIPPED: No email."
      );

      return null;
    }

    const windowStart = getTimeAgo(
      FAILED_LOGIN_WINDOW_MINUTES
    );

    // ------------------------------------------
    // COUNT FAILED LOGINS
    // ------------------------------------------

    const failedLoginCount =
      await SecurityLog.countDocuments({
        email: email.toLowerCase().trim(),

        event: "LOGIN_FAILED",

        createdAt: {
          $gte: windowStart,
        },

        $or: [
          {
            success: false,
          },
          {
            status: "failed",
          },
        ],
      });

    console.log(
      `Failed login count for ${email}:`,
      failedLoginCount
    );

    // ------------------------------------------
    // ONLY TRIGGER AT EXACT THRESHOLD
    // ------------------------------------------

    if (
      failedLoginCount !==
      FAILED_LOGIN_THRESHOLD
    ) {
      console.log(
        "Failed login threshold not reached."
      );

      return null;
    }

    console.log("");
    console.log(
      "5 FAILED LOGINS DETECTED!"
    );

    // ------------------------------------------
    // GET USER INFORMATION
    // ------------------------------------------

    const userDetails =
      await getUserDetails(email);

    // ------------------------------------------
    // CREATE SUSPICIOUS SECURITY LOG
    // ------------------------------------------

    const suspiciousLog =
      await SecurityLog.create({
        email: email.toLowerCase().trim(),

        event: "SUSPICIOUS_ACTIVITY",

        eventType: "FAILED_LOGIN",

        success: false,

        status: "suspicious",

        message:
          "Multiple failed login attempts detected.",

        details:
          `${FAILED_LOGIN_THRESHOLD} failed login attempts detected within ${FAILED_LOGIN_WINDOW_MINUTES} minutes.`,

        ip:
          ip ||
          "Unknown IP",

        device:
          "Unknown Device",

        notificationSent: true,
      });

    console.log(
      "SUSPICIOUS SECURITY LOG CREATED:",
      suspiciousLog._id.toString()
    );

    // ------------------------------------------
    // ADMIN NOTIFICATION
    // ------------------------------------------

    await createAdminNotification({
      type: "FAILED_LOGIN",

      event: "FAILED_LOGIN",

      title:
        "Multiple Failed Login Attempts",

      message:
        `${userDetails.name} (${userDetails.email}) had ${FAILED_LOGIN_THRESHOLD} failed login attempts within ${FAILED_LOGIN_WINDOW_MINUTES} minutes.`,

      name:
        userDetails.name,

      email:
        userDetails.email,

      ipAddress:
        ip,

      securityLogId:
        suspiciousLog._id,
    });

    // ------------------------------------------
    // USER NOTIFICATION
    // ------------------------------------------

    await createUserNotification({
      type: "FAILED_LOGIN",

      event: "FAILED_LOGIN",

      title:
        "Multiple Failed Login Attempts Detected",

      message:
        `We detected ${FAILED_LOGIN_THRESHOLD} failed login attempts on your account within ${FAILED_LOGIN_WINDOW_MINUTES} minutes. If this was not you, please review your account security.`,

      name:
        userDetails.name,

      email:
        userDetails.email,

      ipAddress:
        ip,

      securityLogId:
        suspiciousLog._id,
    });

    console.log(
      "ADMIN + USER FAILED LOGIN NOTIFICATIONS CREATED."
    );

    return suspiciousLog;
  } catch (error) {
    console.error(
      "Check failed login threshold error:",
      error.message
    );

    return null;
  }
}

// ==================================================
// UNUSUAL IP DETECTION
// ==================================================
// Detects successful login from a different IP.
//
// Admin:
//   Receives alert.
//
// User:
//   Receives alert because their account was accessed
//   from a new IP address.
// ==================================================

async function checkUnusualIp(email, currentIp) {
  try {
    console.log("");
    console.log("==========================================");
    console.log("CHECKING UNUSUAL IP");
    console.log("==========================================");
    console.log("Email:", email);
    console.log("Current IP:", currentIp);

    if (!email || !currentIp) {
      console.log(
        "UNUSUAL IP CHECK SKIPPED."
      );

      return null;
    }

    // ------------------------------------------
    // GET PREVIOUS SUCCESSFUL LOGIN
    // ------------------------------------------

    const previousLogins =
      await SecurityLog.find({
        email: email.toLowerCase().trim(),

        event: "LOGIN_SUCCESS",

        $or: [
          {
            success: true,
          },
          {
            status: "success",
          },
        ],
      })
        .sort({
          createdAt: -1,
        })
        .limit(2)
        .lean();

    // ------------------------------------------
    // NEED AT LEAST 2 LOGINS
    // ------------------------------------------

    if (previousLogins.length < 2) {
      console.log(
        "Not enough login history for unusual IP detection."
      );

      return null;
    }

    const latestLogin =
      previousLogins[0];

    const previousLogin =
      previousLogins[1];

    const previousIp =
      previousLogin.ip;

    console.log(
      "Previous IP:",
      previousIp
    );

    // ------------------------------------------
    // SAME IP = NORMAL
    // ------------------------------------------

    if (
      !previousIp ||
      previousIp === currentIp
    ) {
      console.log(
        "IP is normal. No unusual IP detected."
      );

      return null;
    }

    console.log("");
    console.log(
      "UNUSUAL IP DETECTED!"
    );

    // ------------------------------------------
    // GET USER DETAILS
    // ------------------------------------------

    const userDetails =
      await getUserDetails(email);

    // ------------------------------------------
    // CREATE SECURITY LOG
    // ------------------------------------------

    const suspiciousLog =
      await SecurityLog.create({
        email: email.toLowerCase().trim(),

        event: "SUSPICIOUS_ACTIVITY",

        eventType: "UNUSUAL_IP",

        success: false,

        status: "suspicious",

        message:
          "Login detected from a new IP address.",

        details:
          `Previous IP: ${previousIp}. Current IP: ${currentIp}.`,

        ip:
          currentIp,

        device:
          "Unknown Device",

        notificationSent: true,
      });

    console.log(
      "UNUSUAL IP SECURITY LOG CREATED:",
      suspiciousLog._id.toString()
    );

    // ------------------------------------------
    // ADMIN NOTIFICATION
    // ------------------------------------------

    await createAdminNotification({
      type: "UNUSUAL_IP",

      event: "UNUSUAL_IP",

      title:
        "Unusual Login Location Detected",

      message:
        `${userDetails.name} (${userDetails.email}) logged in from a new IP address.`,

      name:
        userDetails.name,

      email:
        userDetails.email,

      ipAddress:
        currentIp,

      securityLogId:
        suspiciousLog._id,
    });

    // ------------------------------------------
    // USER NOTIFICATION
    // ------------------------------------------

    await createUserNotification({
      type: "UNUSUAL_IP",

      event: "UNUSUAL_IP",

      title:
        "New Login Location Detected",

      message:
        `Your account was accessed from a new IP address (${currentIp}). If this was not you, please review your account security immediately.`,

      name:
        userDetails.name,

      email:
        userDetails.email,

      ipAddress:
        currentIp,

      securityLogId:
        suspiciousLog._id,
    });

    console.log(
      "ADMIN + USER UNUSUAL IP NOTIFICATIONS CREATED."
    );

    return suspiciousLog;
  } catch (error) {
    console.error(
      "Check unusual IP error:",
      error.message
    );

    return null;
  }
}

// ==================================================
// UNAUTHORIZED ACCESS DETECTION
// ==================================================
// Detects 3 unauthorized attempts from same IP
// within 5 minutes.
//
// Admin:
//   Receives security alert.
//
// User:
//   Receives notification only when a valid email
//   is available.
// ==================================================

async function checkUnauthorizedAccess(
  email,
  ip
) {
  try {
    console.log("");
    console.log("==========================================");
    console.log("CHECKING UNAUTHORIZED ACCESS");
    console.log("==========================================");
    console.log("Email:", email);
    console.log("IP:", ip);

    if (!ip) {
      console.log(
        "UNAUTHORIZED ACCESS CHECK SKIPPED: No IP."
      );

      return null;
    }

    const windowStart =
      getTimeAgo(
        UNAUTHORIZED_ACCESS_WINDOW_MINUTES
      );

    // ------------------------------------------
    // COUNT UNAUTHORIZED ATTEMPTS
    // ------------------------------------------

    const unauthorizedCount =
      await SecurityLog.countDocuments({
        ip: ip,

        event: "UNAUTHORIZED_ACCESS",

        createdAt: {
          $gte: windowStart,
        },

        $or: [
          {
            success: false,
          },
          {
            status: "failed",
          },
        ],
      });

    console.log(
      `Unauthorized access count for ${ip}:`,
      unauthorizedCount
    );

    // ------------------------------------------
    // ONLY TRIGGER AT EXACT THRESHOLD
    // ------------------------------------------

    if (
      unauthorizedCount !==
      UNAUTHORIZED_ACCESS_THRESHOLD
    ) {
      console.log(
        "Unauthorized access threshold not reached."
      );

      return null;
    }

    console.log("");
    console.log(
      "3 UNAUTHORIZED ACCESS ATTEMPTS DETECTED!"
    );

    // ------------------------------------------
    // USER DETAILS
    // ------------------------------------------

    const userDetails =
      await getUserDetails(email);

    // ------------------------------------------
    // CREATE SECURITY LOG
    // ------------------------------------------

    const suspiciousLog =
      await SecurityLog.create({
        email:
          email ||
          "Unknown",

        event:
          "SUSPICIOUS_ACTIVITY",

        eventType:
          "UNAUTHORIZED_ACCESS",

        success:
          false,

        status:
          "suspicious",

        message:
          "Multiple unauthorized access attempts detected.",

        details:
          `${UNAUTHORIZED_ACCESS_THRESHOLD} unauthorized access attempts detected from IP ${ip} within ${UNAUTHORIZED_ACCESS_WINDOW_MINUTES} minutes.`,

        ip:
          ip,

        device:
          "Unknown Device",

        notificationSent:
          true,
      });

    console.log(
      "UNAUTHORIZED ACCESS SECURITY LOG CREATED:",
      suspiciousLog._id.toString()
    );

    // ------------------------------------------
    // ADMIN NOTIFICATION
    // ------------------------------------------

    await createAdminNotification({
      type:
        "UNAUTHORIZED_ACCESS",

      event:
        "UNAUTHORIZED_ACCESS",

      title:
        "Multiple Unauthorized Access Attempts",

      message:
        `Multiple unauthorized access attempts were detected from IP ${ip}.`,

      name:
        userDetails.name,

      email:
        userDetails.email,

      ipAddress:
        ip,

      securityLogId:
        suspiciousLog._id,
    });

    // ------------------------------------------
    // USER NOTIFICATION
    // ------------------------------------------
    // Only create this when we know which user
    // the event belongs to.
    // ------------------------------------------

    if (
      email &&
      email !== "Unknown"
    ) {
      await createUserNotification({
        type:
          "UNAUTHORIZED_ACCESS",

        event:
          "UNAUTHORIZED_ACCESS",

        title:
          "Suspicious Access Attempt Detected",

        message:
          `Multiple unauthorized access attempts were detected on your account from IP ${ip}. Please review your account security.`,

        name:
          userDetails.name,

        email:
          userDetails.email,

        ipAddress:
          ip,

        securityLogId:
          suspiciousLog._id,
      });
    }

    console.log(
      "ADMIN + USER UNAUTHORIZED ACCESS NOTIFICATIONS CREATED."
    );

    return suspiciousLog;
  } catch (error) {
    console.error(
      "Check unauthorized access error:",
      error.message
    );

    return null;
  }
}

// ==================================================
// SIMPLE USER SECURITY NOTIFICATION HELPERS
// ==================================================
// These helpers can be used from authController and
// userController for events such as:
//
// LOGIN_SUCCESS
// LOGIN_FAILED
// LOGIN_BLOCKED
// PASSWORD_CHANGED
// PASSWORD_CHANGE_FAILED
// PASSWORD_RESET_REQUESTED
// ROLE_CHANGED
// ACCOUNT_LOCKED
// ACCOUNT_UNLOCKED
// ==================================================

async function notifyUserLoginSuccess({
  email,
  name,
  ipAddress,
  securityLogId,
}) {
  return createUserNotification({
    type: "LOGIN_SUCCESS",

    event: "LOGIN_SUCCESS",

    title:
      "Successful Login Detected",

    message:
      `A successful login was detected on your SecurePulse account from IP ${ipAddress || "Unknown IP"}.`,

    name,
    email,

    ipAddress,

    securityLogId,
  });
}

// ==================================================

async function notifyUserLoginFailed({
  email,
  name,
  ipAddress,
  securityLogId,
}) {
  return createUserNotification({
    type: "LOGIN_FAILED",

    event: "LOGIN_FAILED",

    title:
      "Failed Login Attempt",

    message:
      `A failed login attempt was detected on your SecurePulse account from IP ${ipAddress || "Unknown IP"}.`,

    name,
    email,

    ipAddress,

    securityLogId,
  });
}

// ==================================================

async function notifyUserLoginBlocked({
  email,
  name,
  ipAddress,
  message,
  securityLogId,
}) {
  return createUserNotification({
    type: "LOGIN_BLOCKED",

    event: "LOGIN_BLOCKED",

    title:
      "Login Blocked",

    message:
      message ||
      "A login attempt to your SecurePulse account was blocked.",

    name,
    email,

    ipAddress,

    securityLogId,
  });
}

// ==================================================

async function notifyUserPasswordChanged({
  email,
  name,
  ipAddress,
  securityLogId,
}) {
  return createUserNotification({
    type: "PASSWORD_CHANGED",

    event: "PASSWORD_CHANGED",

    title:
      "Password Changed Successfully",

    message:
      "Your SecurePulse account password was changed successfully.",

    name,
    email,

    ipAddress,

    securityLogId,
  });
}

// ==================================================

async function notifyUserPasswordChangeFailed({
  email,
  name,
  ipAddress,
  securityLogId,
}) {
  return createUserNotification({
    type: "PASSWORD_CHANGE_FAILED",

    event: "PASSWORD_CHANGE_FAILED",

    title:
      "Password Change Failed",

    message:
      "A password change attempt failed because the current password was incorrect.",

    name,
    email,

    ipAddress,

    securityLogId,
  });
}

// ==================================================

async function notifyUserPasswordResetRequested({
  email,
  name,
  ipAddress,
  securityLogId,
}) {
  return createUserNotification({
    type: "PASSWORD_RESET_REQUESTED",

    event: "PASSWORD_RESET_REQUESTED",

    title:
      "Password Reset Requested",

    message:
      "A password reset was requested for your SecurePulse account. If you did not request this, please review your account security.",

    name,
    email,

    ipAddress,

    securityLogId,
  });
}

// ==================================================

async function notifyUserRoleChanged({
  email,
  name,
  newRole,
  securityLogId,
}) {
  return createUserNotification({
    type: "ROLE_CHANGED",

    event: "ROLE_CHANGED",

    title:
      "Account Role Updated",

    message:
      `Your SecurePulse account role has been changed to ${newRole || "updated role"}.`,

    name,
    email,

    ipAddress: "System",

    securityLogId,
  });
}

// ==================================================

async function notifyUserAccountLocked({
  email,
  name,
  lockType,
  securityLogId,
}) {
  return createUserNotification({
    type: "ACCOUNT_LOCKED",

    event: "ACCOUNT_LOCKED",

    title:
      "Account Locked",

    message:
      lockType === "permanent"
        ? "Your SecurePulse account has been permanently locked by an administrator."
        : "Your SecurePulse account has been temporarily locked by an administrator.",

    name,
    email,

    ipAddress: "System",

    securityLogId,
  });
}

// ==================================================

async function notifyUserAccountUnlocked({
  email,
  name,
  securityLogId,
}) {
  return createUserNotification({
    type: "ACCOUNT_UNLOCKED",

    event: "ACCOUNT_UNLOCKED",

    title:
      "Account Unlocked",

    message:
      "Your SecurePulse account has been unlocked by an administrator.",

    name,
    email,

    ipAddress: "System",

    securityLogId,
  });
}

// ==================================================
// EXPORTS
// ==================================================

module.exports = {
  // Core notification functions
  createAdminNotification,
  createUserNotification,

  // Security logging
  recordSecurityEvent,

  // Security detection
  checkFailedLoginThreshold,
  checkUnusualIp,
  checkUnauthorizedAccess,

  // User notification helpers
  notifyUserLoginSuccess,
  notifyUserLoginFailed,
  notifyUserLoginBlocked,
  notifyUserPasswordChanged,
  notifyUserPasswordChangeFailed,
  notifyUserPasswordResetRequested,
  notifyUserRoleChanged,
  notifyUserAccountLocked,
  notifyUserAccountUnlocked,
};