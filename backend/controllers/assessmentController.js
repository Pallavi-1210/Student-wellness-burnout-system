const Assessment = require("../models/Assessment");
const { runModelPrediction, REQUIRED_FIELDS } = require("./predictionController");

/**
 * Returns evidence-based wellness recommendations based on predicted burnout level
 */
const getDefaultRecommendations = (burnoutLevel) => {
  switch (burnoutLevel) {
    case "High":
      return [
        "Prioritize Immediate Rest: Step back from non-essential tasks and focus on restoring sleep and physical energy.",
        "Speak with Student Counseling: Reach out to campus counselors, academic advisors, or healthcare professionals for support.",
        "Adjust Workload Expectations: Discuss workload challenges or deadline flexibility with your course instructors.",
      ];
    case "Medium":
      return [
        "Pace Your Daily Workload: Create a structured weekly study plan to avoid last-minute cramming before exams.",
        "Set Evening Boundaries: Avoid studying late into the night and ensure you have time to unwind before sleep.",
        "Seek Academic Guidance: Talk to professors or study partners early if course concepts start feeling overwhelming.",
      ];
    case "Low":
    default:
      return [
        "Maintain Your Study Routine: Keep breaking study sessions into manageable blocks and take regular short breaks.",
        "Protect Your Sleep Schedule: Continue aiming for consistent nightly rest to preserve daily energy and focus.",
        "Stay Connected: Keep up regular interactions with classmates and friends for ongoing social support.",
      ];
  }
};

/**
 * Controller: Save a student's assessment answers & ML prediction
 * Route: POST /api/assessments
 * Security: Authenticated via JWT (req.user populated by authenticateToken)
 */
exports.saveAssessment = async (req, res) => {
  try {
    // 1. Strictly obtain student ID from verified JWT (never trust body-supplied ID)
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid student session.",
      });
    }

    const studentId = req.user._id;

    // 2. Extract answers (support both direct body or nested { answers: { ... } })
    const incomingData = req.body.answers && typeof req.body.answers === "object"
      ? req.body.answers
      : req.body;

    if (!incomingData || typeof incomingData !== "object") {
      return res.status(400).json({
        success: false,
        error: "Invalid request: assessment answers are required in JSON body.",
      });
    }

    // 3. Prepare answers object containing all 16 required fields
    const answers = {};
    for (const field of REQUIRED_FIELDS) {
      if (
        incomingData[field] === undefined ||
        incomingData[field] === null ||
        incomingData[field] === ""
      ) {
        return res.status(400).json({
          success: false,
          error: `Missing required assessment field: '${field}'.`,
        });
      }

      if (field === "gender") {
        const cleanGender = String(incomingData.gender).trim();
        const formattedGender = cleanGender.charAt(0).toUpperCase() + cleanGender.slice(1).toLowerCase();
        if (formattedGender !== "Male" && formattedGender !== "Female") {
          return res.status(400).json({
            success: false,
            error: "Gender must be either 'Male' or 'Female'.",
          });
        }
        answers.gender = formattedGender;
      } else {
        const numVal = Number(incomingData[field]);
        if (isNaN(numVal)) {
          return res.status(400).json({
            success: false,
            error: `Field '${field}' must be a valid number.`,
          });
        }
        answers[field] = numVal;
      }
    }

    // 4. Run Python ML model inference using existing flow
    const riskLevel = await runModelPrediction(answers);

    // 5. Build personalized recommendations
    let recommendations = [];
    if (Array.isArray(req.body.recommendations) && req.body.recommendations.length > 0) {
      recommendations = req.body.recommendations.map((r) => String(r).trim());
    } else {
      recommendations = getDefaultRecommendations(riskLevel);
    }

    // 6. Save new Assessment document in MongoDB Atlas
    const assessment = await Assessment.create({
      user: studentId,
      answers,
      burnoutLevel: riskLevel,
      recommendations,
    });

    // 7. Return saved assessment result
    return res.status(201).json({
      success: true,
      message: "Assessment evaluated and saved successfully.",
      assessmentId: assessment._id,
      burnoutLevel: assessment.burnoutLevel,
      prediction: assessment.burnoutLevel,
      risk_level: assessment.burnoutLevel,
      recommendations: assessment.recommendations,
      createdAt: assessment.createdAt,
      assessment: {
        id: assessment._id,
        user: assessment.user,
        burnoutLevel: assessment.burnoutLevel,
        recommendations: assessment.recommendations,
        answers: assessment.answers,
        createdAt: assessment.createdAt,
      },
    });
  } catch (err) {
    console.error("Assessment Controller - saveAssessment Error:", err.message);

    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || "Failed to process and save assessment.",
    });
  }
};

/**
 * Controller: Get all past assessment records for the authenticated student
 * Route: GET /api/assessments
 * Security: Authenticated via JWT
 */
exports.getStudentAssessments = async (req, res) => {
  try {
    const studentId = req.user._id;

    const assessments = await Assessment.find({ user: studentId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: assessments.length,
      assessments,
    });
  } catch (err) {
    console.error("Assessment Controller - getStudentAssessments Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Unable to retrieve assessment history. Please try again later.",
    });
  }
};

/**
 * Controller: Get a single assessment by ID (strictly scoped to the authenticated student)
 * Route: GET /api/assessments/:id
 * Security: Authenticated via JWT
 */
exports.getAssessmentById = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { id } = req.params;

    const assessment = await Assessment.findOne({
      _id: id,
      user: studentId,
    }).lean();

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: "Assessment not found or access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      assessment,
    });
  } catch (err) {
    console.error("Assessment Controller - getAssessmentById Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Unable to retrieve assessment details.",
    });
  }
};
