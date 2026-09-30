const User = require("../models/User");
const SecurityLog = require("../models/SecurityLog");
const Notification = require("../models/Notification");

// ============================================
// GET SECURITY SUMMARY
// ADMIN ONLY
// ============================================
async function getSummary(req, res) {
  try {
    const now = new Date();

    const [
      totalUsers,
      activeUsers,
      failedLogins,
      suspiciousEvents,
      lockedAccounts,
      successfulLogins,
    ] = await Promise.all([
      User.countDocuments(),

      User.countDocuments({
        isBlocked: { $ne: true },
        $or: [
          { lockUntil: null },
          { lockUntil: { $lte: now } },
        ],
      }),

      SecurityLog.countDocuments({
        event: "LOGIN_FAILED",
      }),

      SecurityLog.countDocuments({
        event: "SUSPICIOUS_ACTIVITY",
      }),

      User.countDocuments({
        $or: [
          { isBlocked: true },
          { lockUntil: { $gt: now } },
        ],
      }),

      SecurityLog.countDocuments({
        event: "LOGIN_SUCCESS",
      }),
    ]);

    const recentLogs = await SecurityLog.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      summary: {
        totalUsers,
        activeUsers,
        failedLogins,
        suspiciousEvents,
        lockedAccounts,
        successfulLogins,
      },
      recentLogs,
    });
  } catch (err) {
    console.error("Summary error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error fetching security summary",
    });
  }
}

// ============================================
// GET SECURITY LOGS
// ADMIN ONLY
// ============================================
async function getLogs(req, res) {
  try {
    let limit = Number(req.query.limit);

    if (!Number.isFinite(limit) || limit <= 0) {
      limit = 50;
    }

    limit = Math.min(Math.floor(limit), 200);

    const logs = await SecurityLog.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log(
      `Admin security logs returned: ${logs.length}`
    );

    return res.status(200).json(logs);
  } catch (err) {
    console.error("Logs error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error fetching security logs",
    });
  }
}

// ============================================
// GET ADMIN SECURITY NOTIFICATIONS
// ADMIN ONLY
// ============================================
async function getNotifications(req, res) {
  try {
    let limit = Number(req.query.limit);

    if (!Number.isFinite(limit) || limit <= 0) {
      limit = 50;
    }

    limit = Math.min(Math.floor(limit), 200);

    const notifications = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log(
      `Admin notifications returned: ${notifications.length}`
    );

    return res.status(200).json(notifications);
  } catch (err) {
    console.error("Notifications error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error fetching admin notifications",
    });
  }
}

// ============================================
// GET MY NOTIFICATIONS
// USER
// ============================================
async function getMyNotifications(req, res) {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user information not found",
      });
    }

    const userEmail = req.user.email;

    let limit = Number(req.query.limit);

    if (!Number.isFinite(limit) || limit <= 0) {
      limit = 50;
    }

    limit = Math.min(Math.floor(limit), 200);

    const notifications = await Notification.find({
      email: userEmail,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log(
      `User notifications returned for ${userEmail}: ${notifications.length}`
    );

    return res.status(200).json(notifications);
  } catch (err) {
    console.error("My notifications error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error fetching your notifications",
    });
  }
}

// ============================================
// MARK NOTIFICATION AS READ
// ============================================
async function markNotificationAsRead(req, res) {
  try {
    const notificationId = req.params.id;

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });
    }

    const notification = await Notification.findById(
      notificationId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    // Users can only modify their own notifications.
    // Admins can modify any notification.
    if (req.user.role !== "admin") {
      if (
        !notification.email ||
        notification.email !== req.user.email
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not allowed to modify this notification",
        });
      }
    }

    notification.isRead = true;

    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (err) {
    console.error(
      "Mark notification as read error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error marking notification as read",
    });
  }
}

// ============================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================
async function markAllNotificationsAsRead(req, res) {
  try {
    let filter = {};

    // USER
    if (req.user.role !== "admin") {
      if (!req.user.email) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user information not found",
        });
      }

      filter = {
        email: req.user.email,
      };
    }

    // ADMIN -> all notifications
    // USER  -> only their own notifications
    const result = await Notification.updateMany(
      filter,
      {
        $set: {
          isRead: true,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error(
      "Mark all notifications as read error:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error marking notifications as read",
    });
  }
}

// ============================================
// GET MY SECURITY LOGS
// USER
// ============================================
async function getMyLogs(req, res) {
  try {
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user information not found",
      });
    }

    const userEmail = req.user.email;

    let limit = Number(req.query.limit);

    if (!Number.isFinite(limit) || limit <= 0) {
      limit = 50;
    }

    limit = Math.min(Math.floor(limit), 200);

    const logs = await SecurityLog.find({
      email: userEmail,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    console.log(
      `User security logs returned for ${userEmail}: ${logs.length}`
    );

    return res.status(200).json(logs);
  } catch (err) {
    console.error("My logs error:", err);

    return res.status(500).json({
      success: false,
      message:
        "Server error fetching your security logs",
    });
  }
}

// ============================================
// EXPORT CONTROLLERS
// ============================================
module.exports = {
  getSummary,
  getLogs,
  getNotifications,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getMyLogs,
};