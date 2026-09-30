// ============================================================
// SECUREPULSE - BROWSER NOTIFICATION HELPER
// Step 1: Request browser notification permission
// ============================================================

/**
 * Check whether the browser supports notifications.
 */
export function isNotificationSupported() {
  return "Notification" in window;
}

/**
 * Get the current browser notification permission.
 *
 * Possible values:
 * - "default"  → User has not decided yet
 * - "granted"  → Notifications are allowed
 * - "denied"   → Notifications are blocked
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) {
    return "unsupported";
  }

  return Notification.permission;
}

/**
 * Request permission to send browser notifications.
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return {
      success: false,
      permission: "unsupported",
      message: "This browser does not support notifications.",
    };
  }

  // Already allowed
  if (Notification.permission === "granted") {
    return {
      success: true,
      permission: "granted",
      message: "Browser notifications are already enabled.",
    };
  }

  // Already blocked
  if (Notification.permission === "denied") {
    return {
      success: false,
      permission: "denied",
      message:
        "Browser notifications are blocked. Please enable them in your browser settings.",
    };
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      return {
        success: true,
        permission: "granted",
        message: "Browser notifications enabled successfully.",
      };
    }

    if (permission === "denied") {
      return {
        success: false,
        permission: "denied",
        message: "Browser notifications were denied.",
      };
    }

    return {
      success: false,
      permission: "default",
      message: "Browser notification permission was not granted.",
    };
  } catch (error) {
    console.error("Notification permission error:", error);

    return {
      success: false,
      permission: "error",
      message: "Unable to request notification permission.",
    };
  }
}

/**
 * Send a browser notification.
 *
 * This will be used in later steps when
 * SecurePulse detects login/security events.
 */
export function showBrowserNotification(title, options = {}) {
  if (!isNotificationSupported()) {
    console.warn("Browser notifications are not supported.");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("Browser notification permission is not granted.");
    return null;
  }

  try {
    const notification = new Notification(title, {
      body: options.body || "",
      icon: options.icon || "/favicon.ico",
      tag: options.tag || "securepulse-notification",
      requireInteraction: options.requireInteraction || false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (error) {
    console.error("Failed to show browser notification:", error);
    return null;
  }
}