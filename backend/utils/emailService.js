const fs = require("fs");
const path = require("path");
const { Resend } = require("resend");
const nodemailer = require("nodemailer");

// Ensure environment variables are loaded
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// ---------------------------------------------------------------------------
// Testing & Client Overrides (Dependency Injection)
// ---------------------------------------------------------------------------
let mockResendClient = null;
let mockTransporter = null;

const setResendClient = (client) => {
  mockResendClient = client;
};

const setTransporter = (transporter) => {
  mockTransporter = transporter;
};

const resetClients = () => {
  mockResendClient = null;
  mockTransporter = null;
  cachedResendClient = null;
  cachedTransporter = null;
};

// ---------------------------------------------------------------------------
// Resend Client Initialization (HTTPS API - Port 443)
// ---------------------------------------------------------------------------
let cachedResendClient = null;

const getResendClient = () => {
  if (mockResendClient) {
    return mockResendClient;
  }
  if (cachedResendClient) {
    return cachedResendClient;
  }

  const apiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : "";
  if (!apiKey) {
    return null;
  }

  cachedResendClient = new Resend(apiKey);
  return cachedResendClient;
};

// ---------------------------------------------------------------------------
// Legacy SMTP Transporter (Fallback for local development)
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
      // win-ca optional on non-Windows or restricted environments
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

  const rawUser = process.env.EMAIL_USER;
  const rawPass = process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE ? process.env.EMAIL_SERVICE.trim().toLowerCase() : "";
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT, 10) || 465;
  const secure = process.env.EMAIL_SECURE !== undefined ? process.env.EMAIL_SECURE === "true" : port === 465;

  const user = rawUser ? rawUser.trim() : "";
  const pass = rawPass ? String(rawPass).replace(/\s+/g, "") : "";

  if (!user || !pass) {
    return null;
  }

  const caList = loadTrustedCertificates();
  const tlsOptions = { rejectUnauthorized: true };
  if (caList.length > 0) {
    tlsOptions.ca = caList;
  }

  const isGmail = service === "gmail" || host === "smtp.gmail.com" || (!host && user.endsWith("@gmail.com"));

  const transportConfig = {
    pool: true,
    host: isGmail ? "smtp.gmail.com" : host,
    port: isGmail ? 465 : port,
    secure: isGmail ? true : secure,
    auth: { user, pass },
    tls: tlsOptions,
    family: 4,
    connectionTimeout: 8000,
    socketTimeout: 10000,
  };

  cachedTransporter = nodemailer.createTransport(transportConfig);
  return cachedTransporter;
};

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
      message: error.message,
    };
  }
};

// ---------------------------------------------------------------------------
// Startup Diagnostic & Pre-warm
// ---------------------------------------------------------------------------
const initializeEmailService = async () => {
  // Log provider selection clearly so Render logs show the active email path at startup.
  // API key value is never logged — only its presence.
  const resendKeyPresent = !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim());
  const smtpPresent = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  console.log(
    `[EmailService] Startup: RESEND_API_KEY=${resendKeyPresent ? "SET" : "NOT SET"}, SMTP credentials=${smtpPresent ? "SET" : "NOT SET"}`
  );

  const resendClient = getResendClient();
  if (resendClient) {
    const rawKey = process.env.RESEND_API_KEY || "";
    if (rawKey && !rawKey.startsWith("re_") && !mockResendClient) {
      console.warn(
        "[EmailService] Warning: RESEND_API_KEY does not start with the expected 're_' prefix. " +
          "Verify the key was copied correctly from the Resend dashboard (no surrounding quotes)."
      );
    }
    console.log("[EmailService] Provider: Resend HTTPS API (port 443). OTP emails bypass Render SMTP block.");
    return true;
  }

  const transporter = getTransporter();
  if (transporter) {
    console.warn(
      "[EmailService] Provider: Legacy SMTP (local fallback). " +
        "WARNING — Render Free tier blocks outbound SMTP (ports 465/587). " +
        "Set RESEND_API_KEY to fix ETIMEDOUT errors on Render."
    );
    try {
      await transporter.verify();
      console.log("[EmailService] Local SMTP connection verified successfully.");
      return true;
    } catch (err) {
      console.warn(`[EmailService] SMTP verification failed: ${err.message}`);
      return false;
    }
  }

  console.warn(
    "[EmailService] WARNING: No email provider configured. " +
      "RESEND_API_KEY is not set and SMTP credentials are missing. " +
      "OTP emails will fail until RESEND_API_KEY is added to environment variables."
  );
  return false;
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

  // Log which provider will handle this dispatch. Never log the OTP, key, or password.
  const resendConfigured = !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim());
  const smtpConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
  console.log(
    `[EmailService] sendOtpEmail → to=${toEmail}, provider=${
      resendConfigured ? "resend_https_api" : smtpConfigured ? "smtp_fallback" : "none"
    }`
  );

  const subject = `Your Student Wellness Verification Code: ${otp}`;
  const textContent = `Your Student Wellness System verification code is: ${otp}. It will expire in ${expiryMinutes} minutes.`;
  const htmlContent = generateEmailTemplate(otp, expiryMinutes);

  // 1. Try Resend HTTPS API (Port 443) — Primary & cloud-ready.
  //    If RESEND_API_KEY is set and Resend returns an error, we throw immediately
  //    and do NOT fall back to SMTP. SMTP will time out on Render.
  const resendClient = getResendClient();
  if (resendClient) {
    let fromAddress = process.env.EMAIL_FROM ? process.env.EMAIL_FROM.trim() : "";

    // If EMAIL_FROM is omitted, empty, or contains an unverified @gmail.com address with Resend,
    // fallback to Resend's verified test sender to avoid domain rejection.
    if (!fromAddress || /@gmail\.com/i.test(fromAddress)) {
      if (fromAddress && /@gmail\.com/i.test(fromAddress)) {
        console.warn(
          "[EmailService] Notice: Resend does not allow sending from unverified @gmail.com addresses. Using 'Student Wellness System <onboarding@resend.dev>'."
        );
      }
      fromAddress = "Student Wellness System <onboarding@resend.dev>";
    }

    try {
      const { data, error } = await resendClient.emails.send({
        from: fromAddress,
        to: toEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      if (error) {
        console.error(`[EmailService] Resend API rejected email to ${toEmail}:`, error.message);

        // Friendly explanation for Resend domain limitation on test accounts
        if (
          error.message &&
          (error.message.includes("testing emails") || error.message.includes("verify your domain"))
        ) {
          throw new Error(
            `Resend Free Tier notice: While using 'onboarding@resend.dev', you can only send test emails to your Resend account email address. To send to all students, add and verify a custom domain in your Resend dashboard.`
          );
        }

        if (error.message && error.message.includes("API key")) {
          throw new Error("Invalid RESEND_API_KEY. Please verify your API key in the environment variables.");
        }

        throw new Error(`Email delivery failed: ${error.message}`);
      }

      const messageId = data && data.id ? data.id : "resend_ok";
      console.log(`[EmailService] OTP email sent successfully to ${toEmail} via Resend HTTPS API. ID: ${messageId}`);
      return { sent: true, mode: "resend_api", messageId };
    } catch (apiErr) {
      console.error(`[EmailService] Resend dispatch error for ${toEmail}:`, apiErr.message);
      throw apiErr;
    }
  }

  // 2. Legacy SMTP Fallback (For local offline development)
  const transporter = getTransporter();
  if (transporter) {
    const rawUser = process.env.EMAIL_USER;
    const user = rawUser ? rawUser.trim() : "";
    const fromAddress =
      process.env.EMAIL_FROM && process.env.EMAIL_FROM.includes(user)
        ? process.env.EMAIL_FROM
        : `"Student Wellness System" <${user || "no-reply@studentwellness.edu"}>`;

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
      console.log(`[EmailService] OTP email sent via SMTP to ${toEmail}. MessageId: ${info.messageId}`);
      return { sent: true, mode: "legacy_smtp", messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] SMTP delivery failed to ${toEmail}:`, err.message);

      if (err.code === "ETIMEDOUT" || err.code === "ESOCKET") {
        throw new Error(
          "SMTP network connection error (ETIMEDOUT): Outbound SMTP ports 465/587 are blocked on cloud hosts like Render Free. Please configure RESEND_API_KEY in your environment variables to send emails via HTTPS (Port 443)."
        );
      }

      if (err.code === "EAUTH" || err.responseCode === 535) {
        throw new Error("SMTP Authentication failed. Please verify EMAIL_USER and EMAIL_PASS.");
      }

      throw new Error(`Unable to deliver verification email: ${err.message}`);
    }
  }

  // 3. Neither provider configured
  console.error("[EmailService] Email dispatch failed: Neither RESEND_API_KEY nor SMTP credentials configured.");
  throw new Error(
    "Email service is not configured. Please set RESEND_API_KEY in your environment variables to enable email delivery."
  );
};

module.exports = {
  sendOtpEmail,
  generateEmailTemplate,
  createTransporter: getTransporter,
  verifyTransporter,
  initializeEmailService,
  loadTrustedCertificates,
  setResendClient,
  setTransporter,
  resetClients,
};
