import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./UserSecurity.css";
import { useAuth } from "../../context/AuthContext";
import UserSidebar from "../../components/UserSidebar";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const UserSecurity = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // SIDEBAR
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // USER SECURITY STATES
  const [profile, setProfile] = useState(null);

  const [loginActivityAlerts, setLoginActivityAlerts] =
    useState(false);

  const [securityAlerts, setSecurityAlerts] =
    useState(false);

  const [notificationSuccess, setNotificationSuccess] =
    useState("");

  const [notificationError, setNotificationError] =
    useState("");

  // CHANGE PASSWORD STATES
  const [showChangePassword, setShowChangePassword] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [passwordSuccess, setPasswordSuccess] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  // LOAD USER PROFILE
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedToken =
          token || localStorage.getItem("token");

        if (!storedToken) {
          setProfile(user || null);
          return;
        }

        const response = await axios.get(
          `${API_BASE_URL}/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );

        if (response.data?.success) {
          const userProfile = response.data;

          setProfile(userProfile);

          setLoginActivityAlerts(
            Boolean(userProfile.loginActivityAlerts)
          );

          setSecurityAlerts(
            Boolean(userProfile.securityAlerts)
          );

          localStorage.setItem(
            "loginActivityAlerts",
            String(
              Boolean(userProfile.loginActivityAlerts)
            )
          );

          localStorage.setItem(
            "securityAlerts",
            String(
              Boolean(userProfile.securityAlerts)
            )
          );
        }
      } catch (error) {
        console.error(
          "Failed to load security profile:",
          error
        );

        const savedLoginAlerts =
          localStorage.getItem("loginActivityAlerts");

        const savedSecurityAlerts =
          localStorage.getItem("securityAlerts");

        setLoginActivityAlerts(
          savedLoginAlerts !== "false"
        );

        setSecurityAlerts(
          savedSecurityAlerts !== "false"
        );
      }
    };

    loadProfile();
  }, [token, user]);

  // UPDATE NOTIFICATION SETTINGS
  const handleNotificationChange = async (
    setting,
    value
  ) => {
    setNotificationSuccess("");
    setNotificationError("");

    const previousLoginActivityAlerts =
      loginActivityAlerts;

    const previousSecurityAlerts =
      securityAlerts;

    if (setting === "loginActivityAlerts") {
      setLoginActivityAlerts(value);

      localStorage.setItem(
        "loginActivityAlerts",
        String(value)
      );
    }

    if (setting === "securityAlerts") {
      setSecurityAlerts(value);

      localStorage.setItem(
        "securityAlerts",
        String(value)
      );
    }

    try {
      const storedToken =
        token || localStorage.getItem("token");

      if (!storedToken) {
        throw new Error("Authentication token not found.");
      }

      const updatedSettings = {
        loginActivityAlerts:
          setting === "loginActivityAlerts"
            ? value
            : loginActivityAlerts,

        securityAlerts:
          setting === "securityAlerts"
            ? value
            : securityAlerts,
      };

      const response = await axios.patch(
        `${API_BASE_URL}/users/notification-settings`,
        updatedSettings,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );

      if (response.data?.success) {
        setNotificationSuccess(
          "Notification settings updated successfully."
        );

        setTimeout(() => {
          setNotificationSuccess("");
        }, 3000);
      } else {
        throw new Error(
          response.data?.message ||
            "Failed to update notification settings."
        );
      }
    } catch (error) {
      console.error(
        "Notification settings error:",
        error
      );

      setLoginActivityAlerts(
        previousLoginActivityAlerts
      );

      setSecurityAlerts(
        previousSecurityAlerts
      );

      localStorage.setItem(
        "loginActivityAlerts",
        String(previousLoginActivityAlerts)
      );

      localStorage.setItem(
        "securityAlerts",
        String(previousSecurityAlerts)
      );

      setNotificationError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update notification settings."
      );

      setTimeout(() => {
        setNotificationError("");
      }, 4000);
    }
  };

  // OPEN CHANGE PASSWORD
  const openChangePassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setPasswordSuccess("");
    setPasswordError("");

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);

    setShowChangePassword(true);
  };

  // CLOSE CHANGE PASSWORD
  const closeChangePassword = () => {
    if (passwordLoading) {
      return;
    }

    setShowChangePassword(false);

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setPasswordSuccess("");
    setPasswordError("");

    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // CHANGE PASSWORD
  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordSuccess("");
    setPasswordError("");

    if (!currentPassword.trim()) {
      setPasswordError(
        "Please enter your current password."
      );
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError(
        "Please enter your new password."
      );
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );
      return;
    }

    if (!confirmPassword.trim()) {
      setPasswordError(
        "Please confirm your new password."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New password and confirm password do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setPasswordLoading(true);

      const storedToken =
        token || localStorage.getItem("token");

      if (!storedToken) {
        throw new Error(
          "Authentication token not found."
        );
      }

      const response = await axios.patch(
        `${API_BASE_URL}/auth/change-password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        }
      );

      if (response.data?.success) {
        setPasswordSuccess(
          response.data.message ||
            "Password changed successfully."
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordSuccess("");
        }, 1800);
      } else {
        setPasswordError(
          response.data?.message ||
            "Failed to change password."
        );
      }
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setPasswordError(
        error.response?.data?.message ||
          "Failed to change password. Please try again."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // QUICK ACTIONS
  const handleLoginActivity = () => {
    navigate("/user/login-activity");
  };

  const handleSecurityAlerts = () => {
    navigate("/user/security-alerts");
  };

  const handleProfile = () => {
    navigate("/user-profile");
  };

  // CLOSE MODAL OUTSIDE
  const handleOverlayClick = (e) => {
    if (
      e.target === e.currentTarget &&
      !passwordLoading
    ) {
      closeChangePassword();
    }
  };

  // ESCAPE KEY
  useEffect(() => {
    const handleEscape = (e) => {
      if (
        e.key === "Escape" &&
        showChangePassword &&
        !passwordLoading
      ) {
        closeChangePassword();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [showChangePassword, passwordLoading]);

  const displayName =
    profile?.name ||
    user?.name ||
    "User";

  return (
    <>
      {/* USER SIDEBAR */}

      <UserSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* MOBILE OVERLAY */}

      {sidebarOpen && (
        <div
          className="user-security-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}

      <main className="user-security-main-content">

        {/* MOBILE HEADER */}

        <div className="user-security-mobile-header">
          <button
            type="button"
            className="user-security-menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            ☰
          </button>

          <span>Security Settings</span>
        </div>

        {/* PAGE HEADER */}

        <div className="user-security-page-header">
          <h1>Security Settings</h1>

          <p>
            Manage your account security and notification
            preferences.
          </p>
        </div>

        {/* ACCOUNT SECURITY */}

        <div className="user-security-card">

          <div className="user-security-card-header">

            <div className="user-security-card-icon">
              🔐
            </div>

            <div>
              <h2>Account Security</h2>

              <p>
                Manage your password and account protection.
              </p>
            </div>

          </div>

          <div className="user-security-items">

            {/* CHANGE PASSWORD */}

            <div className="user-security-item">

              <div className="user-security-item-left">

                <div className="security-item-icon safe">
                  🔑
                </div>

                <div>
                  <h3>Change Password</h3>

                  <p>
                    Update your password regularly to keep
                    your account secure.
                  </p>
                </div>

              </div>

              <button
                type="button"
                className="security-action-button"
                onClick={openChangePassword}
              >
                Change Password
              </button>

            </div>

            {/* ACCOUNT STATUS */}

            <div className="user-security-item">

              <div className="user-security-item-left">

                <div className="security-item-icon safe">
                  🛡️
                </div>

                <div>
                  <h3>Account Status</h3>

                  <p>
                    Your current account security status.
                  </p>
                </div>

              </div>

              <div className="security-enabled">
                <span>●</span>

                {profile?.status ||
                  user?.status ||
                  "Active"}
              </div>

            </div>

          </div>
        </div>

        {/* SECURITY NOTIFICATIONS */}

        <div className="user-security-card">

          <div className="user-security-card-header">

            <div className="user-security-card-icon">
              🔔
            </div>

            <div>
              <h2>Security Notifications</h2>

              <p>
                Choose which security events you want to be
                notified about.
              </p>
            </div>

          </div>

          {notificationSuccess && (
            <div className="notification-settings-success">
              ✓ {notificationSuccess}
            </div>
          )}

          {notificationError && (
            <div className="notification-settings-error">
              {notificationError}
            </div>
          )}

          <div className="user-security-items">

            {/* LOGIN ACTIVITY ALERTS */}

            <div className="user-security-item">

              <div className="user-security-item-left">

                <div className="security-item-icon warning">
                  ⚠
                </div>

                <div>
                  <h3>
                    Login Activity Alerts
                  </h3>

                  <p>
                    Get notified when a login occurs on
                    your account.
                  </p>
                </div>

              </div>

              <label className="security-toggle">

                <input
                  type="checkbox"
                  checked={loginActivityAlerts}
                  onChange={(e) =>
                    handleNotificationChange(
                      "loginActivityAlerts",
                      e.target.checked
                    )
                  }
                />

                <span className="security-toggle-slider"></span>

              </label>

            </div>

            {/* SECURITY ALERTS */}

            <div className="user-security-item">

              <div className="user-security-item-left">

                <div className="security-item-icon warning">
                  ⚠
                </div>

                <div>
                  <h3>
                    Security Alerts
                  </h3>

                  <p>
                    Get notified about important security
                    events on your account.
                  </p>
                </div>

              </div>

              <label className="security-toggle">

                <input
                  type="checkbox"
                  checked={securityAlerts}
                  onChange={(e) =>
                    handleNotificationChange(
                      "securityAlerts",
                      e.target.checked
                    )
                  }
                />

                <span className="security-toggle-slider"></span>

              </label>

            </div>

          </div>
        </div>

        {/* SECURITY CENTER */}

        <div className="user-security-card">

          <div className="user-security-card-header">

            <div className="user-security-card-icon">
              🛡️
            </div>

            <div>
              <h2>Security Center</h2>

              <p>
                Quickly access your security information.
              </p>
            </div>

          </div>

          <div className="user-security-quick-actions">

            <button
              type="button"
              className="user-security-quick-button"
              onClick={handleLoginActivity}
            >
              <span className="quick-button-icon">
                📊
              </span>

              <span>
                Login Activity
              </span>

              <span className="quick-arrow">
                →
              </span>
            </button>

            <button
              type="button"
              className="user-security-quick-button"
              onClick={handleSecurityAlerts}
            >
              <span className="quick-button-icon">
                🚨
              </span>

              <span>
                Security Alerts
              </span>

              <span className="quick-arrow">
                →
              </span>
            </button>

            <button
              type="button"
              className="user-security-quick-button"
              onClick={handleProfile}
            >
              <span className="quick-button-icon">
                👤
              </span>

              <span>
                Account Profile
              </span>

              <span className="quick-arrow">
                →
              </span>
            </button>

          </div>
        </div>

        {/* SECURITY TIP */}

        <div className="user-security-tip">

          <div className="user-security-tip-icon">
            💡
          </div>

          <div>
            <h3>
              Security Tip
            </h3>

            <p>
              Use a strong, unique password and keep your
              security notifications enabled so you can
              quickly identify unusual activity on your
              account.
            </p>
          </div>

        </div>

        {/* FOOTER */}

        <div className="user-security-footer">
          SecurePulse Security Center • Keep your account
          protected
        </div>

      </main>

      {/* CHANGE PASSWORD MODAL */}

      {showChangePassword && (
        <div
          className="change-password-overlay"
          onMouseDown={handleOverlayClick}
        >

          <div
            className="change-password-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >

            <div className="change-password-header">

              <div>
                <h2>
                  Change Password
                </h2>

                <p>
                  Create a new secure password for your
                  account.
                </p>
              </div>

              <button
                type="button"
                className="change-password-close"
                onClick={closeChangePassword}
                disabled={passwordLoading}
                aria-label="Close"
              >
                ×
              </button>

            </div>

            {passwordSuccess && (
              <div className="password-success-message">
                ✓ {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="password-error-message">
                {passwordError}
              </div>
            )}

            <form
              className="change-password-form"
              onSubmit={handleChangePassword}
            >

              {/* CURRENT PASSWORD */}

              <div className="password-field">

                <label htmlFor="currentPassword">
                  Current Password
                </label>

                <div className="password-input-wrapper">

                  <input
                    id="currentPassword"
                    type={
                      showCurrentPassword
                        ? "text"
                        : "password"
                    }
                    value={currentPassword}
                    onChange={(e) =>
                      setCurrentPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                    disabled={passwordLoading}
                  />

                  <button
                    type="button"
                    className="password-show-button"
                    onClick={() =>
                      setShowCurrentPassword(
                        !showCurrentPassword
                      )
                    }
                    disabled={passwordLoading}
                  >
                    {showCurrentPassword
                      ? "🙈"
                      : "👁"}
                  </button>

                </div>
              </div>

              {/* NEW PASSWORD */}

              <div className="password-field">

                <label htmlFor="newPassword">
                  New Password
                </label>

                <div className="password-input-wrapper">

                  <input
                    id="newPassword"
                    type={
                      showNewPassword
                        ? "text"
                        : "password"
                    }
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    disabled={passwordLoading}
                  />

                  <button
                    type="button"
                    className="password-show-button"
                    onClick={() =>
                      setShowNewPassword(
                        !showNewPassword
                      )
                    }
                    disabled={passwordLoading}
                  >
                    {showNewPassword
                      ? "🙈"
                      : "👁"}
                  </button>

                </div>

                <small>
                  Password must contain at least 6
                  characters.
                </small>

              </div>

              {/* CONFIRM PASSWORD */}

              <div className="password-field">

                <label htmlFor="confirmPassword">
                  Confirm New Password
                </label>

                <div className="password-input-wrapper">

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    disabled={passwordLoading}
                  />

                  <button
                    type="button"
                    className="password-show-button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    disabled={passwordLoading}
                  >
                    {showConfirmPassword
                      ? "🙈"
                      : "👁"}
                  </button>

                </div>
              </div>

              {/* ACTIONS */}

              <div className="change-password-actions">

                <button
                  type="button"
                  className="change-password-cancel"
                  onClick={closeChangePassword}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="change-password-submit"
                  disabled={passwordLoading}
                >
                  {passwordLoading
                    ? "Changing..."
                    : "Change Password"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}
    </>
  );
};

export default UserSecurity;