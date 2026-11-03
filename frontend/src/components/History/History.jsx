import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  FiCalendar,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiRefreshCw,
  FiPlusCircle,
  FiList,
  FiMoon,
  FiBookOpen,
  FiHeart,
  FiActivity,
  FiArrowRight,
  FiShield,
  FiLayers,
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
    accentClass: "risk-accent-low",
    icon: <FiCheckCircle />,
    explanation:
      "Workload and lifestyle factors are well balanced. Maintain current study pacing and restorative sleep routines.",
  },
  Medium: {
    label: "Moderate Risk",
    fullLabel: "Moderate Burnout Risk",
    pillClass: "risk-pill-medium",
    cardClass: "risk-card-medium",
    accentClass: "risk-accent-medium",
    icon: <FiAlertTriangle />,
    explanation:
      "Moderate academic pressure or lifestyle fatigue detected. Pacing assignments and setting evening boundaries recommended.",
  },
  High: {
    label: "High Risk",
    fullLabel: "High Burnout Risk",
    pillClass: "risk-pill-high",
    cardClass: "risk-card-high",
    accentClass: "risk-accent-high",
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
  const [riskFilter, setRiskFilter] = useState("all");

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

  // Derived Summary Metrics for top ribbon
  const stats = useMemo(() => {
    if (!assessments.length) {
      return { total: 0, low: 0, med: 0, high: 0, avgSleep: "—", avgStress: "—", latestRisk: "None" };
    }
    const low = assessments.filter((a) => normalizeRisk(a.burnoutLevel) === "Low").length;
    const med = assessments.filter((a) => normalizeRisk(a.burnoutLevel) === "Medium").length;
    const high = assessments.filter((a) => normalizeRisk(a.burnoutLevel) === "High").length;

    const sleepSum = assessments.reduce(
      (sum, a) => sum + (Number(a.answers?.sleep_hours) || 0),
      0
    );
    const stressSum = assessments.reduce(
      (sum, a) => sum + (Number(a.answers?.stress_level) || 0),
      0
    );

    const latest = assessments[0];
    const latestRisk = latest ? normalizeRisk(latest.burnoutLevel) : "None";

    return {
      total: assessments.length,
      low,
      med,
      high,
      avgSleep: (sleepSum / assessments.length).toFixed(1),
      avgStress: (stressSum / assessments.length).toFixed(1),
      latestRisk,
    };
  }, [assessments]);

  // Filtered assessments list
  const filteredAssessments = useMemo(() => {
    if (riskFilter === "all") return assessments;
    return assessments.filter((a) => normalizeRisk(a.burnoutLevel) === riskFilter);
  }, [assessments, riskFilter]);

  // When student clicks "View Details" on an assessment card,
  // display the detailed record with all 16 factors grouped into sections
  if (selectedAssessment) {
    const recordNum =
      assessments.findIndex((a) => a._id === selectedAssessment._id) >= 0
        ? assessments.length -
          assessments.findIndex((a) => a._id === selectedAssessment._id)
        : 1;

    return (
      <div className="history-detail-wrapper fade-in">
        <div className="form-card assessment-card result-view-card">
          <PredictionResult
            key={selectedAssessment._id || recordNum}
            assessmentResult={selectedAssessment}
            onReset={onTakeAssessment}
            onGoDashboard={onGoDashboard}
            onBackToHistory={() => setSelectedAssessment(null)}
            isHistoryView={true}
            recordNumber={recordNum}
            initialView="summary"
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
            Historical log of your past burnout evaluations, lifestyle metrics, and wellbeing progress.
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

      {/* 2. Top Summary Analytics Strip (when records exist) */}
      {!isLoading && assessments.length > 0 && (
        <div className="history-quick-stats-strip">
          <div className="history-stat-box">
            <div className="history-stat-icon-wrap icon-total">
              <FiLayers />
            </div>
            <div className="history-stat-info">
              <span className="history-stat-label">Total Evaluated</span>
              <strong className="history-stat-value">{stats.total} Records</strong>
            </div>
          </div>

          <div className="history-stat-box">
            <div className="history-stat-icon-wrap icon-risk">
              <FiShield />
            </div>
            <div className="history-stat-info">
              <span className="history-stat-label">Latest Burnout Risk</span>
              <strong className="history-stat-value">
                {stats.latestRisk === "Low" ? (
                  <span className="risk-text-low">Low Risk</span>
                ) : stats.latestRisk === "Medium" ? (
                  <span className="risk-text-med">Moderate</span>
                ) : (
                  <span className="risk-text-high">High Risk</span>
                )}
              </strong>
            </div>
          </div>

          <div className="history-stat-box">
            <div className="history-stat-icon-wrap icon-sleep">
              <FiMoon />
            </div>
            <div className="history-stat-info">
              <span className="history-stat-label">Average Sleep</span>
              <strong className="history-stat-value">{stats.avgSleep} hrs/night</strong>
            </div>
          </div>

          <div className="history-stat-box">
            <div className="history-stat-icon-wrap icon-stress">
              <FiHeart />
            </div>
            <div className="history-stat-info">
              <span className="history-stat-label">Average Stress</span>
              <strong className="history-stat-value">{stats.avgStress} / 10</strong>
            </div>
          </div>
        </div>
      )}

      {/* 3. Filter Segmented Control (when records exist) */}
      {!isLoading && assessments.length > 0 && (
        <div className="history-filters-bar">
          <span className="history-filter-title">Filter by Risk:</span>
          <div className="history-filter-pills">
            <button
              type="button"
              className={`history-filter-btn ${riskFilter === "all" ? "active" : ""}`}
              onClick={() => setRiskFilter("all")}
            >
              All Records <span className="filter-count">({stats.total})</span>
            </button>
            <button
              type="button"
              className={`history-filter-btn ${riskFilter === "Low" ? "active" : ""}`}
              onClick={() => setRiskFilter("Low")}
            >
              Low Risk <span className="filter-count">({stats.low})</span>
            </button>
            <button
              type="button"
              className={`history-filter-btn ${riskFilter === "Medium" ? "active" : ""}`}
              onClick={() => setRiskFilter("Medium")}
            >
              Moderate <span className="filter-count">({stats.med})</span>
            </button>
            <button
              type="button"
              className={`history-filter-btn ${riskFilter === "High" ? "active" : ""}`}
              onClick={() => setRiskFilter("High")}
            >
              High Risk <span className="filter-count">({stats.high})</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Loading / Empty / Cards List */}
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
            to view your historical records and personalized trajectory.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onTakeAssessment}
          >
            <FiPlusCircle /> Take First Assessment
          </button>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="empty-state-card">
          <FiList className="empty-icon" />
          <h3>No {riskFilter} Risk Records</h3>
          <p>You have no evaluations matching the selected filter.</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setRiskFilter("all")}
          >
            View All Records
          </button>
        </div>
      ) : (
        /* Modern History Record Cards with Key Assessment Content */
        <div className="history-cards-grid">
          {filteredAssessments.map((item) => {
            const riskKey = normalizeRisk(item.burnoutLevel);
            const meta = RISK_META[riskKey] || RISK_META.Low;
            const answers = item.answers || {};
            const recordIndex =
              assessments.findIndex((a) => a._id === item._id) >= 0
                ? assessments.length - assessments.findIndex((a) => a._id === item._id)
                : 1;

            return (
              <div
                key={item._id}
                className={`history-record-card ${meta.accentClass}`}
              >
                {/* Header: Date and Index */}
                <div className="record-card-top">
                  <div className="record-date-wrapper">
                    <FiCalendar className="record-date-icon" />
                    <span className="record-date-text">{formatDateTime(item.createdAt)}</span>
                  </div>
                  <span className="record-index-badge">#{recordIndex}</span>
                </div>

                {/* Risk Level Badge */}
                <div className="record-risk-row">
                  <span className="record-risk-caption">Burnout Risk</span>
                  <span className={`risk-category-pill ${meta.pillClass}`}>
                    <span className="pill-dot" />
                    {meta.label}
                  </span>
                </div>

                {/* Key Assessment Factors: Sleep, Study, Stress, Exam */}
                <div className="record-metrics-grid">
                  <div className="record-metric-item" title="Nightly Sleep Duration">
                    <FiMoon className="metric-item-icon icon-sleep" />
                    <div className="metric-item-text">
                      <span className="metric-item-label">Sleep</span>
                      <strong className="metric-item-val">
                        {answers.sleep_hours !== undefined ? `${answers.sleep_hours}h` : "—"}
                      </strong>
                    </div>
                  </div>

                  <div className="record-metric-item" title="Daily Study Hours">
                    <FiBookOpen className="metric-item-icon icon-study" />
                    <div className="metric-item-text">
                      <span className="metric-item-label">Study</span>
                      <strong className="metric-item-val">
                        {answers.study_hours_per_day !== undefined ? `${answers.study_hours_per_day}h` : "—"}
                      </strong>
                    </div>
                  </div>

                  <div className="record-metric-item" title="Stress Rating">
                    <FiHeart className="metric-item-icon icon-stress" />
                    <div className="metric-item-text">
                      <span className="metric-item-label">Stress</span>
                      <strong className="metric-item-val">
                        {answers.stress_level !== undefined ? `${answers.stress_level}/10` : "—"}
                      </strong>
                    </div>
                  </div>

                  <div className="record-metric-item" title="Exam Pressure">
                    <FiActivity className="metric-item-icon icon-pressure" />
                    <div className="metric-item-text">
                      <span className="metric-item-label">Exam</span>
                      <strong className="metric-item-val">
                        {answers.exam_pressure !== undefined ? `${answers.exam_pressure}/10` : "—"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="record-card-footer">
                  <button
                    type="button"
                    className="btn-card-view-details"
                    onClick={() => setSelectedAssessment(item)}
                    title="View evaluation details"
                  >
                    View Full Breakdown <FiArrowRight className="btn-icon" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default History;
