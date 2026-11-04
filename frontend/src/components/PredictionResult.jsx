import { useState } from "react";
import {
  FiCheckCircle,
  FiRefreshCw,
  FiBookOpen,
  FiHeart,
  FiActivity,
  FiBarChart2,
  FiList,
  FiCalendar,
  FiMoon,
  FiUsers,
  FiMonitor,
  FiCompass,
  FiCheck,
  FiArrowLeft,
  FiArrowRight,
  FiDollarSign,
  FiPlusCircle,
  FiAward,
  FiUser,
  FiShield,
  FiTrendingUp,
  FiClock,
  FiTarget,
} from "react-icons/fi";

import {
  normalizeRiskLevel,
  RISK_CONFIG,
  getTopPersonalizedRecommendations,
} from "../utils/recommendations";

function formatAssessmentDate(dateStr) {
  if (!dateStr) {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateStr);
  }
}

function formatVal(val, suffix = "") {
  if (val === undefined || val === null || val === "") return "—";
  if (typeof val === "number") {
    const formatted = Number.isInteger(val) ? val : Number(val.toFixed(2));
    return suffix ? `${formatted} ${suffix}` : `${formatted}`;
  }
  return suffix ? `${val} ${suffix}` : `${val}`;
}

function PredictionResult({
  assessmentResult,
  prediction,
  onReset,
  onGoDashboard,
  onBackToHistory,
  isHistoryView,
  recordNumber,
  initialView = "result",
}) {
  // Navigation View State: 'result' | 'recommendations' | 'summary'
  const [activeView, setActiveView] = useState(initialView);

  const resultData = assessmentResult || {};
  const riskKey = normalizeRiskLevel(
    resultData.burnoutLevel || resultData.prediction || prediction
  );
  const config = RISK_CONFIG[riskKey] || RISK_CONFIG.Low;

  const rawAnswers =
    resultData.answers || resultData.formData || resultData;
  const dateDisplay = formatAssessmentDate(resultData.createdAt);

  const topRecommendations = getTopPersonalizedRecommendations(rawAnswers);

  // ============================================================================
  // VIEW 1: ASSESSMENT RESULT OVERVIEW PAGE
  // Features prominent risk prediction and two clean, beautiful action buttons
  // ============================================================================
  if (activeView === "result") {
    return (
      <div className="prediction-dashboard fade-in">
        {/* Top Header Bar */}
        <div className="dashboard-top-bar">
          <div className="top-bar-title-block">
            <span className="result-kicker">
              {recordNumber ? `Assessment #${recordNumber}` : "Assessment Complete"}
            </span>
            <h2 className="result-main-heading">Burnout Risk Evaluation</h2>
            <div className="result-timestamp-line">
              <FiCalendar className="meta-icon" />
              <span>Evaluated on {dateDisplay}</span>
            </div>
          </div>

          <div className="result-action-buttons">
            {onBackToHistory && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBackToHistory}
                title="Return to assessment records"
              >
                <FiArrowLeft /> Back to Records
              </button>
            )}
            {onGoDashboard && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onGoDashboard}
                title="Open Student Dashboard"
              >
                <FiBarChart2 /> Dashboard
              </button>
            )}
            {onReset && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onReset}
              >
                {isHistoryView ? <FiPlusCircle /> : <FiRefreshCw />} {isHistoryView ? "New Assessment" : "Retake"}
              </button>
            )}
          </div>
        </div>

        {/* Prominent Risk Result Hero Card */}
        <div className={`prediction-summary-hero ${config.cardClass}`}>
          <div className="hero-status-row">
            <div className="hero-status-left">
              <span className={`risk-category-pill ${config.badgeClass}`}>
                <span className="pill-dot" /> {config.shortLabel}
              </span>
              <h3 className="hero-risk-title">{config.statusLabel}</h3>
            </div>
            <div className="hero-icon-bubble">{config.icon}</div>
          </div>

          <p className="hero-explanation-text">{config.explanation}</p>

          {/* Clean 3-Stage Risk Spectrum Meter */}
          <div className="compact-risk-spectrum">
            <div className="spectrum-label-row">
              <span>Risk Level</span>
              <strong className="spectrum-current-tag">
                {config.shortLabel}
              </strong>
            </div>
            <div className="spectrum-track">
              <div
                className={`spectrum-segment seg-low ${
                  config.spectrumIndex === 0 ? "active" : ""
                }`}
              >
                <span>Low</span>
                {config.spectrumIndex === 0 && <FiCheck className="seg-check" />}
              </div>
              <div
                className={`spectrum-segment seg-medium ${
                  config.spectrumIndex === 1 ? "active" : ""
                }`}
              >
                <span>Moderate</span>
                {config.spectrumIndex === 1 && <FiCheck className="seg-check" />}
              </div>
              <div
                className={`spectrum-segment seg-high ${
                  config.spectrumIndex === 2 ? "active" : ""
                }`}
              >
                <span>High</span>
                {config.spectrumIndex === 2 && <FiCheck className="seg-check" />}
              </div>
            </div>
          </div>
        </div>

        {/* Two Clean, Consistent Action Buttons (Recommendations & 16-Factor Summary) */}
        <div className="result-two-buttons-group">
          <button
            type="button"
            className="btn btn-primary btn-hero-action"
            onClick={() => setActiveView("recommendations")}
          >
            <FiCompass /> Personalized Recommendations
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-hero-action"
            onClick={() => setActiveView("summary")}
          >
            <FiActivity /> Assessment Summary (16 Factors)
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: PERSONALIZED RECOMMENDATIONS PAGE
  // Displays only 2–3 concise, beautiful cards with category, priority & direct advice
  // ============================================================================
  if (activeView === "recommendations") {
    return (
      <div className="prediction-dashboard recommendations-page fade-in">
        {/* Clean Header Bar */}
        <div className="dashboard-top-bar">
          <div className="nav-back-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveView("result")}
              title="Return to Risk Result"
            >
              <FiArrowLeft /> Back to Result
            </button>
            <div className="subpage-title-block">
              <div className="dash-kicker-row">
                <span className="result-kicker">AI Wellness Plan</span>
                <span className={`risk-category-pill ${config.badgeClass} pill-sm`}>
                  <span className="pill-dot" /> {config.shortLabel} Profile
                </span>
              </div>
              <h2 className="result-main-heading">Personalized Recommendations</h2>
              <div className="result-timestamp-line">
                <span>Tailored action plan derived from your submitted assessment responses</span>
              </div>
            </div>
          </div>

          <div className="result-action-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveView("summary")}
              title="View all 16 factors"
            >
              <FiActivity /> 16 Factors
            </button>
            {onBackToHistory && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBackToHistory}
                title="Return to Records"
              >
                <FiList /> All Records
              </button>
            )}
            {onGoDashboard && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onGoDashboard}
              >
                <FiBarChart2 /> Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Hero Context Callout Banner */}
        <div className="rec-hero-ribbon">
          <div className="rec-ribbon-left">
            <span className="rec-ribbon-badge">
              <FiTarget /> Focus Areas
            </span>
            <p className="rec-ribbon-text">
              Based on your evaluation ({config.shortLabel}), here are your top <strong>{topRecommendations.length} highest-priority wellbeing strategies</strong> to prevent academic burnout and maintain healthy cognitive stamina.
            </p>
          </div>
        </div>

        {/* 2–3 Clean, Beautiful Recommendation Cards */}
        <div className="clean-recommendations-grid">
          {topRecommendations.map((card, idx) => (
            <div key={idx} className="clean-rec-card">
              <div className="rec-card-top-row">
                <span className="rec-category-tag">{card.category}</span>
                <span className={`rec-priority-pill ${card.priorityClass}`}>
                  {card.priorityLabel}
                </span>
              </div>

              <div className="rec-card-body-row">
                <div className="clean-rec-icon-box">
                  {card.icon}
                </div>
                <div className="clean-rec-content">
                  <h4 className="clean-rec-title">{card.title}</h4>
                  <div className="rec-insight-chip">
                    <FiTrendingUp className="insight-icon" />
                    <span>{card.dataInsight}</span>
                  </div>
                  <p className="clean-rec-advice">{card.advice}</p>
                  <div className="rec-action-pill">
                    {card.actionTag}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Daily Student Wellbeing Micro-Habits Strip */}
        <div className="rec-micro-habits-card">
          <div className="micro-habits-header">
            <FiClock className="micro-header-icon" />
            <h4 className="micro-habits-title">Recommended Daily Micro-Habits</h4>
          </div>
          <div className="micro-habits-grid">
            <div className="micro-habit-item">
              <span className="micro-habit-badge">1</span>
              <div>
                <strong>Hydrate First</strong>
                <p>Drink a tall glass of water before starting your morning study session.</p>
              </div>
            </div>
            <div className="micro-habit-item">
              <span className="micro-habit-badge">2</span>
              <div>
                <strong>50/10 Interval</strong>
                <p>Study with focus for 50 mins, followed by 10 mins screen-free rest.</p>
              </div>
            </div>
            <div className="micro-habit-item">
              <span className="micro-habit-badge">3</span>
              <div>
                <strong>Outdoor Reset</strong>
                <p>Take a 15-minute walk outside after classes to lower cortisol levels.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Consistent Bottom Navigation */}
        <div className="clean-bottom-nav">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setActiveView("result")}
          >
            <FiArrowLeft /> Back to Result
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveView("summary")}
          >
            View Assessment Summary (16 Factors) <FiArrowRight />
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 3: COMPLETE ASSESSMENT SUMMARY (16 INDIVIDUAL FACTOR CARDS)
  // Shows ALL submitted assessment factors in beautiful individual cards
  // grouped into Academic Life, Mental Wellness, Daily Lifestyle, Personal Factors
  // ============================================================================
  if (activeView === "summary") {
    return (
      <div className="prediction-dashboard summary-page fade-in">
        {/* Clean Header Bar */}
        <div className="dashboard-top-bar">
          <div className="nav-back-group">
            {isHistoryView && onBackToHistory ? (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBackToHistory}
                title="Return to assessment history records"
              >
                <FiArrowLeft /> Back to Records
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setActiveView("result")}
                title="Return to Risk Result"
              >
                <FiArrowLeft /> Back to Result
              </button>
            )}
            <div className="subpage-title-block">
              <h2 className="result-main-heading">
                {recordNumber ? `Assessment #${recordNumber} Summary` : "Assessment Summary"}
              </h2>
              <div className="result-timestamp-line">
                <FiCalendar className="meta-icon" />
                <span>All 16 submitted assessment factors recorded on {dateDisplay}</span>
              </div>
            </div>
          </div>

          <div className="result-action-buttons">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveView("result")}
              title="View Risk Evaluation"
            >
              <FiCheckCircle /> Risk Result
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setActiveView("recommendations")}
              title="View Recommendations"
            >
              <FiCompass /> Recommendations
            </button>
            {onGoDashboard && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onGoDashboard}
              >
                <FiBarChart2 /> Dashboard
              </button>
            )}
          </div>
        </div>

        {/* 16 Submitted Factors in 4 Organized Sections with Individual Data Cards */}
        <div className="factors-sections-wrapper">
          {/* Section 1: Academic Life */}
          <div className="factors-section-group">
            <div className="factors-section-header">
              <span className="factors-section-icon icon-academic">
                <FiBookOpen />
              </span>
              <div className="factors-header-text">
                <div className="factors-header-top">
                  <h3 className="factors-section-title">Academic Life</h3>
                  <span className="factors-section-count">4 Factors</span>
                </div>
                <span className="factors-section-caption">Study workload, exam pressure, academic standing, and expectations</span>
              </div>
            </div>
            <div className="factors-cards-grid">
              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-academic"><FiBookOpen /></span>
                  <span className="factor-name">Study Hours</span>
                </div>
                <div className="factor-value-highlight">
                  {formatVal(rawAnswers.study_hours_per_day, "hrs")}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-academic"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.study_hours_per_day) || 0) / 12) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Daily dedicated study time</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-academic"><FiActivity /></span>
                  <span className="factor-name">Exam Pressure</span>
                </div>
                <div className="factor-value-highlight">
                  {rawAnswers.exam_pressure !== undefined ? `${rawAnswers.exam_pressure} / 10` : "—"}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-pressure"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.exam_pressure) || 0) / 10) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Self-reported exam tension</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-academic"><FiAward /></span>
                  <span className="factor-name">Academic Performance</span>
                </div>
                <div className="factor-value-highlight">
                  {formatVal(rawAnswers.academic_performance, "%")}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-academic"
                    style={{
                      width: `${Math.min(100, Math.max(0, Number(rawAnswers.academic_performance) || 0))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">GPA / Grade equivalent</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-academic"><FiUsers /></span>
                  <span className="factor-name">Family Expectation</span>
                </div>
                <div className="factor-value-highlight">
                  {rawAnswers.family_expectation !== undefined ? `${rawAnswers.family_expectation} / 10` : "—"}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-pressure"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.family_expectation) || 0) / 10) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Perceived family pressure</span>
              </div>
            </div>
          </div>

          {/* Section 2: Mental Wellness */}
          <div className="factors-section-group">
            <div className="factors-section-header">
              <span className="factors-section-icon icon-mental">
                <FiHeart />
              </span>
              <div className="factors-header-text">
                <div className="factors-header-top">
                  <h3 className="factors-section-title">Mental Wellness</h3>
                  <span className="factors-section-count">4 Factors</span>
                </div>
                <span className="factors-section-caption">Stress level, anxiety, depression score, and social support network</span>
              </div>
            </div>
            <div className="factors-cards-grid">
              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-mental"><FiHeart /></span>
                  <span className="factor-name">Stress Level</span>
                </div>
                <div className="factor-value-highlight">
                  {rawAnswers.stress_level !== undefined ? `${rawAnswers.stress_level} / 10` : "—"}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-stress"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.stress_level) || 0) / 10) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Perceived stress rating</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-mental"><FiHeart /></span>
                  <span className="factor-name">Anxiety Score</span>
                </div>
                <div className="factor-value-highlight">
                  {rawAnswers.anxiety_score !== undefined ? `${formatVal(rawAnswers.anxiety_score)} / 9.11` : "—"}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-stress"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.anxiety_score) || 0) / 9.11) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Standardized anxiety rating</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-mental"><FiHeart /></span>
                  <span className="factor-name">Depression Score</span>
                </div>
                <div className="factor-value-highlight">
                  {rawAnswers.depression_score !== undefined ? `${formatVal(rawAnswers.depression_score)} / 7.74` : "—"}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-stress"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.depression_score) || 0) / 7.74) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Standardized depressive index</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-mental"><FiUsers /></span>
                  <span className="factor-name">Social Support</span>
                </div>
                <div className="factor-value-highlight">
                  {rawAnswers.social_support !== undefined ? `${rawAnswers.social_support} / 10` : "—"}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-academic"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.social_support) || 0) / 10) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Peer & community connection</span>
              </div>
            </div>
          </div>

          {/* Section 3: Daily Lifestyle */}
          <div className="factors-section-group">
            <div className="factors-section-header">
              <span className="factors-section-icon icon-lifestyle">
                <FiMoon />
              </span>
              <div className="factors-header-text">
                <div className="factors-header-top">
                  <h3 className="factors-section-title">Daily Lifestyle</h3>
                  <span className="factors-section-count">4 Factors</span>
                </div>
                <span className="factors-section-caption">Sleep recovery, physical activity, screen exposure, and internet habits</span>
              </div>
            </div>
            <div className="factors-cards-grid">
              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-lifestyle"><FiMoon /></span>
                  <span className="factor-name">Sleep Hours</span>
                </div>
                <div className="factor-value-highlight">
                  {formatVal(rawAnswers.sleep_hours, "hrs")}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-sleep"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.sleep_hours) || 0) / 10) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Nightly sleep duration</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-lifestyle"><FiActivity /></span>
                  <span className="factor-name">Physical Activity</span>
                </div>
                <div className="factor-value-highlight">
                  {formatVal(rawAnswers.physical_activity, "hrs")}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-academic"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.physical_activity) || 0) / 4) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Daily active movement</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-lifestyle"><FiMonitor /></span>
                  <span className="factor-name">Screen Time</span>
                </div>
                <div className="factor-value-highlight">
                  {formatVal(rawAnswers.screen_time, "hrs")}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-screen"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.screen_time) || 0) / 14) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Daily device & display exposure</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-lifestyle"><FiCompass /></span>
                  <span className="factor-name">Internet Usage</span>
                </div>
                <div className="factor-value-highlight">
                  {formatVal(rawAnswers.internet_usage, "hrs")}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-screen"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.internet_usage) || 0) / 14) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Daily online hours</span>
              </div>
            </div>
          </div>

          {/* Section 4: Personal & Financial Factors */}
          <div className="factors-section-group">
            <div className="factors-section-header">
              <span className="factors-section-icon icon-personal">
                <FiDollarSign />
              </span>
              <div className="factors-header-text">
                <div className="factors-header-top">
                  <h3 className="factors-section-title">Personal & Financial Factors</h3>
                  <span className="factors-section-count">4 Factors</span>
                </div>
                <span className="factors-section-caption">Student demographics, program year, and financial stress</span>
              </div>
            </div>
            <div className="factors-cards-grid">
              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-personal"><FiUser /></span>
                  <span className="factor-name">Student Age</span>
                </div>
                <div className="factor-value-highlight">
                  {formatVal(rawAnswers.age, "yrs")}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-personal"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.age) || 18) / 30) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Chronological age</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-personal"><FiShield /></span>
                  <span className="factor-name">Gender</span>
                </div>
                <div className="factor-value-highlight">
                  {rawAnswers.gender || "—"}
                </div>
                <div className="factor-progress-track">
                  <div className="factor-progress-fill fill-personal" style={{ width: "100%" }} />
                </div>
                <span className="factor-subtext">Identified gender</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-personal"><FiBookOpen /></span>
                  <span className="factor-name">Academic Year</span>
                </div>
                <div className="factor-value-highlight">
                  {rawAnswers.academic_year !== undefined ? `Year ${rawAnswers.academic_year}` : "—"}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-academic"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.academic_year) || 1) / 5) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Current program level</span>
              </div>

              <div className="factor-individual-card">
                <div className="factor-card-top">
                  <span className="factor-icon-wrap icon-personal"><FiDollarSign /></span>
                  <span className="factor-name">Financial Stress</span>
                </div>
                <div className="factor-value-highlight">
                  {rawAnswers.financial_stress !== undefined ? `${rawAnswers.financial_stress} / 10` : "—"}
                </div>
                <div className="factor-progress-track">
                  <div
                    className="factor-progress-fill fill-pressure"
                    style={{
                      width: `${Math.min(100, Math.max(0, ((Number(rawAnswers.financial_stress) || 0) / 10) * 100))}%`,
                    }}
                  />
                </div>
                <span className="factor-subtext">Tuition & living expense strain</span>
              </div>
            </div>
          </div>
        </div>

        {/* Consistent Bottom Navigation */}
        <div className="clean-bottom-nav">
          {isHistoryView && onBackToHistory ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBackToHistory}
            >
              <FiArrowLeft /> Back to Records
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setActiveView("result")}
            >
              <FiArrowLeft /> Back to Result
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setActiveView("recommendations")}
          >
            Personalized Recommendations <FiArrowRight />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default PredictionResult;
