const { PythonShell } = require("python-shell");

exports.predictBurnout = async (req, res) => {
  try {
    console.log("Student Data Received:");
    console.log(req.body);

    const studentData = req.body;

    const dataForPython = JSON.stringify(studentData);

    console.log("DATA SENT TO PYTHON:");
    console.log(dataForPython);

    const options = {
      pythonPath: "E:\\Student-Burnout-System\\ml\\venv\\Scripts\\python.exe",
      scriptPath: "E:\\Student-Burnout-System\\ml",
      pythonOptions: ["-u"],
      args: [dataForPython],
    };

    console.log("STARTING PYTHON...");

    const results = await PythonShell.run("predict.py", options);

    console.log("PYTHON RESULT:");
    console.log(results);

    return res.status(200).json({
      success: true,
      result: results,
    });
  } catch (err) {
    console.log("PYTHON ERROR:");
    console.log(err);

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
