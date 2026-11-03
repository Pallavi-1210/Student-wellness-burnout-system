import { useState } from "react";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
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

function normalizeRiskLevel(prediction) {
  if (!prediction) return "Low";
  const raw =
    typeof prediction === "object"
      ? prediction.burnoutLevel ||
        prediction.risk_level ||
        prediction.prediction ||
        ""
      : prediction;
  const str = String(raw).trim().toLowerCase();
  if (str.includes("high")) return "High";
  if (str.includes("med") || str.includes("mod")) return "Medium";
  if (str.includes("low")) return "Low";
  return "Medium";
}

const RISK_CONFIG = {
  Low: {
    statusLabel: "Low Burnout Risk",
    shortLabel: "Low Risk",
    badgeClass: "risk-pill-low",
    cardClass: "risk-card-low",
    icon: <FiCheckCircle />,
    spectrumIndex: 0,
    accentColor: "#2F7A4F",
    explanation:
      "Your workload, rest, and wellbeing indicators reflect a healthy balance. Continue with your current routines.",
  },
  Medium: {
    statusLabel: "Moderate Burnout Risk",
    shortLabel: "Moderate Risk",
    badgeClass: "risk-pill-medium",
    cardClass: "risk-card-medium",
    icon: <FiAlertTriangle />,
    spectrumIndex: 1,
    accentColor: "#D97706",
    explanation:
      "Elevated academic load or early fatigue detected. Introducing regular breaks and workload pacing will prevent burnout.",
  },
  High: {
    statusLabel: "High Burnout Risk",
    shortLabel: "High Risk",
    badgeClass: "risk-pill-high",
    cardClass: "risk-card-high",
    icon: <FiAlertCircle />,
    spectrumIndex: 2,
    accentColor: "#DC2626",
    explanation:
      "High academic stress and fatigue recorded. Prioritizing rest, workload adjustments, and student support is advised.",
  },
};

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

/**
 * Returns strictly 2–3 high-priority, concise recommendations tailored to actual responses.
 * Each recommendation card features a small icon, clear category, priority, data insight, and 1–2 lines of practical advice.
 */
function getTopPersonalizedRecommendations(rawAnswers) {
  const candidates = [];

  const sleepHours = Number(rawAnswers.sleep_hours);
  const studyHours = Number(rawAnswers.study_hours_per_day);
  const examPressure = Number(rawAnswers.exam_pressure);
  const stressLevel = Number(rawAnswers.stress_level);
  const anxietyScore = Number(rawAnswers.anxiety_score);
  const depressionScore = Number(rawAnswers.depression_score);
  const physicalActivity = Number(rawAnswers.physical_activity);
  const screenTime = Number(rawAnswers.screen_time);
  const financialStress = Number(rawAnswers.financial_stress);
  const socialSupport = Number(rawAnswers.social_support);

  // 1. Sleep recovery check
  if (!isNaN(sleepHours) && sleepHours < 6.5) {
    candidates.push({
      priority: 10,
      category: "Sleep & Circadian Rhythm",
      priorityLabel: "Critical Priority",
      priorityClass: "priority-critical",
      icon: <FiMoon />,
      title: "Restore Nightly Sleep Routine",
      dataInsight: `Recorded ${sleepHours} hrs of sleep (below 7–8 hrs recommended baseline)`,
      advice: "Aim for 7–8 hours of consistent nightly rest. Power down electronic displays 45 minutes before sleep to restore focus and cognitive resilience.",
      actionTag: "✓ Target: 7–8 hrs • 11:00 PM digital cutoff",
    });
  }

  // 2. High stress or anxiety
  if (
    (!isNaN(stressLevel) && stressLevel >= 6) ||
    (!isNaN(anxietyScore) && anxietyScore >= 5) ||
    (!isNaN(depressionScore) && depressionScore >= 4)
  ) {
    candidates.push({
      priority: 9,
      category: "Stress & Mental Wellbeing",
      priorityLabel: "High Priority",
      priorityClass: "priority-critical",
      icon: <FiHeart />,
      title: "Active Stress Pacing & Decompression",
      dataInsight: `Stress level rated at ${stressLevel || "elevated"}/10 with high mental strain`,
      advice: "Practice 5 minutes of mindful box breathing between study blocks. If stress feels persistent, reach out to campus student wellness counseling.",
      actionTag: "✓ Practice 5-min daily box breathing",
    });
  }

  // 3. Heavy study workload or high exam pressure
  if (
    (!isNaN(studyHours) && studyHours > 7) ||
    (!isNaN(examPressure) && examPressure >= 7)
  ) {
    candidates.push({
      priority: 8,
      category: "Study & Workload Management",
      priorityLabel: "High Priority",
      priorityClass: "priority-high",
      icon: <FiBookOpen />,
      title: "Structured 50/10 Study Interval Rhythm",
      dataInsight: `Daily study load is ${studyHours || "heavy"} hrs with ${examPressure || "high"}/10 exam pressure`,
      advice: "Prevent cognitive fatigue using the 50/10 rhythm: 50 minutes of focused academic work followed by an obligatory 10-minute screen-free break.",
      actionTag: "✓ 50 min focus • 10 min screen-free break",
    });
  }

  // 4. Low physical activity
  if (!isNaN(physicalActivity) && physicalActivity < 1) {
    candidates.push({
      priority: 7,
      category: "Physical Energy & Movement",
      priorityLabel: "Recommended Habit",
      priorityClass: "priority-routine",
      icon: <FiActivity />,
      title: "Daily Movement & Circulation Breaks",
      dataInsight: `Physical activity currently under 1 hr daily`,
      advice: "Take a 15–20 minute brisk outdoor walk between lectures or study sessions to stimulate cerebral circulation and relieve mental stagnation.",
      actionTag: "✓ 15–20 min daily brisk walk",
    });
  }

  // 5. High screen time
  if (!isNaN(screenTime) && screenTime >= 7) {
    candidates.push({
      priority: 6,
      category: "Digital Screen Boundaries",
      priorityLabel: "Recommended Habit",
      priorityClass: "priority-routine",
      icon: <FiMonitor />,
      title: "Digital Curfew & Eye-Rest Protocol",
      dataInsight: `Screen time is high at ${screenTime} hrs daily`,
      advice: "Apply the 20-20-20 rule during screen sessions (every 20 mins, look 20 feet away for 20 seconds) and disconnect 45 minutes before sleep.",
      actionTag: "✓ 20-20-20 rule • 45m bedtime screen boundary",
    });
  }

  // 6. Financial or social strain
  if (!isNaN(financialStress) && financialStress >= 6) {
    candidates.push({
      priority: 5,
      category: "Financial Support & Resources",
      priorityLabel: "Campus Support",
      priorityClass: "priority-high",
      icon: <FiDollarSign />,
      title: "Campus Financial Aid & Grants",
      dataInsight: `Financial stress self-rated at ${financialStress}/10`,
      advice: "Check campus emergency grant programs, food pantry access, and student financial advisory services to alleviate non-academic pressure.",
      actionTag: "✓ Consult campus financial aid office",
    });
  } else if (!isNaN(socialSupport) && socialSupport <= 4) {
    candidates.push({
      priority: 5,
      category: "Social Connection & Community",
      priorityLabel: "Recommended Habit",
      priorityClass: "priority-routine",
      icon: <FiUsers />,
      title: "Peer Study Circles & Connection",
      dataInsight: `Social support rated low at ${socialSupport}/10`,
      advice: "Form or join a peer study group in your major. Sharing coursework challenges with peers significantly mitigates academic isolation.",
      actionTag: "✓ Connect with a peer or study group",
    });
  }

  // Positive maintenance fallbacks
  if (candidates.length < 2) {
    candidates.push({
      priority: 3,
      category: "Rest Routine Maintenance",
      priorityLabel: "Recommended Habit",
      priorityClass: "priority-routine",
      icon: <FiMoon />,
      title: "Consistent Wake & Rest Routine",
      dataInsight: "Maintain current healthy rest intervals across weekdays and weekends",
      advice: "Keep consistent wake and sleep timings throughout the week to protect your natural circadian rhythm and preserve high daily energy levels.",
      actionTag: "✓ Keep steady wake times (±30m)",
    });
  }
  if (candidates.length < 3) {
    candidates.push({
      priority: 2,
      category: "Restorative Downtime",
      priorityLabel: "Recommended Habit",
      priorityClass: "priority-routine",
      icon: <FiHeart />,
      title: "Daily Non-Academic Downtime",
      dataInsight: "Protect restorative space for personal hobbies and relaxation",
      advice: "Reserve 30–45 minutes daily strictly for non-academic interests, creative hobbies, or leisure reading to keep your mind balanced.",
      actionTag: "✓ 30–45 min daily personal hobby time",
    });
  }
  if (candidates.length < 3) {
    candidates.push({
      priority: 1,
      category: "Academic Planning",
      priorityLabel: "Recommended Habit",
      priorityClass: "priority-routine",
      icon: <FiBookOpen />,
      title: "Advance Assignment Scheduling",
      dataInsight: "Paced task milestones eliminate deadline crunch",
      advice: "Break major semester projects into incremental 3-day milestones to avoid last-minute cramming and maintain low academic anxiety.",
      actionTag: "✓ Milestone-based study planning",
    });
  }

  // Sort by priority and return strictly top 2–3
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.slice(0, 3);
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
