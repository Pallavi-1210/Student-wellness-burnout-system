import {
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiMoon,
  FiHeart,
  FiBookOpen,
  FiActivity,
  FiMonitor,
  FiDollarSign,
  FiUsers,
} from "react-icons/fi";

export function normalizeRiskLevel(prediction) {
  if (!prediction) return "Low";
  const raw =
    typeof prediction === "object"
      ? prediction.burnout_risk ||
        prediction.burnoutLevel ||
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

export const RISK_CONFIG = {
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

/**
 * Returns strictly 2–3 high-priority, concise recommendations tailored to actual responses.
 * Each recommendation card features a small icon, clear category, priority, data insight, and 1–2 lines of practical advice.
 */
export function getTopPersonalizedRecommendations(rawAnswers) {
  if (!rawAnswers || typeof rawAnswers !== "object") return [];

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
      advice:
        "Aim for 7–8 hours of consistent nightly rest. Power down electronic displays 45 minutes before sleep to restore focus and cognitive resilience.",
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
      advice:
        "Practice 5 minutes of mindful box breathing between study blocks. If stress feels persistent, reach out to campus student wellness counseling.",
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
      advice:
        "Prevent cognitive fatigue using the 50/10 rhythm: 50 minutes of focused academic work followed by an obligatory 10-minute screen-free break.",
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
      advice:
        "Take a 15–20 minute brisk outdoor walk between lectures or study sessions to stimulate cerebral circulation and relieve mental stagnation.",
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
      advice:
        "Apply the 20-20-20 rule during screen sessions (every 20 mins, look 20 feet away for 20 seconds) and disconnect 45 minutes before sleep.",
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
      advice:
        "Check campus emergency grant programs, food pantry access, and student financial advisory services to alleviate non-academic pressure.",
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
      advice:
        "Form or join a peer study group in your major. Sharing coursework challenges with peers significantly mitigates academic isolation.",
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
      advice:
        "Keep consistent wake and sleep timings throughout the week to protect your natural circadian rhythm and preserve high daily energy levels.",
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
      advice:
        "Reserve 30–45 minutes daily strictly for non-academic interests, creative hobbies, or leisure reading to keep your mind balanced.",
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
      advice:
        "Break major semester projects into incremental 3-day milestones to avoid last-minute cramming and maintain low academic anxiety.",
      actionTag: "✓ Milestone-based study planning",
    });
  }

  // Sort by priority and return strictly top 2–3
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.slice(0, 3);
}

