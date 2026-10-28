const express = require("express");
const {
  saveAssessment,
  getStudentAssessments,
  getAssessmentById,
} = require("../controllers/assessmentController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

// All assessment routes require valid JWT authentication
router.use(authenticateToken);

// POST /api/assessments - Evaluates answers with ML model and saves record in MongoDB
router.post("/", saveAssessment);

// GET /api/assessments - Retrieves assessment history for the authenticated student
router.get("/", getStudentAssessments);

// GET /api/assessments/:id - Retrieves single assessment detail for authenticated student
router.get("/:id", getAssessmentById);

module.exports = router;
