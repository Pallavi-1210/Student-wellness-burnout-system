import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiCalendar,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiEye,
  FiRefreshCw,
  FiPlusCircle,
  FiList,
  FiBookOpen,
  FiHeart,
  FiMoon,
  FiArrowLeft,
} from "react-icons/fi";
import { API_ENDPOINTS } from "../../utils/apiConfig";
import PredictionResult from "../PredictionResult";

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

function History({ token, onTakeAssessment, onGoDashboard }) {
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

  // If student clicked "View Details" on an assessment record,
  // display the exact same 3-page post-assessment flow:
  // Risk Result Page → Personalized Recommendations / Assessment Summary
  if (selectedAssessment) {
    const recordNum =
      assessments.findIndex((a) => a._id === selectedAssessment._id) >= 0
        ? assessments.length -
          assessments.findIndex((a) => a._id === selectedAssessment._id)
        : 1;

    return (
      <div className="history-detail-wrapper fade-in">
        <div className="history-detail-top-nav">
          <button
            type="button"
            className="btn btn-secondary btn-back-nav"
            onClick={() => setSelectedAssessment(null)}
            title="Return to assessment history records"
          >
            <FiArrowLeft /> Back to All Records
          </button>
          <div className="history-record-badge">
            Viewing Evaluation #{recordNum}
          </div>
        </div>

        <div className="form-card assessment-card result-view-card">
          <PredictionResult
            assessmentResult={selectedAssessment}
            onReset={onTakeAssessment}
            onGoDashboard={onGoDashboard}
            onGoHistory={() => setSelectedAssessment(null)}
            onBackToHistory={() => setSelectedAssessment(null)}
            isHistoryView={true}
            recordNumber={recordNum}
          />
        </div>
      </div>
    );
  }

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
    </div>
  );
}

export default History;
