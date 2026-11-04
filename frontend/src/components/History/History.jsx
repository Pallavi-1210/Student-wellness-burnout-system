import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiRefreshCw,
  FiPlusCircle,
  FiArrowLeft,
  FiCompass,
  FiList,
  FiTrendingUp,
  FiAlertCircle,
} from "react-icons/fi";
import { API_ENDPOINTS } from "../../utils/apiConfig";
import { getTopPersonalizedRecommendations } from "../../utils/recommendations";

const API_BASE_URL = API_ENDPOINTS.ASSESSMENTS;

function formatHistoryDate(dateStr) {
  if (!dateStr) return { date: "—", time: "", full: "—" };
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const year = d.getFullYear();
    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return {
      date: `${day} ${month} ${year}`,
      time: time,
      full: `${day} ${month} ${year} · ${time}`,
    };
  } catch {
    return { date: String(dateStr), time: "", full: String(dateStr) };
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
    pillClass: "dark-pill-low",
  },
  Medium: {
    label: "Moderate Risk",
    pillClass: "dark-pill-medium",
  },
  High: {
    label: "High Risk",
    pillClass: "dark-pill-high",
  },
};

function formatHours(val) {
  if (val === undefined || val === null || val === "") return "—";
  return `${val} Hours`;
}

function formatScore(val, max = 10) {
  if (val === undefined || val === null || val === "") return "—";
  return `${val}/${max}`;
}

function formatAcademicPerformance(val) {
  if (val === undefined || val === null || val === "") return "—";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (num <= 10) return `${num}/10`;
  return `${num}%`;
}

function History({ token, onTakeAssessment }) {
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [activeTab, setActiveTab] = useState("breakdown"); // 'breakdown' | 'recommendations'

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

  // ============================================================================
  // VIEW 2: FULL ASSESSMENT BREAKDOWN (AFTER CLICKING FULL BREAKDOWN)
  // Matches the exact second card in the user's mockup
  // ============================================================================
  if (selectedAssessment) {
    const { full } = formatHistoryDate(selectedAssessment.createdAt);
    const riskKey = normalizeRisk(selectedAssessment.burnoutLevel);
    const meta = RISK_META[riskKey] || RISK_META.Low;
    const answers = selectedAssessment.answers || selectedAssessment.formData || {};
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
              <button
                type="button"
                className="dark-pill-btn"
                onClick={() => {
                  setSelectedAssessment(null);
                  setActiveTab("breakdown");
                }}
                title="Return to assessment history"
              >
                <FiArrowLeft /> Back to History
              </button>
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
                    <span className="dark-row-value">{formatHours(answers.study_hours_per_day)}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Exam Pressure</span>
                    <span className="dark-row-value">{formatScore(answers.exam_pressure, 10)}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Academic Satisfaction</span>
                    <span className="dark-row-value">{formatAcademicPerformance(answers.academic_performance)}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Financial Stress</span>
                    <span className="dark-row-value">{formatScore(answers.financial_stress, 10)}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Family Expectation</span>
                    <span className="dark-row-value">{formatScore(answers.family_expectation, 10)}</span>
                  </div>
                </div>
              </div>

              {/* 02 — Personal Well-being */}
              <div className="dark-breakdown-section">
                <h3 className="dark-section-heading">02 — Personal Well-being</h3>
                <div className="dark-rows-group">
                  <div className="dark-data-row">
                    <span className="dark-row-label">Sleep Hours</span>
                    <span className="dark-row-value">{formatHours(answers.sleep_hours)}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Stress Level</span>
                    <span className="dark-row-value">{formatScore(answers.stress_level, 10)}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Anxiety Score</span>
                    <span className="dark-row-value">{answers.anxiety_score !== undefined ? `${answers.anxiety_score} / 9.11` : "—"}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Depression Score</span>
                    <span className="dark-row-value">{answers.depression_score !== undefined ? `${answers.depression_score} / 7.74` : "—"}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Social Support</span>
                    <span className="dark-row-value">{formatScore(answers.social_support, 10)}</span>
                  </div>
                </div>
              </div>

              {/* 03 — Daily Lifestyle */}
              <div className="dark-breakdown-section">
                <h3 className="dark-section-heading">03 — Daily Lifestyle</h3>
                <div className="dark-rows-group">
                  <div className="dark-data-row">
                    <span className="dark-row-label">Physical Activity</span>
                    <span className="dark-row-value">{formatHours(answers.physical_activity)}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Screen Time</span>
                    <span className="dark-row-value">{formatHours(answers.screen_time)}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Internet Usage</span>
                    <span className="dark-row-value">{formatHours(answers.internet_usage)}</span>
                  </div>
                </div>
              </div>

              {/* 04 — Demographics & Background */}
              <div className="dark-breakdown-section">
                <h3 className="dark-section-heading">04 — Demographics & Background</h3>
                <div className="dark-rows-group">
                  <div className="dark-data-row">
                    <span className="dark-row-label">Student Age</span>
                    <span className="dark-row-value">{answers.age !== undefined ? `${answers.age} Years` : "—"}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Gender</span>
                    <span className="dark-row-value">{answers.gender || "—"}</span>
                  </div>
                  <div className="dark-data-row">
                    <span className="dark-row-label">Academic Year</span>
                    <span className="dark-row-value">{answers.academic_year !== undefined ? `Year ${answers.academic_year}` : "—"}</span>
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
          <div className="dark-card-footer">
            <button
              type="button"
              className="dark-pill-btn"
              onClick={() => {
                setSelectedAssessment(null);
                setActiveTab("breakdown");
              }}
            >
              <FiArrowLeft /> Back to Assessment History
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 1: ASSESSMENT HISTORY LIST (EXACT TOP CARD IN MOCKUP)
  // ============================================================================
  return (
    <div className="dark-history-outer-container fade-in">
      <div className="dark-history-card">
        {/* Header Row */}
        <div className="dark-card-header">
          <div className="dark-header-title-block">
            <h2 className="dark-main-title">Assessment History</h2>
            <p className="dark-subtitle">Your previous burnout assessments</p>
          </div>
          <div className="dark-header-right-actions">
            <button
              type="button"
              className="dark-icon-btn"
              onClick={fetchHistory}
              disabled={isLoading}
              title="Refresh assessments"
            >
              <FiRefreshCw className={isLoading ? "spin" : ""} />
            </button>
            <button
              type="button"
              className="dark-pill-btn dark-pill-btn-primary"
              onClick={onTakeAssessment}
            >
              <FiPlusCircle /> New Assessment
            </button>
          </div>
        </div>

        {error && (
          <div className="dark-alert-error">
            <FiAlertCircle className="alert-icon" />
            <span>{error}</span>
          </div>
        )}

        <div className="dark-divider-line" />

        {/* Rows List */}
        {isLoading ? (
          <div className="dark-loading-state">
            <FiRefreshCw className="spin dark-spinner-icon" />
            <p>Loading your assessment records...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="dark-empty-state">
            <FiList className="dark-empty-icon" />
            <h3>No previous assessments found</h3>
            <p>Complete a quick burnout assessment to generate your personalized wellness history.</p>
            <button
              type="button"
              className="dark-pill-btn dark-pill-btn-primary"
              onClick={onTakeAssessment}
            >
              <FiPlusCircle /> Take Assessment
            </button>
          </div>
        ) : (
          <div className="dark-history-list">
            {assessments.map((item) => {
              const { date, time } = formatHistoryDate(item.createdAt);
              const riskKey = normalizeRisk(item.burnoutLevel);
              const meta = RISK_META[riskKey] || RISK_META.Low;

              return (
                <div key={item._id} className="dark-history-row">
                  <div className="dark-row-date-block">
                    <span className="dark-row-date">{date}</span>
                    <span className="dark-row-time">{time}</span>
                  </div>

                  <div className="dark-row-actions">
                    <span className={`dark-risk-pill ${meta.pillClass}`}>
                      {meta.label}
                    </span>
                    <button
                      type="button"
                      className="dark-pill-btn dark-btn-breakdown"
                      onClick={() => {
                        setSelectedAssessment(item);
                        setActiveTab("breakdown");
                      }}
                    >
                      Full Breakdown
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default History;
