const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { sendOtpEmail } = require("../utils/emailService");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_RESEND_LIMIT = 5;
const RESEND_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const VERIFICATION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes to complete signup after verification

/**
 * Controller: Send OTP to user's email for registration
 * Route: POST /api/auth/send-otp
 */
exports.sendOtp = async (req, res) => {
  try {
    const body = req.body || {};
    const { email } = body;

    // 1. Basic validation
    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "A valid email address is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    // 2. Prevent OTP sending if user is already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "An account with this email address already exists. Please log in.",
      });
    }

    // 3. Check existing OTP record for resend cooldown and rate limits
    const existingOtp = await Otp.findOne({ email: normalizedEmail });
    const now = Date.now();
    const lastResend = existingOtp && existingOtp.lastResendAt ? existingOtp.lastResendAt.getTime() : 0;
    const isWithinWindow = now - lastResend < RESEND_WINDOW_MS;

    if (existingOtp) {
      const elapsedSeconds = Math.floor((now - lastResend) / 1000);

      // Enforce 60-second cooldown
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        const remainingCooldown = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
        return res.status(429).json({
          success: false,
          error: `Please wait ${remainingCooldown} seconds before requesting a new code.`,
          retryAfter: remainingCooldown,
        });
      }

      // Enforce max resend limit within a 1-hour window
      if (isWithinWindow && existingOtp.resendCount >= MAX_RESEND_LIMIT) {
        return res.status(429).json({
          success: false,
          error: "Maximum OTP resend limit reached. Please try again in one hour.",
        });
      }
    }

    // 4. Generate cryptographically secure 6-digit numeric OTP
    const plainOtp = crypto.randomInt(100000, 1000000).toString();

    // 5. Hash OTP with bcrypt before saving to MongoDB
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(plainOtp, salt);

    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // 6. Upsert OTP record
    const updatedResendCount = existingOtp && isWithinWindow ? existingOtp.resendCount + 1 : 1;

    await Otp.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        otp: hashedOtp,
        expiresAt,
        attempts: 0,
        isVerified: false,
        verificationToken: null,
        lastResendAt: new Date(),
        resendCount: updatedResendCount,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    // 7. Send OTP email strictly to user's registered email
    await sendOtpEmail({
      toEmail: normalizedEmail,
      otp: plainOtp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
    });

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email address.",
      expiresInMinutes: OTP_EXPIRY_MINUTES,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (err) {
    console.error("Auth Controller - sendOtp Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Unable to process OTP request. Please try again later.",
    });
  }
};

/**
 * Controller: Verify OTP code
 * Route: POST /api/auth/verify-otp
 */
exports.verifyOtp = async (req, res) => {
  try {
    const body = req.body || {};
    const { email, otp } = body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: "Email and 6-digit verification code are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        error: "Verification code must be exactly 6 digits.",
      });
    }

    const otpRecord = await Otp.findOne({ email: normalizedEmail });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        error: "No verification code was requested for this email, or it has expired.",
      });
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        error: "Verification code has expired. Please request a new one.",
      });
    }

    // Check max attempts (brute-force defense)
    if (otpRecord.attempts >= 5) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(429).json({
        success: false,
        error: "Too many incorrect attempts. This code has been invalidated. Please request a new one.",
      });
    }

    // Compare entered OTP with hashed OTP
    const isMatch = await bcrypt.compare(cleanOtp, otpRecord.otp);

    if (!isMatch) {
      otpRecord.attempts += 1;
      const remaining = 5 - otpRecord.attempts;
      if (remaining <= 0) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return res.status(429).json({
          success: false,
          error: "Too many incorrect attempts. This code has been invalidated. Please request a new one.",
          attemptsRemaining: 0,
        });
      }
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        error: `Invalid verification code. ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining,
      });
    }

    // Mark as verified and generate a single-use verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    otpRecord.isVerified = true;
    otpRecord.verificationToken = verificationToken;
    otpRecord.verifiedAt = new Date();
    otpRecord.attempts = 0;
    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You may now complete your registration.",
      verificationToken,
      email: normalizedEmail,
    });
  } catch (err) {
    console.error("Auth Controller - verifyOtp Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Unable to verify code. Please try again later.",
    });
  }
};

/**
 * Controller: Register user after email OTP verification
 * Route: POST /api/auth/signup
 */
exports.signup = async (req, res) => {
  try {
    const body = req.body || {};
    const { name, email, password, confirmPassword, verificationToken } = body;

    // 1. Validate required fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Name, email, password, and confirm password are required.",
      });
    }

    const trimmedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();

    // 2. Validate name
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      return res.status(400).json({
        success: false,
        error: "Name must be between 2 and 60 characters long.",
      });
    }

    // 3. Validate email
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: "Please provide a valid email address.",
      });
    }

    // 4. Validate password and match
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters long.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Passwords do not match.",
      });
    }

    // 5. Require and validate OTP verification token
    if (!verificationToken || typeof verificationToken !== "string") {
      return res.status(403).json({
        success: false,
        error: "Email verification is required before creating an account. Please verify your email with the OTP first.",
      });
    }

    const verifiedRecord = await Otp.findOne({
      email: normalizedEmail,
      verificationToken,
      isVerified: true,
    });

    if (!verifiedRecord) {
      return res.status(403).json({
        success: false,
        error: "Invalid or unverified email session. Please complete OTP verification first.",
      });
    }

    // Check verification session validity (30-minute window)
    if (Date.now() - verifiedRecord.verifiedAt.getTime() > VERIFICATION_EXPIRY_MS) {
      await Otp.deleteOne({ _id: verifiedRecord._id });
      return res.status(403).json({
        success: false,
        error: "Verification session has expired. Please verify your email again.",
      });
    }

    // 6. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "An account with this email address already exists. Please sign in.",
      });
    }

    // 7. Create new user (password is automatically hashed via Mongoose pre-save hook)
    const newUser = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password,
      isVerified: true,
    });

    // Clean up any pending OTP records for this email if any exist
    try {
      await Otp.deleteMany({ email: normalizedEmail });
    } catch {
      // Non-critical cleanup
    }

    // 7. Generate JWT token for seamless auto-login
    const jwtSecret = process.env.JWT_SECRET;
    let token = null;
    if (jwtSecret) {
      token = jwt.sign(
        {
          id: newUser._id,
          email: newUser.email,
        },
        jwtSecret,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        }
      );
    }

    return res.status(201).json({
      success: true,
      message: "Student registered successfully.",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isVerified: newUser.isVerified,
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("Auth Controller - signup Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Unable to complete registration. Please try again later.",
    });
  }
};

/**
 * Controller: Authenticate user and issue JWT
 * Route: POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const body = req.body || {};
    const { email, password } = body;

    // 1. Validate required inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 2. Find user by normalized email (include password for comparison)
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    // 3. Verify password using schema comparePassword method
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    // 4. Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured in environment variables.");
      return res.status(500).json({
        success: false,
        error: "Server configuration error. Please contact administrator.",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      jwtSecret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      }
    );

    // 5. Return success with token and safe user profile (no password)
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Auth Controller - login Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Unable to process login. Please try again later.",
    });
  }
};

