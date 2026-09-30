import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import {
  getNotificationPermission,
  showBrowserNotification,
} from "../../utils/browserNotifications";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================
  // CHECK LOGIN ACTIVITY ALERT PREFERENCE
  // ============================================

  const isLoginActivityAlertsEnabled = () => {
    const savedPreference = localStorage.getItem(
      "loginActivityAlerts"
    );

    // Default = enabled
    return savedPreference !== "false";
  };

  // ============================================
  // SHOW LOGIN NOTIFICATION
  // ============================================

  const showLoginNotification = (
    title,
    body,
    tag
  ) => {
    try {
      // Browser permission must be granted
      if (
        getNotificationPermission() !==
        "granted"
      ) {
        return;
      }

      // Login Activity Alerts must be enabled
      if (!isLoginActivityAlertsEnabled()) {
        return;
      }

      showBrowserNotification(title, {
        body,
        tag,
      });
    } catch (notificationError) {
      console.error(
        "Login notification error:",
        notificationError
      );
    }
  };

  // ============================================
  // LOGIN SUBMIT
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // ==========================================
    // BASIC VALIDATION
    // ==========================================

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Login attempt:",
        email
      );

      // ========================================
      // CALL AUTH CONTEXT LOGIN
      // ========================================

      const data = await login({
        email: email.trim(),
        password,
      });

      console.log(
        "Login response:",
        data
      );

      // ========================================
      // VERIFY TOKEN WAS SAVED
      // ========================================

      const savedToken =
        localStorage.getItem("token");

      console.log(
        "Token after login:",
        savedToken
          ? "TOKEN FOUND"
          : "TOKEN NOT FOUND"
      );

      if (!savedToken) {
        throw new Error(
          "Authentication token was not saved. Please try logging in again."
        );
      }

      // ========================================
      // GET LOGGED USER
      // ========================================

      const loggedUser =
        data?.user || data;

      if (!loggedUser) {
        throw new Error(
          "Invalid login response from server."
        );
      }

      // ========================================
      // SUCCESS LOGIN NOTIFICATION
      // ========================================

      showLoginNotification(
        "🔐 SecurePulse",
        "New successful login detected on your account.",
        "securepulse-login-success"
      );

      // ========================================
      // CHECK USER ROLE
      // ========================================

      const role = String(
        loggedUser.role || ""
      )
        .trim()
        .toLowerCase();

      console.log(
        "Logged user role:",
        role
      );

      // ========================================
      // REDIRECT
      // ========================================

      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      // ========================================
      // ERROR MESSAGE
      // ========================================

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Invalid email or password.";

      setError(message);

      // ========================================
      // FAILED LOGIN NOTIFICATION
      // ========================================

      showLoginNotification(
        "⚠️ SecurePulse Security Alert",
        "A failed login attempt was detected on your account.",
        "securepulse-login-failed"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* ======================================
            LOGO / TITLE
        ====================================== */}

        <h1>🛡 SecurePulse</h1>

        <h2>Welcome Back</h2>

        {/* ======================================
            ERROR MESSAGE
        ====================================== */}

        {error && (
          <p
            className="error"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* ======================================
            LOGIN FORM
        ====================================== */}

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}

          <label htmlFor="login-email">
            Email
          </label>

          <input
            id="login-email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            autoComplete="email"
            required
          />

          {/* PASSWORD */}

          <label htmlFor="login-password">
            Password
          </label>

          <input
            id="login-password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            autoComplete="current-password"
            required
          />

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>

        </form>

        {/* ======================================
            FORGOT PASSWORD
        ====================================== */}

        <p>
          <Link to="/forgot-password">
            Forgot Password?
          </Link>
        </p>

        {/* ======================================
            REGISTER
        ====================================== */}

        <p>
          Don't have an account?{" "}
          <Link to="/register">
            Create Account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;