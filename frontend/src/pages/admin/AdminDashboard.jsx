import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  // ============================================
  // SUMMARY STATE
  // ============================================
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    failedLogins: 0,
    suspiciousEvents: 0,
    lockedAccounts: 0,
    successfulLogins: 0,
  });

  // ============================================
  // SECURITY LOGS
  // ============================================
  const [logs, setLogs] = useState([]);

  // ============================================
  // UI STATE
  // ============================================
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ============================================
  // GET READABLE EVENT NAME
  // ============================================
  const getEventName = (event) => {
    const eventNames = {
      LOGIN_SUCCESS: "Login Success",
      LOGIN_FAILED: "Login Failed",
      LOGIN_BLOCKED: "Login Blocked",

      ACCOUNT_LOCKED: "Account Locked",
      ACCOUNT_PERMANENTLY_LOCKED: "Permanent Lock",
      ACCOUNT_TEMPORARILY_LOCKED: "Temporary Lock",

      ACCOUNT_UNLOCKED: "Account Unlocked",
      TEMPORARY_LOCK_REMOVED: "Temporary Unlock",

      SUSPICIOUS_ACTIVITY: "Suspicious Activity",

      USER_CREATED: "User Created",
      USER_DELETED: "User Deleted",

      ROLE_CHANGED: "Role Changed",
      PASSWORD_CHANGED: "Password Changed",

      ADMIN_ACCESS: "Admin Access",
    };

    return eventNames[event] || event || "Unknown Event";
  };

  // ============================================
  // GET EVENT STATUS
  // ============================================
  const getEventStatus = (event) => {
    switch (event) {
      case "LOGIN_SUCCESS":
      case "PASSWORD_CHANGED":
      case "ACCOUNT_UNLOCKED":
      case "TEMPORARY_LOCK_REMOVED":
      case "USER_CREATED":
        return {
          text: "Success",
          className: "success",
        };

      case "LOGIN_FAILED":
      case "USER_DELETED":
        return {
          text: "Failed",
          className: "failed",
        };

      case "LOGIN_BLOCKED":
        return {
          text: "Blocked",
          className: "locked",
        };

      case "ACCOUNT_LOCKED":
      case "ACCOUNT_PERMANENTLY_LOCKED":
      case "ACCOUNT_TEMPORARILY_LOCKED":
        return {
          text: "Locked",
          className: "locked",
        };

      case "SUSPICIOUS_ACTIVITY":
        return {
          text: "Suspicious",
          className: "suspicious",
        };

      case "ROLE_CHANGED":
      case "ADMIN_ACCESS":
        return {
          text: "Info",
          className: "unknown",
        };

      default:
        return {
          text: "Info",
          className: "unknown",
        };
    }
  };

  // ============================================
  // FORMAT SRI LANKA DATE & TIME
  // ============================================
  const formatDate = (dateString) => {
    if (!dateString) {
      return "Unknown";
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return new Intl.DateTimeFormat("en-LK", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  // ============================================
  // FETCH ADMIN DASHBOARD DATA
  // ============================================
  const fetchAdminData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Clear old error before a new request
      setError("");

      // ==========================================
      // CHECK TOKEN
      // ==========================================
      const token = localStorage.getItem("token");

      console.log(
        "Admin Dashboard token status:",
        token ? "TOKEN FOUND" : "TOKEN NOT FOUND"
      );

      /*
       * IMPORTANT:
       *
       * We do NOT remove the token here.
       *
       * If the token is missing, show an authentication
       * message and stop this request.
       *
       * The dashboard itself should never delete the
       * user's authentication token.
       */
      if (!token) {
        setError(
          "Your admin session is not available. Please login again."
        );

        return;
      }

      // ==========================================
      // FETCH SECURITY SUMMARY
      // ==========================================
      const summaryResponse = await api.get(
        "/security/summary"
      );

      console.log(
        "Admin summary response:",
        summaryResponse.data
      );

      const summaryData = summaryResponse.data;

      // ==========================================
      // BACKEND SUMMARY
      // ==========================================
      const backendSummary =
        summaryData.summary || summaryData;

      // ==========================================
      // UPDATE SUMMARY
      // ==========================================
      setSummary({
        totalUsers:
          Number(backendSummary.totalUsers) || 0,

        activeUsers:
          Number(backendSummary.activeUsers) || 0,

        failedLogins:
          Number(backendSummary.failedLogins) || 0,

        suspiciousEvents:
          Number(
            backendSummary.suspiciousEvents
          ) || 0,

        lockedAccounts:
          Number(
            backendSummary.lockedAccounts
          ) || 0,

        successfulLogins:
          Number(
            backendSummary.successfulLogins
          ) || 0,
      });

      // ==========================================
      // GET RECENT LOGS FROM SUMMARY
      // ==========================================
      let normalizedLogs = [];

      if (
        Array.isArray(summaryData.recentLogs)
      ) {
        normalizedLogs = [
          ...summaryData.recentLogs,
        ];
      }

      // ==========================================
      // FALLBACK: FETCH LOGS SEPARATELY
      // ==========================================
      if (normalizedLogs.length === 0) {
        try {
          const logsResponse = await api.get(
            "/security/logs?limit=10"
          );

          console.log(
            "Admin logs response:",
            logsResponse.data
          );

          const logsData = logsResponse.data;

          if (Array.isArray(logsData)) {
            normalizedLogs = logsData;
          } else if (
            Array.isArray(logsData.logs)
          ) {
            normalizedLogs = logsData.logs;
          } else if (
            Array.isArray(logsData.data)
          ) {
            normalizedLogs = logsData.data;
          } else if (
            Array.isArray(
              logsData.securityLogs
            )
          ) {
            normalizedLogs =
              logsData.securityLogs;
          }
        } catch (logsError) {
          /*
           * If summary works but the separate logs
           * request fails, keep the dashboard working.
           */
          console.error(
            "Admin logs request failed:",
            logsError
          );

          normalizedLogs = [];
        }
      }

      // ==========================================
      // SORT NEWEST FIRST
      // ==========================================
      normalizedLogs.sort((a, b) => {
        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      });

      // ==========================================
      // SHOW ONLY 10 LATEST EVENTS
      // ==========================================
      setLogs(
        normalizedLogs.slice(0, 10)
      );

      // ==========================================
      // SUCCESS
      // ==========================================
      setError("");

    } catch (err) {
      console.error(
        "Admin dashboard error:",
        err
      );

      // ==========================================
      // GET HTTP STATUS
      // ==========================================
      const status =
        err?.response?.status;

      // ==========================================
      // GET BACKEND MESSAGE
      // ==========================================
      const backendMessage =
        err?.response?.data?.message;

      // ==========================================
      // 401 - UNAUTHORIZED
      // ==========================================
      if (status === 401) {
        /*
         * IMPORTANT:
         *
         * Do NOT remove localStorage token here.
         *
         * AuthContext is responsible for session
         * management.
         */
        setError(
          backendMessage ||
            "Your session is no longer valid. Please login again."
        );

        return;
      }

      // ==========================================
      // 403 - FORBIDDEN
      // ==========================================
      if (status === 403) {
        /*
         * 403 can mean:
         *
         * - user is not an admin
         * - backend role check failed
         * - permission problem
         *
         * It does NOT automatically mean the token
         * is missing.
         */
        setError(
          backendMessage ||
            "You do not have permission to access the admin dashboard."
        );

        return;
      }

      // ==========================================
      // NETWORK / SERVER ERROR
      // ==========================================
      if (!err?.response) {
        setError(
          "Unable to connect to the SecurePulse server. Please make sure the backend is running."
        );

        return;
      }

      // ==========================================
      // OTHER SERVER ERRORS
      // ==========================================
      setError(
        backendMessage ||
          err?.message ||
          "Unable to load security dashboard."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================
  useEffect(() => {
    fetchAdminData();

    const interval = setInterval(() => {
      fetchAdminData();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ============================================
  // ANALYTICS CALCULATIONS
  // ============================================
  const totalLoginEvents =
    summary.successfulLogins +
    summary.failedLogins;

  const successfulLoginPercentage =
    totalLoginEvents > 0
      ? Math.round(
          (summary.successfulLogins /
            totalLoginEvents) *
            100
        )
      : 0;

  const failedLoginPercentage =
    totalLoginEvents > 0
      ? Math.round(
          (summary.failedLogins /
            totalLoginEvents) *
            100
        )
      : 0;

  const totalSecurityThreats =
    summary.failedLogins +
    summary.suspiciousEvents +
    summary.lockedAccounts;

  const failedThreatPercentage =
    totalSecurityThreats > 0
      ? Math.round(
          (summary.failedLogins /
            totalSecurityThreats) *
            100
        )
      : 0;

  const suspiciousThreatPercentage =
    totalSecurityThreats > 0
      ? Math.round(
          (summary.suspiciousEvents /
            totalSecurityThreats) *
            100
        )
      : 0;

  const lockedThreatPercentage =
    totalSecurityThreats > 0
      ? Math.round(
          (summary.lockedAccounts /
            totalSecurityThreats) *
            100
        )
      : 0;

  // ============================================
  // RENDER
  // ============================================
  return (
    <AdminLayout>
      <div className="securepulse-admin-app">

        {/* ======================================
            HEADER
        ======================================= */}
        <header className="admin-header">
          <div>
            <p className="admin-breadcrumb">
              SECURITY CENTER / ADMIN
            </p>

            <h1>
              Security Command Center
            </h1>

            <p>
              Monitor authentication activity,
              threats and system security.
            </p>
          </div>

          <div className="admin-status">
            <span></span>
            System Online
          </div>
        </header>

        {/* ======================================
            ERROR
        ======================================= */}
        {error && (
          <div
            className="admin-error"
            role="alert"
          >
            <strong>
              Unable to load dashboard
            </strong>

            <p>{error}</p>
          </div>
        )}

        {/* ======================================
            WELCOME BANNER
        ======================================= */}
        <section className="admin-welcome">
          <div>
            <span className="welcome-label">
              SECURITY MONITORING
            </span>

            <h2>
              Welcome to SecurePulse
            </h2>

            <p>
              Your centralized security dashboard
              for monitoring users, login activity
              and potential threats.
            </p>
          </div>

          <div className="welcome-shield">
            🛡
          </div>
        </section>

        {/* ======================================
            SECURITY OVERVIEW
        ======================================= */}
        <section className="admin-section">
          <div className="section-heading">
            <div>
              <h2>
                Security Overview
              </h2>

              <p>
                Real-time system security statistics
              </p>
            </div>
          </div>

          <div className="admin-stats-grid">

            {/* TOTAL USERS */}
            <div className="admin-stat-card">
              <div className="admin-stat-icon blue">
                ◉
              </div>

              <div>
                <p>
                  TOTAL USERS
                </p>

                <h3>
                  {loading
                    ? "..."
                    : summary.totalUsers}
                </h3>

                <span>
                  Registered accounts
                </span>
              </div>
            </div>

            {/* ACTIVE USERS */}
            <div className="admin-stat-card">
              <div className="admin-stat-icon green">
                ✓
              </div>

              <div>
                <p>
                  ACTIVE USERS
                </p>

                <h3>
                  {loading
                    ? "..."
                    : summary.activeUsers}
                </h3>

                <span>
                  Currently active accounts
                </span>
              </div>
            </div>

            {/* FAILED LOGINS */}
            <div className="admin-stat-card">
              <div className="admin-stat-icon red">
                ⚠
              </div>

              <div>
                <p>
                  FAILED LOGINS
                </p>

                <h3>
                  {loading
                    ? "..."
                    : summary.failedLogins}
                </h3>

                <span>
                  Failed authentication attempts
                </span>
              </div>
            </div>

            {/* SUSPICIOUS EVENTS */}
            <div className="admin-stat-card">
              <div className="admin-stat-icon orange">
                !
              </div>

              <div>
                <p>
                  SUSPICIOUS EVENTS
                </p>

                <h3>
                  {loading
                    ? "..."
                    : summary.suspiciousEvents}
                </h3>

                <span>
                  Potential security threats
                </span>
              </div>
            </div>

            {/* LOCKED ACCOUNTS */}
            <div className="admin-stat-card">
              <div className="admin-stat-icon purple">
                🔒
              </div>

              <div>
                <p>
                  LOCKED ACCOUNTS
                </p>

                <h3>
                  {loading
                    ? "..."
                    : summary.lockedAccounts}
                </h3>

                <span>
                  Currently locked accounts
                </span>
              </div>
            </div>

            {/* SUCCESSFUL LOGINS */}
            <div className="admin-stat-card">
              <div className="admin-stat-icon blue">
                ✓
              </div>

              <div>
                <p>
                  SUCCESSFUL LOGINS
                </p>

                <h3>
                  {loading
                    ? "..."
                    : summary.successfulLogins}
                </h3>

                <span>
                  Successful authentication events
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* ======================================
            SECURITY ANALYTICS
        ======================================= */}
        <section className="analytics-section">
          <div className="section-heading">
            <div>
              <h2>
                Security Analytics
              </h2>

              <p>
                Authentication and security event
                distribution
              </p>
            </div>
          </div>

          <div className="analytics-grid">

            {/* LOGIN ACTIVITY */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div>
                  <h3>
                    Login Activity
                  </h3>

                  <p>
                    Successful versus failed
                    authentication
                  </p>
                </div>

                <div className="analytics-total">
                  {loading
                    ? "..."
                    : totalLoginEvents}
                </div>
              </div>

              <div className="analytics-bars">

                {/* SUCCESSFUL */}
                <div className="analytics-row">
                  <div className="analytics-row-label">
                    <span>
                      Successful Logins
                    </span>

                    <strong>
                      {loading
                        ? "..."
                        : summary.successfulLogins}
                    </strong>
                  </div>

                  <div className="analytics-track">
                    <div
                      className="analytics-fill success-fill"
                      style={{
                        width: `${successfulLoginPercentage}%`,
                      }}
                    ></div>
                  </div>

                  <span className="analytics-percentage">
                    {successfulLoginPercentage}%
                  </span>
                </div>

                {/* FAILED */}
                <div className="analytics-row">
                  <div className="analytics-row-label">
                    <span>
                      Failed Logins
                    </span>

                    <strong>
                      {loading
                        ? "..."
                        : summary.failedLogins}
                    </strong>
                  </div>

                  <div className="analytics-track">
                    <div
                      className="analytics-fill failed-fill"
                      style={{
                        width: `${failedLoginPercentage}%`,
                      }}
                    ></div>
                  </div>

                  <span className="analytics-percentage">
                    {failedLoginPercentage}%
                  </span>
                </div>

              </div>
            </div>

            {/* SECURITY THREATS */}
            <div className="analytics-card">
              <div className="analytics-card-header">
                <div>
                  <h3>
                    Security Threats
                  </h3>

                  <p>
                    Recorded security-related events
                  </p>
                </div>

                <div className="analytics-total">
                  {loading
                    ? "..."
                    : totalSecurityThreats}
                </div>
              </div>

              <div className="analytics-bars">

                {/* FAILED */}
                <div className="analytics-row">
                  <div className="analytics-row-label">
                    <span>
                      Failed Login Events
                    </span>

                    <strong>
                      {loading
                        ? "..."
                        : summary.failedLogins}
                    </strong>
                  </div>

                  <div className="analytics-track">
                    <div
                      className="analytics-fill failed-fill"
                      style={{
                        width: `${failedThreatPercentage}%`,
                      }}
                    ></div>
                  </div>

                  <span className="analytics-percentage">
                    {failedThreatPercentage}%
                  </span>
                </div>

                {/* SUSPICIOUS */}
                <div className="analytics-row">
                  <div className="analytics-row-label">
                    <span>
                      Suspicious Activity
                    </span>

                    <strong>
                      {loading
                        ? "..."
                        : summary.suspiciousEvents}
                    </strong>
                  </div>

                  <div className="analytics-track">
                    <div
                      className="analytics-fill suspicious-fill"
                      style={{
                        width: `${suspiciousThreatPercentage}%`,
                      }}
                    ></div>
                  </div>

                  <span className="analytics-percentage">
                    {suspiciousThreatPercentage}%
                  </span>
                </div>

                {/* LOCKED */}
                <div className="analytics-row">
                  <div className="analytics-row-label">
                    <span>
                      Locked Accounts
                    </span>

                    <strong>
                      {loading
                        ? "..."
                        : summary.lockedAccounts}
                    </strong>
                  </div>

                  <div className="analytics-track">
                    <div
                      className="analytics-fill locked-fill"
                      style={{
                        width: `${lockedThreatPercentage}%`,
                      }}
                    ></div>
                  </div>

                  <span className="analytics-percentage">
                    {lockedThreatPercentage}%
                  </span>
                </div>

              </div>
            </div>

          </div>

          {/* ANALYTICS INSIGHT */}
          <div className="analytics-insight">
            <div className="analytics-insight-icon">
              ◉
            </div>

            <div>
              <h3>
                Security Activity Overview
              </h3>

              <p>
                SecurePulse currently tracks{" "}
                <strong>
                  {loading
                    ? "..."
                    : totalLoginEvents}
                </strong>{" "}
                recorded login events and{" "}
                <strong>
                  {loading
                    ? "..."
                    : summary.suspiciousEvents}
                </strong>{" "}
                suspicious activities.
              </p>
            </div>
          </div>
        </section>

        {/* ======================================
            SECURITY MONITORING
        ======================================= */}
        <section className="monitoring-card">
          <div className="monitoring-icon">
            ✓
          </div>

          <div>
            <h3>
              Security Monitoring Active
            </h3>

            <p>
              SecurePulse is actively monitoring
              authentication events and suspicious
              login activity.
            </p>
          </div>

          <div className="monitoring-status">
            <span></span>
            Active
          </div>
        </section>

        {/* ======================================
            RECENT SECURITY EVENTS
        ======================================= */}
        <section className="events-card">
          <div className="events-header">
            <div>
              <h2>
                Recent Security Events
              </h2>

              <p>
                Latest authentication and security
                activities
              </p>
            </div>

            <button
              className="view-events-button"
              type="button"
              onClick={() =>
                fetchAdminData(true)
              }
              disabled={
                loading || refreshing
              }
            >
              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>

          <div className="events-table-container">

            {loading ? (
              <div className="events-message">
                Loading security events...
              </div>
            ) : logs.length === 0 ? (
              <div className="events-message">
                No security events found.
              </div>
            ) : (
              <table className="events-table">
                <thead>
                  <tr>
                    <th>
                      Date & Time
                    </th>

                    <th>
                      Email
                    </th>

                    <th>
                      Event
                    </th>

                    <th>
                      Device
                    </th>

                    <th>
                      IP Address
                    </th>

                    <th>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map(
                    (log, index) => {
                      const event =
                        log.event ||
                        log.eventType ||
                        "Unknown";

                      const readableEvent =
                        getEventName(event);

                      const status =
                        getEventStatus(event);

                      return (
                        <tr
                          key={
                            log._id ||
                            `${event}-${log.createdAt}-${index}`
                          }
                        >
                          <td>
                            <strong>
                              {formatDate(
                                log.createdAt
                              )}
                            </strong>
                          </td>

                          <td>
                            {log.email ||
                              "Unknown"}
                          </td>

                          <td>
                            <span className="event-name">
                              {readableEvent}
                            </span>
                          </td>

                          <td>
                            {log.device ||
                              "Unknown Device"}
                          </td>

                          <td>
                            {log.ip ||
                              log.ipAddress ||
                              "Unknown"}
                          </td>

                          <td>
                            <span
                              className={`event-status ${status.className}`}
                            >
                              <span></span>
                              {status.text}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            )}

          </div>
        </section>

        {/* ======================================
            FOOTER
        ======================================= */}
        <footer className="admin-footer">
          <span>
            SecurePulse Security System
          </span>

          <span>
            Protection Active
          </span>
        </footer>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;