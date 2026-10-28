const path = require("path");
const fs = require("fs");
const { PythonShell } = require("python-shell");

const REQUIRED_FIELDS = [
  "age",
  "gender",
  "academic_year",
  "study_hours_per_day",
  "exam_pressure",
  "academic_performance",
  "stress_level",
  "anxiety_score",
  "depression_score",
  "sleep_hours",
  "physical_activity",
  "social_support",
  "screen_time",
  "internet_usage",
  "financial_stress",
  "family_expectation",
];

exports.REQUIRED_FIELDS = REQUIRED_FIELDS;

/**
 * Executes the Python ML Random Forest model prediction worker with given student data.
 * Returns the predicted risk level ('Low', 'Medium', or 'High').
 * Reusable across controllers without code duplication.
 */
exports.runModelPrediction = async (studentData) => {
  // 1. Basic validation of input data
  if (!studentData || typeof studentData !== "object") {
    const err = new Error("Invalid request: JSON data required.");
    err.statusCode = 400;
    throw err;
  }

  // 2. Validate all required fields
  for (const field of REQUIRED_FIELDS) {
    if (
      studentData[field] === undefined ||
      studentData[field] === null ||
      studentData[field] === ""
    ) {
      const err = new Error(`Missing required field: '${field}'.`);
      err.statusCode = 400;
      throw err;
    }
  }

  // 3. Resolve portable file paths
  const mlDir = path.resolve(__dirname, "../../ml");
  const scriptPath = mlDir;

  const winVenvPython = path.join(mlDir, "venv", "Scripts", "python.exe");
  const posixVenvPython = path.join(mlDir, "venv", "bin", "python");

  let pythonPath = process.env.PYTHON_PATH;
  if (!pythonPath) {
    if (fs.existsSync(winVenvPython)) {
      pythonPath = winVenvPython;
    } else if (fs.existsSync(posixVenvPython)) {
      pythonPath = posixVenvPython;
    } else {
      pythonPath = process.platform === "win32" ? "python" : "python3";
    }
  }

  const options = {
    pythonPath: pythonPath,
    scriptPath: scriptPath,
    pythonOptions: ["-u"],
    args: [JSON.stringify(studentData)],
  };

  // 4. Run Python prediction worker
  let results;
  try {
    results = await PythonShell.run("predict.py", options);
  } catch (pyErr) {
    const rawOutput = pyErr.stdout || (Array.isArray(pyErr.logs) ? pyErr.logs.join("\n") : "");
    const lines = rawOutput.split("\n");
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith("{") && line.endsWith("}")) {
        try {
          const parsed = JSON.parse(line);
          if (parsed && (parsed.error || parsed.success === false)) {
            const err = new Error(parsed.error || "Model prediction failed in Python script.");
            err.statusCode = 400;
            throw err;
          }
        } catch (parseErr) {
          if (parseErr.statusCode) throw parseErr;
        }
      }
    }
    throw pyErr;
  }

  // 5. Safely parse JSON from stdout lines
  let parsedResult = null;
  if (Array.isArray(results)) {
    for (let i = results.length - 1; i >= 0; i--) {
      const line = results[i].trim();
      if (line.startsWith("{") && line.endsWith("}")) {
        try {
          const parsed = JSON.parse(line);
          if (parsed && (parsed.risk_level || parsed.success !== undefined)) {
            parsedResult = parsed;
            break;
          }
        } catch {
          // Ignore non-JSON log lines or warnings
        }
      }
    }
  }

  if (!parsedResult) {
    throw new Error(
      "Python script executed but did not return a valid JSON response."
    );
  }

  if (!parsedResult.success) {
    const err = new Error(parsedResult.error || "Model prediction failed in Python script.");
    err.statusCode = 400;
    throw err;
  }

  return parsedResult.risk_level;
};

/**
 * Handles standalone ML predictions for /api/predict
 */
exports.predictBurnout = async (req, res) => {
  try {
    const studentData = req.body;
    const riskLevel = await exports.runModelPrediction(studentData);

    return res.status(200).json({
      success: true,
      prediction: riskLevel,
      risk_level: riskLevel,
    });
  } catch (err) {
    console.error("Prediction Controller Error:", err.message);

    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      error: err.message || "Internal server error during prediction.",
    });
  }
};
