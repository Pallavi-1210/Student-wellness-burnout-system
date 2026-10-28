import { useState } from "react";
import axios from "axios";
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiAlertCircle,
} from "react-icons/fi";
import { API_ENDPOINTS } from "../../utils/apiConfig";

const API_BASE_URL = API_ENDPOINTS.AUTH;

function Login({ onAuthSuccess, onSwitchToSignup }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail || !formData.password) {
      setError("Please fill in both email and password.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email: trimmedEmail,
        password: formData.password,
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        if (onAuthSuccess) {
          onAuthSuccess({ token, user });
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Unable to connect to the authentication server. Please ensure the backend is running.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card-body">
      <div className="auth-header">
        <span className="project-tag">Student Wellness Portal</span>
        <h2>Welcome Back</h2>

      </div>

      {error && (
        <div className="auth-alert error">
          <FiAlertCircle className="alert-icon" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <div className="form-group">
          <label htmlFor="login-email">Student Email Address</label>
          <div className="input-with-icon">
            <FiMail className="input-icon" />
            <input
              id="login-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. student@college.edu"
              autoComplete="email"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <div className="input-with-icon">
            <FiLock className="input-icon" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary auth-submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            "Signing in..."
          ) : (
            <>
              Sign In &rarr;
            </>
          )}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Don't have an account yet?{" "}
          <button
            type="button"
            className="auth-link-btn"
            onClick={onSwitchToSignup}
          >
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
