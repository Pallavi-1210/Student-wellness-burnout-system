import { useState } from "react";
import axios from "axios";
import "./App.css";

import {
  FiUser,
  FiBookOpen,
  FiHeart,
  FiActivity,
  FiShield,
  FiCheck,
  FiLogOut,
  FiBarChart2,
  FiList,
  FiLayers,
  FiLogIn,
  FiUserPlus,
} from "react-icons/fi";

import { validateForm, validateStep } from "./utils/validation";
import { API_ENDPOINTS } from "./utils/apiConfig";

import BasicInformation from "./steps/BasicInformation";
import AcademicLife from "./steps/AcademicLife";
import MentalWellness from "./steps/MentalWellness";
import DailyLifestyle from "./steps/DailyLifestyle";
import PersonalWellbeing from "./steps/PersonalWellbeing";
import PredictionResult from "./components/PredictionResult";
import AuthView from "./components/Auth/AuthView";
import Dashboard from "./components/Dashboard/Dashboard";
import History from "./components/History/History";
import LandingPage from "./components/Landing/LandingPage";

const STEPS = [
  {
    id: 1,
    title: "Basic Information",
    shortTitle: "1. Basics",
    icon: <FiUser />,
    subtitle: "Enter your basic age, gender, and academic year details.",
  },
  {
    id: 2,
    title: "Academic Routine",
    shortTitle: "2. Academic",
    icon: <FiBookOpen />,
    subtitle:
      "Provide details about your daily study hours, performance, and exam pressure.",
  },
  {
    id: 3,
    title: "Mental Wellbeing",
    shortTitle: "3. Mental",
    icon: <FiHeart />,
    subtitle:
      "Assess your stress level, anxiety, depression scores, and social support.",
  },
  {
    id: 4,
    title: "Lifestyle & Habits",
    shortTitle: "4. Lifestyle",
    icon: <FiActivity />,
    subtitle:
      "Record your sleep duration, physical activity, screen time, and internet usage.",
  },
  {
    id: 5,
    title: "Personal & Financial Factors",
    shortTitle: "5. Personal",
    icon: <FiShield />,
    subtitle: "Final step evaluating financial stress and family expectations.",
  },
];

const INITIAL_FORM_STATE = {
  age: "",
  gender: "",
  academic_year: "",
  study_hours_per_day: "",
  exam_pressure: "",
  academic_performance: "",
  stress_level: "",
  anxiety_score: "",
  depression_score: "",
  sleep_hours: "",
  physical_activity: "",
  social_support: "",
  screen_time: "",
  internet_usage: "",
  financial_stress: "",
  family_expectation: "",
};

function App() {
  // Authentication State
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Logged-out view state: 'landing' | 'login' | 'register'
  const [loggedOutView, setLoggedOutView] = useState("landing");

  // Navigation tab for logged-in users: 'assessment' | 'dashboard' | 'history'
  const [activeTab, setActiveTab] = useState("assessment");

  // Assessment Form State
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const handleAuthSuccess = ({ token: newToken, user: newUser }) => {
    setToken(newToken);
    setUser(newUser);
    setActiveTab("assessment");
    setCurrentStep(1);
    setAssessmentResult(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    handleReset();
    setActiveTab("assessment");
    setLoggedOutView("landing");
  };

  const navigateLandingSection = (sectionId) => {
    if (loggedOutView !== "landing") {
      setLoggedOutView("landing");
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleNext = () => {
    const stepErrors = validateStep(currentStep, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (targetStep) => {
    if (targetStep < currentStep) {
      setErrors({});
      setCurrentStep(targetStep);
    } else if (targetStep > currentStep) {
      const stepErrors = validateStep(currentStep, formData);
      if (Object.keys(stepErrors).length === 0) {
        setErrors({});
        setCurrentStep(targetStep);
      } else {
        setErrors(stepErrors);
      }
    }
  };

  const handleReset = () => {
    setAssessmentResult(null);
    setCurrentStep(1);
    setErrors({});
    setFormData(INITIAL_FORM_STATE);
  };

  // Submit assessment to backend: evaluates with Python ML model and saves in MongoDB
  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateForm(formData);
    if (error) {
      alert(error);
      return;
    }

    try {
      setIsSubmitting(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await axios.post(
        API_ENDPOINTS.ASSESSMENTS,
        { answers: formData },
        { headers }
      );

      if (response.data.success) {
        setAssessmentResult({
          burnoutLevel: response.data.burnoutLevel || response.data.prediction,
          recommendations: response.data.recommendations || [],
          answers: response.data.assessment?.answers || formData,
          createdAt: response.data.createdAt || new Date().toISOString(),
          id: response.data.assessmentId || response.data.assessment?.id,
        });
      }
    } catch (err) {
      console.error("Save Assessment Error:", err);
      try {
        const fallbackRes = await axios.post(
          API_ENDPOINTS.PREDICT,
          formData
        );
        if (fallbackRes.data.success) {
          setAssessmentResult({
            burnoutLevel: fallbackRes.data.prediction || fallbackRes.data.risk_level,
            recommendations: [],
            answers: formData,
            createdAt: new Date().toISOString(),
          });
          return;
        }
      } catch (fallbackErr) {
        console.error("Fallback Predict Error:", fallbackErr);
      }

      alert(
        err.response?.data?.error ||
        "Unable to evaluate and save assessment. Please ensure backend is running."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInformation
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        );
      case 2:
        return (
          <AcademicLife
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        );
      case 3:
        return (
          <MentalWellness
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        );
      case 4:
        return (
          <DailyLifestyle
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        );
      case 5:
        return (
          <PersonalWellbeing
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  const activeStepMeta = STEPS[currentStep - 1];
  const progressPercent = (currentStep / STEPS.length) * 100;

  const isUserLoggedIn = Boolean(token && user);

  return (
    <div className="app">
      {/* Top Application Bar */}
      <header className="main-navbar">
        <div className="nav-container-inner">
          <div
            className="nav-brand"
            onClick={() => {
              if (!isUserLoggedIn) {
                navigateLandingSection("hero");
              } else {
                setActiveTab("assessment");
              }
            }}
            style={{ cursor: "pointer" }}
            title="Student Wellness System"
          >
            <div className="brand-logo-badge">
              <FiLayers />
            </div>
            <div className="brand-text-block">
              <span className="brand-title">Student Wellness</span>
              <span className="brand-badge-tag">AI Portal</span>
            </div>
          </div>

          {/* Logged-out Navigation */}
          {!isUserLoggedIn ? (
            <nav className="nav-guest-links" aria-label="Public Navigation">
              <button
                type="button"
                className={`nav-link-btn ${loggedOutView === "landing" ? "active" : ""}`}
                onClick={() => navigateLandingSection("hero")}
              >
                Home
              </button>
              <button
                type="button"
                className="nav-link-btn"
                onClick={() => navigateLandingSection("about")}
              >
                About
              </button>
              <button
                type="button"
                className="nav-link-btn"
                onClick={() => navigateLandingSection("how-it-works")}
              >
                How It Works
              </button>
              <button
                type="button"
                className="nav-link-btn"
                onClick={() => navigateLandingSection("features")}
              >
                Features
              </button>
              <button
                type="button"
                className={`nav-link-btn btn-ghost-login ${loggedOutView === "login" ? "active" : ""}`}
                onClick={() => setLoggedOutView("login")}
              >
                <FiLogIn /> Login
              </button>
              <button
                type="button"
                className="btn-primary-register"
                onClick={() => setLoggedOutView("register")}
              >
                <FiUserPlus /> Register
              </button>
            </nav>
          ) : (
            /* Logged-in Navigation */
            <div className="nav-controls" aria-label="Student Session Navigation">
              <nav className="nav-tab-links">
                <button
                  type="button"
                  className={`nav-tab-item ${activeTab === "assessment" ? "active" : ""}`}
                  onClick={() => setActiveTab("assessment")}
                >
                  <FiActivity /> Assessments
                </button>
                <button
                  type="button"
                  className={`nav-tab-item ${activeTab === "dashboard" ? "active" : ""}`}
                  onClick={() => setActiveTab("dashboard")}
                >
                  <FiBarChart2 /> Dashboard
                </button>
                <button
                  type="button"
                  className={`nav-tab-item ${activeTab === "history" ? "active" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  <FiList /> History
                </button>
              </nav>

              {/* User Session Pill & Logout */}
              <div className="user-profile-widget">
                <div
                  className="user-avatar-dot"
                  title={user.email}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : <FiUser />}
                </div>
                <div className="user-info-snippet">
                  <span className="user-name-text">{user.name || "Student"}</span>
                </div>
                <button
                  type="button"
                  className="btn-nav-logout"
                  onClick={handleLogout}
                  title={`Sign out (${user.email})`}
                  aria-label="Sign Out"
                >
                  <FiLogOut />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="content-container">
        {!isUserLoggedIn ? (
          loggedOutView === "landing" ? (
            <LandingPage
              onLoginClick={() => setLoggedOutView("login")}
              onRegisterClick={() => setLoggedOutView("register")}
              onStartAssessment={() => setLoggedOutView("register")}
            />
          ) : (
            <div className="auth-outer-wrap">
              <div className="form-card auth-mode">
                <AuthView
                  initialMode={loggedOutView === "register" ? "signup" : "login"}
                  onAuthSuccess={handleAuthSuccess}
                  onBackToLanding={() => setLoggedOutView("landing")}
                />
              </div>
            </div>
          )
        ) : activeTab === "dashboard" ? (
          /* Dashboard Analytics View */
          <div className="authenticated-view-wrapper">
            <Dashboard
              token={token}
              onTakeAssessment={() => {
                handleReset();
                setActiveTab("assessment");
              }}
              onGoHistory={() => setActiveTab("history")}
            />
          </div>
        ) : activeTab === "history" ? (
          /* Assessment History Records View */
          <div className="authenticated-view-wrapper">
            <History
              token={token}
              onTakeAssessment={() => {
                handleReset();
                setActiveTab("assessment");
              }}
            />
          </div>
        ) : (
          /* Assessment View (Form or Results Report) with Wellness Study Backdrop */
          <div className="authenticated-view-wrapper assessment-view-container">
            <div className={`form-card assessment-card ${assessmentResult ? "result-view-card" : ""}`}>
              {assessmentResult ? (
                <PredictionResult
                  assessmentResult={assessmentResult}
                  onReset={handleReset}
                  onGoDashboard={() => setActiveTab("dashboard")}
                  onGoHistory={() => setActiveTab("history")}
                />
              ) : (
                <>
                  <header className="card-header">
                    <span className="project-tag">
                      Burnout Risk Predictor (Random Forest ML)
                    </span>
                    <h2>Burnout Risk Assessment</h2>
                    <p className="subtitle">
                      Answer the 16 questions across the 5 sections below to evaluate your
                      academic routine, lifestyle, and wellbeing indicators.
                    </p>
                  </header>

                  <div className="step-tracker">
                    <div className="progress-info-row">
                      <span className="progress-step-text">
                        Section {currentStep} of {STEPS.length} &bull; {activeStepMeta.title}
                      </span>
                      <span className="progress-badge">
                        {Math.round(progressPercent)}% Completed
                      </span>
                    </div>

                    <div className="progress-bar-wrapper" role="progressbar" aria-valuenow={Math.round(progressPercent)} aria-valuemin="0" aria-valuemax="100">
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    <div className="step-pills">
                      {STEPS.map((step) => {
                        const isDone = currentStep > step.id;
                        const isActive = currentStep === step.id;

                        return (
                          <button
                            type="button"
                            key={step.id}
                            className={`step-pill ${isActive ? "active" : ""} ${
                              isDone ? "done" : ""
                            }`}
                            onClick={() => handleStepClick(step.id)}
                            title={step.title}
                          >
                            <span className="step-icon">
                              {isDone ? <FiCheck /> : step.icon}
                            </span>
                            <span className="step-label">{step.shortTitle}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="step-header">
                    <div className="step-badge-square">{activeStepMeta.icon}</div>
                    <div>
                      <span className="step-counter-tag">
                        Section {currentStep} of {STEPS.length}
                      </span>
                      <h3>{activeStepMeta.title}</h3>
                      <p className="step-description">{activeStepMeta.subtitle}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} noValidate>
                    {renderCurrentStep()}

                    <div className="form-actions">
                      {currentStep > 1 ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-nav-back"
                          onClick={handleBack}
                          disabled={isSubmitting}
                        >
                          &larr; Previous Section
                        </button>
                      ) : (
                        <div className="nav-spacer" />
                      )}

                      {currentStep < 5 ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-nav-next"
                          onClick={handleNext}
                        >
                          Next Section &rarr;
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="btn btn-submit"
                          disabled={isSubmitting}
                        >
                          {isSubmitting
                            ? "Evaluating Assessment with ML..."
                            : "Submit Assessment \u2192"}
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
