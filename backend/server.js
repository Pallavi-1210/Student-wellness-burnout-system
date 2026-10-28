const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const predictionRoutes = require("./routes/predictionRoutes");

const { initializeEmailService } = require("./utils/emailService");

const app = express();

// ============================================================================
// Production CORS Configuration
// ============================================================================
const configuredOrigins = process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

const allowedOriginsList = configuredOrigins
  ? configuredOrigins.split(",").map((o) => o.trim())
  : defaultAllowedOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server, curl, mobile apps, or same-origin requests with no origin header
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOriginsList.includes("*") ||
        allowedOriginsList.includes(origin) ||
        process.env.NODE_ENV !== "production";

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Blocked by CORS policy: Origin '${origin}' is not authorized.`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Lightweight Production Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Request body parsers
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ============================================================================
// Health & Diagnostic Endpoints
// ============================================================================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Student Wellness & Burnout Detection API is running.",
    version: "1.0.0",
  });
});

// ============================================================================
// Application API Routes
// ============================================================================
app.use("/api/auth", authRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api", predictionRoutes);

// ============================================================================
// 404 & Global Error Handling
// ============================================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error("Unhandled API Error:", err.message);
  const status = err.statusCode || err.status || 500;
  res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error." : err.message,
  });
});

// ============================================================================
// Server Initialization & Graceful Shutdown
// ============================================================================
const PORT = process.env.PORT || 5000;
let serverInstance = null;

const startServer = async () => {
  try {
    await connectDB();

    // Pre-warm email service in background for instant OTP dispatch
    initializeEmailService().catch((err) => {
      console.warn("[EmailService] Startup warmup notice:", err.message);
    });

    serverInstance = app.listen(PORT, () => {
      console.log(`Student Wellness API running on port ${PORT}`);
    });

    return serverInstance;
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

const handleGracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Gracefully shutting down...`);
  if (serverInstance) {
    serverInstance.close(() => {
      console.log("HTTP server closed.");
    });
  }
  try {
    await mongoose.connection.close(false);
    console.log("MongoDB connection closed.");
  } catch (err) {
    console.error("Error closing MongoDB connection:", err.message);
  }
  process.exit(0);
};

process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));
process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));

if (require.main === module) {
  startServer();
}

module.exports = app;
