const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Ensure environment variables are loaded
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Cached list of trusted Root Certificate Authorities from OS / environment
let trustedCAs = [];

/**
 * Loads trusted Certificate Authorities from the OS and environment.
 * On Windows, loads system root certificates (including endpoint security/antivirus proxies)
 * so that TLS connections are authenticated securely.
 * Certificate verification remains strictly enabled (rejectUnauthorized: true).
 */
const loadTrustedCertificates = () => {
  if (trustedCAs.length > 0) {
    return trustedCAs;
  }

  const certs = [];

  // 1. Load Windows OS Certificate Store on Windows systems
  if (process.platform === "win32") {
    try {
      const winCa = require("win-ca/api");
      winCa({
        format: winCa.der2.pem,
        ondata: (crt) => {
          if (crt && typeof crt === "string") {
            certs.push(crt);
          }
        },
      });
      if (certs.length > 0) {
        console.log(`[EmailService] Loaded ${certs.length} trusted root certificates from Windows OS store.`);
      }
    } catch (err) {
      console.warn("[EmailService] Note: Could not read Windows certificate store via win-ca:", err.message);
    }
  }

  // 2. Load custom CA file if specified in environment
  const caFilePath = process.env.EMAIL_CA_FILE || process.env.NODE_EXTRA_CA_CERTS;
  if (caFilePath && fs.existsSync(caFilePath)) {
    try {
      const customCa = fs.readFileSync(caFilePath, "utf8");
      certs.push(customCa);
      console.log(`[EmailService] Loaded custom CA certificate from: ${caFilePath}`);
    } catch (err) {
      console.warn(`[EmailService] Warning: Could not read custom CA file at ${caFilePath}:`, err.message);
    }
  }

  trustedCAs = certs;
  return trustedCAs;
};

// Initial load of trusted CAs
loadTrustedCertificates();

// Singleton pooled transporter instance
let cachedTransporter = null;

/**
 * Creates or returns the singleton Nodemailer transporter.
 * Uses persistent connection pooling (pool: true) to eliminate per-email TLS/TCP handshake latency.
 * Uses family: 4 to bypass IPv6 DNS lookup delays on Windows networks.
 * Keeps strict rejectUnauthorized: true for secure delivery.
 */
const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const rawUser = process.env.EMAIL_USER;
  const rawPass = process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE ? process.env.EMAIL_SERVICE.trim().toLowerCase() : "";
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT, 10) || 465;
  const secure = process.env.EMAIL_SECURE !== undefined ? process.env.EMAIL_SECURE === "true" : port === 465;

  const user = rawUser ? rawUser.trim() : "";
  // Normalize App Password: remove spaces only; preserve all characters
  const pass = rawPass ? String(rawPass).replace(/\s+/g, "") : "";

  if (!user || !pass) {
    return null;
  }

  const caList = loadTrustedCertificates();
  const tlsOptions = {
    rejectUnauthorized: true,
  };
  if (caList.length > 0) {
    tlsOptions.ca = caList;
  }

  const isGmail = service === "gmail" || host === "smtp.gmail.com" || (!host && user.endsWith("@gmail.com"));

  const transportConfig = {
    pool: true, // Keep connection open for fast subsequent deliveries
    host: isGmail ? "smtp.gmail.com" : host,
    port: isGmail ? 465 : port,
    secure: isGmail ? true : secure,
    auth: {
      user,
      pass,
    },
    tls: tlsOptions,
    family: 4, // Force IPv4 to eliminate IPv6 DNS resolution fallback stalls
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000,
  };

  cachedTransporter = nodemailer.createTransport(transportConfig);
  return cachedTransporter;
};

/**
 * Diagnostic helper to verify SMTP transporter connection and credentials
 */
const verifyTransporter = async () => {
  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: "Transporter not initialized. Missing EMAIL_USER or EMAIL_PASS." };
  }
  try {
    await transporter.verify();
    return { success: true, message: "SMTP server is ready to deliver messages." };
  } catch (error) {
    return {
      success: false,
      code: error.code,
      responseCode: error.responseCode,
      message: error.message,
    };
  }
};

/**
 * Pre-warms the SMTP connection pool in the background on startup
 */
const initializeEmailService = async () => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[EmailService] Transporter credentials not configured.");
    return false;
  }
  try {
    await transporter.verify();
    console.log("[EmailService] SMTP connection pool verified and pre-warmed for instant delivery.");
    return true;
  } catch (err) {
    console.warn(`[EmailService] Background warmup notice: ${err.message}`);
    return false;
  }
};

/**
 * Generates modern, accessible HTML email template for student OTP verification
 */
const generateEmailTemplate = (otp, expiryMinutes) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Student Registration Verification</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 24px; }
        .badge { display: inline-block; padding: 6px 14px; background: #e0f2fe; color: #0369a1; border-radius: 9999px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 16px 0 8px 0; text-align: center; }
        p { font-size: 15px; line-height: 1.6; color: #475569; margin: 8px 0; }
        .otp-container { text-align: center; margin: 30px 0; padding: 18px; background: #f1f5f9; border-radius: 10px; border: 1px dashed #cbd5e1; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a; user-select: all; }
        .notice { font-size: 13px; color: #64748b; text-align: center; margin-top: 14px; }
        .footer { border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">Student Wellness System</span>
          <h1>Verify Your Email</h1>
          <p>Thank you for registering. Use the verification code below to verify your email address and complete your signup.</p>
        </div>
        <div class="otp-container">
          <div class="otp-code">${otp}</div>
        </div>
        <p class="notice">This OTP code is valid for <strong>${expiryMinutes} minutes</strong>. Do not share this code with anyone.</p>
        <div class="footer">
          <p>If you did not request this verification code, please disregard this email.</p>
        </div>
      </div>
    </body>
  </html>
  `;
};

/**
 * Sends OTP verification email strictly to user's registered email.
 * Never logs actual OTP to backend logs or console.
 * Never returns actual OTP in return objects.
 */
const sendOtpEmail = async ({ toEmail, otp, expiryMinutes = 10 }) => {
  const transporter = getTransporter();
  const rawUser = process.env.EMAIL_USER;
  const user = rawUser ? rawUser.trim() : "";

  // Ensure From header aligns with authenticated user for optimal deliverability
  const fromAddress =
    process.env.EMAIL_FROM && process.env.EMAIL_FROM.includes(user)
      ? process.env.EMAIL_FROM
      : `"Student Wellness System" <${user || "no-reply@studentwellness.edu"}>`;

  if (!transporter) {
    console.error(`[EmailService] Email sending failed: EMAIL_USER or EMAIL_PASS not configured.`);
    throw new Error("Email service is not configured. Unable to send verification email.");
  }

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `Your Student Wellness Verification Code: ${otp}`,
    text: `Your Student Wellness System verification code is: ${otp}. It will expire in ${expiryMinutes} minutes.`,
    html: generateEmailTemplate(otp, expiryMinutes),
    priority: "high",
    headers: {
      "X-Priority": "1",
      "X-MSMail-Priority": "High",
      "Importance": "high",
    },
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] OTP email sent successfully to ${toEmail}. MessageId: ${info.messageId}`);
    return { sent: true, mode: "live_smtp", messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] Failed to send email to ${toEmail}: ${err.message}`);

    // Gmail authentication error
    const isAuthError =
      err.code === "EAUTH" ||
      err.responseCode === 535 ||
      (typeof err.message === "string" && (err.message.includes("535") || err.message.includes("BadCredentials")));

    if (isAuthError) {
      throw new Error(
        "Gmail SMTP Authentication failed. Please verify the Google App Password configured in EMAIL_PASS."
      );
    }

    // TLS certificate errors
    const isCertError =
      err.code === "SELF_SIGNED_CERT_IN_CHAIN" ||
      err.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" ||
      err.code === "CERT_HAS_EXPIRED" ||
      (typeof err.message === "string" && err.message.toLowerCase().includes("certificate"));

    if (isCertError) {
      throw new Error("Unable to verify secure email certificate. Please check network certificate configuration.");
    }

    // Network connection errors
    const isNetworkError =
      err.code === "ECONNREFUSED" ||
      err.code === "ETIMEDOUT" ||
      err.code === "ENOTFOUND" ||
      err.code === "ESOCKET" ||
      err.code === "ECONNRESET";

    if (isNetworkError) {
      throw new Error(`SMTP network connection error (${err.code}): Unable to reach email server.`);
    }

    throw new Error(`Unable to deliver verification email: ${err.message}`);
  }
};

module.exports = {
  sendOtpEmail,
  createTransporter: getTransporter,
  verifyTransporter,
  initializeEmailService,
  loadTrustedCertificates,
};
