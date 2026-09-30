
const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  getProfile,
  getUserActivity,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================
// LOGIN RATE LIMITER
// ============================================

const loginLimiter = rateLimit({
  windowMs:
    (Number(process.env.LOGIN_WINDOW_MINUTES) || 5) *
    60 *
    1000,

  max:
    Number(process.env.LOGIN_MAX_ATTEMPTS) || 5,

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message:
      "Too many login attempts from this IP. Please try again later.",
  },
});

// ============================================
// AUTH ROUTES
// ============================================

// Register
router.post("/register", register);

// Login
router.post("/login", loginLimiter, login);

// ============================================
// FORGOT PASSWORD
// NO LOGIN REQUIRED
// ============================================

router.post(
  "/forgot-password",
  forgotPassword
);

// ============================================
// RESET PASSWORD
// NO LOGIN REQUIRED
// ============================================

router.post(
  "/reset-password/:token",
  resetPassword
);

// ============================================
// CURRENT USER PROFILE
// LOGIN REQUIRED
// ============================================

router.get(
  "/me",
  protect,
  getProfile
);

// ============================================
// CURRENT USER ACTIVITY
// LOGIN REQUIRED
// ============================================

router.get(
  "/activity",
  protect,
  getUserActivity
);

// ============================================
// CHANGE PASSWORD
// LOGIN REQUIRED
// ============================================

router.patch(
  "/change-password",
  protect,
  changePassword
);

// ============================================
// EXPORT ROUTER
// ============================================

module.exports = router;

