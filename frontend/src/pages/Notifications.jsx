import { useEffect, useState } from "react";
import axios from "axios";
import "./Notifications.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const Notifications = () => {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ==========================================================
  // GET TOKEN
  // ==========================================================
  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("authToken")
    );
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================
  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

    return new Date(date).toLocaleString(
      "en-LK",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // ==========================================================
  // GET EVENT LABEL
  // ==========================================================
  const getEventLabel = (notification) => {
    if (
      notification.type ===
      "FAILED_LOGIN"
    ) {
      return "5 Failed Login Attempts";
    }

    if (
      notification.type ===
      "UNUSUAL_IP"
    ) {
      return "Unusual IP Address";
    }

    if (
      notification.type ===
      "UNAUTHORIZED_ACCESS"
    ) {
      return "Unauthorized Access";
    }

    return (
      notification.event ||
      "Suspicious Activity"
    );
  };

  // ==========================================================
  // LOAD NOTIFICATIONS
  // ==========================================================
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError(
          "Not authorized. Please login again."
        );

        return;
      }

      const response =
        await axios.get(
          `${API_URL}/notifications`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (
        response.data &&
        Array.isArray(
          response.data.notifications
        )
      ) {
        setNotifications(
          response.data.notifications
        );
      } else if (
        Array.isArray(response.data)
      ) {
        setNotifications(
          response.data
        );
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error(
        "LOAD NOTIFICATIONS ERROR:",
        err
      );

      if (
        err.response?.status === 401
      ) {
        setError(
          "Not authorized. Your token is invalid or expired. Please login again."
        );
      } else if (
        err.response?.status === 403
      ) {
        setError(
          "You do not have permission to view notifications."
        );
      } else {
        setError(
          err.response?.data?.message ||
          "Unable to load security alerts."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // MARK AS READ
  // ==========================================================
  const markAsRead = async (id) => {
    try {
      const token = getToken();

      await axios.patch(
        `${API_URL}/notifications/${id}/read`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setNotifications(
        (previous) =>
          previous.map((item) =>
            item._id === id
              ? {
                  ...item,
                  isRead: true,
                }
              : item
          )
      );
    } catch (err) {
      console.error(
        "MARK NOTIFICATION READ ERROR:",
        err
      );
    }
  };

  // ==========================================================
  // MARK ALL AS READ
  // ==========================================================
  const markAllAsRead = async () => {
    try {
      const token = getToken();

      await axios.patch(
        `${API_URL}/notifications/read-all`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setNotifications(
        (previous) =>
          previous.map((item) => ({
            ...item,
            isRead: true,
          }))
      );
    } catch (err) {
      console.error(
        "MARK ALL READ ERROR:",
        err
      );
    }
  };

  // ==========================================================
  // LOAD ON PAGE OPEN
  // ==========================================================
  useEffect(() => {
    loadNotifications();

    const interval =
      setInterval(
        loadNotifications,
        30000
      );

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ==========================================================
  // LOADING
  // ==========================================================
  if (loading) {
    return (
      <div className="notifications-page">
        <div className="notifications-loading">
          Loading security alerts...
        </div>
      </div>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================
  if (error) {
    return (
      <div className="notifications-page">
        <div className="notifications-header">
          <div>
            <h1>Security Alerts</h1>
            <p>
              Monitor suspicious security activity
            </p>
          </div>
        </div>

        <div className="notifications-error">
          <div className="error-icon">
            !
          </div>

          <h3>
            Unable to load security alerts
          </h3>

          <p>{error}</p>

          <button
            onClick={loadNotifications}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================
  return (
    <div className="notifications-page">

      {/* HEADER */}
      <div className="notifications-header">

        <div>
          <span className="notifications-label">
            SECURITY CENTER
          </span>

          <h1>
            Security Alerts
          </h1>

          <p>
            Review suspicious activity detected
            by SecurePulse.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            className="mark-all-button"
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* EMPTY STATE */}
      {notifications.length === 0 ? (
        <div className="notifications-empty">

          <div className="empty-icon">
            ✓
          </div>

          <h2>
            No security alerts
          </h2>

          <p>
            No suspicious security activity
            has been detected.
          </p>

        </div>
      ) : (

        /* NOTIFICATION LIST */
        <div className="notifications-list">

          {notifications.map(
            (notification) => (

              <div
                key={notification._id}
                className={`notification-card ${
                  notification.isRead
                    ? "notification-read"
                    : "notification-unread"
                }`}
              >

                {/* TOP */}
                <div className="notification-top">

                  <div className="notification-title-area">

                    <div className="notification-icon">
                      !
                    </div>

                    <div>
                      <h2>
                        {notification.title ||
                          "Security Alert"}
                      </h2>

                      <span
                        className={`notification-status ${
                          notification.isRead
                            ? "read"
                            : "unread"
                        }`}
                      >
                        {notification.isRead
                          ? "Read"
                          : "New Alert"}
                      </span>
                    </div>

                  </div>

                  {!notification.isRead && (
                    <button
                      className="read-button"
                      onClick={() =>
                        markAsRead(
                          notification._id
                        )
                      }
                    >
                      Mark as read
                    </button>
                  )}

                </div>

                {/* MESSAGE */}
                <div className="notification-message">
                  {notification.message}
                </div>

                {/* DETAILS */}
                <div className="notification-details">

                  {/* NAME */}
                  <div className="notification-detail">

                    <span className="detail-label">
                      User Name
                    </span>

                    <span className="detail-value">
                      {notification.name ||
                        "Unknown User"}
                    </span>

                  </div>

                  {/* EMAIL */}
                  <div className="notification-detail">

                    <span className="detail-label">
                      Email
                    </span>

                    <span className="detail-value">
                      {notification.email ||
                        "Unknown"}
                    </span>

                  </div>

                  {/* EVENT */}
                  <div className="notification-detail">

                    <span className="detail-label">
                      Event
                    </span>

                    <span className="detail-value event-value">
                      {getEventLabel(
                        notification
                      )}
                    </span>

                  </div>

                  {/* IP */}
                  <div className="notification-detail">

                    <span className="detail-label">
                      IP Address
                    </span>

                    <span className="detail-value ip-value">
                      {notification.ipAddress ||
                        "Unknown IP"}
                    </span>

                  </div>

                  {/* TIME */}
                  <div className="notification-detail">

                    <span className="detail-label">
                      Time
                    </span>

                    <span className="detail-value">
                      {formatDate(
                        notification.createdAt
                      )}
                    </span>

                  </div>

                </div>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
};

export default Notifications;

