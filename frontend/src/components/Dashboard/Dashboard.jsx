import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Chart from "chart.js/auto";
import {
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiActivity,
  FiRefreshCw,
  FiPlusCircle,
  FiCalendar,
  FiArrowRight,
  FiBookOpen,
  FiHeart,
  FiMoon,
} from "react-icons/fi";
import { API_ENDPOINTS } from "../../utils/apiConfig";

const API_BASE_URL = API_ENDPOINTS.ASSESSMENTS;

function normalizeRisk(level) {
  const str = String(level || "").trim().toLowerCase();
  if (str.includes("high")) return "High";
  if (str.includes("med") || str.includes("mod")) return "Medium";
  return "Low";
}

function Dashboard({ token, onTakeAssessment, onGoHistory }) {
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const doughnutCanvasRef = useRef(null);
  const lineCanvasRef = useRef(null);
  const barCanvasRef = useRef(null);

  const doughnutChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const barChartRef = useRef(null);

  const fetchAssessments = useCallback(async () => {
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
      console.error("Dashboard Fetch Error:", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Unable to load assessment records.");
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
          console.error("Dashboard Fetch Error:", err);
          setError(err.response?.data?.error || "Unable to load assessment records.");
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

  // Derived statistics from actual data
  const totalCount = assessments.length;
  const lowCount = assessments.filter(
    (a) => normalizeRisk(a.burnoutLevel) === "Low"
  ).length;
  const medCount = assessments.filter(
    (a) => normalizeRisk(a.burnoutLevel) === "Medium"
  ).length;
  const highCount = assessments.filter(
    (a) => normalizeRisk(a.burnoutLevel) === "High"
  ).length;

  const latestAssessment = assessments[0] || null;
  const latestRisk = latestAssessment
    ? normalizeRisk(latestAssessment.burnoutLevel)
    : "Low";

  // Chart rendering effect
  useEffect(() => {
    if (isLoading || assessments.length === 0) return;

    // Destroy prior chart instances
    if (doughnutChartRef.current) doughnutChartRef.current.destroy();
    if (lineChartRef.current) lineChartRef.current.destroy();
    if (barChartRef.current) barChartRef.current.destroy();

    // 1. Doughnut Chart: Risk Distribution
    if (doughnutCanvasRef.current) {
      const doughnutCtx = doughnutCanvasRef.current.getContext("2d");
      doughnutChartRef.current = new Chart(doughnutCtx, {
        type: "doughnut",
        data: {
          labels: ["Low Risk", "Moderate Risk", "High Risk"],
          datasets: [
            {
              data: [lowCount, medCount, highCount],
              backgroundColor: ["#315B48", "#D97706", "#DC2626"],
              borderColor: "#ffffff",
              borderWidth: 3,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                boxWidth: 12,
                boxHeight: 12,
                borderRadius: 3,
                useBorderRadius: true,
                padding: 16,
                font: { family: "inherit", size: 12, weight: "600" },
                color: "#2F3E35",
              },
            },
            tooltip: {
              backgroundColor: "#1B3529",
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: function (context) {
                  const val = context.raw || 0;
                  const pct =
                    totalCount > 0 ? ((val / totalCount) * 100).toFixed(1) : 0;
                  return ` ${context.label}: ${val} (${pct}%)`;
                },
              },
            },
          },
          cutout: "72%",
        },
      });
    }

    // 2. Line Chart: Trend Over Time
    if (lineCanvasRef.current) {
      const chronological = [...assessments].reverse();
      const labels = chronological.map((item, idx) => {
        try {
          const d = new Date(item.createdAt);
          const month = d.toLocaleDateString("en-US", { month: "short" });
          const day = d.getDate();
          return `#${idx + 1} (${month} ${day})`;
        } catch {
          return `#${idx + 1}`;
        }
      });

      const burnoutScores = chronological.map((item) => {
        const lvl = normalizeRisk(item.burnoutLevel);
        if (lvl === "High") return 3;
        if (lvl === "Medium") return 2;
        return 1;
      });

      const lineCtx = lineCanvasRef.current.getContext("2d");
      lineChartRef.current = new Chart(lineCtx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Burnout Severity",
              data: burnoutScores,
              borderColor: "#315B48",
              backgroundColor: "rgba(49, 91, 72, 0.08)",
              borderWidth: 2.5,
              tension: 0.35,
              fill: true,
              pointBackgroundColor: burnoutScores.map((s) =>
                s === 3 ? "#DC2626" : s === 2 ? "#D97706" : "#315B48"
              ),
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2.5,
              pointRadius: 6,
              pointHoverRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 0.6,
              max: 3.4,
              ticks: {
                stepSize: 1,
                callback: function (val) {
                  if (val === 1) return "Low";
                  if (val === 2) return "Moderate";
                  if (val === 3) return "High";
                  return "";
                },
                font: { family: "inherit", size: 11, weight: "600" },
                color: "#56685D",
              },
              grid: {
                color: "rgba(49, 91, 72, 0.08)",
              },
            },
            x: {
              ticks: {
                font: { family: "inherit", size: 11 },
                color: "#56685D",
              },
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: "#1B3529",
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: function (context) {
                  const val = context.raw;
                  const label =
                    val === 3
                      ? "High Risk"
                      : val === 2
                      ? "Moderate Risk"
                      : "Low Risk";
                  return ` Burnout Severity: ${label}`;
                },
              },
            },
          },
        },
      });
    }

    // 3. Bar Chart: Key Factors
    if (barCanvasRef.current) {
      const latestAnswers = latestAssessment?.answers || {};
      const studyHrs = Number(latestAnswers.study_hours_per_day) || 0;
      const sleepHrs = Number(latestAnswers.sleep_hours) || 0;
      const stressLvl = Number(latestAnswers.stress_level) || 0;
      const anxiety = Number(latestAnswers.anxiety_score) || 0;

      const barCtx = barCanvasRef.current.getContext("2d");
      barChartRef.current = new Chart(barCtx, {
        type: "bar",
        data: {
          labels: [
            "Daily Study (hrs)",
            "Nightly Sleep (hrs)",
            "Stress Rating (/10)",
            "Anxiety Index (/30)",
          ],
          datasets: [
            {
              label: "Recent Value",
              data: [studyHrs, sleepHrs, stressLvl, anxiety],
              backgroundColor: [
                "rgba(102, 124, 152, 0.9)",
                "rgba(49, 91, 72, 0.9)",
                "rgba(217, 119, 6, 0.9)",
                "rgba(220, 38, 38, 0.9)",
              ],
              borderColor: ["#667C98", "#315B48", "#D97706", "#DC2626"],
              borderWidth: 1.5,
              borderRadius: 8,
              maxBarThickness: 44,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                font: { family: "inherit", size: 11 },
                color: "#56685D",
              },
              grid: {
                color: "rgba(49, 91, 72, 0.08)",
              },
            },
            x: {
              ticks: {
                font: { family: "inherit", size: 11, weight: "600" },
                color: "#2F3E35",
              },
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: "#1B3529",
              padding: 10,
              cornerRadius: 8,
              callbacks: {
                label: function (context) {
                  return ` Value: ${context.raw}`;
                },
              },
            },
          },
        },
      });
    }

    return () => {
      if (doughnutChartRef.current) doughnutChartRef.current.destroy();
      if (lineChartRef.current) lineChartRef.current.destroy();
      if (barChartRef.current) barChartRef.current.destroy();
    };
  }, [
    assessments,
    isLoading,
    lowCount,
    medCount,
    highCount,
    totalCount,
    latestAssessment,
  ]);

  return (
    <div className="dashboard-container fade-in">
      {/* 1. Header Bar */}
      <div className="dashboard-header-row">
        <div>
          <div className="dash-kicker-row">
            <span className="result-kicker">Analytics</span>
            <span className="dash-count-pill">{totalCount} Evaluations</span>
          </div>
          <h2 className="dash-main-title">Student Wellness Dashboard</h2>
          <p className="dash-subtitle">
            Longitudinal burnout risk indicators and personal wellness progress.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchAssessments}
            disabled={isLoading}
            title="Refresh analytics data"
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
          <p>Loading your wellness metrics...</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="empty-state-card">
          <FiBarChart2 className="empty-icon" />
          <h3>No Evaluations Logged Yet</h3>
          <p>
            Complete your first student burnout assessment to view real-time risk
            analytics, progress charts, and personal wellness trends.
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
        <>
          {/* 2. Stat Summary Cards */}
          <div className="stat-cards-grid">
            {/* Total */}
            <div className="stat-card">
              <div className="stat-icon-wrapper total">
                <FiBarChart2 />
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Completed</span>
                <span className="stat-number">{totalCount}</span>
                <span className="stat-note">Assessments</span>
              </div>
            </div>

            {/* Low Risk */}
            <div className="stat-card stat-low">
              <div className="stat-icon-wrapper low">
                <FiCheckCircle />
              </div>
              <div className="stat-info">
                <span className="stat-label">Low Risk</span>
                <span className="stat-number">{lowCount}</span>
                <span className="stat-badge-pill pill-low">
                  {totalCount > 0
                    ? `${Math.round((lowCount / totalCount) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>

            {/* Moderate Risk */}
            <div className="stat-card stat-medium">
              <div className="stat-icon-wrapper medium">
                <FiAlertTriangle />
              </div>
              <div className="stat-info">
                <span className="stat-label">Moderate Risk</span>
                <span className="stat-number">{medCount}</span>
                <span className="stat-badge-pill pill-medium">
                  {totalCount > 0
                    ? `${Math.round((medCount / totalCount) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>

            {/* High Risk */}
            <div className="stat-card stat-high">
              <div className="stat-icon-wrapper high">
                <FiAlertCircle />
              </div>
              <div className="stat-info">
                <span className="stat-label">High Risk</span>
                <span className="stat-number">{highCount}</span>
                <span className="stat-badge-pill pill-high">
                  {totalCount > 0
                    ? `${Math.round((highCount / totalCount) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Recent Evaluation Banner (Compact Snapshot) */}
          {latestAssessment && (
            <div className="dash-recent-snapshot-card">
              <div className="snapshot-left">
                <span className="snapshot-kicker">Latest Assessment</span>
                <div className="snapshot-title-row">
                  <span
                    className={`risk-category-pill ${
                      latestRisk === "High"
                        ? "risk-pill-high"
                        : latestRisk === "Medium"
                        ? "risk-pill-medium"
                        : "risk-pill-low"
                    }`}
                  >
                    <span className="pill-dot" />
                    {latestRisk === "High"
                      ? "High Risk"
                      : latestRisk === "Medium"
                      ? "Moderate Risk"
                      : "Low Risk"}
                  </span>
                  <span className="snapshot-timestamp">
                    <FiCalendar className="meta-icon" />
                    {new Date(latestAssessment.createdAt).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }
                    )}
                  </span>
                </div>
              </div>

              {/* Quick factor chips */}
              <div className="snapshot-factors-chips">
                <div className="snapshot-chip">
                  <FiBookOpen className="chip-icon" />
                  <span>
                    Study:{" "}
                    <strong>
                      {latestAssessment.answers?.study_hours_per_day ?? "—"}h/d
                    </strong>
                  </span>
                </div>
                <div className="snapshot-chip">
                  <FiMoon className="chip-icon" />
                  <span>
                    Sleep:{" "}
                    <strong>
                      {latestAssessment.answers?.sleep_hours ?? "—"}h/n
                    </strong>
                  </span>
                </div>
                <div className="snapshot-chip">
                  <FiHeart className="chip-icon" />
                  <span>
                    Stress:{" "}
                    <strong>
                      {latestAssessment.answers?.stress_level ?? "—"}/10
                    </strong>
                  </span>
                </div>
                {onGoHistory && (
                  <button
                    type="button"
                    className="btn-snapshot-history"
                    onClick={onGoHistory}
                  >
                    History <FiArrowRight />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. Charts Section */}
          <div className="charts-double-row">
            {/* Doughnut Chart */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-title-group">
                  <FiPieChart className="chart-icon" />
                  <div>
                    <h4>Risk Distribution</h4>
                    <span className="chart-sub">Proportion across evaluations</span>
                  </div>
                </div>
              </div>
              <div className="chart-canvas-wrapper doughnut-wrapper">
                <canvas ref={doughnutCanvasRef} />
              </div>
            </div>

            {/* Line Chart */}
            <div className="chart-card">
              <div className="chart-card-header">
                <div className="chart-title-group">
                  <FiTrendingUp className="chart-icon" />
                  <div>
                    <h4>Burnout Severity Trend</h4>
                    <span className="chart-sub">Progression over time</span>
                  </div>
                </div>
              </div>
              <div className="chart-canvas-wrapper">
                <canvas ref={lineCanvasRef} />
              </div>
            </div>
          </div>

          {/* 5. Wide Indicators Chart */}
          <div className="chart-card single-wide-chart">
            <div className="chart-card-header">
              <div className="chart-title-group">
                <FiActivity className="chart-icon" />
                <div>
                  <h4>Key Wellbeing Indicators</h4>
                  <span className="chart-sub">
                    Latest session values for study, rest, stress, and anxiety
                  </span>
                </div>
              </div>
              {onGoHistory && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onGoHistory}
                >
                  View History Records <FiArrowRight />
                </button>
              )}
            </div>
            <div className="chart-canvas-wrapper bar-wrapper">
              <canvas ref={barCanvasRef} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
