import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);

  // ============================================
  // CLOSE MOBILE SIDEBAR
  // ============================================
  const closeMobileMenu = () => {
    if (onClose) {
      onClose();
    }
  };

  // ============================================
  // LOGOUT
  // ============================================
  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login");
  };

  // ============================================
  // MY PROFILE
  // ============================================
  const handleProfile = () => {
    setProfileOpen(false);
    closeMobileMenu();

    // ADMIN PROFILE PAGE
    navigate("/profile");
  };

  // ============================================
  // GET USER INITIAL
  // ============================================
  const getInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }

    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return "A";
  };

  // ============================================
  // DISPLAY NAME
  // ============================================
  const displayName =
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "Admin";

  return (
    <aside className={`sidebar ${isOpen ? "mobile-open" : ""}`}>

      {/* ============================================
          BRAND
      ============================================ */}
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


      {/* ============================================
          ADMIN INFORMATION
      ============================================ */}
      <div className="sidebar-admin-info">

        <div className="sidebar-admin-avatar">
          {getInitial()}
        </div>

        <div className="sidebar-admin-details">

          <strong>
            {displayName}
          </strong>

          <span>
            Administrator
          </span>

        </div>

      </div>


      {/* ============================================
          MAIN NAVIGATION
      ============================================ */}
      <nav className="sidebar-nav">

        <div className="sidebar-nav-section">

          <span className="sidebar-nav-title">
            MAIN
          </span>


          {/* ============================================
              ADMIN DASHBOARD
          ============================================ */}
          <NavLink
            to="/admin"
            end
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-link-icon">
              ◉
            </span>

            <span>
              Dashboard
            </span>
          </NavLink>


          {/* ============================================
              USER MANAGEMENT
          ============================================ */}
          <NavLink
            to="/admin/users"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-link-icon">
              👥
            </span>

            <span>
              User Management
            </span>
          </NavLink>


          {/* ============================================
              SECURITY LOGS
          ============================================ */}
          <NavLink
            to="/admin/security-logs"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-link-icon">
              ⚠
            </span>

            <span>
              Security Logs
            </span>
          </NavLink>


          {/* ============================================
              ACCOUNT SECURITY
          ============================================ */}
          <NavLink
            to="/security-settings"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-link-icon">
              🔐
            </span>

            <span>
              Account Security
            </span>
          </NavLink>

        </div>

      </nav>


      {/* ============================================
          SYSTEM STATUS
      ============================================ */}
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


      {/* ============================================
          PROFILE AREA
      ============================================ */}
      <div className="sidebar-profile-wrapper">

        {/* ============================================
            PROFILE POPUP
        ============================================ */}
        {profileOpen && (
          <div className="sidebar-profile-menu">

            {/* ============================================
                PROFILE HEADER
            ============================================ */}
            <div className="profile-menu-header">

              <div className="profile-menu-avatar">
                {getInitial()}
              </div>

              <div className="profile-menu-user">

                <strong>
                  {displayName}
                </strong>

                <span>
                  {user?.email || "Admin Account"}
                </span>

              </div>

            </div>


            <div className="profile-menu-divider"></div>


            {/* ============================================
                MY PROFILE
            ============================================ */}
            <button
              type="button"
              className="profile-menu-item"
              onClick={handleProfile}
            >
              <span className="profile-menu-item-icon">
                👤
              </span>

              <span>
                My Profile
              </span>
            </button>


            <div className="profile-menu-divider"></div>


            {/* ============================================
                LOGOUT
            ============================================ */}
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


        {/* ============================================
            PROFILE BUTTON
        ============================================ */}
        <button
          type="button"
          className={`sidebar-profile ${
            profileOpen ? "profile-active" : ""
          }`}
          onClick={() =>
            setProfileOpen((prev) => !prev)
          }
        >

          <div className="sidebar-profile-avatar">
            {getInitial()}
          </div>

          <div className="sidebar-profile-info">

            <strong>
              {displayName}
            </strong>

            <span>
              Administrator
            </span>

          </div>

          <span
            className={`sidebar-profile-arrow ${
              profileOpen ? "arrow-up" : ""
            }`}
          >
            ⌄
          </span>

        </button>

      </div>

    </aside>
  );
};

export default Sidebar;

