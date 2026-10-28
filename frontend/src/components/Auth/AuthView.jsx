import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import { FiLogIn, FiUserPlus, FiArrowLeft } from "react-icons/fi";

function AuthView({ onAuthSuccess, initialMode = "login", onBackToLanding }) {
  const [mode, setMode] = useState(initialMode);
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);

  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
  }

  return (
    <div className="auth-container">
      {onBackToLanding && (
        <button
          type="button"
          className="btn-back-landing"
          onClick={onBackToLanding}
        >
          <FiArrowLeft /> Back to Homepage
        </button>
      )}

      <div className="auth-tab-nav">
        <button
          type="button"
          className={`auth-tab-btn ${mode === "login" ? "active" : ""}`}
          onClick={() => setMode("login")}
        >
          <FiLogIn /> Sign In
        </button>
        <button
          type="button"
          className={`auth-tab-btn ${mode === "signup" ? "active" : ""}`}
          onClick={() => setMode("signup")}
        >
          <FiUserPlus /> Create Account
        </button>
      </div>

      <div className="auth-panel">
        {mode === "login" ? (
          <Login
            onAuthSuccess={onAuthSuccess}
            onSwitchToSignup={() => setMode("signup")}
          />
        ) : (
          <Signup
            onAuthSuccess={onAuthSuccess}
            onSwitchToLogin={() => setMode("login")}
          />
        )}
      </div>
    </div>
  );
}

export default AuthView;
