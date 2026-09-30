
import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./ResetPassword.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!password || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        `/auth/reset-password/${token}`,
        {
          password,
          confirmPassword,
        }
      );

      setMessage(
        response.data?.message ||
          "Password reset successfully. You can now login."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to reset password. The reset link may have expired."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">

        {/* HEADER */}
        <div className="reset-password-header">

          <div className="reset-password-icon">
            🔐
          </div>

          <h1>Reset Password</h1>

          <p>
            Create a new secure password for your SecurePulse account.
          </p>

        </div>

        {/* FORM */}
        <form
          className="reset-password-form"
          onSubmit={handleSubmit}
        >

          {/* NEW PASSWORD */}
          <div className="reset-password-field">

            <label className="reset-password-label">
              New Password
            </label>

            <input
              type="password"
              className="reset-password-input"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

          </div>

          {/* CONFIRM PASSWORD */}
          <div className="reset-password-field">

            <label className="reset-password-label">
              Confirm Password
            </label>

            <input
              type="password"
              className="reset-password-input"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              disabled={loading}
            />

          </div>

          {/* ERROR */}
          {error && (
            <div className="reset-password-error">
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {message && (
            <div className="reset-password-success">
              {message}
            </div>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            className="reset-password-button"
            disabled={loading}
          >
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>

        </form>

        {/* BACK TO LOGIN */}
        <div className="reset-password-back">
          <Link to="/login">
            ← Back to Login
          </Link>
        </div>

        {/* SECURITY TEXT */}
        <div className="reset-password-security">
          Your new password should be unique and difficult to guess.
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;

