
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// =====================================================
// USER SCHEMA
// =====================================================

const userSchema = new mongoose.Schema(
  {
    // ===================================================
    // BASIC INFORMATION
    // ===================================================

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,

      // Correct email validation
      match: [
        /^\S+@\S+\.\S+$/,
        "Invalid email format",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },

    // ===================================================
    // PASSWORD RESET
    // ===================================================

    passwordResetToken: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // ===================================================
    // USER ROLE
    // ===================================================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // ===================================================
    // FAILED LOGIN MONITORING
    // ===================================================

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    // ===================================================
    // LAST LOGIN
    // ===================================================

    lastLogin: {
      type: Date,
      default: null,
    },

    // ===================================================
    // TEMPORARY LOCK
    //
    // null       = not temporarily locked
    // future date = temporarily locked
    // past date  = lock has expired
    // ===================================================

    lockUntil: {
      type: Date,
      default: null,
    },

    // ===================================================
    // PERMANENT ADMIN BLOCK
    //
    // true  = permanently blocked by administrator
    // false = not permanently blocked
    // ===================================================

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // ===================================================
    // NOTIFICATION SETTINGS
    // ===================================================

    loginActivityAlerts: {
      type: Boolean,
      default: true,
    },

    securityAlerts: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// HASH PASSWORD BEFORE SAVE
// =====================================================

userSchema.pre("save", async function (next) {
  // Do not hash password again if password was not changed
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);

    this.password = await bcrypt.hash(
      this.password,
      salt
    );

    next();
  } catch (error) {
    next(error);
  }
});

// =====================================================
// COMPARE PASSWORD
// =====================================================

userSchema.methods.comparePassword = function (
  candidatePassword
) {
  return bcrypt.compare(
    candidatePassword,
    this.password
  );
};

// =====================================================
// VIRTUAL: TEMPORARY LOCK STATUS
// =====================================================

userSchema.virtual("isTemporarilyLocked").get(function () {
  return !!(
    this.lockUntil &&
    this.lockUntil > new Date()
  );
});

// =====================================================
// VIRTUAL: OVERALL LOCK STATUS
// =====================================================

userSchema.virtual("isLocked").get(function () {
  const temporarilyLocked =
    this.lockUntil &&
    this.lockUntil > new Date();

  return this.isBlocked || temporarilyLocked;
});

// =====================================================
// VIRTUAL: LOCK TYPE
// =====================================================

userSchema.virtual("lockType").get(function () {
  if (this.isBlocked) {
    return "permanent";
  }

  if (
    this.lockUntil &&
    this.lockUntil > new Date()
  ) {
    return "temporary";
  }

  return null;
});

// =====================================================
// INCLUDE VIRTUALS WHEN CONVERTING TO JSON
// =====================================================

userSchema.set("toJSON", {
  virtuals: true,
});

userSchema.set("toObject", {
  virtuals: true,
});

// =====================================================
// EXPORT MODEL
// =====================================================

module.exports = mongoose.model(
  "User",
  userSchema
);

