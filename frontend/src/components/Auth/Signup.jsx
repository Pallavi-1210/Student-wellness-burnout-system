import { useState, useEffect } from "react";
import axios from "axios";
import {
  FiMail,
  FiLock,
  FiUser,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiKey,
  FiRefreshCw,
  FiEdit2,
  FiShield,
} from "react-icons/fi";
import { API_ENDPOINTS } from "../../utils/apiConfig";

const API_BASE_URL = API_ENDPOINTS.AUTH;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Signup({ onAuthSuccess, onSwitchToLogin }) {
  // Step 1: Details (name, email)
  // Step 2: OTP Verification
  // Step 3: Password creation (only accessible after successful OTP verification)
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const [verificationToken, setVerificationToken] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Cooldown countdown in seconds for resending OTP
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === "otp" ? value.replace(/\D/g, "").slice(0, 6) : value;
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
    if (error) setError("");
  };

  // Step 1: Send OTP to student email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      setError("Please provide a valid email address.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(`${API_BASE_URL}/send-otp`, {
        email: trimmedEmail,
      });

      if (res.data.success) {
        setSuccessMsg(res.data.message || "Verification code sent to your email!");
        setCooldown(res.data.cooldownSeconds || 60);
        setStep(2);
      }
    } catch (err) {
      console.error("Send OTP Error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
        if (err.response.data.retryAfter) {
          setCooldown(err.response.data.retryAfter);
        }
      } else {
        setError("Unable to send verification code. Please ensure backend server is running.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    const trimmedEmail = formData.email.trim().toLowerCase();
    const cleanOtp = String(formData.otp).trim();

    if (!cleanOtp) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    if (!/^\d{6}$/.test(cleanOtp)) {
      setError("Verification code must be exactly 6 numeric digits.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(`${API_BASE_URL}/verify-otp`, {
        email: trimmedEmail,
        otp: cleanOtp,
      });

      if (res.data.success && res.data.verificationToken) {
        setVerificationToken(res.data.verificationToken);
        setIsEmailVerified(true);
        setSuccessMsg("Email verified! Create your password to finish registration.");
        setStep(3);
      }
    } catch (err) {
      console.error("Verify OTP Error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Verification failed. Please check your code or request a new one.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set password and create account
  const handleFinalSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();

    if (!isEmailVerified || !verificationToken) {
      setError("Email verification is required before creating an account. Please complete OTP verification.");
      setStep(1);
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);

      const res = await axios.post(`${API_BASE_URL}/signup`, {
        name: trimmedName,
        email: trimmedEmail,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        verificationToken,
      });

      if (res.data.success) {
        setSuccessMsg("Account created successfully! Logging you in...");

        // Auto-login student with issued token
        if (res.data.token && res.data.user) {
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("user", JSON.stringify(res.data.user));
          if (onAuthSuccess) {
            onAuthSuccess({
              token: res.data.token,
              user: res.data.user,
            });
          }
        } else {
          try {
            const loginRes = await axios.post(`${API_BASE_URL}/login`, {
              email: trimmedEmail,
              password: formData.password,
            });
            if (loginRes.data.success) {
              const { token, user } = loginRes.data;
              localStorage.setItem("token", token);
              localStorage.setItem("user", JSON.stringify(user));
              if (onAuthSuccess) {
                onAuthSuccess({ token, user });
              }
              return;
            }
          } catch {
            if (onSwitchToLogin) onSwitchToLogin();
          }
        }
      }
    } catch (err) {
      console.error("Signup Error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
        if (err.response.status === 403) {
          setIsEmailVerified(false);
          setVerificationToken("");
          setStep(1);
        }
      } else {
        setError("Registration could not be completed. Please ensure backend is running.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEmail = () => {
    setError("");
    setSuccessMsg("");
    setStep(1);
    setIsEmailVerified(false);
    setVerificationToken("");
    setFormData((prev) => ({ ...prev, otp: "" }));
  };

  return (
    <div className="auth-card-body">
      <div className="auth-header">
        <span className="project-tag">Student Wellness Portal</span>
        <h2>Create Student Account</h2>

      </div>

      {/* Progress Step Indicator */}
      <div className="auth-step-indicator" role="navigation" aria-label="Signup Progress">
        <div className={`auth-step-pill ${step === 1 ? "active" : step > 1 ? "completed" : ""}`}>
          <span className="step-num-badge">{step > 1 ? <FiCheckCircle /> : "1"}</span> Details
        </div>
        <div className="auth-step-divider" />
        <div className={`auth-step-pill ${step === 2 ? "active" : step > 2 ? "completed" : ""}`}>
          <span className="step-num-badge">{step > 2 ? <FiCheckCircle /> : "2"}</span> Verify OTP
        </div>
        <div className="auth-step-divider" />
        <div className={`auth-step-pill ${step === 3 ? "active" : ""}`}>
          <span className="step-num-badge">3</span> Password
        </div>
      </div>

      {error && (
        <div className="auth-alert error">
          <FiAlertCircle className="alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="auth-alert success">
          <FiCheckCircle className="alert-icon" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: Enter Name and Email */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} noValidate className="auth-form">
          <div className="form-group">
            <label htmlFor="signup-name">Full Name</label>
            <div className="input-with-icon">
              <FiUser className="input-icon" />
              <input
                id="signup-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Alex Johnson"
                autoComplete="name"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-email">Student Email Address</label>
            <div className="input-with-icon">
              <FiMail className="input-icon" />
              <input
                id="signup-email"
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
            <span className="form-input-help">
              A 6-digit verification code will be sent to this email address.
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              "Sending Verification Code..."
            ) : (
              <>
                Send OTP &rarr;
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 2: Enter 6-Digit OTP */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} noValidate className="auth-form">
          <div className="otp-email-summary">
            <div>
              <span className="summary-label">Code sent to:</span>
              <strong className="summary-email">{formData.email}</strong>
            </div>
            <button
              type="button"
              className="btn-edit-email"
              onClick={handleEditEmail}
              title="Change email address"
            >
              <FiEdit2 /> Change
            </button>
          </div>

          <div className="form-group">
            <label htmlFor="signup-otp">Enter 6-Digit Verification Code</label>
            <div className="input-with-icon">
              <FiKey className="input-icon" />
              <input
                id="signup-otp"
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleChange}
                placeholder="• • • • • •"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                disabled={isLoading}
                className="otp-input-field"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="otp-action-row">
            <button
              type="button"
              className="btn-resend-otp"
              onClick={handleSendOtp}
              disabled={isLoading || cooldown > 0}
            >
              <FiRefreshCw className={isLoading ? "spin" : ""} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend Code"}
            </button>
            <span className="otp-validity-text">Valid for 10 minutes</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isLoading || formData.otp.trim().length !== 6}
          >
            {isLoading ? (
              "Verifying Code..."
            ) : (
              <>
                Verify OTP &rarr;
              </>
            )}
          </button>
        </form>
      )}

      {/* STEP 3: Set Password & Create Account (Only accessible after OTP verification) */}
      {step === 3 && (
        <form onSubmit={handleFinalSignup} noValidate className="auth-form">
          <div className="verified-student-badge">
            <div className="badge-info">
              <FiShield className="badge-icon" />
              <div>
                <strong>{formData.name}</strong>
                <span>{formData.email}</span>
              </div>
            </div>
            <span className="badge-status">
              <FiCheckCircle /> Verified
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="signup-password">Create Password</label>
            <div className="input-with-icon">
              <FiLock className="input-icon" />
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                disabled={isLoading}
                required
                autoFocus
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

          <div className="form-group">
            <label htmlFor="signup-confirm-password">Confirm Password</label>
            <div className="input-with-icon">
              <FiLock className="input-icon" />
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              "Creating Account..."
            ) : (
              <>
                Complete Registration &rarr;
              </>
            )}
          </button>
        </form>
      )}

      <div className="auth-footer">
        <p>
          Already have an account?{" "}
          <button
            type="button"
            className="auth-link-btn"
            onClick={onSwitchToLogin}
          >
            Sign In here
          </button>
        </p>
      </div>
    </div>
  );
}

export default Signup;
