import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import "./SecuritySettings.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const SecuritySettings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSecurityInformation = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Authentication token not found.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/users/profile`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
            "Failed to load security information."
          );
        }

        setUser(data);

      } catch (error) {
        console.error(
          "Security settings error:",
          error
        );

        setError(
          error.message ||
          "Unable to load security information."
        );

      } finally {
        setLoading(false);
      }
    };

    fetchSecurityInformation();
  }, []);


  // =========================================================
  // DATE FORMAT
  // =========================================================

  const formatDateTime = (date) => {
    if (!date) {
      return "Not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleString();
  };


  // =========================================================
  // ROLE
  // =========================================================

  const getRoleLabel = (role) => {
    if (role === "admin") {
      return "Administrator";
    }

    return role || "User";
  };


  // =========================================================
  // ACCOUNT STATUS
  // =========================================================

  const getStatusClass = (status) => {
    if (status === "Permanently Locked") {
      return "security-status-permanent";
    }

    if (status === "Temporarily Locked") {
      return "security-status-temporary";
    }

    return "security-status-active";
  };


  // =========================================================
  // LOCK INFORMATION
  // =========================================================

  const getLockInformation = () => {
    if (!user) {
      return "Not available";
    }

    if (user.isBlocked) {
      return "Permanently locked";
    }

    if (user.lockUntil) {
      const lockDate = new Date(user.lockUntil);

      if (
        !Number.isNaN(lockDate.getTime()) &&
        lockDate > new Date()
      ) {
        return `Temporarily locked until ${lockDate.toLocaleString()}`;
      }
    }

    return "No active account lock";
  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <AdminLayout>

        <div className="security-settings-page">

          <div className="security-loading">

            <div className="security-spinner"></div>

            <p>
              Loading security information...
            </p>

          </div>

        </div>

      </AdminLayout>
    );
  }


  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <AdminLayout>

        <div className="security-settings-page">

          <div className="security-error">

            <div className="security-error-icon">
              ⚠️
            </div>

            <h2>
              Unable to Load Security Information
            </h2>

            <p>
              {error}
            </p>

          </div>

        </div>

      </AdminLayout>
    );
  }


  if (!user) {
    return null;
  }


  const status =
    user.status || "Active";

  const role =
    getRoleLabel(user.role);

  const failedAttempts =
    user.failedLoginAttempts ?? 0;

  const lastLogin =
    formatDateTime(user.lastLogin);


  return (
    <AdminLayout>

      <div className="security-settings-page">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="security-settings-header">

          <div className="security-title-row">

            <div className="security-title-icon">
              🛡️
            </div>

            <div>

              <h1>
                Security Settings
              </h1>

              <p>
                Review the security controls protecting
                your SecurePulse account
              </p>

            </div>

          </div>


          <div className="security-protected-badge">

            <span className="security-protected-dot"></span>

            Account Protected

          </div>

        </div>


        {/* ===================================================
            MAIN SECURITY CARD
        =================================================== */}

        <div className="security-main-card">

          <div className="security-main-icon">
            🔐
          </div>

          <div className="security-main-content">

            <span className="security-main-label">
              CURRENT SECURITY STATUS
            </span>

            <h2>
              Account Protected
            </h2>

            <p>
              Your SecurePulse account is protected by
              authentication, role-based access control,
              and security monitoring.
            </p>

          </div>

          <div
            className={`security-main-status ${getStatusClass(
              status
            )}`}
          >

            <span className="status-dot"></span>

            {status}

          </div>

        </div>


        {/* ===================================================
            SECURITY OVERVIEW
        =================================================== */}

        <div className="security-section">

          <div className="security-section-heading">

            <div className="section-icon">
              🛡️
            </div>

            <div>

              <h3>
                Security Overview
              </h3>

              <p>
                Security features currently protecting
                your account
              </p>

            </div>

          </div>


          <div className="security-overview-grid">

            {/* AUTHENTICATION */}
            <div className="security-overview-card">

              <div className="overview-icon blue">
                🔐
              </div>

              <div className="overview-content">

                <span>
                  Authentication
                </span>

                <strong>
                  Enabled
                </strong>

                <small>
                  Secure JWT authentication
                </small>

              </div>

              <div className="overview-check">
                ✓
              </div>

            </div>


            {/* ROLE BASED ACCESS */}
            <div className="security-overview-card">

              <div className="overview-icon purple">
                🛡️
              </div>

              <div className="overview-content">

                <span>
                  Role-Based Access
                </span>

                <strong>
                  {role}
                </strong>

                <small>
                  Access permissions are controlled
                  by role
                </small>

              </div>

              <div className="overview-check">
                ✓
              </div>

            </div>


            {/* MONITORING */}
            <div className="security-overview-card">

              <div className="overview-icon green">
                📊
              </div>

              <div className="overview-content">

                <span>
                  Security Monitoring
                </span>

                <strong>
                  Active
                </strong>

                <small>
                  Account activity is monitored
                </small>

              </div>

              <div className="overview-check">
                ✓
              </div>

            </div>

          </div>

        </div>


        {/* ===================================================
            ACCOUNT PROTECTION
        =================================================== */}

        <div className="security-section">

          <div className="security-section-heading">

            <div className="section-icon">
              🔒
            </div>

            <div>

              <h3>
                Account Protection
              </h3>

              <p>
                Current security information for your account
              </p>

            </div>

          </div>


          <div className="protection-grid">

            {/* ACCOUNT STATUS */}
            <div className="protection-card">

              <span className="protection-label">
                Account Status
              </span>

              <div
                className={`protection-status ${getStatusClass(
                  status
                )}`}
              >

                <span className="status-dot"></span>

                {status}

              </div>

            </div>


            {/* FAILED ATTEMPTS */}
            <div className="protection-card">

              <span className="protection-label">
                Failed Login Attempts
              </span>

              <strong className="protection-value">
                {failedAttempts}
              </strong>

              <small>
                Recorded failed attempts
              </small>

            </div>


            {/* LAST LOGIN */}
            <div className="protection-card">

              <span className="protection-label">
                Last Login
              </span>

              <strong className="protection-value small-value">
                {lastLogin}
              </strong>

            </div>


            {/* ACCOUNT LOCK */}
            <div className="protection-card">

              <span className="protection-label">
                Account Lock
              </span>

              <strong className="protection-value small-value">
                {getLockInformation()}
              </strong>

            </div>

          </div>

        </div>


        {/* ===================================================
            SECURITY NOTICE
        =================================================== */}

        <div className="security-notice">

          <div className="security-notice-icon">
            ✓
          </div>

          <div>

            <h4>
              Your account security is active
            </h4>

            <p>
              SecurePulse uses authentication,
              role-based access control, account
              protection and security monitoring to
              help protect your account and system access.
            </p>

          </div>

        </div>

      </div>

    </AdminLayout>
  );
};

export default SecuritySettings;

