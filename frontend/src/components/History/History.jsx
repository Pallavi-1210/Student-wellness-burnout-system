import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiEye,
  FiX,
  FiRefreshCw,
  FiPlusCircle,
  FiList,
  FiBookOpen,
  FiHeart,
  FiActivity,
  FiShield,
  FiMoon,
  FiCompass,
} from "react-icons/fi";
import { API_ENDPOINTS } from "../../utils/apiConfig";

const API_BASE_URL = API_ENDPOINTS.ASSESSMENTS;

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
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

function normalizeRisk(level) {
  const str = String(level || "").trim().toLowerCase();
  if (str.includes("high")) return "High";
  if (str.includes("med") || str.includes("mod")) return "Medium";
  return "Low";
}

const RISK_META = {
  Low: {
    label: "Low Risk",
    fullLabel: "Low Burnout Risk",
    pillClass: "risk-pill-low",
    cardClass: "risk-card-low",
    icon: <FiCheckCircle />,
    explanation:
      "Workload and lifestyle factors are well balanced. Maintain current study pacing and restorative sleep routines.",
  },
  Medium: {
    label: "Moderate Risk",
    fullLabel: "Moderate Burnout Risk",
    pillClass: "risk-pill-medium",
    cardClass: "risk-card-medium",
    icon: <FiAlertTriangle />,
    explanation:
      "Moderate academic pressure or lifestyle fatigue detected. Pacing assignments and setting evening boundaries recommended.",
  },
  High: {
    label: "High Risk",
    fullLabel: "High Burnout Risk",
    pillClass: "risk-pill-high",
    cardClass: "risk-card-high",
    icon: <FiAlertCircle />,
    explanation:
      "Elevated stress and fatigue levels recorded. Taking proactive rest and seeking campus wellness counseling is strongly advised.",
  },
};

function History({ token, onTakeAssessment }) {
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      setError("");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(API_BASE_URL, { headers });

      if (res.data.success && Array.isArray(res.data.assessments)) {
        setAssessments(res.data.assessments);
      } else {
        setAssessments([]);
      }
    } catch (err) {
      console.error("History Fetch Error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Unable to load assessment history.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let ignore = false;
    const loadInitial = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(API_BASE_URL, { headers });
        if (!ignore) {
          if (res.data.success && Array.isArray(res.data.assessments)) {
            setAssessments(res.data.assessments);
          } else {
            setAssessments([]);
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("History Fetch Error:", err);
          setError(err.response?.data?.error || "Unable to load assessment history.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadInitial();
    return () => {
      ignore = true;
    };
  }, [token]);

  return (
    <div className="history-container fade-in">
      {/* 1. Header Row */}
      <div className="dashboard-header-row">
        <div>
          <div className="dash-kicker-row">
            <span className="result-kicker">Records Log</span>
            <span className="dash-count-pill">
              {assessments.length} {assessments.length === 1 ? "Record" : "Records"}
            </span>
          </div>
          <h2 className="dash-main-title">Assessment History</h2>
          <p className="dash-subtitle">
            Historical log of your past burnout evaluations and tracked wellbeing metrics.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchHistory}
            disabled={isLoading}
            title="Refresh history"
          >
            <FiRefreshCw className={isLoading ? "spin" : ""} /> Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onTakeAssessment}
          >
            <FiPlusCircle /> New Assessment
          </button>
        </div>
      </div>

      {error && (
        <div className="auth-alert error">
          <FiAlertCircle className="alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="loading-state-card">
          <FiRefreshCw className="loading-spinner spin" />
          <p>Retrieving your assessment history...</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="empty-state-card">
          <FiList className="empty-icon" />
          <h3>No Records Found</h3>
          <p>
            You have not completed any burnout evaluations yet. Complete an assessment
            to view your historical records, breakdown analysis, and longitudinal trends.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onTakeAssessment}
          >
            <FiPlusCircle /> Take First Assessment
          </button>
        </div>
      ) : (
        /* 2. Sleek History Records Table Card */
        <div className="history-table-card">
          <div className="table-responsive">
            <table className="history-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date & Time</th>
                  <th>Burnout Risk</th>
                  <th>Key Factors</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((item, idx) => {
                  const riskKey = normalizeRisk(item.burnoutLevel);
                  const meta = RISK_META[riskKey] || RISK_META.Low;
                  const answers = item.answers || {};

                  return (
                    <tr key={item._id || idx}>
                      <td className="row-num">
                        #{assessments.length - idx}
                      </td>
                      <td className="row-date">
                        <div className="date-wrapper">
                          <FiCalendar className="date-icon" />
                          <span>{formatDateTime(item.createdAt)}</span>
                        </div>
                      </td>
                      <td className="row-level">
                        <span className={`risk-category-pill ${meta.pillClass}`}>
                          <span className="pill-dot" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="row-metrics">
                        <div className="metric-tags-row">
                          <span className="metric-mini-tag">
                            <FiBookOpen className="tag-icon" />
                            {answers.study_hours_per_day !== undefined
                              ? `${answers.study_hours_per_day}h study`
                              : "—"}
                          </span>
                          <span className="metric-mini-tag">
                            <FiMoon className="tag-icon" />
                            {answers.sleep_hours !== undefined
                              ? `${answers.sleep_hours}h sleep`
                              : "—"}
                          </span>
                          <span className="metric-mini-tag">
                            <FiHeart className="tag-icon" />
                            {answers.stress_level !== undefined
                              ? `Stress ${answers.stress_level}/10`
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="row-action" style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="btn-history-view"
                          onClick={() => setSelectedAssessment(item)}
                          title="View evaluation details"
                        >
                          <FiEye /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Redesigned Clean Assessment Details Modal */}
      {selectedAssessment && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedAssessment(null)}
        >
          <div
            className="modal-card fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <span className="modal-tag">Assessment Record</span>
                <h3 className="modal-title">
                  Evaluation #
                  {assessments.findIndex((a) => a._id === selectedAssessment._id) >= 0
                    ? assessments.length -
                      assessments.findIndex((a) => a._id === selectedAssessment._id)
                    : 1}
                </h3>
                <span className="modal-timestamp">
                  <FiClock /> {formatDateTime(selectedAssessment.createdAt)}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedAssessment(null)}
                aria-label="Close modal"
              >
                <FiX />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {/* Risk Level Banner */}
              {(() => {
                const riskKey = normalizeRisk(selectedAssessment.burnoutLevel);
                const meta = RISK_META[riskKey] || RISK_META.Low;
                return (
                  <div className={`modal-status-hero ${meta.cardClass}`}>
                    <div className="hero-status-row">
                      <div className="hero-status-left">
                        <span className={`risk-category-pill ${meta.pillClass}`}>
                          <span className="pill-dot" /> {meta.label}
                        </span>
                        <h4 className="hero-risk-title">{meta.fullLabel}</h4>
                      </div>
                      <div className="hero-icon-bubble">{meta.icon}</div>
                    </div>
                    <p className="hero-explanation-text">{meta.explanation}</p>
                  </div>
                );
              })()}

              {/* Recommendations (if available) */}
              {Array.isArray(selectedAssessment.recommendations) &&
                selectedAssessment.recommendations.length > 0 && (
                  <div className="modal-section">
                    <div className="section-title-combo">
                      <FiCompass className="section-header-icon" />
                      <h4 className="modal-section-title">Recommendations</h4>
                    </div>
                    <div className="modal-recs-grid">
                      {selectedAssessment.recommendations.map((rec, rIdx) => (
                        <div key={rIdx} className="modal-rec-card">
                          <FiCheckCircle className="rec-bullet-icon" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* 4 Organized Groups (Matching Prediction Result Page) */}
              {selectedAssessment.answers && (
                <div className="modal-section">
                  <div className="section-title-combo">
                    <FiActivity className="section-header-icon" />
                    <h4 className="modal-section-title">
                      Submitted Responses (16 Factors)
                    </h4>
                  </div>

                  <div className="modal-responses-grid">
                    {/* 1. Academic Life */}
                    <div className="response-group-card">
                      <div className="group-card-header">
                        <span className="group-icon-badge">
                          <FiBookOpen />
                        </span>
                        <span className="group-heading">Academic Life</span>
                      </div>
                      <div className="group-items-list">
                        <div className="data-row">
                          <span className="data-label">Daily Study Hours</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.study_hours_per_day !== undefined
                              ? `${selectedAssessment.answers.study_hours_per_day} hrs/day`
                              : "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Exam Pressure</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.exam_pressure !== undefined
                              ? `${selectedAssessment.answers.exam_pressure} / 10`
                              : "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Academic Performance</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.academic_performance !== undefined
                              ? `${selectedAssessment.answers.academic_performance}%`
                              : "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Family Expectation</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.family_expectation !== undefined
                              ? `${selectedAssessment.answers.family_expectation} / 10`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Mental Wellness */}
                    <div className="response-group-card">
                      <div className="group-card-header">
                        <span className="group-icon-badge">
                          <FiHeart />
                        </span>
                        <span className="group-heading">Mental Wellness</span>
                      </div>
                      <div className="group-items-list">
                        <div className="data-row">
                          <span className="data-label">Stress Level</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.stress_level !== undefined
                              ? `${selectedAssessment.answers.stress_level} / 10`
                              : "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Anxiety Score</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.anxiety_score !== undefined
                              ? `${selectedAssessment.answers.anxiety_score} / 30`
                              : "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Depression Score</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.depression_score !== undefined
                              ? `${selectedAssessment.answers.depression_score} / 30`
                              : "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Social Support</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.social_support !== undefined
                              ? `${selectedAssessment.answers.social_support} / 10`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Daily Lifestyle */}
                    <div className="response-group-card">
                      <div className="group-card-header">
                        <span className="group-icon-badge">
                          <FiMoon />
                        </span>
                        <span className="group-heading">Daily Lifestyle</span>
                      </div>
                      <div className="group-items-list">
                        <div className="data-row">
                          <span className="data-label">Sleep Duration</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.sleep_hours !== undefined
                              ? `${selectedAssessment.answers.sleep_hours} hrs/night`
                              : "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Physical Activity</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.physical_activity !== undefined
                              ? `${selectedAssessment.answers.physical_activity} hrs/day`
                              : "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Screen Time</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.screen_time !== undefined
                              ? `${selectedAssessment.answers.screen_time} hrs/day`
                              : "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Internet Usage</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.internet_usage !== undefined
                              ? `${selectedAssessment.answers.internet_usage} hrs/day`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 4. Personal Wellbeing */}
                    <div className="response-group-card">
                      <div className="group-card-header">
                        <span className="group-icon-badge">
                          <FiShield />
                        </span>
                        <span className="group-heading">Personal Wellbeing</span>
                      </div>
                      <div className="group-items-list">
                        <div className="data-row">
                          <span className="data-label">Student Age</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.age !== undefined
                              ? `${selectedAssessment.answers.age} yrs`
                              : "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Gender</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.gender || "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Academic Year</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.academic_year !== undefined
                              ? `Year ${selectedAssessment.answers.academic_year}`
                              : "—"}
                          </span>
                        </div>
                        <div className="data-row">
                          <span className="data-label">Financial Stress</span>
                          <span className="data-value-pill">
                            {selectedAssessment.answers.financial_stress !== undefined
                              ? `${selectedAssessment.answers.financial_stress} / 10`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedAssessment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default History;
