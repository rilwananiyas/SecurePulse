
import { Routes, Route } from "react-router-dom";

// ============================================
// AUTH PAGES
// ============================================
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

// ============================================
// USER PAGES
// ============================================
import UserDashboard from "../pages/user/UserDashboard";
import UserLoginActivity from "../pages/user/UserLoginActivity";
import UserSecurityAlerts from "../pages/user/UserSecurityAlerts";
import UserSecurity from "../pages/user/UserSecurity";

// ============================================
// ADMIN PAGES
// ============================================
import AdminDashboard from "../pages/admin/AdminDashboard";
import Users from "../pages/admin/Users";
import SecurityAlerts from "../pages/admin/SecurityAlerts";
import Notifications from "../pages/Notifications";

// ============================================
// COMMON / PROFILE PAGES
// ============================================
import Profile from "../pages/Profile/Profile";
import SecuritySettings from "../pages/SecuritySettings/SecuritySettings";

// ============================================
// PROTECTED ROUTE
// ============================================
import ProtectedRoute from "../components/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>

      {/* ============================================
          AUTH ROUTES
      ============================================ */}

      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* FORGOT PASSWORD */}
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />

      {/* RESET PASSWORD */}
      <Route
        path="/reset-password/:token"
        element={<ResetPassword />}
      />


      {/* ============================================
          USER ROUTES
      ============================================ */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="user">
            <UserDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/login-activity"
        element={
          <ProtectedRoute role="user">
            <UserLoginActivity />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/security-alerts"
        element={
          <ProtectedRoute role="user">
            <UserSecurityAlerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-profile"
        element={
          <ProtectedRoute role="user">
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user-security"
        element={
          <ProtectedRoute role="user">
            <UserSecurity />
          </ProtectedRoute>
        }
      />


      {/* ============================================
          ADMIN ROUTES
      ============================================ */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute role="admin">
            <Users />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/security-logs"
        element={
          <ProtectedRoute role="admin">
            <SecurityAlerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/security-alerts"
        element={
          <ProtectedRoute role="admin">
            <SecurityAlerts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute role="admin">
            <Notifications />
          </ProtectedRoute>
        }
      />


      {/* ============================================
          ADMIN PROFILE
      ============================================ */}

      <Route
        path="/profile"
        element={
          <ProtectedRoute role="admin">
            <Profile />
          </ProtectedRoute>
        }
      />


      {/* ============================================
          ADMIN SECURITY SETTINGS
      ============================================ */}

      <Route
        path="/security-settings"
        element={
          <ProtectedRoute role="admin">
            <SecuritySettings />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
};

export default AppRoutes;




