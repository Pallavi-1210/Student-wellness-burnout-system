import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiRefreshCw,
  FiPlusCircle,
  FiList,
  FiAlertCircle,
} from "react-icons/fi";
import { API_ENDPOINTS } from "../../utils/apiConfig";
import AssessmentBreakdown from "../AssessmentBreakdown";
import {
  formatHistoryDate,
  normalizeRisk,
  RISK_META,
} from "../../utils/recommendations";

const API_BASE_URL = API_ENDPOINTS.ASSESSMENTS;

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

  // View 2: Full Breakdown
  if (selectedAssessment) {
    return (
      <AssessmentBreakdown
        assessment={selectedAssessment}
        onBack={() => setSelectedAssessment(null)}
        backLabel="Back to History"
      />
    );
  }

  // View 1: History List (Exact mockup layout)
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
                      onClick={() => setSelectedAssessment(item)}
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
