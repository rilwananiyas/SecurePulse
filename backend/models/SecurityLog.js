const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema(
  {
    // =====================================================
    // USER EMAIL
    // =====================================================

    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "Unknown",
    },

    // =====================================================
    // IP ADDRESS
    // =====================================================

    ip: {
      type: String,
      default: "Unknown",
    },

    // Backward/forward compatibility
    ipAddress: {
      type: String,
      default: "Unknown",
    },

    // =====================================================
    // USER AGENT
    // =====================================================

    userAgent: {
      type: String,
      default: "Unknown",
    },

    // =====================================================
    // DEVICE
    // =====================================================

    device: {
      type: String,
      default: "Unknown Device",
    },

    // =====================================================
    // SECURITY EVENT
    // =====================================================

    event: {
      type: String,

      enum: [
        // Authentication
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "LOGIN_BLOCKED",
        "LOGOUT",

        // Account locking
        "ACCOUNT_LOCKED",
        "ACCOUNT_UNLOCKED",
        "ACCOUNT_PERMANENTLY_LOCKED",
        "ACCOUNT_TEMPORARILY_LOCKED",
        "TEMPORARY_LOCK_REMOVED",

        // Account management
        "USER_CREATED",
        "USER_DELETED",
        "ROLE_CHANGED",

        // Security
        "PASSWORD_CHANGED",
        "PASSWORD_CHANGE_FAILED",
        "PASSWORD_RESET_REQUESTED",
        "ADMIN_ACCESS",

        // Suspicious activity
        "SUSPICIOUS_ACTIVITY",
        "UNAUTHORIZED_ACCESS",
      ],

      required: true,
    },

    // =====================================================
    // BACKWARD COMPATIBILITY
    // =====================================================

    eventType: {
      type: String,
      default: undefined,
    },

    // =====================================================
    // STATUS
    // =====================================================

    status: {
      type: String,
      enum: [
        "success",
        "failed",
        "warning",
        "blocked",
        "info",
      ],
      default: "info",
    },

    // =====================================================
    // SUSPICIOUS FLAG
    // =====================================================

    isSuspicious: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // NOTIFICATION FLAG
    // =====================================================

    notificationSent: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // DETAILS
    // =====================================================

    details: {
      type: String,
      default: "",
    },

    // =====================================================
    // MESSAGE
    // =====================================================

    message: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// COPY eventType → event
// =====================================================

securityLogSchema.pre("validate", function (next) {
  if (!this.event && this.eventType) {
    this.event = this.eventType;
  }

  next();
});

// =====================================================
// KEEP IP FIELDS SYNCHRONIZED
// =====================================================

securityLogSchema.pre("save", function (next) {
  if (
    (!this.ip || this.ip === "Unknown") &&
    this.ipAddress &&
    this.ipAddress !== "Unknown"
  ) {
    this.ip = this.ipAddress;
  }

  if (
    (!this.ipAddress || this.ipAddress === "Unknown") &&
    this.ip &&
    this.ip !== "Unknown"
  ) {
    this.ipAddress = this.ip;
  }

  next();
});

// =====================================================
// INDEXES
// =====================================================

securityLogSchema.index({
  email: 1,
  event: 1,
  createdAt: -1,
});

securityLogSchema.index({
  ip: 1,
  event: 1,
  createdAt: -1,
});

securityLogSchema.index({
  isSuspicious: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "SecurityLog",
  securityLogSchema
);