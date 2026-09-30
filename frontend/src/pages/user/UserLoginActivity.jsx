
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserSidebar from "../../components/UserSidebar";
import "./UserLoginActivity.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const UserLoginActivity = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH LOGIN ACTIVITY
  // =====================================================
  useEffect(() => {
    const fetchLoginActivity = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/auth/activity`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login");
          return;
        }

        const data = await response.json();

        console.log(
          "User Login Activity:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to load login activity."
          );
        }

        const activityLogs = Array.isArray(data)
          ? data
          : Array.isArray(data.logs)
          ? data.logs
          : Array.isArray(data.activity)
          ? data.activity
          : [];

        setLogs(activityLogs);
      } catch (err) {
        console.error(
          "Login activity error:",
          err
        );

        setError(
          err.message ||
            "Unable to load login activity."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLoginActivity();
  }, [navigate]);

  // =====================================================
  // FORMAT DATE
  // =====================================================
  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =====================================================
  // GET DATE
  // =====================================================
  const getDate = (log) => {
    return (
      log?.createdAt ||
      log?.timestamp ||
      log?.date ||
      log?.time
    );
  };

  // =====================================================
  // GET STATUS
  // =====================================================
  const getStatus = (log) => {
    const value =
      log?.event ||
      log?.eventType ||
      log?.status ||
      log?.action ||
      log?.type ||
      "";

    const status = String(value)
      .toUpperCase()
      .replace(/[\s-]/g, "_");

    if (
      status.includes("FAILED") ||
      status.includes("FAILURE") ||
      status.includes("INVALID")
    ) {
      return {
        text: "Failed",
        className: "failed",
      };
    }

    if (
      status.includes("BLOCKED") ||
      status.includes("LOCKED")
    ) {
      return {
        text: "Blocked",
        className: "blocked",
      };
    }

    if (
      status.includes("SUSPICIOUS") ||
      status.includes("ALERT")
    ) {
      return {
        text: "Suspicious",
        className: "suspicious",
      };
    }

    if (
      status.includes("SUCCESS") ||
      status.includes("UNLOCK")
    ) {
      return {
        text: "Success",
        className: "success",
      };
    }

    if (status.includes("LOGIN")) {
      return {
        text: "Success",
        className: "success",
      };
    }

    return {
      text: value || "Activity",
      className: "neutral",
    };
  };

  // =====================================================
  // GET IP
  // =====================================================
  const getIp = (log) => {
    return (
      log?.ipAddress ||
      log?.ip ||
      log?.ip_address ||
      "Unknown"
    );
  };

  // =====================================================
  // GET DEVICE
  // =====================================================
  const getDevice = (log) => {
    return (
      log?.device ||
      log?.userAgent ||
      "Unknown Device"
    );
  };

  // =====================================================
  // GET LOCATION
  // =====================================================
  const getLocation = (log) => {
    return (
      log?.location ||
      log?.country ||
      "Unknown"
    );
  };

  // =====================================================
  // COUNTS
  // =====================================================
  const successfulCount = logs.filter(
    (log) =>
      getStatus(log).className === "success"
  ).length;

  const failedCount = logs.filter((log) => {
    const status =
      getStatus(log).className;

    return (
      status === "failed" ||
      status === "blocked"
    );
  }).length;

  // =====================================================
  // RENDER
  // =====================================================
  return (
    <div className="user-login-activity-page">

      {/* SIDEBAR */}
      <UserSidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="user-login-activity-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* MOBILE MENU */}
      <button
        type="button"
        className="user-login-activity-mobile-menu"
        onClick={() =>
          setSidebarOpen((prev) => !prev)
        }
      >
        ☰
      </button>

      {/* MAIN */}
      <main className="user-login-activity-main">

        {/* HEADER */}
        <header className="user-login-activity-header">

          <div>
            <p className="user-login-activity-label">
              SECURITY CENTER / LOGIN ACTIVITY
            </p>

            <h1>
              Login Activity
            </h1>

            <p>
              Review recent authentication
              activity associated with your account.
            </p>
          </div>

          <button
            type="button"
            className="user-back-dashboard-btn"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Dashboard
          </button>

        </header>

        {/* ERROR */}
        {error && (
          <div className="user-login-activity-error">

            <span className="error-icon">
              ⚠
            </span>

            <div>
              <strong>
                Unable to load activity
              </strong>

              <p>
                {error}
              </p>
            </div>

          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="user-login-activity-summary">

          {/* TOTAL */}
          <div className="user-activity-summary-card">

            <div className="user-summary-icon blue">
              🔐
            </div>

            <div>
              <span>
                Total Attempts
              </span>

              <strong>
                {loading
                  ? "..."
                  : logs.length}
              </strong>
            </div>

          </div>

          {/* SUCCESS */}
          <div className="user-activity-summary-card">

            <div className="user-summary-icon green">
              ✓
            </div>

            <div>
              <span>
                Successful
              </span>

              <strong>
                {loading
                  ? "..."
                  : successfulCount}
              </strong>
            </div>

          </div>

          {/* FAILED */}
          <div className="user-activity-summary-card">

            <div className="user-summary-icon red">
              !
            </div>

            <div>
              <span>
                Failed / Blocked
              </span>

              <strong>
                {loading
                  ? "..."
                  : failedCount}
              </strong>
            </div>

          </div>

        </section>

        {/* LOGIN ACTIVITY CARD */}
        <section className="user-login-activity-card">

          <div className="user-login-activity-card-header">

            <div>
              <p>
                AUTHENTICATION HISTORY
              </p>

              <h2>
                Recent Login Activity
              </h2>
            </div>

            <span className="user-monitoring-badge">
              ● Monitoring Active
            </span>

          </div>

          {/* TABLE */}
          <div className="user-login-activity-table-wrapper">

            {loading ? (

              <div className="user-login-activity-state">

                <div className="user-activity-spinner"></div>

                <p>
                  Loading login activity...
                </p>

              </div>

            ) : logs.length === 0 ? (

              <div className="user-login-activity-state">

                <div className="user-activity-empty-icon">
                  🔐
                </div>

                <h3>
                  No login activity found
                </h3>

                <p>
                  Your authentication activity
                  will appear here.
                </p>

              </div>

            ) : (

              <table className="user-login-activity-table">

                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Date &amp; Time</th>
                    <th>IP Address</th>
                    <th>Device</th>
                    <th>Location</th>
                  </tr>
                </thead>

                <tbody>

                  {logs.map((log, index) => {

                    const status =
                      getStatus(log);

                    return (
                      <tr
                        key={
                          log?._id ||
                          log?.id ||
                          index
                        }
                      >

                        {/* STATUS */}
                        <td>
                          <span
                            className={`user-login-status ${status.className}`}
                          >
                            <span className="status-dot"></span>

                            {status.text}
                          </span>
                        </td>

                        {/* DATE */}
                        <td>
                          {formatDate(
                            getDate(log)
                          )}
                        </td>

                        {/* IP */}
                        <td>
                          {getIp(log)}
                        </td>

                        {/* DEVICE */}
                        <td>
                          <span className="user-device-cell">
                            {getDevice(log)}
                          </span>
                        </td>

                        {/* LOCATION */}
                        <td>
                          {getLocation(log)}
                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            )}

          </div>

        </section>

        {/* SECURITY INFORMATION */}
        <section className="user-login-security-info">

          <div className="user-security-info-icon">
            🛡️
          </div>

          <div className="user-security-info-content">

            <h3>
              Keep your account secure
            </h3>

            <p>
              If you notice a login that you
              do not recognize, review your
              account security settings and
              change your password.
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/user-security")
            }
          >
            Account Security
          </button>

        </section>

        {/* FOOTER */}
        <footer className="user-login-activity-footer">

          <span>
            SecurePulse Security Center
          </span>

          <span>
            Authentication Monitoring Active
          </span>

        </footer>

      </main>

    </div>
  );
};

export default UserLoginActivity;

