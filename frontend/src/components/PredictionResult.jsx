import { useState } from "react";
import {
  FiCompass,
  FiList,
  FiRefreshCw,
  FiBarChart2,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
} from "react-icons/fi";
import AssessmentBreakdown from "./AssessmentBreakdown";
import {
  formatHistoryDate,
  normalizeRisk,
  RISK_META,
} from "../utils/recommendations";

const EXPLANATIONS = {
  Low: "Your workload, rest, and wellbeing indicators reflect a healthy balance. Keep up your current routines.",
  Medium:
    "Elevated academic load or early fatigue detected. Introducing regular breaks and workload pacing will prevent burnout.",
  High: "High academic stress and fatigue recorded. Prioritizing rest, workload adjustments, and student support is strongly advised.",
};

const RISK_ICONS = {
  Low: <FiCheckCircle className="dark-result-icon icon-low" />,
  Medium: <FiAlertTriangle className="dark-result-icon icon-med" />,
  High: <FiAlertCircle className="dark-result-icon icon-high" />,
};

/**
 * PredictionResult Component.
 * Post-Assessment submission flow:
 * 1. Initially shows predicted Burnout Risk Level, concise explanation, and two clean action buttons:
 *    - 'View Full Breakdown'
 *    - 'Personalized Recommendations'
 * 2. On clicking 'View Full Breakdown', renders the exact same AssessmentBreakdown component
 *    with submitted answers and a Back button.
 * 3. On clicking 'Personalized Recommendations', renders the recommendations view with a Back button.
 */
function PredictionResult({
  assessmentResult,
  prediction,
  onReset,
  onGoDashboard,
  onGoHistory,
  initialView = "result",
}) {
  const [activeView, setActiveView] = useState(initialView);

  const resultData = assessmentResult || {};
  const rawRisk =
    resultData.burnoutLevel ||
    resultData.burnout_risk ||
    resultData.prediction ||
    resultData.risk_level ||
    prediction;

  const riskKey = normalizeRisk(rawRisk);
  const meta = RISK_META[riskKey] || RISK_META.Low;
  const explanation = EXPLANATIONS[riskKey] || EXPLANATIONS.Low;
  const { full } = formatHistoryDate(resultData.createdAt);

  // VIEW 2: FULL ASSESSMENT BREAKDOWN (EXACT SAME COMPONENT AS HISTORY BREAKDOWN)
  if (activeView === "breakdown") {
    return (
      <AssessmentBreakdown
        assessment={resultData}
        onBack={() => setActiveView("result")}
        backLabel="Back to Result Summary"
        initialTab="breakdown"
      />
    );
  }

  // VIEW 3: PERSONALIZED RECOMMENDATIONS VIEW
  if (activeView === "recommendations") {
    return (
      <AssessmentBreakdown
        assessment={resultData}
        onBack={() => setActiveView("result")}
        backLabel="Back to Result Summary"
        initialTab="recommendations"
      />
    );
  }

  // VIEW 1: INITIAL RESULT SUMMARY (Post-Submission)
  return (
    <div className="dark-history-outer-container fade-in">
      <div className="dark-history-card dark-result-card">
        {/* Header Row */}
        <div className="dark-card-header">
          <div className="dark-header-title-block">
            <h2 className="dark-main-title">Assessment Result</h2>
            <p className="dark-subtitle">Evaluated on {full}</p>
          </div>
          <div className="dark-header-right-actions">
            {onGoDashboard && (
              <button
                type="button"
                className="dark-pill-btn"
                onClick={onGoDashboard}
                title="Open Student Dashboard"
              >
                <FiBarChart2 /> Dashboard
              </button>
            )}
            {onGoHistory && (
              <button
                type="button"
                className="dark-pill-btn"
                onClick={onGoHistory}
                title="View All History Records"
              >
                <FiList /> History
              </button>
            )}
          </div>
        </div>

        <div className="dark-divider-line" />

        {/* Central Risk Result Hero */}
        <div className="dark-result-hero">
          <div className="dark-result-icon-wrap">{RISK_ICONS[riskKey]}</div>

          <div className="dark-result-meta">
            <span className={`dark-risk-pill ${meta.pillClass}`}>
              {meta.label}
            </span>
            <h3 className="dark-result-risk-heading">
              Predicted Burnout Risk: {meta.label}
            </h3>
            <p className="dark-result-explanation">{explanation}</p>
          </div>
        </div>

        {/* Two Prominent Action Buttons */}
        <div className="dark-result-actions-grid">
          <button
            type="button"
            className="dark-pill-btn dark-pill-btn-primary dark-result-btn"
            onClick={() => setActiveView("breakdown")}
          >
            <FiList /> View Full Breakdown
          </button>
          <button
            type="button"
            className="dark-pill-btn dark-result-btn"
            onClick={() => setActiveView("recommendations")}
          >
            <FiCompass /> Personalized Recommendations
          </button>
        </div>

        {/* Secondary Utility Actions */}
        <div className="dark-result-secondary-bar">
          {onReset && (
            <button
              type="button"
              className="dark-subtle-link-btn"
              onClick={onReset}
            >
              <FiRefreshCw /> Retake Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PredictionResult;
