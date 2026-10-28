const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Ensure environment variables are loaded
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// ---------------------------------------------------------------------------
// Testing & Client Overrides (Dependency Injection)
// ---------------------------------------------------------------------------
let mockTransporter = null;

const setTransporter = (transporter) => {
  mockTransporter = transporter;
};

const resetClients = () => {
  mockTransporter = null;
  cachedTransporter = null;
};

// ---------------------------------------------------------------------------
// SMTP Transporter — reads ALL connection parameters from environment variables.
// No provider-specific host, port, or TLS setting is hardcoded here.
// ---------------------------------------------------------------------------
let trustedCAs = [];

const loadTrustedCertificates = () => {
  if (trustedCAs.length > 0) {
    return trustedCAs;
  }

  const certs = [];
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
    } catch {
      // win-ca is optional — not available on Linux/Render
    }
  }

  const caFilePath = process.env.EMAIL_CA_FILE || process.env.NODE_EXTRA_CA_CERTS;
  if (caFilePath && fs.existsSync(caFilePath)) {
    try {
      const customCa = fs.readFileSync(caFilePath, "utf8");
      certs.push(customCa);
    } catch {
      // Ignored
    }
  }

  trustedCAs = certs;
  return trustedCAs;
};

let cachedTransporter = null;

const getTransporter = () => {
  if (mockTransporter) {
    return mockTransporter;
  }
  if (cachedTransporter) {
    return cachedTransporter;
  }

  // All SMTP parameters come exclusively from environment variables.
  // There is no isGmail branch or any provider-specific override.
  const host = process.env.EMAIL_HOST ? process.env.EMAIL_HOST.trim() : "";
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
  const pass = process.env.EMAIL_PASS ? String(process.env.EMAIL_PASS).replace(/\s+/g, "") : "";
  // Default port 587 (Brevo STARTTLS). Override with EMAIL_PORT=2525 if 587 is blocked.
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  // EMAIL_SECURE=false for ports 587/2525 (STARTTLS). Set "true" only for port 465 (SSL).
  const secure = process.env.EMAIL_SECURE === "true";

  // All three are required — return null if any are missing so callers fail safely.
  if (!host || !user || !pass) {
    return null;
  }

  const caList = loadTrustedCertificates();
  const tlsOptions = { rejectUnauthorized: true };
  if (caList.length > 0) {
    tlsOptions.ca = caList;
  }

  const transportConfig = {
    host,
    port,
    secure,
    auth: { user, pass },
    tls: tlsOptions,
    family: 4,           // IPv4 only — more reliable on cloud hosts
    connectionTimeout: 10000,
    socketTimeout: 15000,
  };

  cachedTransporter = nodemailer.createTransport(transportConfig);
  return cachedTransporter;
};

const verifyTransporter = async () => {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      success: false,
      error:
        "SMTP transporter not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in environment variables.",
    };
  }
  try {
    await transporter.verify();
    return { success: true, message: "SMTP server is ready to deliver messages." };
  } catch (error) {
    return {
      success: false,
      code: error.code,
      message: error.message,
    };
  }
};

// ---------------------------------------------------------------------------
// Startup Diagnostic
// ---------------------------------------------------------------------------
const initializeEmailService = async () => {
  // EMAIL_HOST and EMAIL_PORT are not secrets — safe to log.
  // EMAIL_USER and EMAIL_PASS values are never logged.
  const host = process.env.EMAIL_HOST ? process.env.EMAIL_HOST.trim() : "";
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const secure = process.env.EMAIL_SECURE === "true";
  const userPresent = !!(process.env.EMAIL_USER && process.env.EMAIL_USER.trim());
  const passPresent = !!(process.env.EMAIL_PASS && process.env.EMAIL_PASS.trim());

  console.log(
    `[EmailService] Startup: EMAIL_HOST=${host || "NOT SET"}, EMAIL_PORT=${port}, ` +
      `secure=${secure}, EMAIL_USER=${userPresent ? "SET" : "NOT SET"}, EMAIL_PASS=${passPresent ? "SET" : "NOT SET"}`
  );

  const transporter = getTransporter();

  if (!transporter) {
    console.warn(
      "[EmailService] WARNING: SMTP transporter not configured. " +
        "OTP emails will fail. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in environment variables."
    );
    return false;
  }

  console.log(`[EmailService] Provider: Brevo SMTP (${host}:${port}, secure=${secure}).`);

  // Port 587 is in Render Free's explicitly blocked list. Warn proactively.
  if (port === 587 || port === 465) {
    console.warn(
      `[EmailService] ⚠ Port ${port} is listed among Render Free tier's blocked outbound SMTP ports ` +
        "(25, 465, 587). If connection times out on Render, set EMAIL_PORT=2525 and redeploy. " +
        "Port 2525 is not in the blocked list and is supported by Brevo."
    );
  }

  try {
    await transporter.verify();
    console.log("[EmailService] SMTP connection verified successfully.");
    return true;
  } catch (err) {
    if (err.code === "ETIMEDOUT" || err.code === "ESOCKET") {
      console.warn(
        `[EmailService] SMTP verification timed out (${err.code}): cannot reach ${host}:${port}. ` +
          "This port is likely blocked by Render Free tier. Set EMAIL_PORT=2525 and redeploy."
      );
    } else {
      console.warn(`[EmailService] SMTP verification failed: ${err.message}`);
    }
    // Return false but do NOT crash — the server still starts; email will fail at send time.
    return false;
  }
};

// ---------------------------------------------------------------------------
// HTML Email Template
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Primary OTP Delivery Function
// ---------------------------------------------------------------------------
const sendOtpEmail = async ({ toEmail, otp, expiryMinutes = 10 }) => {
  if (!toEmail || typeof toEmail !== "string") {
    throw new Error("Recipient email address is required.");
  }
  if (!otp) {
    throw new Error("OTP code is required.");
  }

  // Log which provider will handle this dispatch.
  // The OTP value, EMAIL_PASS, and any API keys are never logged.
  const smtpConfigured = !!(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_HOST.trim() &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS
  );
  console.log(
    `[EmailService] sendOtpEmail → to=${toEmail}, provider=${smtpConfigured ? "brevo_smtp" : "none"}`
  );

  const subject = `Your Student Wellness Verification Code: ${otp}`;
  const textContent = `Your Student Wellness System verification code is: ${otp}. It will expire in ${expiryMinutes} minutes.`;
  const htmlContent = generateEmailTemplate(otp, expiryMinutes);

  const transporter = getTransporter();

  if (!transporter) {
    console.error(
      "[EmailService] SMTP transporter not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS."
    );
    throw new Error(
      "Email service is not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in environment variables."
    );
  }

  // Build the From address from environment. Never fall back to a hardcoded address that
  // doesn't match the verified Brevo sender, as this will cause delivery rejection.
  const rawUser = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : "";
  const fromAddress = process.env.EMAIL_FROM
    ? process.env.EMAIL_FROM.trim()
    : `"Student Wellness System" <${rawUser}>`;

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject,
    text: textContent,
    html: htmlContent,
    priority: "high",
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[EmailService] OTP email sent via Brevo SMTP to ${toEmail}. MessageId: ${info.messageId}`
    );
    return { sent: true, mode: "brevo_smtp", messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] SMTP delivery failed to ${toEmail}: ${err.message}`);

    if (err.code === "ETIMEDOUT" || err.code === "ESOCKET") {
      const host = process.env.EMAIL_HOST || "email server";
      const port = process.env.EMAIL_PORT || "587";
      throw new Error(
        `SMTP connection timed out (${host}:${port}). ` +
          "Port 587 is blocked on Render Free tier. " +
          "Set EMAIL_PORT=2525 in environment variables and redeploy."
      );
    }

    if (err.code === "EAUTH" || err.responseCode === 535) {
      throw new Error(
        "SMTP authentication failed. Verify EMAIL_USER (Brevo login email) and " +
          "EMAIL_PASS (Brevo SMTP key from dashboard) in environment variables."
      );
    }

    throw new Error(`Unable to deliver OTP email: ${err.message}`);
  }
};

module.exports = {
  sendOtpEmail,
  generateEmailTemplate,
  createTransporter: getTransporter,
  verifyTransporter,
  initializeEmailService,
  loadTrustedCertificates,
  setTransporter,
  resetClients,
};
