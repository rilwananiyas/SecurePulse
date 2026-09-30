import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import api from "../../services/api";
import "./LoginActivity.css";

const LoginActivity = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // ============================================
  // FORMAT DATE - SRI LANKA TIME
  // ============================================
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";

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
  // GET LOGIN EVENT NAME
  // ============================================
  const getEventName = (event) => {
    switch (event) {
      case "LOGIN_SUCCESS":
        return "Login Success";

      case "LOGIN_FAILED":
        return "Login Failed";

      case "LOGIN_BLOCKED":
        return "Login Blocked";

      default:
        return event || "Unknown";
    }
  };

  // ============================================
  // GET EVENT CATEGORY
  // ============================================
  const getCategory = (event) => {
    switch (event) {
      case "LOGIN_SUCCESS":
        return "SUCCESS";

      case "LOGIN_FAILED":
        return "FAILED";

      case "LOGIN_BLOCKED":
        return "BLOCKED";

      default:
        return "OTHER";
    }
  };

  // ============================================
  // FETCH LOGIN ACTIVITY
  // ============================================
  const fetchLoginActivity = async (manual = false) => {
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
      } else if (Array.isArray(data.logs)) {
        receivedLogs = data.logs;
      } else if (Array.isArray(data.data)) {
        receivedLogs = data.data;
      } else if (
        Array.isArray(data.securityLogs)
      ) {
        receivedLogs = data.securityLogs;
      }

      // ==========================================
      // ONLY LOGIN-RELATED EVENTS
      // ==========================================
      const loginLogs = receivedLogs.filter(
        (log) => {
          const event =
            log.event ||
            log.eventType ||
            "";

          return [
            "LOGIN_SUCCESS",
            "LOGIN_FAILED",
            "LOGIN_BLOCKED",
          ].includes(event);
        }
      );

      // ==========================================
      // LATEST FIRST
      // ==========================================
      loginLogs.sort((a, b) => {
        return (
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
        );
      });

      setLogs(loginLogs);
    } catch (err) {
      console.error(
        "Login activity error:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load login activity."
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
    fetchLoginActivity();

    const interval = setInterval(() => {
      fetchLoginActivity();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ============================================
  // FILTER + SEARCH
  // ============================================
  const filteredLogs = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return logs.filter((log) => {
      const event =
        log.event ||
        log.eventType ||
        "";

      const category = getCategory(event);

      const matchesFilter =
        filter === "ALL" ||
        category === filter;

      if (!searchText) {
        return matchesFilter;
      }

      const searchableText = [
        log.email,
        log.event,
        log.eventType,
        log.message,
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

  // ============================================
  // STATISTICS
  // ============================================
  const statistics = useMemo(() => {
    return {
      total: logs.length,

      success: logs.filter(
        (log) =>
          getCategory(
            log.event ||
              log.eventType
          ) === "SUCCESS"
      ).length,

      failed: logs.filter(
        (log) =>
          getCategory(
            log.event ||
              log.eventType
          ) === "FAILED"
      ).length,

      blocked: logs.filter(
        (log) =>
          getCategory(
            log.event ||
              log.eventType
          ) === "BLOCKED"
      ).length,
    };
  }, [logs]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <AdminLayout>
      <div className="securepulse-login-activity-page">

        {/* ================= HEADER ================= */}

        <header className="login-activity-header">

          <div>
            <p className="login-activity-breadcrumb">
              SECURITY CENTER / LOGIN ACTIVITY
            </p>

            <h1>
              Login Activity
            </h1>

            <p>
              Monitor successful, failed and blocked
              authentication attempts.
            </p>
          </div>

          <button
            type="button"
            className="login-refresh-button"
            onClick={() =>
              fetchLoginActivity(true)
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

        {/* ================= ERROR ================= */}

        {error && (
          <div
            className="login-activity-error"
            role="alert"
          >
            <strong>
              Unable to load login activity
            </strong>

            <p>{error}</p>
          </div>
        )}

        {/* ================= STATISTICS ================= */}

        <section className="login-stat-grid">

          {/* TOTAL */}

          <div className="login-stat-card">

            <div className="login-stat-icon blue">
              ◉
            </div>

            <div>
              <span>
                Total Login Events
              </span>

              <strong>
                {loading
                  ? "..."
                  : statistics.total}
              </strong>
            </div>

          </div>

          {/* SUCCESS */}

          <div className="login-stat-card">

            <div className="login-stat-icon green">
              ✓
            </div>

            <div>
              <span>
                Successful
              </span>

              <strong>
                {loading
                  ? "..."
                  : statistics.success}
              </strong>
            </div>

          </div>

          {/* FAILED */}

          <div className="login-stat-card">

            <div className="login-stat-icon red">
              ⚠
            </div>

            <div>
              <span>
                Failed
              </span>

              <strong>
                {loading
                  ? "..."
                  : statistics.failed}
              </strong>
            </div>

          </div>

          {/* BLOCKED */}

          <div className="login-stat-card">

            <div className="login-stat-icon orange">
              ⛔
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

        </section>

        {/* ================= ACTIVITY CARD ================= */}

        <section className="login-activity-card">

          <div className="login-activity-card-header">

            <div>
              <h2>
                Authentication Activity
              </h2>

              <p>
                Latest login attempts recorded by
                SecurePulse.
              </p>
            </div>

          </div>

          {/* ================= CONTROLS ================= */}

          <div className="login-activity-controls">

            <div
              className="login-filter-group"
              role="group"
              aria-label="Login activity filters"
            >

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
                  filter === "SUCCESS"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setFilter("SUCCESS")
                }
              >
                Successful
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

            </div>

            <input
              type="search"
              aria-label="Search login activity"
              placeholder="Search email, IP, device..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

          {/* ================= TABLE ================= */}

          <div className="login-table-container">

            {loading ? (

              <div className="login-activity-message">

                <div className="login-message-icon">
                  ⏳
                </div>

                <h3>
                  Loading login activity
                </h3>

                <p>
                  Please wait while SecurePulse
                  retrieves authentication events.
                </p>

              </div>

            ) : filteredLogs.length === 0 ? (

              <div className="login-activity-message">

                <div className="login-message-icon">
                  ✓
                </div>

                <h3>
                  No login activity found
                </h3>

                <p>
                  No login events match the current
                  filter or search.
                </p>

              </div>

            ) : (

              <table className="login-activity-table">

                <thead>

                  <tr>
                    <th>
                      Date &amp; Time
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
                      Browser / System
                    </th>

                    <th>
                      Status
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {filteredLogs.map(
                    (log, index) => {

                      const event =
                        log.event ||
                        log.eventType ||
                        "UNKNOWN";

                      const category =
                        getCategory(event);

                      return (
                        <tr
                          key={
                            log._id ||
                            `${event}-${log.createdAt}-${index}`
                          }
                        >

                          {/* DATE */}

                          <td>
                            <strong>
                              {formatDate(
                                log.createdAt
                              )}
                            </strong>
                          </td>

                          {/* EMAIL */}

                          <td>
                            <span className="login-email">
                              {log.email ||
                                "Unknown"}
                            </span>
                          </td>

                          {/* EVENT */}

                          <td>
                            <span
                              className={`login-event ${category.toLowerCase()}`}
                            >
                              {getEventName(
                                event
                              )}
                            </span>
                          </td>

                          {/* DEVICE */}

                          <td>
                            {log.device ||
                              "Unknown Device"}
                          </td>

                          {/* IP */}

                          <td>
                            {log.ip ||
                              log.ipAddress ||
                              "Unknown"}
                          </td>

                          {/* USER AGENT */}

                          <td>
                            <span className="login-user-agent">
                              {log.userAgent ||
                                "Unknown"}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td>
                            <span
                              className={`login-status ${category.toLowerCase()}`}
                            >
                              <span></span>

                              {category ===
                                "SUCCESS" &&
                                "Success"}

                              {category ===
                                "FAILED" &&
                                "Failed"}

                              {category ===
                                "BLOCKED" &&
                                "Blocked"}
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

          {/* ================= FOOTER ================= */}

          {!loading &&
            filteredLogs.length > 0 && (

              <div className="login-activity-footer">

                Showing{" "}
                <strong>
                  {filteredLogs.length}
                </strong>{" "}
                of{" "}
                <strong>
                  {logs.length}
                </strong>{" "}
                login events

              </div>

            )}

        </section>

        {/* ================= PAGE FOOTER ================= */}

        <footer className="login-page-footer">

          <span>
            SecurePulse Security System
          </span>

          <span>
            Login Monitoring Active
          </span>

        </footer>

      </div>
    </AdminLayout>
  );
};

export default LoginActivity;