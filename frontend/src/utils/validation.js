// Validate a single step
export const validateStep = (step, formData) => {
  const stepErrors = {};

  // STEP 1: Basic Information
  if (step === 1) {
    // Age
    if (
      formData.age === "" ||
      Number(formData.age) < 17 ||
      Number(formData.age) > 29
    ) {
      stepErrors.age = "Age must be between 17 and 29.";
    }

    // Gender
    if (!formData.gender) {
      stepErrors.gender = "Please select your gender.";
    }

    // Academic Year
    if (
      formData.academic_year === "" ||
      Number(formData.academic_year) < 1 ||
      Number(formData.academic_year) > 4
    ) {
      stepErrors.academic_year = "Academic year must be between 1 and 4.";
    }
  }

  // STEP 2: Academic Life
  else if (step === 2) {
    // Study Hours
    if (
      formData.study_hours_per_day === "" ||
      Number(formData.study_hours_per_day) < 0 ||
      Number(formData.study_hours_per_day) > 13.91
    ) {
      stepErrors.study_hours_per_day =
        "Study hours must be between 0 and 13.91 hours per day.";
    }

    // Exam Pressure
    if (
      formData.exam_pressure === "" ||
      Number(formData.exam_pressure) < 1 ||
      Number(formData.exam_pressure) > 10
    ) {
      stepErrors.exam_pressure = "Exam pressure must be between 1 and 10.";
    }

    // Academic Performance
    if (
      formData.academic_performance === "" ||
      Number(formData.academic_performance) < 48.35 ||
      Number(formData.academic_performance) > 97.25
    ) {
      stepErrors.academic_performance =
        "Academic performance must be between 48.35% and 97.25%.";
    }

    // Family Expectation
    if (
      formData.family_expectation === "" ||
      Number(formData.family_expectation) < 0 ||
      Number(formData.family_expectation) > 10
    ) {
      stepErrors.family_expectation =
        "Family expectation must be between 0 and 10.";
    }
  }

  // STEP 3: Mental Wellness
  else if (step === 3) {
    // Stress Level
    if (
      formData.stress_level === "" ||
      Number(formData.stress_level) < 0 ||
      Number(formData.stress_level) > 10
    ) {
      stepErrors.stress_level = "Stress level must be between 0 and 10.";
    }

    // Anxiety Score
    if (
      formData.anxiety_score === "" ||
      Number(formData.anxiety_score) < 0 ||
      Number(formData.anxiety_score) > 9.11
    ) {
      stepErrors.anxiety_score = "Anxiety score must be between 0 and 9.11.";
    }

    // Depression Score
    if (
      formData.depression_score === "" ||
      Number(formData.depression_score) < 0 ||
      Number(formData.depression_score) > 7.74
    ) {
      stepErrors.depression_score =
        "Depression score must be between 0 and 7.74.";
    }

    // Social Support
    if (
      formData.social_support === "" ||
      Number(formData.social_support) < 0 ||
      Number(formData.social_support) > 10
    ) {
      stepErrors.social_support = "Social support must be between 0 and 10.";
    }
  }

  // STEP 4: Daily Lifestyle
  else if (step === 4) {
    // Sleep Hours
    if (
      formData.sleep_hours === "" ||
      Number(formData.sleep_hours) < 3 ||
      Number(formData.sleep_hours) > 10
    ) {
      stepErrors.sleep_hours =
        "Sleep hours must be between 3 and 10 hours per day.";
    }

    // Physical Activity
    if (
      formData.physical_activity === "" ||
      Number(formData.physical_activity) < 0 ||
      Number(formData.physical_activity) > 7
    ) {
      stepErrors.physical_activity =
        "Physical activity must be between 0 and 7 hours per day.";
    }

    // Screen Time
    if (
      formData.screen_time === "" ||
      Number(formData.screen_time) < 1 ||
      Number(formData.screen_time) > 12
    ) {
      stepErrors.screen_time =
        "Screen time must be between 1 and 12 hours per day.";
    }

    // Internet Usage
    if (
      formData.internet_usage === "" ||
      Number(formData.internet_usage) < 1 ||
      Number(formData.internet_usage) > 13.78
    ) {
      stepErrors.internet_usage =
        "Internet usage must be between 1 and 13.78 hours per day.";
    }
  }

  // STEP 5: Personal Wellbeing
  else if (step === 5) {
    // Financial Stress
    if (
      formData.financial_stress === "" ||
      Number(formData.financial_stress) < 0 ||
      Number(formData.financial_stress) > 10
    ) {
      stepErrors.financial_stress =
        "Financial stress must be between 0 and 10.";
    }
  }

  return stepErrors;
};

// Validate the complete form on final submission
export const validateForm = (formData) => {
  // Step 1
  const step1Errors = validateStep(1, formData);
  if (Object.keys(step1Errors).length > 0) {
    return Object.values(step1Errors)[0];
  }

  // Step 2
  const step2Errors = validateStep(2, formData);
  if (Object.keys(step2Errors).length > 0) {
    return Object.values(step2Errors)[0];
  }

  // Step 3
  const step3Errors = validateStep(3, formData);
  if (Object.keys(step3Errors).length > 0) {
    return Object.values(step3Errors)[0];
  }

  // Step 4
  const step4Errors = validateStep(4, formData);
  if (Object.keys(step4Errors).length > 0) {
    return Object.values(step4Errors)[0];
  }

  // Step 5
  const step5Errors = validateStep(5, formData);
  if (Object.keys(step5Errors).length > 0) {
    return Object.values(step5Errors)[0];
  }

  // Everything is valid
  return null;
};
