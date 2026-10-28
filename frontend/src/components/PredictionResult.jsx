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
      "Your assessment indicates healthy balance between your academic workload, sleep duration, and emotional wellbeing. Continue practicing your current routines.",
  },
  Medium: {
    statusLabel: "Moderate Burnout Risk",
    shortLabel: "Moderate Risk",
    badgeClass: "risk-pill-medium",
    cardClass: "risk-card-medium",
    icon: <FiAlertTriangle />,
    spectrumIndex: 1,
    explanation:
      "Your responses show elevated academic pressure or lifestyle fatigue. Introducing timely rest pauses and pacing your study load will prevent exhaustion.",
  },
  High: {
    statusLabel: "High Burnout Risk",
    shortLabel: "High Risk",
    badgeClass: "risk-pill-high",
    cardClass: "risk-card-high",
    icon: <FiAlertCircle />,
    spectrumIndex: 2,
    explanation:
      "Your assessment highlights significant academic stress, sleep disruption, or cognitive strain. Taking proactive self-care steps and seeking campus support is strongly recommended.",
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
 * Builds personalized, evidence-based recommendations tailored directly to
 * the student's actual responses across sleep, study, stress, and lifestyle.
 */
function buildPersonalizedRecommendations(rawAnswers, riskKey, backendRecs) {
  const cards = [];

  const studyHours = Number(rawAnswers.study_hours_per_day);
  const examPressure = Number(rawAnswers.exam_pressure);
  const sleepHours = Number(rawAnswers.sleep_hours);
  const stressLevel = Number(rawAnswers.stress_level);
  const anxietyScore = Number(rawAnswers.anxiety_score);
  const screenTime = Number(rawAnswers.screen_time);
  const socialSupport = Number(rawAnswers.social_support);
  const physicalActivity = Number(rawAnswers.physical_activity);

  // 1. Sleep Rest Card
  if (!isNaN(sleepHours) && sleepHours < 6.5) {
    cards.push({
      category: "Sleep Recovery",
      icon: <FiMoon />,
      title: "Prioritize Nightly Sleep",
      text: `You reported ${sleepHours} hrs of sleep. Aiming for 7–8 hours will substantially restore memory retention and lower cortisol.`,
    });
  } else if (!isNaN(sleepHours)) {
    cards.push({
      category: "Rest Routine",
      icon: <FiMoon />,
      title: "Maintain Sleep Rhythm",
      text: `Your current rest duration (${sleepHours} hrs) is healthy. Keeping regular bedtime hours preserves sustained mental clarity.`,
    });
  }

  // 2. Academic Routine Card
  if ((!isNaN(studyHours) && studyHours > 7) || (!isNaN(examPressure) && examPressure >= 7)) {
    cards.push({
      category: "Academic Pace",
      icon: <FiBookOpen />,
      title: "Structure Focused Intervals",
      text: `With ${!isNaN(studyHours) ? studyHours + " study hrs/day" : "heavy workload"} and high exam pressure, insert a 10-minute break every 50 minutes.`,
    });
  } else {
    cards.push({
      category: "Study Balance",
      icon: <FiBookOpen />,
      title: "Consistent Weekly Planning",
      text: "Map assignments 4–5 days in advance to maintain steady pacing and eliminate high-stress cramming sessions.",
    });
  }

  // 3. Mental Decompression Card
  if ((!isNaN(stressLevel) && stressLevel >= 6) || (!isNaN(anxietyScore) && anxietyScore >= 5)) {
    cards.push({
      category: "Stress Management",
      icon: <FiHeart />,
      title: "Active Decompression",
      text: `Your stress rating is ${stressLevel}/10. Practice 5 minutes of box breathing or mindful walking between study blocks.`,
    });
  } else if (!isNaN(socialSupport) && socialSupport <= 4) {
    cards.push({
      category: "Peer Connection",
      icon: <FiUsers />,
      title: "Strengthen Peer Support",
      text: "Reaching out to study groups, friends, or advisors significantly dampens burnout and promotes academic resilience.",
    });
  } else {
    cards.push({
      category: "Mental Wellbeing",
      icon: <FiHeart />,
      title: "Mindful Downtime",
      text: "Schedule dedicated unplugged time each week for creative hobbies, relaxation, and physical revitalization.",
    });
  }

  // 4. Lifestyle / Digital Wellness Card
  if (!isNaN(screenTime) && screenTime >= 7) {
    cards.push({
      category: "Digital Wellness",
      icon: <FiMonitor />,
      title: "Digital Screen Boundaries",
      text: `You noted ${screenTime} daily screen hours. Step away from devices 45 minutes before sleep to facilitate restorative sleep cycles.`,
    });
  } else if (!isNaN(physicalActivity) && physicalActivity < 1) {
    cards.push({
      category: "Physical Activity",
      icon: <FiActivity />,
      title: "Daily Movement Breaks",
      text: "Adding 20 minutes of brisk walking or light stretching boosts cerebral blood flow and sharpens daily focus.",
    });
  }

  // If backend provided custom recommendations and we need fallback/additional cards
  if (cards.length < 3 && Array.isArray(backendRecs) && backendRecs.length > 0) {
    backendRecs.forEach((item) => {
      if (cards.length >= 3) return;
      const str = String(item).trim();
      let title = "Personal Suggestion";
      let text = str;
      if (str.includes(":")) {
        const parts = str.split(":");
        title = parts[0].trim();
        text = parts.slice(1).join(":").trim();
      }
      cards.push({
        category: "Recommendation",
        icon: <FiCompass />,
        title,
        text,
      });
    });
  }

  return cards.slice(0, 3);
}

function PredictionResult({
  assessmentResult,
  prediction,
  onReset,
  onGoDashboard,
  onGoHistory,
}) {
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

  return (
    <div className="prediction-dashboard fade-in">
      {/* 1. Header & Navigation Actions */}
      <div className="dashboard-top-bar">
        <div>
          <span className="result-kicker">Assessment Complete</span>
          <h2 className="result-main-heading">Burnout Risk Evaluation</h2>
          <div className="result-timestamp-line">
            <FiCalendar className="meta-icon" />
            <span>Evaluated on {dateDisplay}</span>
          </div>
        </div>

        {/* Unified, properly styled action buttons */}
        <div className="result-action-buttons">
          {onGoDashboard && (
            <button
              type="button"
              className="btn btn-primary btn-result-action"
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
              title="View Previous Assessments"
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

      {/* 2. Compact Primary Result Section */}
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

      {/* 3. Personalized Recommendations Grid */}
      <div className="result-section-wrapper">
        <div className="result-section-header">
          <div className="section-title-combo">
            <FiCompass className="section-header-icon" />
            <div>
              <h3 className="section-title">Personalized Recommendations</h3>
              <p className="section-subtitle">
                Targeted action points based on your specific academic and wellness factors.
              </p>
            </div>
          </div>
        </div>

        <div className="recommendation-cards-grid">
          {recommendationCards.map((card, idx) => (
            <div key={idx} className="rec-card">
              <div className="rec-card-top">
                <span className="rec-category-tag">{card.category}</span>
                <span className="rec-icon-badge">{card.icon}</span>
              </div>
              <h4 className="rec-card-title">{card.title}</h4>
              <p className="rec-card-body">{card.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Submitted Assessment Responses in 4 Organized Groups */}
      {Object.keys(rawAnswers).length > 0 && (
        <div className="result-section-wrapper">
          <div className="result-section-header">
            <div className="section-title-combo">
              <FiActivity className="section-header-icon" />
              <div>
                <h3 className="section-title">Submitted Assessment Responses</h3>
                <p className="section-subtitle">
                  Summary of your 16 recorded academic, lifestyle, and wellbeing indicators.
                </p>
              </div>
            </div>
          </div>

          <div className="responses-two-column-grid">
            {/* Group 1: Academic Life */}
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
                    {rawAnswers.study_hours_per_day !== undefined
                      ? `${rawAnswers.study_hours_per_day} hrs/day`
                      : "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Exam Pressure</span>
                  <span className="data-value-pill">
                    {rawAnswers.exam_pressure !== undefined
                      ? `${rawAnswers.exam_pressure} / 10`
                      : "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Academic Performance</span>
                  <span className="data-value-pill">
                    {rawAnswers.academic_performance !== undefined
                      ? `${rawAnswers.academic_performance}%`
                      : "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Family Expectation</span>
                  <span className="data-value-pill">
                    {rawAnswers.family_expectation !== undefined
                      ? `${rawAnswers.family_expectation} / 10`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Group 2: Mental Wellness */}
            <div className="response-group-card">
              <div className="group-card-header">
                <span className="group-icon-badge">
                  <FiHeart />
                </span>
                <span className="group-heading">Mental Wellness</span>
              </div>
              <div className="group-items-list">
                <div className="data-row">
                  <span className="data-label">Perceived Stress Level</span>
                  <span className="data-value-pill">
                    {rawAnswers.stress_level !== undefined
                      ? `${rawAnswers.stress_level} / 10`
                      : "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Anxiety Score</span>
                  <span className="data-value-pill">
                    {rawAnswers.anxiety_score !== undefined
                      ? `${rawAnswers.anxiety_score} / 9.11`
                      : "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Depression Score</span>
                  <span className="data-value-pill">
                    {rawAnswers.depression_score !== undefined
                      ? `${rawAnswers.depression_score} / 7.74`
                      : "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Social Support</span>
                  <span className="data-value-pill">
                    {rawAnswers.social_support !== undefined
                      ? `${rawAnswers.social_support} / 10`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Group 3: Daily Lifestyle */}
            <div className="response-group-card">
              <div className="group-card-header">
                <span className="group-icon-badge">
                  <FiClock />
                </span>
                <span className="group-heading">Daily Lifestyle</span>
              </div>
              <div className="group-items-list">
                <div className="data-row">
                  <span className="data-label">Sleep Duration</span>
                  <span className="data-value-pill">
                    {rawAnswers.sleep_hours !== undefined
                      ? `${rawAnswers.sleep_hours} hrs/night`
                      : "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Physical Activity</span>
                  <span className="data-value-pill">
                    {rawAnswers.physical_activity !== undefined
                      ? `${rawAnswers.physical_activity} hrs/day`
                      : "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Daily Screen Time</span>
                  <span className="data-value-pill">
                    {rawAnswers.screen_time !== undefined
                      ? `${rawAnswers.screen_time} hrs/day`
                      : "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Internet Usage</span>
                  <span className="data-value-pill">
                    {rawAnswers.internet_usage !== undefined
                      ? `${rawAnswers.internet_usage} hrs/day`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Group 4: Personal Wellbeing */}
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
                    {rawAnswers.age !== undefined
                      ? `${rawAnswers.age} yrs`
                      : "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Identified Gender</span>
                  <span className="data-value-pill">
                    {rawAnswers.gender || "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Academic Year</span>
                  <span className="data-value-pill">
                    {rawAnswers.academic_year !== undefined
                      ? `Year ${rawAnswers.academic_year}`
                      : "—"}
                  </span>
                </div>
                <div className="data-row">
                  <span className="data-label">Financial Stress</span>
                  <span className="data-value-pill">
                    {rawAnswers.financial_stress !== undefined
                      ? `${rawAnswers.financial_stress} / 10`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PredictionResult;
