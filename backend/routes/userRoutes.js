const express = require("express");

const {
  getUsers,
  getMyProfile,
  updateUserRole,
  toggleUserLock,
  temporaryLockUser,
  unlockTemporaryUser,
  deleteUser,
  updateNotificationSettings,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// =====================================================
// CURRENT USER PROFILE
// =====================================================
// Requires:
// 1. VALID JWT
// 2. USER OR ADMIN ROLE
//
// GET /api/users/profile
// =====================================================

router.get("/profile", protect, getMyProfile);

// =====================================================
// UPDATE NOTIFICATION SETTINGS
// =====================================================
// Requires:
// 1. VALID JWT
// 2. USER OR ADMIN ROLE
//
// PATCH /api/users/notification-settings
//
// Example body:
// {
//   "loginActivityAlerts": true,
//   "securityAlerts": false
// }
// =====================================================

router.patch(
  "/notification-settings",
  protect,
  updateNotificationSettings
);

// =====================================================
// ALL ADMIN USER-MANAGEMENT ROUTES REQUIRE
// 1. VALID JWT
// 2. ADMIN ROLE
// =====================================================

router.use(protect, requireRole("admin"));

// =====================================================
// GET ALL USERS
// GET /api/users
// =====================================================

router.get("/", getUsers);

// =====================================================
// CHANGE USER ROLE
// PATCH /api/users/:id/role
// =====================================================

router.patch("/:id/role", updateUserRole);

// =====================================================
// PERMANENT LOCK / UNLOCK
// PATCH /api/users/:id/lock
// =====================================================

router.patch("/:id/lock", toggleUserLock);

// =====================================================
// TEMPORARY LOCK
// PATCH /api/users/:id/temporary-lock
// =====================================================

router.patch(
  "/:id/temporary-lock",
  temporaryLockUser
);

// =====================================================
// REMOVE TEMPORARY LOCK
// PATCH /api/users/:id/remove-temporary-lock
// =====================================================

router.patch(
  "/:id/remove-temporary-lock",
  unlockTemporaryUser
);

// =====================================================
// DELETE USER
// DELETE /api/users/:id
// =====================================================

router.delete("/:id", deleteUser);

module.exports = router;