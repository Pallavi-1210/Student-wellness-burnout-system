const express = require("express");
const cors = require("cors");
const predictionRoutes = require("./routes/predictionRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", predictionRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Backend Running");
});

// Port
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
