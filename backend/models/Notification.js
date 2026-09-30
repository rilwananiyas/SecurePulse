const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // =====================================================
    // NOTIFICATION AUDIENCE
    // =====================================================

    audience: {
      type: String,
      enum: ["admin", "user"],
      required: true,
      default: "admin",
      index: true,
    },

    // =====================================================
    // USER / RECIPIENT INFORMATION
    // =====================================================

    name: {
      type: String,
      trim: true,
      default: "Unknown User",
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "Unknown",
      index: true,
    },

    // Specific recipient for USER notifications.
    //
    // Admin notifications can keep this as null.
    //
    recipientEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
      index: true,
    },

    // =====================================================
    // NOTIFICATION TYPE
    // =====================================================

    type: {
      type: String,
      enum: [
        "FAILED_LOGIN",
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "UNUSUAL_IP",
        "UNAUTHORIZED_ACCESS",
        "SUSPICIOUS_ACTIVITY",

        "USER_CREATED",
        "USER_DELETED",

        "USER_BLOCKED",
        "USER_UNLOCKED",
        "ACCOUNT_TEMPORARILY_LOCKED",
        "ACCOUNT_PERMANENTLY_BLOCKED",

        "ROLE_CHANGED",

        "PASSWORD_CHANGED",
        "PASSWORD_CHANGE_FAILED",

        "PASSWORD_RESET_REQUESTED",
        "PASSWORD_RESET_COMPLETED",

        "PROFILE_UPDATED",
        "SECURITY_SETTINGS_CHANGED",
      ],
      required: true,
    },

    // =====================================================
    // SECURITY EVENT
    // =====================================================

    event: {
      type: String,
      trim: true,
      default: "SUSPICIOUS_ACTIVITY",
      index: true,
    },

    // =====================================================
    // TITLE
    // =====================================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // MESSAGE
    // =====================================================

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // IP ADDRESS
    // =====================================================

    ipAddress: {
      type: String,
      trim: true,
      default: "Unknown IP",
    },

    // =====================================================
    // DEVICE
    // =====================================================

    device: {
      type: String,
      trim: true,
      default: "Unknown Device",
    },

    // =====================================================
    // SECURITY LOG REFERENCE
    // =====================================================

    securityLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SecurityLog",
      default: null,
    },

    // =====================================================
    // READ STATUS
    // =====================================================

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
// =====================================================

notificationSchema.index({
  audience: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  audience: 1,
  createdAt: -1,
});

notificationSchema.index({
  recipientEmail: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  type: 1,
  createdAt: -1,
});

notificationSchema.index({
  email: 1,
  createdAt: -1,
});

notificationSchema.index({
  event: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);