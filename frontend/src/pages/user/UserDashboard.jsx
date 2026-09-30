
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserSidebar from "../../components/UserSidebar";
import "./UserDashboard.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const UserDashboard = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    totalLoginAttempts: 0,
    securityAlerts: 0,
    accountStatus: "Active",
    logs: [],
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // GET LOGGED-IN USER
  // =====================================================
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error("Failed to read user:", err);
    }
  }, []);

  // =====================================================
  // FETCH USER LOGIN ACTIVITY
  // =====================================================
  useEffect(() => {
    const fetchDashboardData = async () => {
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

        if (!response.ok) {
          throw new Error("Failed to load login activity.");
        }

        const data = await response.json();

        const logs = Array.isArray(data)
          ? data
          : Array.isArray(data.logs)
          ? data.logs
          : Array.isArray(data.activity)
          ? data.activity
          : [];

        setDashboardData({
          totalLoginAttempts:
            data.totalLoginAttempts ??
            data.totalAttempts ??
            logs.length,

          securityAlerts:
            data.securityAlerts ??
            data.alerts ??
            0,

          accountStatus:
            data.accountStatus ||
            data.status ||
            "Active",

          logs,
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);

        setError(
          "Unable to load your security activity."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // =====================================================
  // FORMAT DATE
  // =====================================================
  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "—";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString();
  };

  // =====================================================
  // FORMAT STATUS
  // =====================================================
  const getStatus = (log) => {
    const rawStatus =
      log?.status ||
      log?.event ||
      log?.action ||
      log?.type ||
      "";

    const status = String(rawStatus)
      .toLowerCase()
      .replace(/[_-]/g, " ");

    if (
      status.includes("failed") ||
      status.includes("failure")
    ) {
      return "Failed";
    }

    if (
      status.includes("blocked") ||
      status.includes("locked")
    ) {
      return "Blocked";
    }

    if (
      status.includes("suspicious") ||
      status.includes("alert")
    ) {
      return "Suspicious";
    }

    if (
      status.includes("temporary lock") ||
      status.includes("permanent lock")
    ) {
      return "Locked";
    }

    if (
      status.includes("unlock") ||
      status.includes("success") ||
      status.includes("successful") ||
      status.includes("login")
    ) {
      return "Success";
    }

    return rawStatus
      ? String(rawStatus)
      : "Activity";
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================
  const getStatusClass = (log) => {
    const status = getStatus(log).toLowerCase();

    if (
      status === "failed" ||
      status === "blocked"
    ) {
      return "status-danger";
    }

    if (
      status === "suspicious" ||
      status === "locked"
    ) {
      return "status-warning";
    }

    if (status === "success") {
      return "status-success";
    }

    return "status-neutral";
  };

  // =====================================================
  // GET LOG DATE
  // =====================================================
  const getLogDate = (log) => {
    return (
      log?.createdAt ||
      log?.timestamp ||
      log?.date ||
      log?.time
    );
  };

  // =====================================================
  // GET IP ADDRESS
  // =====================================================
  const getIpAddress = (log) => {
    return (
      log?.ipAddress ||
      log?.ip ||
      log?.ip_address ||
      "—"
    );
  };

  // =====================================================
  // GET DEVICE
  // =====================================================
  const getDevice = (log) => {
    return (
      log?.device ||
      log?.userAgent ||
      "Unknown device"
    );
  };

  // =====================================================
  // DASHBOARD
  // =====================================================
  return (
    <div className="securepulse-user-page">

      {/* =================================================
          USER SIDEBAR
      ================================================= */}
      <UserSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* =================================================
          MOBILE OVERLAY
      ================================================= */}
      {sidebarOpen && (
        <div
          className="user-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =================================================
          MOBILE MENU
      ================================================= */}
      <button
        type="button"
        className="user-mobile-menu"
        onClick={() =>
          setSidebarOpen((prev) => !prev)
        }
        aria-label="Toggle navigation menu"
        aria-expanded={sidebarOpen}
      >
        ☰
      </button>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}
      <main className="user-main-content">

        {/* =================================================
            HEADER
        ================================================= */}
        <header className="user-dashboard-header">

          <div className="user-header-left">

            <p className="user-page-label">
              USER DASHBOARD
            </p>

            <h1>
              Welcome back,{" "}
              <span>
                {user?.name || "User"}
              </span>
            </h1>

            <p className="user-header-subtitle">
              Monitor your account security
              and login activity.
            </p>

          </div>

          <div className="user-header-right">

            <div className="user-online-status">
              <span className="online-dot"></span>

              <span>Online</span>
            </div>

          </div>

        </header>

        {/* =================================================
            ERROR
        ================================================= */}
        {error && (
          <div className="user-dashboard-error">

            <span>⚠</span>

            <div>
              <strong>
                Unable to load some data
              </strong>

              <p>{error}</p>
            </div>

          </div>
        )}

        {/* =================================================
            SECURITY OVERVIEW
        ================================================= */}
        <section className="user-security-overview">

          <div className="section-heading">

            <div>

              <p className="section-eyebrow">
                SECURITY OVERVIEW
              </p>

              <h2>
                Your account at a glance
              </h2>

            </div>

            <div className="account-status-badge">

              <span className="status-dot"></span>

              {dashboardData.accountStatus}

            </div>

          </div>

          {/* =================================================
              STAT CARDS
          ================================================= */}
          <div className="user-stat-grid">

            {/* LOGIN ACTIVITY */}
            <div className="user-stat-card">

              <div className="user-stat-icon blue">
                🔐
              </div>

              <div className="user-stat-content">

                <span>
                  Login Activity
                </span>

                <strong>
                  {loading
                    ? "..."
                    : dashboardData.totalLoginAttempts}
                </strong>

                <small>
                  Total login attempts
                </small>

              </div>

            </div>

            {/* SECURITY ALERTS */}
            <div className="user-stat-card">

              <div className="user-stat-icon orange">
                ⚠
              </div>

              <div className="user-stat-content">

                <span>
                  Security Alerts
                </span>

                <strong>
                  {loading
                    ? "..."
                    : dashboardData.securityAlerts}
                </strong>

                <small>
                  Alerts related to your account
                </small>

              </div>

            </div>

            {/* ACCOUNT STATUS */}
            <div className="user-stat-card">

              <div className="user-stat-icon green">
                🛡️
              </div>

              <div className="user-stat-content">

                <span>
                  Account Status
                </span>

                <strong className="secure-status">
                  {dashboardData.accountStatus}
                </strong>

                <small>
                  Current security status
                </small>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            RECENT ACTIVITY
        ================================================= */}
        <section className="user-activity-section">

          <div className="section-heading">

            <div>

              <p className="section-eyebrow">
                RECENT ACTIVITY
              </p>

              <h2>
                Recent login activity
              </h2>

            </div>

            <button
              type="button"
              className="view-activity-btn"
              onClick={() =>
                navigate("/user/login-activity")
              }
            >
              View All
            </button>

          </div>

          <div className="user-activity-card">

            {loading ? (

              <div className="user-table-state">

                <div className="loading-spinner"></div>

                <p>
                  Loading login activity...
                </p>

              </div>

            ) : dashboardData.logs.length === 0 ? (

              <div className="user-table-state">

                <div className="empty-icon">
                  🔐
                </div>

                <h3>
                  No login activity
                </h3>

                <p>
                  Your recent login activity
                  will appear here.
                </p>

              </div>

            ) : (

              <div className="user-table-wrapper">

                <table className="user-activity-table">

                  <thead>

                    <tr>

                      <th>Status</th>
                      <th>Date & Time</th>
                      <th>IP Address</th>
                      <th>Device</th>

                    </tr>

                  </thead>

                  <tbody>

                    {dashboardData.logs
                      .slice(0, 5)
                      .map((log, index) => {

                        const status =
                          getStatus(log);

                        return (
                          <tr
                            key={
                              log._id ||
                              log.id ||
                              index
                            }
                          >

                            <td>

                              <span
                                className={`activity-status ${getStatusClass(
                                  log
                                )}`}
                              >

                                <span className="activity-status-dot"></span>

                                {status}

                              </span>

                            </td>

                            <td>
                              {formatDate(
                                getLogDate(log)
                              )}
                            </td>

                            <td>
                              {getIpAddress(log)}
                            </td>

                            <td>
                              <span className="device-text">
                                {getDevice(log)}
                              </span>
                            </td>

                          </tr>
                        );

                      })}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        </section>

        {/* =================================================
            ACCOUNT PROTECTION
        ================================================= */}
        <section className="user-protection-card">

          <div className="protection-icon">
            🛡️
          </div>

          <div className="protection-content">

            <h3>
              Your account is protected
            </h3>

            <p>
              SecurePulse continuously monitors
              your authentication activity and
              records security events related to
              your account.
            </p>

          </div>

          <button
            type="button"
            className="security-settings-btn"
            onClick={() =>
              navigate("/user-security")
            }
          >
            Account Security
          </button>

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}
        <footer className="user-dashboard-footer">

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

export default UserDashboard;

