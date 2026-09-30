import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./UserSidebar.css";

const UserSidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);

  const closeMobileMenu = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login");
  };

  const handleProfile = () => {
    setProfileOpen(false);
    navigate("/user-profile");
  };

  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }

    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return "U";
  };

  const displayName =
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <aside
      className={`user-sidebar ${
        isOpen ? "mobile-open" : ""
      }`}
    >

      {/* BRAND */}

      <div className="sidebar-brand">

        <div className="sidebar-logo">
          S
        </div>

        <div className="sidebar-brand-text">
          <h2>SecurePulse</h2>
          <span>Security Center</span>
        </div>

        <button
          type="button"
          className="sidebar-close-btn"
          onClick={closeMobileMenu}
          aria-label="Close sidebar"
        >
          ×
        </button>

      </div>


      {/* MAIN NAVIGATION */}

      <nav className="sidebar-nav">

        <div className="sidebar-nav-section">

          <span className="sidebar-nav-title">
            MAIN MENU
          </span>


          {/* DASHBOARD */}

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="sidebar-link-icon">
              ◉
            </span>

            <span>
              Dashboard
            </span>
          </NavLink>


          {/* LOGIN ACTIVITY */}

          <NavLink
            to="/user/login-activity"
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="sidebar-link-icon">
              ↗
            </span>

            <span>
              Login Activity
            </span>
          </NavLink>


          {/* SECURITY ALERTS */}

          <NavLink
            to="/user/security-alerts"
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="sidebar-link-icon">
              ⚠
            </span>

            <span>
              Security Alerts
            </span>
          </NavLink>


          {/* SECURITY SETTINGS */}

          <NavLink
            to="/user-security"
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >
            <span className="sidebar-link-icon">
              ⚙
            </span>

            <span>
              Security Settings
            </span>
          </NavLink>

        </div>

      </nav>


      {/* SYSTEM STATUS */}

      <div className="sidebar-system-status">

        <span className="system-status-dot"></span>

        <div>
          <strong>
            System Secure
          </strong>

          <span>
            Monitoring Active
          </span>
        </div>

      </div>


      {/* PROFILE */}

      <div className="sidebar-profile-wrapper">

        {profileOpen && (

          <div className="sidebar-profile-menu">

            <div className="profile-menu-header">

              <div className="profile-menu-avatar">
                {getInitial()}
              </div>

              <div className="profile-menu-user">

                <strong>
                  {displayName}
                </strong>

                <span>
                  {user?.email || "User Account"}
                </span>

              </div>

            </div>


            <div className="profile-menu-divider"></div>


            {/* PROFILE */}

            <button
              type="button"
              className="profile-menu-item"
              onClick={handleProfile}
            >
              <span className="profile-menu-item-icon">
                👤
              </span>

              <span>
                Profile
              </span>
            </button>


            <div className="profile-menu-divider"></div>


            {/* LOGOUT */}

            <button
              type="button"
              className="profile-menu-item logout-item"
              onClick={handleLogout}
            >
              <span className="profile-menu-item-icon">
                ⇥
              </span>

              <span>
                Logout
              </span>
            </button>

          </div>

        )}


        {/* PROFILE BUTTON */}

        <button
          type="button"
          className={`sidebar-profile ${
            profileOpen ? "profile-active" : ""
          }`}
          onClick={() =>
            setProfileOpen((prev) => !prev)
          }
          aria-expanded={profileOpen}
          aria-label="Open profile menu"
        >

          <div className="sidebar-profile-avatar">
            {getInitial()}
          </div>

          <div className="sidebar-profile-info">

            <strong>
              {displayName}
            </strong>

            <span>
              User
            </span>

          </div>

          <span
            className={`sidebar-profile-arrow ${
              profileOpen ? "arrow-up" : ""
            }`}
            aria-hidden="true"
          >
            ⌄
          </span>

        </button>

      </div>

    </aside>
  );
};

export default UserSidebar;