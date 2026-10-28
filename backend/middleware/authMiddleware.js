const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware to authenticate requests via JWT Bearer token.
 * Extracts the user ID exclusively from the verified token payload.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers["authorization"];

    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Access denied. Valid Bearer token required in Authorization header.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. Token is missing.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured in environment variables.");
      return res.status(500).json({
        success: false,
        error: "Server authentication configuration error.",
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          error: "Authentication token has expired. Please log in again.",
        });
      }
      return res.status(401).json({
        success: false,
        error: "Invalid authentication token. Please log in again.",
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: "Malformed token payload. User ID missing.",
      });
    }

    // Verify user still exists in database
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "The user associated with this token no longer exists.",
      });
    }

    // Attach authenticated user to request object
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(500).json({
      success: false,
      error: "Internal server error during authentication.",
    });
  }
};

module.exports = {
  authenticateToken,
};
