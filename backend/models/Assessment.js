const mongoose = require("mongoose");

/**
 * Sub-schema for the 16 responses submitted in the student assessment form.
 * Matches exact feature names expected by the ML model in ml/predict.py
 */
const answersSchema = new mongoose.Schema(
  {
    age: {
      type: Number,
      required: [true, "Age is required."],
      min: [15, "Age must be at least 15."],
      max: [100, "Age cannot exceed 100."],
    },
    gender: {
      type: String,
      required: [true, "Gender is required."],
      enum: {
        values: ["Male", "Female"],
        message: "Gender must be either 'Male' or 'Female'.",
      },
      trim: true,
    },
    academic_year: {
      type: Number,
      required: [true, "Academic year is required."],
      min: [1, "Academic year must be at least 1."],
      max: [10, "Academic year cannot exceed 10."],
    },
    study_hours_per_day: {
      type: Number,
      required: [true, "Study hours per day is required."],
      min: [0, "Study hours cannot be negative."],
      max: [24, "Study hours cannot exceed 24 hours per day."],
    },
    exam_pressure: {
      type: Number,
      required: [true, "Exam pressure is required."],
      min: [1, "Exam pressure must be between 1 and 10."],
      max: [10, "Exam pressure must be between 1 and 10."],
    },
    academic_performance: {
      type: Number,
      required: [true, "Academic performance is required."],
      min: [0, "Academic performance must be between 0 and 100."],
      max: [100, "Academic performance must be between 0 and 100."],
    },
    stress_level: {
      type: Number,
      required: [true, "Stress level is required."],
      min: [0, "Stress level must be between 0 and 10."],
      max: [10, "Stress level must be between 0 and 10."],
    },
    anxiety_score: {
      type: Number,
      required: [true, "Anxiety score is required."],
      min: [0, "Anxiety score cannot be negative."],
      max: [30, "Anxiety score cannot exceed 30."],
    },
    depression_score: {
      type: Number,
      required: [true, "Depression score is required."],
      min: [0, "Depression score cannot be negative."],
      max: [30, "Depression score cannot exceed 30."],
    },
    sleep_hours: {
      type: Number,
      required: [true, "Sleep hours is required."],
      min: [0, "Sleep hours cannot be negative."],
      max: [24, "Sleep hours cannot exceed 24."],
    },
    physical_activity: {
      type: Number,
      required: [true, "Physical activity score is required."],
      min: [0, "Physical activity score cannot be negative."],
      max: [10, "Physical activity score cannot exceed 10."],
    },
    social_support: {
      type: Number,
      required: [true, "Social support score is required."],
      min: [0, "Social support score cannot be negative."],
      max: [10, "Social support score cannot exceed 10."],
    },
    screen_time: {
      type: Number,
      required: [true, "Screen time is required."],
      min: [0, "Screen time cannot be negative."],
      max: [24, "Screen time cannot exceed 24 hours."],
    },
    internet_usage: {
      type: Number,
      required: [true, "Internet usage is required."],
      min: [0, "Internet usage cannot be negative."],
      max: [24, "Internet usage cannot exceed 24 hours."],
    },
    financial_stress: {
      type: Number,
      required: [true, "Financial stress is required."],
      min: [0, "Financial stress must be between 0 and 10."],
      max: [10, "Financial stress must be between 0 and 10."],
    },
    family_expectation: {
      type: Number,
      required: [true, "Family expectation is required."],
      min: [0, "Family expectation must be between 0 and 10."],
      max: [10, "Family expectation must be between 0 and 10."],
    },
  },
  { _id: false }
);

/**
 * Main Assessment Schema
 * Allows each student to maintain multiple assessment history records over time.
 */
const assessmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required."],
      index: true, // Non-unique index: a student can have multiple assessments
    },
    answers: {
      type: answersSchema,
      required: [true, "Assessment responses are required."],
    },
    burnoutLevel: {
      type: String,
      required: [true, "Burnout level prediction is required."],
      enum: {
        values: ["Low", "Medium", "High"],
        message: "Burnout level must be 'Low', 'Medium', or 'High'.",
      },
      trim: true,
    },
    recommendations: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries of a user's assessments ordered by latest date
assessmentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Assessment", assessmentSchema);
