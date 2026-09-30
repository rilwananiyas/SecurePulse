const express = require("express");

const {
  getSummary,
  getLogs,
  getNotifications,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getMyLogs,
} = require("../controllers/securityController");

const protect = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// ==================================================
// ALL SECURITY ROUTES REQUIRE VALID JWT
// ==================================================
router.use(protect);

// ==================================================
// ADMIN SECURITY SUMMARY
// GET /api/security/summary
// ==================================================
router.get(
  "/summary",
  requireRole("admin"),
  getSummary
);

// ==================================================
// ADMIN SECURITY LOGS
// GET /api/security/logs
// ==================================================
router.get(
  "/logs",
  requireRole("admin"),
  getLogs
);

// ==================================================
// ADMIN NOTIFICATIONS
// GET /api/security/notifications
// ==================================================
router.get(
  "/notifications",
  requireRole("admin"),
  getNotifications
);

// ==================================================
// ADMIN MARK NOTIFICATION AS READ
// PATCH /api/security/notifications/:id/read
// ==================================================
router.patch(
  "/notifications/:id/read",
  requireRole("admin"),
  markNotificationAsRead
);

// ==================================================
// ADMIN MARK ALL NOTIFICATIONS AS READ
// PATCH /api/security/notifications/read-all
// ==================================================
router.patch(
  "/notifications/read-all",
  requireRole("admin"),
  markAllNotificationsAsRead
);

// ==================================================
// USER NOTIFICATIONS
// GET /api/security/my-notifications
// ==================================================
router.get(
  "/my-notifications",
  getMyNotifications
);

// ==================================================
// USER MARK NOTIFICATION AS READ
// PATCH /api/security/my-notifications/:id/read
// ==================================================
router.patch(
  "/my-notifications/:id/read",
  markNotificationAsRead
);

// ==================================================
// USER MARK ALL NOTIFICATIONS AS READ
// PATCH /api/security/my-notifications/read-all
// ==================================================
router.patch(
  "/my-notifications/read-all",
  markAllNotificationsAsRead
);

// ==================================================
// USER SECURITY LOGS
// GET /api/security/my-logs
// ==================================================
router.get(
  "/my-logs",
  getMyLogs
);

// ==================================================
// EXPORT ROUTER
// ==================================================
module.exports = router;