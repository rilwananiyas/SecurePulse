import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserSidebar from "../../components/UserSidebar";
import "./UserSecurityAlerts.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const UserSecurityAlerts = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================
  // FETCH USER SECURITY ALERTS
  // ============================================
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        // ----------------------------------------
        // CHECK TOKEN
        // ----------------------------------------
        if (!token) {
          navigate("/login");
          return;
        }

        // ----------------------------------------
        // GET ONLY LOGGED-IN USER'S LOGS
        // ----------------------------------------
        const response = await fetch(
          `${API_BASE_URL}/security/my-logs?limit=50`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // ----------------------------------------
        // UNAUTHORIZED
        // ----------------------------------------
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          navigate("/login");
          return;
        }

        // ----------------------------------------
        // OTHER SERVER ERRORS
        // ----------------------------------------
        if (!response.ok) {
          let errorMessage =
            "Failed to load security alerts.";

          try {
            const errorData = await response.json();

            if (errorData?.message) {
              errorMessage = errorData.message;
            }
          } catch {
            // Ignore invalid JSON response
          }

          throw new Error(errorMessage);
        }

        // ----------------------------------------
        // READ RESPONSE
        // ----------------------------------------
        const data = await response.json();

        // Backend returns an array
        if (Array.isArray(data)) {
          setAlerts(data);
        }

        // Support { logs: [] }
        else if (Array.isArray(data.logs)) {
          setAlerts(data.logs);
        }

        // Support { alerts: [] }
        else if (Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
        }

        // Unknown response
        else {
          setAlerts([]);
        }
      } catch (err) {
        console.error(
          "Security alerts error:",
          err
        );

        setError(
          err.message ||
            "Unable to load security alerts."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [navigate]);

  // ============================================
  // HELPERS
  // ============================================

  const getDate = (alert) => {
    const date =
      alert.createdAt ||
      alert.timestamp ||
      alert.date ||
      alert.created_at;

    if (!date) {
      return "Unknown date";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Unknown date";
    }

    return parsedDate.toLocaleString();
  };

  const getType = (alert) => {
    return (
      alert.eventType ||
      alert.type ||
      alert.action ||
      alert.event ||
      "Security Event"
    );
  };

  const getDescription = (alert) => {
    return (
      alert.description ||
      alert.message ||
      alert.details ||
      "A security-related event was recorded."
    );
  };

  const getLevel = (alert) => {
    const level =
      alert.level ||
      alert.severity ||
      alert.riskLevel ||
      "Info";

    return String(level);
  };

  const getIpAddress = (alert) => {
    return (
      alert.ipAddress ||
      alert.ip ||
      alert.ip_address ||
      "Not available"
    );
  };

  const getLevelClass = (level) => {
    const value = String(level).toLowerCase();

    if (
      value.includes("critical") ||
      value.includes("high") ||
      value.includes("danger")
    ) {
      return "alert-level-high";
    }

    if (
      value.includes("medium") ||
      value.includes("warning")
    ) {
      return "alert-level-medium";
    }

    return "alert-level-low";
  };

  const getIcon = (level) => {
    const value = String(level).toLowerCase();

    if (
      value.includes("critical") ||
      value.includes("high") ||
      value.includes("danger")
    ) {
      return "!";
    }

    if (
      value.includes("medium") ||
      value.includes("warning")
    ) {
      return "⚠";
    }

    return "i";
  };

  // ============================================
  // SUMMARY
  // ============================================

  const totalAlerts = alerts.length;

  const highAlerts = alerts.filter((alert) => {
    const level = getLevel(alert).toLowerCase();

    return (
      level.includes("critical") ||
      level.includes("high") ||
      level.includes("danger")
    );
  }).length;

  const warningAlerts = alerts.filter((alert) => {
    const level = getLevel(alert).toLowerCase();

    return (
      level.includes("medium") ||
      level.includes("warning")
    );
  }).length;

  const normalAlerts =
    totalAlerts - highAlerts - warningAlerts;

  // ============================================
  // UI
  // ============================================

  return (
    <>
      {/* ========================================
          USER SIDEBAR
      ======================================== */}

      <UserSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ========================================
          MOBILE OVERLAY
      ======================================== */}

      {sidebarOpen && (
        <div
          className="user-alerts-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ========================================
          MAIN CONTENT
      ======================================== */}

      <main className="user-alerts-main-content">

        {/* MOBILE HEADER */}

        <div className="user-alerts-mobile-header">
          <button
            className="user-alerts-menu-button"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <span>Security Alerts</span>
        </div>

        {/* ======================================
            PAGE HEADER
        ====================================== */}

        <section className="user-alerts-page-header">
          <div>
            <p className="user-alerts-breadcrumb">
              Security Center / Alerts
            </p>

            <h1>Security Alerts</h1>

            <p>
              Review security-related events
              associated with your account.
            </p>
          </div>

          <div className="user-alerts-status">
            <span className="user-alerts-status-dot"></span>
            System Secure
          </div>
        </section>

        {/* ======================================
            ERROR
        ====================================== */}

        {error && (
          <div className="user-alerts-error">
            <strong>Unable to load alerts</strong>

            <span>{error}</span>
          </div>
        )}

        {/* ======================================
            SUMMARY CARDS
        ====================================== */}

        <section className="user-alerts-summary">

          {/* TOTAL */}

          <div className="user-alert-summary-card">
            <div className="summary-card-icon">
              ⚠
            </div>

            <div>
              <span>Total Alerts</span>
              <strong>{totalAlerts}</strong>
            </div>
          </div>

          {/* HIGH RISK */}

          <div className="user-alert-summary-card">
            <div className="summary-card-icon danger">
              !
            </div>

            <div>
              <span>High Risk</span>
              <strong>{highAlerts}</strong>
            </div>
          </div>

          {/* WARNINGS */}

          <div className="user-alert-summary-card">
            <div className="summary-card-icon warning">
              ⚠
            </div>

            <div>
              <span>Warnings</span>
              <strong>{warningAlerts}</strong>
            </div>
          </div>

          {/* INFORMATIONAL */}

          <div className="user-alert-summary-card">
            <div className="summary-card-icon safe">
              ✓
            </div>

            <div>
              <span>Informational</span>
              <strong>{normalAlerts}</strong>
            </div>
          </div>
        </section>

        {/* ======================================
            ALERTS SECTION
        ====================================== */}

        <section className="user-alerts-card">

          <div className="user-alerts-card-header">
            <div>
              <h2>Recent Security Events</h2>

              <p>
                Latest security activity detected
                by SecurePulse.
              </p>
            </div>

            <button
              className="user-alerts-activity-button"
              onClick={() =>
                navigate("/user/login-activity")
              }
            >
              View Login Activity
            </button>
          </div>

          {/* ====================================
              LOADING
          ==================================== */}

          {loading && (
            <div className="user-alerts-empty-state">
              <div className="user-alerts-loader"></div>

              <p>
                Loading security alerts...
              </p>
            </div>
          )}

          {/* ====================================
              EMPTY
          ==================================== */}

          {!loading &&
            !error &&
            alerts.length === 0 && (
              <div className="user-alerts-empty-state">
                <div className="empty-alert-icon">
                  ✓
                </div>

                <h3>No Security Alerts</h3>

                <p>
                  No security-related events have
                  been recorded for your account.
                </p>
              </div>
            )}

          {/* ====================================
              ALERT LIST
          ==================================== */}

          {!loading && alerts.length > 0 && (
            <div className="user-alert-list">

              {alerts.map((alert, index) => {
                const level = getLevel(alert);

                return (
                  <div
                    className="user-security-alert-item"
                    key={
                      alert._id ||
                      alert.id ||
                      index
                    }
                  >

                    {/* ALERT ICON */}

                    <div
                      className={`user-alert-icon ${getLevelClass(
                        level
                      )}`}
                    >
                      {getIcon(level)}
                    </div>

                    {/* ALERT CONTENT */}

                    <div className="user-alert-content">

                      <div className="user-alert-top-row">

                        <h3>
                          {getType(alert)}
                        </h3>

                        <span
                          className={`user-alert-level ${getLevelClass(
                            level
                          )}`}
                        >
                          {level}
                        </span>

                      </div>

                      <p className="user-alert-description">
                        {getDescription(alert)}
                      </p>

                      <div className="user-alert-meta">

                        <span>
                          🕒 {getDate(alert)}
                        </span>

                        <span>
                          🌐 IP:{" "}
                          {getIpAddress(alert)}
                        </span>

                      </div>
                    </div>
                  </div>
                );
              })}

            </div>
          )}
        </section>

        {/* ======================================
            SECURITY TIP
        ====================================== */}

        <section className="user-alerts-security-tip">

          <div className="security-tip-icon">
            🔐
          </div>

          <div>
            <h3>Stay Protected</h3>

            <p>
              If you notice unfamiliar login
              activity or security events, change
              your password immediately and review
              your account security settings.
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/user-security")
            }
          >
            Security Settings
          </button>

        </section>

        {/* ======================================
            FOOTER
        ====================================== */}

        <footer className="user-alerts-footer">
          <span>SecurePulse</span>

          <span>
            Secure Authentication & Monitoring
            System
          </span>
        </footer>

      </main>
    </>
  );
};

export default UserSecurityAlerts;

