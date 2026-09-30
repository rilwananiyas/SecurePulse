import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import "./Profile.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH CURRENT ADMIN PROFILE
  // =====================================================

  useEffect(() => {
    const fetchProfile = async () => {
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
            data.message || "Failed to fetch profile"
          );
        }

        setUser(data);
      } catch (error) {
        console.error("Profile fetch error:", error);

        setError(
          error.message || "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDateTime = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleString();
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString();
  };

  // =====================================================
  // ROLE LABEL
  // =====================================================

  const getRoleLabel = (role) => {
    if (role === "admin") {
      return "Administrator";
    }

    return role || "User";
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {
    if (status === "Permanently Locked") {
      return "status-permanent";
    }

    if (status === "Temporarily Locked") {
      return "status-temporary";
    }

    return "status-active";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <AdminLayout>
        <div className="profile-page">
          <div className="profile-loading">
            <div className="profile-spinner"></div>

            <p>Loading your profile...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <AdminLayout>
        <div className="profile-page">
          <div className="profile-error">
            <div className="profile-error-icon">
              ⚠️
            </div>

            <h2>Unable to Load Profile</h2>

            <p>{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // =====================================================
  // NO USER
  // =====================================================

  if (!user) {
    return (
      <AdminLayout>
        <div className="profile-page">
          <div className="profile-error">
            <div className="profile-error-icon">
              👤
            </div>

            <h2>Profile Not Found</h2>

            <p>
              Your profile information could not be found.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // =====================================================
  // PROFILE DATA
  // =====================================================

  const displayName = user.name || "User";

  const email = user.email || "Not available";

  const role = getRoleLabel(user.role);

  const status = user.status || "Active";

  const createdDate = formatDate(user.createdAt);

  const lastLogin = formatDateTime(user.lastLogin);

  const firstLetter = displayName
    .charAt(0)
    .toUpperCase();

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <AdminLayout>
      <div className="profile-page">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="profile-header">
          <div>
            <div className="profile-title-row">
              <div className="profile-title-icon">
                👤
              </div>

              <div>
                <h1>My Profile</h1>

                <p>
                  Manage and view your SecurePulse
                  account information
                </p>
              </div>
            </div>
          </div>

          <div className="profile-security-badge">
            <span className="security-dot"></span>
            Secure Account
          </div>
        </div>

        {/* =================================================
            MAIN PROFILE CONTAINER
        ================================================= */}

        <div className="profile-container">

          {/* =================================================
              PROFILE HERO
          ================================================= */}

          <div className="profile-top">

            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {firstLetter}
              </div>

              <span className="avatar-online"></span>
            </div>

            <div className="profile-identity">

              <div className="identity-name-row">
                <h2>{displayName}</h2>

                <span className="verified-badge">
                  ✓ Verified
                </span>
              </div>

              <p className="profile-email">
                {email}
              </p>

              <div className="profile-badges">

                <span className="profile-role">
                  🛡️ {role}
                </span>

                <span
                  className={`profile-status ${getStatusClass(
                    status
                  )}`}
                >
                  <span className="status-dot"></span>
                  {status}
                </span>

              </div>
            </div>

            <div className="profile-hero-security">
              <div className="hero-security-icon">
                🔐
              </div>

              <div>
                <span>Security Level</span>
                <strong>Protected</strong>
              </div>
            </div>

          </div>

          {/* =================================================
              ACCOUNT INFORMATION
          ================================================= */}

          <div className="profile-section">

            <div className="section-heading">

              <div className="section-icon blue">
                👤
              </div>

              <div>
                <h3>Account Information</h3>

                <p>
                  Basic information associated with
                  your SecurePulse account
                </p>
              </div>

            </div>

            <div className="profile-details">

              {/* FULL NAME */}

              <div className="profile-detail">

                <div className="detail-icon">
                  👤
                </div>

                <div className="detail-content">

                  <span className="detail-label">
                    Full Name
                  </span>

                  <span className="detail-value">
                    {displayName}
                  </span>

                </div>
              </div>

              {/* EMAIL */}

              <div className="profile-detail">

                <div className="detail-icon">
                  ✉️
                </div>

                <div className="detail-content">

                  <span className="detail-label">
                    Email Address
                  </span>

                  <span className="detail-value">
                    {email}
                  </span>

                </div>
              </div>

              {/* ROLE */}

              <div className="profile-detail">

                <div className="detail-icon">
                  🛡️
                </div>

                <div className="detail-content">

                  <span className="detail-label">
                    Account Role
                  </span>

                  <span className="detail-value">
                    {role}
                  </span>

                </div>
              </div>

              {/* STATUS */}

              <div className="profile-detail">

                <div className="detail-icon status-icon">
                  ●
                </div>

                <div className="detail-content">

                  <span className="detail-label">
                    Account Status
                  </span>

                  <span
                    className={`detail-status ${getStatusClass(
                      status
                    )}`}
                  >
                    <span className="status-dot"></span>
                    {status}
                  </span>

                </div>
              </div>

              {/* CREATED */}

              <div className="profile-detail">

                <div className="detail-icon">
                  📅
                </div>

                <div className="detail-content">

                  <span className="detail-label">
                    Account Created
                  </span>

                  <span className="detail-value">
                    {createdDate}
                  </span>

                </div>
              </div>

              {/* LAST LOGIN */}

              <div className="profile-detail">

                <div className="detail-icon">
                  🕒
                </div>

                <div className="detail-content">

                  <span className="detail-label">
                    Last Login
                  </span>

                  <span className="detail-value">
                    {lastLogin}
                  </span>

                </div>
              </div>

            </div>
          </div>

          {/* =================================================
              SECURITY INFORMATION
          ================================================= */}

          <div className="profile-security-section">

            <div className="section-heading">

              <div className="section-icon security">
                🔐
              </div>

              <div>
                <h3>Security Information</h3>

                <p>
                  Security features protecting your
                  SecurePulse account
                </p>
              </div>

            </div>

            <div className="security-cards">

              {/* AUTHENTICATION */}

              <div className="security-card">

                <div className="security-card-icon">
                  🔐
                </div>

                <div>
                  <h4>Authentication</h4>

                  <p>
                    Your account is protected by
                    SecurePulse authentication.
                  </p>
                </div>

              </div>

              {/* RBAC */}

              <div className="security-card">

                <div className="security-card-icon">
                  🛡️
                </div>

                <div>
                  <h4>Role-Based Access</h4>

                  <p>
                    Access permissions are controlled
                    using role-based access control.
                  </p>
                </div>

              </div>

              {/* MONITORING */}

              <div className="security-card">

                <div className="security-card-icon">
                  📊
                </div>

                <div>
                  <h4>Security Monitoring</h4>

                  <p>
                    Account activity is monitored by
                    the SecurePulse security system.
                  </p>
                </div>

              </div>

            </div>

            {/* SECURITY NOTICE */}

            <div className="security-notice">

              <div className="notice-icon">
                ✓
              </div>

              <div>
                <h4>Your account is protected</h4>

                <p>
                  SecurePulse uses authentication,
                  role-based access control and
                  security monitoring to help protect
                  your account and system access.
                </p>
              </div>

            </div>

          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default Profile;

