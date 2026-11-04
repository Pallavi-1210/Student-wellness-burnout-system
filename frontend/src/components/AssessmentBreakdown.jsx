import { useState } from "react";
import {
  FiArrowLeft,
  FiCompass,
  FiList,
  FiTrendingUp,
} from "react-icons/fi";
import {
  getTopPersonalizedRecommendations,
  formatHistoryDate,
  normalizeRisk,
  RISK_META,
  formatHours,
  formatScore,
  formatAcademicPerformance,
} from "../utils/recommendations";

/**
 * Shared Full Assessment Breakdown Component.
 * Implements the exact numbered sections breakdown mockup.
 * Used identically for both Historical Assessments and Post-Assessment Submission.
 */
function AssessmentBreakdown({
  assessment,
  onBack,
  backLabel = "Back to History",
  initialTab = "breakdown",
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!assessment) return null;

  const rawRisk =
    assessment.burnoutLevel ||
    assessment.burnout_risk ||
    assessment.prediction ||
    assessment.risk_level;
  const riskKey = normalizeRisk(rawRisk);
  const meta = RISK_META[riskKey] || RISK_META.Low;

  const answers =
    assessment.answers ||
    assessment.formData ||
    assessment.rawAnswers ||
    assessment;

  const { full } = formatHistoryDate(assessment.createdAt);
  const recommendations = getTopPersonalizedRecommendations(answers);

  return (
    <div className="dark-history-outer-container fade-in">
      <div className="dark-history-card">
        {/* Header Row */}
        <div className="dark-card-header">
          <div className="dark-header-title-block">
            <h2 className="dark-main-title">Full Assessment Breakdown</h2>
            <p className="dark-subtitle">{full}</p>
          </div>
          <div className="dark-header-right-actions">
            <span className={`dark-risk-pill ${meta.pillClass}`}>
              {meta.label}
            </span>
            {onBack && (
              <button
                type="button"
                className="dark-pill-btn"
                onClick={onBack}
                title={backLabel}
              >
                <FiArrowLeft /> {backLabel}
              </button>
            )}
          </div>
        </div>

        {/* Clean Sub-navigation for Breakdown vs Recommendations */}
        <div className="dark-view-switcher">
          <button
            type="button"
            className={`dark-switch-tab ${activeTab === "breakdown" ? "active" : ""}`}
            onClick={() => setActiveTab("breakdown")}
          >
            <FiList /> All Factors
          </button>
          <button
            type="button"
            className={`dark-switch-tab ${activeTab === "recommendations" ? "active" : ""}`}
            onClick={() => setActiveTab("recommendations")}
          >
            <FiCompass /> Recommendations ({recommendations.length})
          </button>
        </div>

        <div className="dark-divider-line" />

        {activeTab === "breakdown" ? (
          /* ================================================================
             NUMBERED SECTIONS BREAKDOWN (EXACT MOCKUP)
             ================================================================ */
          <div className="dark-breakdown-content">
            {/* 01 — Academic Life */}
            <div className="dark-breakdown-section">
              <h3 className="dark-section-heading">01 — Academic Life</h3>
              <div className="dark-rows-group">
                <div className="dark-data-row">
                  <span className="dark-row-label">Daily Study Hours</span>
                  <span className="dark-row-value">
                    {formatHours(answers.study_hours_per_day)}
                  </span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Exam Pressure</span>
                  <span className="dark-row-value">
                    {formatScore(answers.exam_pressure, 10)}
                  </span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Academic Satisfaction</span>
                  <span className="dark-row-value">
                    {formatAcademicPerformance(answers.academic_performance)}
                  </span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Financial Stress</span>
                  <span className="dark-row-value">
                    {formatScore(answers.financial_stress, 10)}
                  </span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Family Expectation</span>
                  <span className="dark-row-value">
                    {formatScore(answers.family_expectation, 10)}
                  </span>
                </div>
              </div>
            </div>

            {/* 02 — Personal Well-being */}
            <div className="dark-breakdown-section">
              <h3 className="dark-section-heading">02 — Personal Well-being</h3>
              <div className="dark-rows-group">
                <div className="dark-data-row">
                  <span className="dark-row-label">Sleep Hours</span>
                  <span className="dark-row-value">
                    {formatHours(answers.sleep_hours)}
                  </span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Stress Level</span>
                  <span className="dark-row-value">
                    {formatScore(answers.stress_level, 10)}
                  </span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Anxiety Score</span>
                  <span className="dark-row-value">
                    {answers.anxiety_score !== undefined && answers.anxiety_score !== ""
                      ? `${answers.anxiety_score} / 9.11`
                      : "—"}
                  </span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Depression Score</span>
                  <span className="dark-row-value">
                    {answers.depression_score !== undefined && answers.depression_score !== ""
                      ? `${answers.depression_score} / 7.74`
                      : "—"}
                  </span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Social Support</span>
                  <span className="dark-row-value">
                    {formatScore(answers.social_support, 10)}
                  </span>
                </div>
              </div>
            </div>

            {/* 03 — Daily Lifestyle */}
            <div className="dark-breakdown-section">
              <h3 className="dark-section-heading">03 — Daily Lifestyle</h3>
              <div className="dark-rows-group">
                <div className="dark-data-row">
                  <span className="dark-row-label">Physical Activity</span>
                  <span className="dark-row-value">
                    {formatHours(answers.physical_activity)}
                  </span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Screen Time</span>
                  <span className="dark-row-value">
                    {formatHours(answers.screen_time)}
                  </span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Internet Usage</span>
                  <span className="dark-row-value">
                    {formatHours(answers.internet_usage)}
                  </span>
                </div>
              </div>
            </div>

            {/* 04 — Demographics & Background */}
            <div className="dark-breakdown-section">
              <h3 className="dark-section-heading">04 — Demographics & Background</h3>
              <div className="dark-rows-group">
                <div className="dark-data-row">
                  <span className="dark-row-label">Student Age</span>
                  <span className="dark-row-value">
                    {answers.age !== undefined && answers.age !== ""
                      ? `${answers.age} Years`
                      : "—"}
                  </span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Gender</span>
                  <span className="dark-row-value">{answers.gender || "—"}</span>
                </div>
                <div className="dark-data-row">
                  <span className="dark-row-label">Academic Year</span>
                  <span className="dark-row-value">
                    {answers.academic_year !== undefined && answers.academic_year !== ""
                      ? `Year ${answers.academic_year}`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================================================================
             PERSONALIZED RECOMMENDATIONS VIEW
             ================================================================ */
          <div className="dark-recs-content">
            <div className="dark-recs-intro">
              <p>
                Targeted wellbeing strategies generated for your <strong>{meta.label}</strong> evaluation on {full}:
              </p>
            </div>
            <div className="dark-recs-cards-list">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="dark-rec-card">
                  <div className="dark-rec-card-header">
                    <span className="dark-rec-category">{rec.category}</span>
                    <span className={`dark-rec-priority ${rec.priorityClass}`}>
                      {rec.priorityLabel}
                    </span>
                  </div>
                  <h4 className="dark-rec-title">{rec.title}</h4>
                  <div className="dark-rec-insight">
                    <FiTrendingUp className="dark-rec-icon" />
                    <span>{rec.dataInsight}</span>
                  </div>
                  <p className="dark-rec-advice">{rec.advice}</p>
                  <div className="dark-rec-action-tag">{rec.actionTag}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Back Button */}
        {onBack && (
          <div className="dark-card-footer">
            <button
              type="button"
              className="dark-pill-btn"
              onClick={onBack}
            >
              <FiArrowLeft /> {backLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AssessmentBreakdown;
