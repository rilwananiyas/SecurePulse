import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import "./SecurityAlerts.css";

const SecurityAlerts = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // =========================================================
  // EVENT NAMES
  // =========================================================

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

    return (
      eventNames[event] ||
      event ||
      "Unknown Event"
    );
  };

  // =========================================================
  // EVENT CATEGORY
  // =========================================================

  const getEventCategory = (event) => {
    switch (event) {
      case "LOGIN_FAILED":
        return "FAILED";

      case "LOGIN_BLOCKED":
        return "BLOCKED";

      case "ACCOUNT_LOCKED":
      case "ACCOUNT_PERMANENTLY_LOCKED":
      case "ACCOUNT_TEMPORARILY_LOCKED":
        return "LOCKED";

      case "SUSPICIOUS_ACTIVITY":
        return "SUSPICIOUS";

      case "LOGIN_SUCCESS":
      case "ACCOUNT_UNLOCKED":
      case "TEMPORARY_LOCK_REMOVED":
      case "USER_CREATED":
        return "SUCCESS";

      case "USER_DELETED":
      case "ROLE_CHANGED":
      case "PASSWORD_CHANGED":
      case "ADMIN_ACCESS":
        return "INFO";

      default:
        return "INFO";
    }
  };

  // =========================================================
  // DATE & TIME
  // =========================================================

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

  // =========================================================
  // FETCH SECURITY ALERTS
  // =========================================================

  const fetchAlerts = async (manual = false) => {
    try {
      if (manual) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get(
        "/security/logs?limit=200"
      );

      const data = response.data;

      let receivedLogs = [];

      if (Array.isArray(data)) {
        receivedLogs = data;
      } else if (Array.isArray(data?.logs)) {
        receivedLogs = data.logs;
      } else if (
        Array.isArray(data?.securityLogs)
      ) {
        receivedLogs = data.securityLogs;
      } else if (
        Array.isArray(data?.data)
      ) {
        receivedLogs = data.data;
      }

      // Newest events first
      receivedLogs.sort((a, b) => {
        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      });

      setLogs(receivedLogs);
    } catch (err) {
      console.error(
        "Security alerts error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load security alerts."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // INITIAL LOAD + AUTO REFRESH
  // =========================================================

  useEffect(() => {
    fetchAlerts();

    const interval = setInterval(() => {
      fetchAlerts();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =========================================================
  // FILTER + SEARCH
  // =========================================================

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const event =
        log.event ||
        log.eventType ||
        "";

      const category =
        getEventCategory(event);

      const matchesFilter =
        filter === "ALL" ||
        category === filter;

      const searchText =
        search.trim().toLowerCase();

      if (!searchText) {
        return matchesFilter;
      }

      const searchableText = [
        log.email,
        log.event,
        log.eventType,
        log.message,
        log.details,
        log.device,
        log.ip,
        log.ipAddress,
        log.userAgent,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        matchesFilter &&
        searchableText.includes(searchText)
      );
    });
  }, [logs, filter, search]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const getCategoryCount = (category) => {
      return logs.filter((log) => {
        const event =
          log.event ||
          log.eventType ||
          "";

        return (
          getEventCategory(event) ===
          category
        );
      }).length;
    };

    return {
      total: logs.length,
      failed:
        getCategoryCount("FAILED"),
      blocked:
        getCategoryCount("BLOCKED"),
      locked:
        getCategoryCount("LOCKED"),
      suspicious:
        getCategoryCount("SUSPICIOUS"),
    };
  }, [logs]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <AdminLayout>
      <div className="securepulse-alerts-page">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="alerts-header">
          <div>
            <p className="alerts-breadcrumb">
              SECURITY CENTER / ALERTS
            </p>

            <h1>
              Security Alerts
            </h1>

            <p>
              Monitor suspicious authentication
              activity and security events.
            </p>
          </div>

          <button
            type="button"
            className="alerts-refresh-button"
            onClick={() =>
              fetchAlerts(true)
            }
            disabled={
              loading || refreshing
            }
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>
        </header>

        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (
          <div
            className="alerts-error"
            role="alert"
          >
            <strong>
              Unable to load security alerts
            </strong>

            <p>{error}</p>
          </div>
        )}

        {/* =====================================================
            STATISTICS
        ====================================================== */}

        <section className="alerts-stat-grid">

          {/* TOTAL */}

          <div className="alert-stat-card">
            <div className="alert-stat-icon blue">
              ◉
            </div>

            <div>
              <span>
                Total Events
              </span>

              <strong>
                {loading
                  ? "..."
                  : statistics.total}
              </strong>
            </div>
          </div>

          {/* FAILED */}

          <div className="alert-stat-card">
            <div className="alert-stat-icon red">
              ⚠
            </div>

            <div>
              <span>
                Failed Logins
              </span>

              <strong>
                {loading
                  ? "..."
                  : statistics.failed}
              </strong>
            </div>
          </div>

          {/* BLOCKED */}

          <div className="alert-stat-card">
            <div className="alert-stat-icon orange">
              !
            </div>

            <div>
              <span>
                Blocked
              </span>

              <strong>
                {loading
                  ? "..."
                  : statistics.blocked}
              </strong>
            </div>
          </div>

          {/* LOCKED */}

          <div className="alert-stat-card">
            <div className="alert-stat-icon purple">
              🔒
            </div>

            <div>
              <span>
                Lock Events
              </span>

              <strong>
                {loading
                  ? "..."
                  : statistics.locked}
              </strong>
            </div>
          </div>

          {/* SUSPICIOUS */}

          <div className="alert-stat-card">
            <div className="alert-stat-icon warning">
              ⚡
            </div>

            <div>
              <span>
                Suspicious
              </span>

              <strong>
                {loading
                  ? "..."
                  : statistics.suspicious}
              </strong>
            </div>
          </div>

        </section>

        {/* =====================================================
            ALERT PANEL
        ====================================================== */}

        <section className="alerts-panel">

          <div className="alerts-panel-header">
            <div>
              <h2>
                Security Event Monitor
              </h2>

              <p>
                Review authentication and
                account security activity.
              </p>
            </div>
          </div>

          {/* ===================================================
              FILTERS + SEARCH
          ==================================================== */}

          <div className="alerts-controls">

            <div className="alerts-filter-group">

              <button
                type="button"
                className={
                  filter === "ALL"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("ALL")
                }
              >
                All
              </button>

              <button
                type="button"
                className={
                  filter === "FAILED"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("FAILED")
                }
              >
                Failed
              </button>

              <button
                type="button"
                className={
                  filter === "BLOCKED"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("BLOCKED")
                }
              >
                Blocked
              </button>

              <button
                type="button"
                className={
                  filter === "LOCKED"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("LOCKED")
                }
              >
                Locked
              </button>

              <button
                type="button"
                className={
                  filter === "SUSPICIOUS"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("SUSPICIOUS")
                }
              >
                Suspicious
              </button>

            </div>

            <input
              type="search"
              aria-label="Search security alerts"
              placeholder="Search email, event, IP..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

          {/* ===================================================
              ALERT LIST
          ==================================================== */}

          <div className="alerts-list">

            {/* LOADING */}

            {loading ? (
              <div className="alerts-empty">

                <div className="alerts-empty-icon">
                  ⏳
                </div>

                <h3>
                  Loading security alerts
                </h3>

                <p>
                  Please wait while
                  SecurePulse retrieves
                  the latest events.
                </p>

              </div>
            ) : filteredLogs.length === 0 ? (

              /* EMPTY */

              <div className="alerts-empty">

                <div className="alerts-empty-icon">
                  ✓
                </div>

                <h3>
                  No security alerts found
                </h3>

                <p>
                  There are no events
                  matching the current
                  filter.
                </p>

              </div>
            ) : (

              /* EVENTS */

              filteredLogs.map(
                (log, index) => {

                  const event =
                    log.event ||
                    log.eventType ||
                    "UNKNOWN";

                  const category =
                    getEventCategory(event);

                  return (
                    <article
                      className={`security-alert-item ${category.toLowerCase()}`}
                      key={
                        log._id ||
                        `${event}-${log.createdAt}-${index}`
                      }
                    >

                      {/* EVENT ICON */}

                      <div className="alert-main-icon">

                        {category ===
                          "FAILED" &&
                          "⚠"}

                        {category ===
                          "BLOCKED" &&
                          "⛔"}

                        {category ===
                          "LOCKED" &&
                          "🔒"}

                        {category ===
                          "SUSPICIOUS" &&
                          "!"}

                        {category ===
                          "SUCCESS" &&
                          "✓"}

                        {category ===
                          "INFO" &&
                          "i"}

                      </div>

                      {/* EVENT CONTENT */}

                      <div className="alert-content">

                        <div className="alert-title-row">

                          <h3>
                            {getEventName(
                              event
                            )}
                          </h3>

                          <span
                            className={`alert-category ${category.toLowerCase()}`}
                          >
                            {category}
                          </span>

                        </div>

                        {/* MESSAGE */}

                        <p className="alert-message">
                          {log.message ||
                            log.details ||
                            "Security event recorded by SecurePulse."}
                        </p>

                        {/* DETAILS */}

                        <div className="alert-details">

                          <span>
                            <strong>
                              Email:
                            </strong>{" "}
                            {log.email ||
                              "Unknown"}
                          </span>

                          <span>
                            <strong>
                              Device:
                            </strong>{" "}
                            {log.device ||
                              "Unknown Device"}
                          </span>

                          <span>
                            <strong>
                              IP:
                            </strong>{" "}
                            {log.ip ||
                              log.ipAddress ||
                              "Unknown"}
                          </span>

                          <span>
                            <strong>
                              Time:
                            </strong>{" "}
                            {formatDate(
                              log.createdAt
                            )}
                          </span>

                        </div>

                        {/* USER AGENT */}

                        {log.userAgent && (
                          <div className="alert-user-agent">

                            <strong>
                              Browser / System:
                            </strong>{" "}
                            {log.userAgent}

                          </div>
                        )}

                      </div>

                    </article>
                  );
                }
              )
            )}

          </div>

          {/* ===================================================
              FOOTER COUNT
          ==================================================== */}

          {!loading &&
            filteredLogs.length > 0 && (
              <div className="alerts-footer">
                Showing{" "}
                <strong>
                  {filteredLogs.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {logs.length}
                </strong>{" "}
                security events
              </div>
            )}

        </section>

        {/* =====================================================
            PAGE FOOTER
        ====================================================== */}

        <footer className="alerts-page-footer">
          <span>
            SecurePulse Security System
          </span>

          <span>
            Security Monitoring Active
          </span>
        </footer>

      </div>
    </AdminLayout>
  );
};

export default SecurityAlerts;