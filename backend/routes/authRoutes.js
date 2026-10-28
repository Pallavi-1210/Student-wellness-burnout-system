const express = require("express");
const {
  sendOtp,
  verifyOtp,
  signup,
  login,
} = require("../controllers/authController");

const router = express.Router();

// Route to generate and send time-limited OTP
router.post("/send-otp", sendOtp);

// Route to verify the OTP
router.post("/verify-otp", verifyOtp);

// Route to register user with name, email, password, confirmPassword after OTP verification
router.post("/signup", signup);

// Route to authenticate user and issue JWT
router.post("/login", login);

module.exports = router;
