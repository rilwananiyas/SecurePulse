import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  // ============================================
  // WAIT FOR AUTHENTICATION CHECK
  // ============================================
  if (loading) {
    return <p>Loading...</p>;
  }

  // ============================================
  // NO LOGGED-IN USER
  // ============================================
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ============================================
  // NORMALIZE USER ROLE
  // ============================================
  const userRole = String(user.role || "")
    .trim()
    .toLowerCase();

  // ============================================
  // NO ROLE RESTRICTION
  // ============================================
  if (!role) {
    return children;
  }

  // ============================================
  // SUPPORT SINGLE OR MULTIPLE ROLES
  // ============================================
  const allowedRoles = Array.isArray(role)
    ? role.map((r) => String(r).trim().toLowerCase())
    : [String(role).trim().toLowerCase()];

  // ============================================
  // CHECK ROLE
  // ============================================
  if (!allowedRoles.includes(userRole)) {

    // Admin trying to access a user-only page
    if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    }

    // Normal user trying to access an admin-only page
    return <Navigate to="/dashboard" replace />;
  }

  // ============================================
  // ACCESS GRANTED
  // ============================================
  return children;
};

export default ProtectedRoute;

