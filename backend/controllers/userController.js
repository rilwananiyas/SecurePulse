const User = require("../models/User");
const SecurityLog = require("../models/SecurityLog");

// =====================================================
// HELPER: GET CURRENT USER ID
// =====================================================

function getCurrentUserId(req) {
  return req.user?.id || req.user?._id;
}

// =====================================================
// GET ALL USERS
// GET /api/users
// =====================================================

async function getUsers(req, res) {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    const now = new Date();

    const formattedUsers = users.map((user) => {
      let status = "Active";

      if (user.isBlocked === true) {
        status = "Permanently Locked";
      } else if (
        user.lockUntil &&
        new Date(user.lockUntil) > now
      ) {
        status = "Temporarily Locked";
      }

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status,
        isBlocked: user.isBlocked,
        lockUntil: user.lockUntil || null,
        failedLoginAttempts:
          user.failedLoginAttempts || 0,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin || null,

        // Notification settings
        loginActivityAlerts:
          user.loginActivityAlerts,
        securityAlerts:
          user.securityAlerts,
      };
    });

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
}

// =====================================================
// GET CURRENT USER PROFILE
// GET /api/users/profile
// =====================================================

async function getMyProfile(req, res) {
  try {
    const currentUserId = getCurrentUserId(req);

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findById(currentUserId)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const now = new Date();

    let status = "Active";

    if (user.isBlocked === true) {
      status = "Permanently Locked";
    } else if (
      user.lockUntil &&
      new Date(user.lockUntil) > now
    ) {
      status = "Temporarily Locked";
    }

    return res.status(200).json({
      success: true,

      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,

      status,

      isBlocked: user.isBlocked,
      lockUntil: user.lockUntil || null,

      failedLoginAttempts:
        user.failedLoginAttempts || 0,

      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      lastLogin: user.lastLogin || null,

      // =================================================
      // NOTIFICATION SETTINGS
      // =================================================

      loginActivityAlerts:
        user.loginActivityAlerts !== false,

      securityAlerts:
        user.securityAlerts !== false,
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
}

// =====================================================
// UPDATE NOTIFICATION SETTINGS
// PATCH /api/users/notification-settings
// =====================================================

async function updateNotificationSettings(req, res) {
  try {
    const currentUserId = getCurrentUserId(req);

    // -------------------------------------------------
    // CHECK AUTHENTICATION
    // -------------------------------------------------

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // -------------------------------------------------
    // GET VALUES FROM REQUEST
    // -------------------------------------------------

    const {
      loginActivityAlerts,
      securityAlerts,
    } = req.body;

    // -------------------------------------------------
    // VALIDATE VALUES
    // -------------------------------------------------

    if (
      typeof loginActivityAlerts !== "boolean" ||
      typeof securityAlerts !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "loginActivityAlerts and securityAlerts must be true or false.",
      });
    }

    // -------------------------------------------------
    // FIND CURRENT USER
    // -------------------------------------------------

    const user = await User.findById(currentUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // -------------------------------------------------
    // UPDATE SETTINGS
    // -------------------------------------------------

    user.loginActivityAlerts =
      loginActivityAlerts;

    user.securityAlerts =
      securityAlerts;

    await user.save();

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Notification settings updated successfully.",

      settings: {
        loginActivityAlerts:
          user.loginActivityAlerts,

        securityAlerts:
          user.securityAlerts,
      },
    });
  } catch (error) {
    console.error(
      "Update notification settings error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update notification settings.",
      error: error.message,
    });
  }
}

// =====================================================
// UPDATE USER ROLE
// PATCH /api/users/:id/role
// =====================================================

async function updateUserRole(req, res) {
  try {
    const currentUserId = getCurrentUserId(req);
    const targetUserId = req.params.id;

    const { role } = req.body;

    // -------------------------------------------------
    // VALIDATE ROLE
    // -------------------------------------------------

    if (!["admin", "user"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Use admin or user.",
      });
    }

    // -------------------------------------------------
    // CANNOT CHANGE OWN ROLE
    // -------------------------------------------------

    if (
      String(currentUserId) ===
      String(targetUserId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role.",
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // -------------------------------------------------
    // CANNOT DEMOTE LAST ADMIN
    // -------------------------------------------------

    if (
      targetUser.role === "admin" &&
      role === "user"
    ) {
      const adminCount = await User.countDocuments({
        role: "admin",
      });

      if (adminCount <= 1) {
        return res.status(403).json({
          success: false,
          message:
            "Cannot demote the last administrator.",
        });
      }
    }

    const oldRole = targetUser.role;

    targetUser.role = role;

    await targetUser.save();

    // -------------------------------------------------
    // SECURITY LOG
    // -------------------------------------------------

    try {
      await SecurityLog.create({
        user: targetUser._id,
        eventType: "ROLE_CHANGED",
        description:
          `User role changed from ${oldRole} to ${role}`,
        ipAddress:
          req.ip ||
          req.headers["x-forwarded-for"] ||
          "Unknown",
        userAgent:
          req.headers["user-agent"] ||
          "Unknown",
      });
    } catch (logError) {
      console.error(
        "Role change security log error:",
        logError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: `User role changed to ${role}.`,
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
}

// =====================================================
// PERMANENT LOCK / UNLOCK USER
// PATCH /api/users/:id/lock
// =====================================================

async function toggleUserLock(req, res) {
  try {
    const currentUserId = getCurrentUserId(req);
    const targetUserId = req.params.id;

    // -------------------------------------------------
    // CANNOT LOCK YOURSELF
    // -------------------------------------------------

    if (
      String(currentUserId) ===
      String(targetUserId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot lock your own account.",
      });
    }

    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // -------------------------------------------------
    // UNLOCK PERMANENTLY
    // -------------------------------------------------

    if (user.isBlocked === true) {
      user.isBlocked = false;
      user.lockUntil = null;

      await user.save();

      try {
        await SecurityLog.create({
          user: user._id,
          eventType: "ACCOUNT_UNLOCKED",
          description:
            "Permanent account lock removed by administrator",
          ipAddress:
            req.ip ||
            req.headers["x-forwarded-for"] ||
            "Unknown",
          userAgent:
            req.headers["user-agent"] ||
            "Unknown",
        });
      } catch (logError) {
        console.error(
          "Unlock security log error:",
          logError.message
        );
      }

      return res.status(200).json({
        success: true,
        message: "Permanent lock removed.",
      });
    }

    // -------------------------------------------------
    // PERMANENT LOCK
    // -------------------------------------------------

    user.isBlocked = true;
    user.lockUntil = null;

    await user.save();

    try {
      await SecurityLog.create({
        user: user._id,
        eventType: "PERMANENT_LOCK",
        description:
          "User permanently locked by administrator",
        ipAddress:
          req.ip ||
          req.headers["x-forwarded-for"] ||
          "Unknown",
        userAgent:
          req.headers["user-agent"] ||
          "Unknown",
      });
    } catch (logError) {
      console.error(
        "Permanent lock security log error:",
        logError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "User permanently locked.",
    });
  } catch (error) {
    console.error("Toggle user lock error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change account lock status",
      error: error.message,
    });
  }
}

// =====================================================
// TEMPORARY LOCK USER
// PATCH /api/users/:id/temporary-lock
// =====================================================

async function temporaryLockUser(req, res) {
  try {
    const currentUserId = getCurrentUserId(req);
    const targetUserId = req.params.id;

    const { duration } = req.body;

    // -------------------------------------------------
    // CANNOT LOCK YOURSELF
    // -------------------------------------------------

    if (
      String(currentUserId) ===
      String(targetUserId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot temporarily lock your own account.",
      });
    }

    // -------------------------------------------------
    // VALID DURATIONS
    // -------------------------------------------------

    const allowedDurations = [
      15,
      30,
      60,
      360,
      720,
      1440,
    ];

    const minutes = Number(duration);

    if (!allowedDurations.includes(minutes)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid duration. Allowed: 15, 30, 60, 360, 720, or 1440 minutes.",
      });
    }

    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // -------------------------------------------------
    // DO NOT TEMPORARILY LOCK PERMANENTLY LOCKED USER
    // -------------------------------------------------

    if (user.isBlocked === true) {
      return res.status(400).json({
        success: false,
        message:
          "This user is permanently locked. Remove the permanent lock first.",
      });
    }

    // -------------------------------------------------
    // SET TEMPORARY LOCK
    // -------------------------------------------------

    const lockUntil = new Date(
      Date.now() + minutes * 60 * 1000
    );

    user.lockUntil = lockUntil;
    user.isBlocked = false;

    await user.save();

    try {
      await SecurityLog.create({
        user: user._id,
        eventType: "TEMPORARY_LOCK",
        description:
          `User temporarily locked for ${minutes} minutes`,
        ipAddress:
          req.ip ||
          req.headers["x-forwarded-for"] ||
          "Unknown",
        userAgent:
          req.headers["user-agent"] ||
          "Unknown",
      });
    } catch (logError) {
      console.error(
        "Temporary lock security log error:",
        logError.message
      );
    }

    return res.status(200).json({
      success: true,
      message:
        `User temporarily locked for ${minutes} minutes.`,
      lockUntil,
    });
  } catch (error) {
    console.error(
      "Temporary lock user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to temporarily lock user",
      error: error.message,
    });
  }
}

// =====================================================
// REMOVE TEMPORARY LOCK
// PATCH /api/users/:id/remove-temporary-lock
// =====================================================

async function unlockTemporaryUser(req, res) {
  try {
    const currentUserId = getCurrentUserId(req);
    const targetUserId = req.params.id;

    // -------------------------------------------------
    // CANNOT APPLY TO SELF
    // -------------------------------------------------

    if (
      String(currentUserId) ===
      String(targetUserId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot change your own lock status.",
      });
    }

    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // -------------------------------------------------
    // DO NOT REMOVE PERMANENT LOCK HERE
    // -------------------------------------------------

    if (user.isBlocked === true) {
      return res.status(400).json({
        success: false,
        message:
          "This is a permanent lock. Use the permanent unlock action.",
      });
    }

    user.lockUntil = null;

    await user.save();

    try {
      await SecurityLog.create({
        user: user._id,
        eventType: "TEMPORARY_UNLOCK",
        description:
          "Temporary account lock removed by administrator",
        ipAddress:
          req.ip ||
          req.headers["x-forwarded-for"] ||
          "Unknown",
        userAgent:
          req.headers["user-agent"] ||
          "Unknown",
      });
    } catch (logError) {
      console.error(
        "Temporary unlock security log error:",
        logError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "Temporary lock removed.",
    });
  } catch (error) {
    console.error(
      "Remove temporary lock error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to remove temporary lock",
      error: error.message,
    });
  }
}

// =====================================================
// DELETE USER
// DELETE /api/users/:id
// =====================================================

async function deleteUser(req, res) {
  try {
    const currentUserId = getCurrentUserId(req);
    const targetUserId = req.params.id;

    // -------------------------------------------------
    // CANNOT DELETE YOURSELF
    // -------------------------------------------------

    if (
      String(currentUserId) ===
      String(targetUserId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // -------------------------------------------------
    // CANNOT DELETE LAST ADMIN
    // -------------------------------------------------

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({
        role: "admin",
      });

      if (adminCount <= 1) {
        return res.status(403).json({
          success: false,
          message:
            "Cannot delete the last administrator.",
        });
      }
    }

    await User.findByIdAndDelete(targetUserId);

    try {
      await SecurityLog.create({
        eventType: "USER_DELETED",
        description:
          `User ${user.email} was deleted by administrator`,
        ipAddress:
          req.ip ||
          req.headers["x-forwarded-for"] ||
          "Unknown",
        userAgent:
          req.headers["user-agent"] ||
          "Unknown",
      });
    } catch (logError) {
      console.error(
        "Delete security log error:",
        logError.message
      );
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("Delete user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
}

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
  getUsers,
  getMyProfile,
  updateNotificationSettings,
  updateUserRole,
  toggleUserLock,
  temporaryLockUser,
  unlockTemporaryUser,
  deleteUser,
};