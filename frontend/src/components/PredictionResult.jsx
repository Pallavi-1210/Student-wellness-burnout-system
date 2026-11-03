import { useState } from "react";
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiRefreshCw,
  FiBookOpen,
  FiHeart,
  FiShield,
  FiActivity,
  FiBarChart2,
  FiList,
  FiClock,
  FiCalendar,
  FiMoon,
  FiUsers,
  FiMonitor,
  FiCompass,
  FiCheck,
  FiArrowLeft,
  FiArrowRight,
  FiDollarSign,
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
    explanation:
      "Your assessment indicates a healthy balance between your academic workload, sleep duration, and emotional wellbeing. Continue practicing your current routines to maintain your vitality.",
  },
  Medium: {
    statusLabel: "Moderate Burnout Risk",
    shortLabel: "Moderate Risk",
    badgeClass: "risk-pill-medium",
    cardClass: "risk-card-medium",
    icon: <FiAlertTriangle />,
    spectrumIndex: 1,
    explanation:
      "Your responses show moderate academic pressure or early lifestyle fatigue. Introducing timely rest pauses and pacing your study load will prevent exhaustion from developing.",
  },
  High: {
    statusLabel: "High Burnout Risk",
    shortLabel: "High Risk",
    badgeClass: "risk-pill-high",
    cardClass: "risk-card-high",
    icon: <FiAlertCircle />,
    spectrumIndex: 2,
    explanation:
      "Your assessment highlights significant academic stress, sleep disruption, or persistent cognitive strain. Taking proactive self-care steps and seeking campus support is strongly recommended.",
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

/**
 * Builds comprehensive personalized recommendations tailored directly to
 * the student's actual answers across sleep, study, stress, activity, screen, and personal factors.
 */
function buildPersonalizedRecommendations(rawAnswers, riskKey, backendRecs) {
  const cards = [];

  const studyHours = Number(rawAnswers.study_hours_per_day);
  const examPressure = Number(rawAnswers.exam_pressure);
  const sleepHours = Number(rawAnswers.sleep_hours);
  const stressLevel = Number(rawAnswers.stress_level);
  const anxietyScore = Number(rawAnswers.anxiety_score);
  const depressionScore = Number(rawAnswers.depression_score);
  const screenTime = Number(rawAnswers.screen_time);
  const internetUsage = Number(rawAnswers.internet_usage);
  const socialSupport = Number(rawAnswers.social_support);
  const physicalActivity = Number(rawAnswers.physical_activity);
  const financialStress = Number(rawAnswers.financial_stress);
  const familyExpectation = Number(rawAnswers.family_expectation);

  // 1. Sleep & Recovery
  if (!isNaN(sleepHours) && sleepHours < 6.5) {
    cards.push({
      category: "Sleep Recovery",
      icon: <FiMoon />,
      title: "Prioritize Nightly Rest",
      highlight: `${sleepHours} hrs/night reported`,
      text: `You reported ${sleepHours} hours of sleep per night. Sleep debt significantly reduces memory retention and accelerates burnout. Aim for 7–8 hours of consistent nightly rest with a 30-minute screen-free wind-down buffer before bed.`,
    });
  } else if (!isNaN(sleepHours)) {
    cards.push({
      category: "Rest Routine",
      icon: <FiMoon />,
      title: "Maintain Sleep Schedule",
      highlight: `${sleepHours} hrs/night reported (Healthy)`,
      text: `Your current rest duration (${sleepHours} hours) is within a restorative range. Keep regular bedtime and wake-up hours, even on weekends, to anchor your natural circadian rhythm.`,
    });
  }

  // 2. Study Routine & Academic Pacing
  if ((!isNaN(studyHours) && studyHours > 7) || (!isNaN(examPressure) && examPressure >= 7)) {
    cards.push({
      category: "Academic Pace",
      icon: <FiBookOpen />,
      title: "Adopt 50/10 Study Intervals",
      highlight: `${!isNaN(studyHours) ? studyHours + " study hrs/day" : "Intense workload"} • Exam pressure: ${examPressure}/10`,
      text: `Extended study blocks without pause trigger cognitive exhaustion. Implement the Pomodoro technique: study with intense focus for 50 minutes, then take a mandatory 10-minute mental break.`,
    });
  } else {
    cards.push({
      category: "Study Balance",
      icon: <FiBookOpen />,
      title: "Proactive Weekly Workload Mapping",
      highlight: `${!isNaN(studyHours) ? studyHours + " study hrs/day" : "Balanced load"} • Exam pressure: ${examPressure || 0}/10`,
      text: "Plan your assignments and revision milestones 4–5 days in advance. Consistent daily micro-sessions prevent eleventh-hour cramming and sustain steady academic composure.",
    });
  }

  // 3. Stress Management & Mental Well-being
  if ((!isNaN(stressLevel) && stressLevel >= 6) || (!isNaN(anxietyScore) && anxietyScore >= 5) || (!isNaN(depressionScore) && depressionScore >= 4)) {
    cards.push({
      category: "Stress Management",
      icon: <FiHeart />,
      title: "Active Stress Decompression",
      highlight: `Stress: ${stressLevel}/10 • Anxiety: ${anxietyScore}/9.11`,
      text: `Your psychological indicators reflect heightened tension. Practice 5–10 minutes of box breathing or progressive muscle relaxation between classes, and consider connecting with student wellness counseling for guided support.`,
    });
  } else {
    cards.push({
      category: "Mental Wellbeing",
      icon: <FiHeart />,
      title: "Mindful Downtime & Recharge",
      highlight: `Stress: ${stressLevel || 0}/10 (Managed)`,
      text: "Schedule at least 45 minutes of dedicated daily unplugged leisure for creative hobbies, social interactions, or quiet reflection to maintain emotional equilibrium.",
    });
  }

  // 4. Physical Activity & Vitality
  if (!isNaN(physicalActivity) && physicalActivity < 1) {
    cards.push({
      category: "Physical Activity",
      icon: <FiActivity />,
      title: "Daily Movement Breaks",
      highlight: `${physicalActivity} hrs/day activity recorded`,
      text: "Prolonged sitting restricts cerebral circulation and amplifies physical fatigue. Incorporate a 15–20 minute brisk outdoor walk or gentle stretching between lectures to release dopamine and refresh mental focus.",
    });
  } else if (!isNaN(physicalActivity)) {
    cards.push({
      category: "Physical Activity",
      icon: <FiActivity />,
      title: "Sustain Active Vitality",
      highlight: `${physicalActivity} hrs/day activity (Active)`,
      text: "Your daily movement routine is a strong protective shield against academic stress. Continue pairing regular exercise with proper hydration and balanced nutrition.",
    });
  }

  // 5. Screen Time & Digital Wellness
  if ((!isNaN(screenTime) && screenTime >= 7) || (!isNaN(internetUsage) && internetUsage >= 8)) {
    cards.push({
      category: "Digital Wellness",
      icon: <FiMonitor />,
      title: "Establish Digital Screen Curfews",
      highlight: `${screenTime} hrs screen • ${internetUsage} hrs online`,
      text: `Excessive digital exposure increases cognitive overload and delays sleep onset. Disable non-critical app notifications during study sessions and avoid bright displays 45 minutes before bedtime.`,
    });
  } else {
    cards.push({
      category: "Digital Wellness",
      icon: <FiMonitor />,
      title: "Mindful Device Consumption",
      highlight: `${screenTime || 0} hrs screen/day (Balanced)`,
      text: "Your screen usage is well balanced. Continue maintaining device-free boundaries during meal times and evening wind-down routines.",
    });
  }

  // 6. Work-Life, Social & Financial Support
  if ((!isNaN(financialStress) && financialStress >= 6) || (!isNaN(familyExpectation) && familyExpectation >= 7)) {
    cards.push({
      category: "External Pressures",
      icon: <FiDollarSign />,
      title: "Address Financial & Family Demands",
      highlight: `Financial stress: ${financialStress}/10 • Family expectation: ${familyExpectation}/10`,
      text: "High external expectations and financial strain amplify burnout susceptibility. Explore campus student aid, emergency grants, or work-study programs, and communicate openly with mentors regarding realistic academic milestones.",
    });
  } else if (!isNaN(socialSupport) && socialSupport <= 4) {
    cards.push({
      category: "Social Support",
      icon: <FiUsers />,
      title: "Strengthen Peer & Campus Bonds",
      highlight: `Social support: ${socialSupport}/10`,
      text: "Studying in isolation exacerbates feeling overwhelmed. Engage with study groups, campus societies, or trusted friends to share challenges and build a supportive community.",
    });
  } else {
    cards.push({
      category: "Support Network",
      icon: <FiUsers />,
      title: "Leverage Your Support Network",
      highlight: `Social support: ${socialSupport || 0}/10 (Solid)`,
      text: "You have a solid social support circle. Leaning on friends, family, and faculty during demanding exam periods is a proven resilience factor against burnout.",
    });
  }

  // If backend provided custom recommendations, append them
  if (Array.isArray(backendRecs) && backendRecs.length > 0) {
    backendRecs.forEach((item) => {
      const str = String(item).trim();
      let title = "Campus Resource";
      let text = str;
      if (str.includes(":")) {
        const parts = str.split(":");
        title = parts[0].trim();
        text = parts.slice(1).join(":").trim();
      }
      cards.push({
        category: "Guidance",
        icon: <FiCompass />,
        title,
        highlight: "Personalized Recommendation",
        text,
      });
    });
  }

  return cards;
}

function PredictionResult({
  assessmentResult,
  prediction,
  onReset,
  onGoDashboard,
  onGoHistory,
}) {
  // Navigation View State: 'result' | 'recommendations' | 'summary'
  const [activeView, setActiveView] = useState("result");

  const resultData = assessmentResult || {};
  const riskKey = normalizeRiskLevel(
    resultData.burnoutLevel || resultData.prediction || prediction
  );
  const config = RISK_CONFIG[riskKey] || RISK_CONFIG.Low;

  const rawAnswers = resultData.answers || resultData.formData || {};
  const dateDisplay = formatAssessmentDate(resultData.createdAt);

  const recommendationCards = buildPersonalizedRecommendations(
    rawAnswers,
    riskKey,
    resultData.recommendations
  );

  // ============================================================================
  // VIEW 1: RISK RESULT OVERVIEW PAGE
  // Displays only the prominent risk result, explanation, and two primary buttons
  // ============================================================================
  if (activeView === "result") {
    return (
      <div className="prediction-dashboard fade-in">
        {/* Top Header Bar */}
        <div className="dashboard-top-bar">
          <div>
            <span className="result-kicker">Assessment Complete</span>
            <h2 className="result-main-heading">Burnout Risk Evaluation</h2>
            <div className="result-timestamp-line">
              <FiCalendar className="meta-icon" />
              <span>Evaluated on {dateDisplay}</span>
            </div>
          </div>

          <div className="result-action-buttons">
            {onGoDashboard && (
              <button
                type="button"
                className="btn btn-secondary btn-result-action"
                onClick={onGoDashboard}
                title="Open Student Dashboard"
              >
                <FiBarChart2 /> Dashboard
              </button>
            )}
            {onGoHistory && (
              <button
                type="button"
                className="btn btn-secondary btn-result-action"
                onClick={onGoHistory}
                title="View Past Assessments"
              >
                <FiList /> View History
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-result-action"
              onClick={onReset}
              title="Take a New Assessment"
            >
              <FiRefreshCw /> Retake Assessment
            </button>
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

          {/* Visual 3-Stage Risk Spectrum Meter */}
          <div className="compact-risk-spectrum">
            <div className="spectrum-label-row">
              <span>Burnout Risk Spectrum</span>
              <strong className="spectrum-current-tag">
                Predicted: {config.statusLabel}
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

        {/* Two Prominent Action Cards/Buttons to Navigate to Separate Pages */}
        <div className="post-assessment-action-section">
          <div className="action-section-header">
            <h3 className="action-section-title">Explore Your Assessment Insights</h3>
            <p className="action-section-subtitle">
              Choose an option below to view tailored wellness guidance or review your recorded assessment metrics.
            </p>
          </div>

          <div className="post-assessment-buttons-grid">
            {/* Button 1: Personalized Recommendations */}
            <button
              type="button"
              className="post-nav-card card-btn-recommendations"
              onClick={() => setActiveView("recommendations")}
            >
              <div className="post-nav-card-icon-wrap icon-recs">
                <FiCompass />
              </div>
              <div className="post-nav-card-content">
                <div className="post-nav-badge">Tailored Action Plan</div>
                <h4 className="post-nav-card-title">Personalized Recommendations</h4>
                <p className="post-nav-card-desc">
                  Actionable suggestions covering sleep recovery, study routines, stress management, physical activity, and wellness.
                </p>
                <div className="post-nav-cta">
                  <span>View Recommendations</span>
                  <FiArrowRight className="cta-arrow" />
                </div>
              </div>
            </button>

            {/* Button 2: Assessment Summary */}
            <button
              type="button"
              className="post-nav-card card-btn-summary"
              onClick={() => setActiveView("summary")}
            >
              <div className="post-nav-card-icon-wrap icon-summary">
                <FiActivity />
              </div>
              <div className="post-nav-card-content">
                <div className="post-nav-badge badge-summary">Response Audit</div>
                <h4 className="post-nav-card-title">Assessment Summary</h4>
                <p className="post-nav-card-desc">
                  Review all 16 self-reported parameters including sleep, study hours, pressure, screen time, and financial stress.
                </p>
                <div className="post-nav-cta">
                  <span>View Assessment Summary</span>
                  <FiArrowRight className="cta-arrow" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: PERSONALIZED RECOMMENDATIONS SEPARATE PAGE
  // ============================================================================
  if (activeView === "recommendations") {
    return (
      <div className="prediction-dashboard recommendations-page fade-in">
        {/* Navigation Bar */}
        <div className="dashboard-top-bar">
          <div className="nav-back-group">
            <button
              type="button"
              className="btn btn-secondary btn-back-nav"
              onClick={() => setActiveView("result")}
              title="Return to Assessment Result"
            >
              <FiArrowLeft /> Back to Result
            </button>
            <div className="subpage-title-block">
              <span className="result-kicker">Personalized Action Plan</span>
              <h2 className="result-main-heading">Wellness Recommendations</h2>
              <div className="result-timestamp-line">
                <span>Tailored for your predicted </span>
                <span className={`risk-category-pill pill-sm ${config.badgeClass}`}>
                  <span className="pill-dot" /> {config.shortLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="result-action-buttons">
            <button
              type="button"
              className="btn btn-primary btn-result-action"
              onClick={() => setActiveView("summary")}
              title="Switch to Assessment Summary"
            >
              <FiList /> View Summary
            </button>
            {onGoDashboard && (
              <button
                type="button"
                className="btn btn-secondary btn-result-action"
                onClick={onGoDashboard}
              >
                <FiBarChart2 /> Dashboard
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-result-action"
              onClick={onReset}
            >
              <FiRefreshCw /> Retake
            </button>
          </div>
        </div>

        {/* Personalized Recommendations Grid */}
        <div className="recommendations-container">
          <div className="recs-intro-banner">
            <div className="intro-icon-circle">
              <FiCompass />
            </div>
            <div>
              <h3 className="intro-title">Evidence-Based Wellness Guidance</h3>
              <p className="intro-text">
                These targeted recommendations are personalized to your actual assessment factors,
                designed to prevent exhaustion, restore cognitive balance, and sustain academic success.
              </p>
            </div>
          </div>

          <div className="recommendations-full-grid">
            {recommendationCards.map((card, idx) => (
              <div key={idx} className="rec-card-enhanced">
                <div className="rec-card-top">
                  <span className="rec-category-tag">{card.category}</span>
                  <span className="rec-icon-badge">{card.icon}</span>
                </div>
                <h4 className="rec-card-title">{card.title}</h4>
                {card.highlight && (
                  <div className="rec-highlight-pill">{card.highlight}</div>
                )}
                <p className="rec-card-body">{card.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Page Navigation */}
        <div className="subpage-bottom-nav">
          <button
            type="button"
            className="btn btn-secondary btn-bottom-action"
            onClick={() => setActiveView("result")}
          >
            <FiArrowLeft /> Back to Risk Result
          </button>
          <div className="bottom-right-actions">
            <button
              type="button"
              className="btn btn-primary btn-bottom-action"
              onClick={() => setActiveView("summary")}
            >
              View Assessment Summary <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 3: ASSESSMENT SUMMARY SEPARATE PAGE
  // ============================================================================
  if (activeView === "summary") {
    return (
      <div className="prediction-dashboard summary-page fade-in">
        {/* Navigation Bar */}
        <div className="dashboard-top-bar">
          <div className="nav-back-group">
            <button
              type="button"
              className="btn btn-secondary btn-back-nav"
              onClick={() => setActiveView("result")}
              title="Return to Assessment Result"
            >
              <FiArrowLeft /> Back to Result
            </button>
            <div className="subpage-title-block">
              <span className="result-kicker">Submitted Responses</span>
              <h2 className="result-main-heading">Assessment Summary</h2>
              <div className="result-timestamp-line">
                <FiCalendar className="meta-icon" />
                <span>Recorded on {dateDisplay}</span>
                <span className="meta-divider">•</span>
                <span className={`risk-category-pill pill-sm ${config.badgeClass}`}>
                  <span className="pill-dot" /> {config.shortLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="result-action-buttons">
            <button
              type="button"
              className="btn btn-primary btn-result-action"
              onClick={() => setActiveView("recommendations")}
              title="Switch to Recommendations"
            >
              <FiCompass /> Recommendations
            </button>
            {onGoDashboard && (
              <button
                type="button"
                className="btn btn-secondary btn-result-action"
                onClick={onGoDashboard}
              >
                <FiBarChart2 /> Dashboard
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-result-action"
              onClick={onReset}
            >
              <FiRefreshCw /> Retake
            </button>
          </div>
        </div>

        {/* 16 Submitted Assessment Factors in 4 Organized Pillar Panels */}
        <div className="summary-pillars-container">
          <div className="summary-intro-banner">
            <div className="intro-icon-circle icon-summary">
              <FiActivity />
            </div>
            <div>
              <h3 className="intro-title">Complete 16-Factor Assessment Breakdown</h3>
              <p className="intro-text">
                Every factor below was submitted during your assessment and processed by the Random Forest ML model to evaluate your burnout risk.
              </p>
            </div>
          </div>

          <div className="summary-pillars-grid">
            {/* Pillar 1: Academic Life */}
            <div className="summary-pillar-card">
              <div className="pillar-header">
                <div className="pillar-icon-badge">
                  <FiBookOpen />
                </div>
                <div>
                  <h4 className="pillar-title">Academic Life</h4>
                  <span className="pillar-subtitle">Workload & performance metrics</span>
                </div>
              </div>
              <div className="pillar-items-list">
                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Daily Study Hours</span>
                    <span className="metric-caption">Self-study & lecture time</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.study_hours_per_day !== undefined
                      ? `${rawAnswers.study_hours_per_day} hrs/day`
                      : "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Exam Pressure</span>
                    <span className="metric-caption">Self-reported exam anxiety</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.exam_pressure !== undefined
                      ? `${rawAnswers.exam_pressure} / 10`
                      : "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Academic Performance</span>
                    <span className="metric-caption">Current grade / GPA equivalent</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.academic_performance !== undefined
                      ? `${rawAnswers.academic_performance}%`
                      : "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Family Expectation</span>
                    <span className="metric-caption">Perceived familial pressure</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.family_expectation !== undefined
                      ? `${rawAnswers.family_expectation} / 10`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Mental Wellness */}
            <div className="summary-pillar-card">
              <div className="pillar-header">
                <div className="pillar-icon-badge icon-heart">
                  <FiHeart />
                </div>
                <div>
                  <h4 className="pillar-title">Mental Wellness</h4>
                  <span className="pillar-subtitle">Psychological & social health</span>
                </div>
              </div>
              <div className="pillar-items-list">
                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Perceived Stress Level</span>
                    <span className="metric-caption">Overall psychological stress</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.stress_level !== undefined
                      ? `${rawAnswers.stress_level} / 10`
                      : "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Anxiety Score</span>
                    <span className="metric-caption">Standardized anxiety rating</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.anxiety_score !== undefined
                      ? `${rawAnswers.anxiety_score} / 9.11`
                      : "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Depression Score</span>
                    <span className="metric-caption">Standardized depressive index</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.depression_score !== undefined
                      ? `${rawAnswers.depression_score} / 7.74`
                      : "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Social Support</span>
                    <span className="metric-caption">Peer & family connection</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.social_support !== undefined
                      ? `${rawAnswers.social_support} / 10`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Daily Lifestyle */}
            <div className="summary-pillar-card">
              <div className="pillar-header">
                <div className="pillar-icon-badge icon-clock">
                  <FiClock />
                </div>
                <div>
                  <h4 className="pillar-title">Daily Lifestyle</h4>
                  <span className="pillar-subtitle">Rest, movement & digital habits</span>
                </div>
              </div>
              <div className="pillar-items-list">
                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Sleep Duration</span>
                    <span className="metric-caption">Nightly restorative sleep</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.sleep_hours !== undefined
                      ? `${rawAnswers.sleep_hours} hrs/night`
                      : "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Physical Activity</span>
                    <span className="metric-caption">Exercise & active movement</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.physical_activity !== undefined
                      ? `${rawAnswers.physical_activity} hrs/day`
                      : "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Daily Screen Time</span>
                    <span className="metric-caption">Total computer & phone usage</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.screen_time !== undefined
                      ? `${rawAnswers.screen_time} hrs/day`
                      : "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Internet Usage</span>
                    <span className="metric-caption">Daily connected browsing</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.internet_usage !== undefined
                      ? `${rawAnswers.internet_usage} hrs/day`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Pillar 4: Personal & Financial Factors */}
            <div className="summary-pillar-card">
              <div className="pillar-header">
                <div className="pillar-icon-badge icon-shield">
                  <FiShield />
                </div>
                <div>
                  <h4 className="pillar-title">Personal & Financial</h4>
                  <span className="pillar-subtitle">Demographics & living factors</span>
                </div>
              </div>
              <div className="pillar-items-list">
                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Student Age</span>
                    <span className="metric-caption">Current chronological age</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.age !== undefined
                      ? `${rawAnswers.age} yrs`
                      : "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Identified Gender</span>
                    <span className="metric-caption">Student reported gender</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.gender || "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Academic Year</span>
                    <span className="metric-caption">Program year level</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.academic_year !== undefined
                      ? `Year ${rawAnswers.academic_year}`
                      : "—"}
                  </span>
                </div>

                <div className="pillar-row">
                  <div className="metric-info">
                    <span className="metric-name">Financial Stress</span>
                    <span className="metric-caption">Tuition & living expense strain</span>
                  </div>
                  <span className="metric-value-pill">
                    {rawAnswers.financial_stress !== undefined
                      ? `${rawAnswers.financial_stress} / 10`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Page Navigation */}
        <div className="subpage-bottom-nav">
          <button
            type="button"
            className="btn btn-secondary btn-bottom-action"
            onClick={() => setActiveView("result")}
          >
            <FiArrowLeft /> Back to Risk Result
          </button>
          <div className="bottom-right-actions">
            <button
              type="button"
              className="btn btn-primary btn-bottom-action"
              onClick={() => setActiveView("recommendations")}
            >
              View Personalized Recommendations <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default PredictionResult;
