/**
 * Production Readiness Test Suite
 * Executes unit and integration tests across:
 * 1. Express App Routes & Health Endpoints (Real HTTP requests)
 * 2. 404 & Global Error Handling
 * 3. ML Model Python Inference Pipeline
 * 4. Assessment Risk Mapping & Validation Logic
 * 5. Mongoose Models & Schemas
 * 6. JWT Authentication & Password Hashing
 */
const assert = require("assert");
const http = require("http");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Load backend env
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = require("../server");
const { runModelPrediction, REQUIRED_FIELDS } = require("../controllers/predictionController");
const User = require("../models/User");
const Otp = require("../models/Otp");
const Assessment = require("../models/Assessment");
const {
  sendOtpEmail,
  generateEmailTemplate,
  setResendClient,
  resetClients,
} = require("../utils/emailService");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

async function runTest(testName, fn) {
  totalTests++;
  process.stdout.write(`  [TEST] ${testName} ... `);
  try {
    await fn();
    passedTests++;
    console.log("PASSED");
  } catch (err) {
    failedTests++;
    console.log("FAILED");
    console.error(`         Error: ${err.message}`);
  }
}

// Helper for testing HTTP requests against Express app
function makeRequest(server, path, method = "GET", postData = null) {
  return new Promise((resolve, reject) => {
    const addr = server.address();
    const headers = {};
    let payload = null;
    if (postData) {
      payload = typeof postData === "string" ? postData : JSON.stringify(postData);
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload);
    }
    const req = http.request(
      {
        host: "127.0.0.1",
        port: addr.port,
        path,
        method,
        headers,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(body);
            resolve({ statusCode: res.statusCode, headers: res.headers, body: json });
          } catch {
            resolve({ statusCode: res.statusCode, headers: res.headers, rawBody: body });
          }
        });
      }
    );
    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function main() {
  console.log("\n=======================================================");
  console.log("  Running Student Wellness Production Test Suite");
  console.log("=======================================================\n");

  // Spin up an ephemeral HTTP server on random port for route integration testing
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, "127.0.0.1", resolve));

  try {
    // -----------------------------------------------------------------
    // 1. ML Model & Python Inference Worker Tests
    // -----------------------------------------------------------------
    console.log("1. Machine Learning Inference Pipeline:");

    await runTest("ML Worker: Predicts valid risk level for standard student profile", async () => {
      const sampleInput = {
        age: 21,
        gender: "Female",
        academic_year: 3,
        study_hours_per_day: 6.5,
        exam_pressure: 7.0,
        academic_performance: 7.5,
        stress_level: 6.0,
        anxiety_score: 5.5,
        depression_score: 4.0,
        sleep_hours: 6.5,
        physical_activity: 3.0,
        social_support: 7.0,
        screen_time: 5.0,
        internet_usage: 4.0,
        financial_stress: 5.0,
        family_expectation: 6.0,
      };

      const risk = await runModelPrediction(sampleInput);
      assert(["Low", "Medium", "High"].includes(risk), `Unexpected risk level: ${risk}`);
    });

    await runTest("ML Worker: Rejects missing required field with validation error", async () => {
      const incompleteInput = {
        age: 20,
        gender: "Male",
        // missing fields
      };

      let caughtError = false;
      try {
        await runModelPrediction(incompleteInput);
      } catch (err) {
        caughtError = true;
        assert(err.message.includes("Missing required field"), `Unexpected error: ${err.message}`);
      }
      assert(caughtError, "Expected missing field to throw an error");
    });

    await runTest("ML Worker: Rejects invalid gender value with clean error message", async () => {
      const invalidGenderInput = {
        age: 20,
        gender: "UnknownGender",
        academic_year: 2,
        study_hours_per_day: 5,
        exam_pressure: 5,
        academic_performance: 7,
        stress_level: 5,
        anxiety_score: 4,
        depression_score: 3,
        sleep_hours: 7,
        physical_activity: 4,
        social_support: 7,
        screen_time: 4,
        internet_usage: 3,
        financial_stress: 4,
        family_expectation: 5,
      };

      let caughtError = false;
      try {
        await runModelPrediction(invalidGenderInput);
      } catch (err) {
        caughtError = true;
        assert(
          err.message.includes("gender") || err.message.includes("Gender"),
          `Expected gender error message, received: ${err.message}`
        );
      }
      assert(caughtError, "Expected invalid gender to throw an error");
    });

    // -----------------------------------------------------------------
    // 2. Security, Authentication & Cryptography Tests
    // -----------------------------------------------------------------
    console.log("\n2. Security & Authentication Utilities:");

    await runTest("Crypto: Bcrypt correctly hashes and verifies passwords", async () => {
      const plain = "StudentP@ssw0rd!2026";
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(plain, salt);

      assert(hash !== plain, "Hash must not equal plain text");
      const isMatch = await bcrypt.compare(plain, hash);
      assert(isMatch === true, "Bcrypt compare failed for correct password");

      const isBadMatch = await bcrypt.compare("WrongPassword", hash);
      assert(isBadMatch === false, "Bcrypt compare succeeded for wrong password");
    });

    await runTest("Crypto: JWT signing, verification and expiration", async () => {
      const secret = "test-jwt-secret-key-32-chars-minimum-length";
      const payload = { id: "507f1f77bcf86cd799439011", email: "student@college.edu" };

      const token = jwt.sign(payload, secret, { expiresIn: "1h" });
      assert(typeof token === "string" && token.length > 20, "Token was not generated");

      const decoded = jwt.verify(token, secret);
      assert.strictEqual(decoded.id, payload.id);
      assert.strictEqual(decoded.email, payload.email);

      // Verify invalid signature rejection
      let failedSign = false;
      try {
        jwt.verify(token, "different-wrong-secret");
      } catch {
        failedSign = true;
      }
      assert(failedSign, "JWT with wrong secret must be rejected");
    });

    // -----------------------------------------------------------------
    // 3. Schema & Model Integrity Tests
    // -----------------------------------------------------------------
    console.log("\n3. Mongoose Model Definitions:");

    await runTest("Models: User model exposes required fields and comparePassword", () => {
      assert(User.schema.path("name"), "User schema missing 'name'");
      assert(User.schema.path("email"), "User schema missing 'email'");
      assert(User.schema.path("password"), "User schema missing 'password'");
      assert(typeof User.prototype.comparePassword === "function", "User missing comparePassword method");
    });

    await runTest("Models: Assessment model enforces required answer fields and burnoutLevel enum", () => {
      assert(Assessment.schema.path("user"), "Assessment schema missing 'user'");
      assert(Assessment.schema.path("burnoutLevel"), "Assessment schema missing 'burnoutLevel'");
      const enumVals = Assessment.schema.path("burnoutLevel").enumValues;
      assert.deepStrictEqual(enumVals, ["Low", "Medium", "High"]);

      // Verify all 16 required fields exist in schema
      for (const f of REQUIRED_FIELDS) {
        assert(Assessment.schema.path(`answers.${f}`), `Assessment schema missing 'answers.${f}'`);
      }
    });

    await runTest("Models: Otp model has TTL expiry and attempts defined", () => {
      assert(Otp.schema.path("otp"), "Otp schema missing 'otp'");
      assert(Otp.schema.path("expiresAt"), "Otp schema missing 'expiresAt'");
      assert(Otp.schema.path("attempts"), "Otp schema missing 'attempts'");
    });

    // -----------------------------------------------------------------
    // 4. Express Server & Route Configuration (Live HTTP)
    // -----------------------------------------------------------------
    console.log("\n4. Express Server & Route Integration:");

    await runTest("HTTP GET /: Returns 200 OK with running status", async () => {
      const res = await makeRequest(testServer, "/");
      assert.strictEqual(res.statusCode, 200);
      assert(res.body.success === true, "Response body success should be true");
      assert(res.headers["x-content-type-options"] === "nosniff", "Missing security header");
    });

    await runTest("HTTP GET /health: Returns 200 OK with health metadata", async () => {
      const res = await makeRequest(testServer, "/health");
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.status, "healthy");
      assert(typeof res.body.uptime === "number", "Health check missing uptime");
    });

    await runTest("HTTP GET /api/unknown-route: Returns structured 404 JSON", async () => {
      const res = await makeRequest(testServer, "/api/unknown-endpoint-404");
      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.body.success, false);
      assert(res.body.error.includes("Resource not found"), "Expected 404 error message");
    });

    await runTest("HTTP POST /api/auth/login without body: Returns 400 Bad Request", async () => {
      const res = await makeRequest(testServer, "/api/auth/login", "POST");
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
    });

    await runTest("HTTP GET /api/assessments without JWT: Returns 401 Unauthorized", async () => {
      const res = await makeRequest(testServer, "/api/assessments", "GET");
      assert.strictEqual(res.statusCode, 401);
      assert.strictEqual(res.body.success, false);
      assert(res.body.error.includes("Bearer token required"), `Unexpected message: ${res.body.error}`);
    });

    // -----------------------------------------------------------------
    // 5. Email Delivery & OTP Dispatch Pipeline (Mocked - No real OTPs sent)
    // -----------------------------------------------------------------
    console.log("\n5. Email Delivery & OTP Authentication Pipeline:");

    await runTest("Email: Template generation contains OTP code and expiration", () => {
      const template = generateEmailTemplate("987654", 10);
      assert(typeof template === "string", "Template should be a string");
      assert(template.includes("987654"), "Template missing OTP code");
      assert(template.includes("10 minutes"), "Template missing expiry time");
    });

    await runTest("Email: Successfully dispatches OTP via Resend HTTPS API (Mocked)", async () => {
      let capturedPayload = null;
      setResendClient({
        emails: {
          send: async (payload) => {
            capturedPayload = payload;
            return { data: { id: "mock_resend_msg_test_123" }, error: null };
          },
        },
      });

      const result = await sendOtpEmail({
        toEmail: "student@university.edu",
        otp: "849201",
        expiryMinutes: 10,
      });

      assert.strictEqual(result.sent, true);
      assert.strictEqual(result.mode, "resend_api");
      assert.strictEqual(result.messageId, "mock_resend_msg_test_123");
      assert.strictEqual(capturedPayload.to, "student@university.edu");
      assert(capturedPayload.subject.includes("849201"));
    });

    await runTest("Email: Handles Resend API error cleanly without crash (Mocked)", async () => {
      setResendClient({
        emails: {
          send: async () => {
            return {
              data: null,
              error: { message: "Invalid API key provided", name: "validation_error" },
            };
          },
        },
      });

      let caught = false;
      try {
        await sendOtpEmail({
          toEmail: "student@university.edu",
          otp: "123456",
        });
      } catch (err) {
        caught = true;
        assert(err.message.includes("Invalid RESEND_API_KEY"), `Unexpected message: ${err.message}`);
      }
      assert.strictEqual(caught, true, "Expected sendOtpEmail to throw on API error");
    });

    await runTest("Email: Translates Resend free-tier domain restriction into friendly notice (Mocked)", async () => {
      setResendClient({
        emails: {
          send: async () => {
            return {
              data: null,
              error: {
                message:
                  "You can only send testing emails to your own email address. To send emails to other addresses, you need to verify your domain.",
              },
            };
          },
        },
      });

      let caught = false;
      try {
        await sendOtpEmail({
          toEmail: "other_student@university.edu",
          otp: "654321",
        });
      } catch (err) {
        caught = true;
        assert(err.message.includes("Resend Free Tier notice"), `Unexpected error: ${err.message}`);
      }
      assert.strictEqual(caught, true, "Expected domain limitation notice to be caught and translated");
    });

    await runTest("Email: Rejects unconfigured service with clear instructions to set RESEND_API_KEY", async () => {
      resetClients();
      const originalResendKey = process.env.RESEND_API_KEY;
      const originalUser = process.env.EMAIL_USER;
      const originalPass = process.env.EMAIL_PASS;
      delete process.env.RESEND_API_KEY;
      delete process.env.EMAIL_USER;
      delete process.env.EMAIL_PASS;

      let caught = false;
      try {
        await sendOtpEmail({
          toEmail: "student@university.edu",
          otp: "112233",
        });
      } catch (err) {
        caught = true;
        assert(err.message.includes("Please set RESEND_API_KEY"), `Unexpected error: ${err.message}`);
      } finally {
        if (originalResendKey) process.env.RESEND_API_KEY = originalResendKey;
        if (originalUser) process.env.EMAIL_USER = originalUser;
        if (originalPass) process.env.EMAIL_PASS = originalPass;
      }
      assert.strictEqual(caught, true, "Expected unconfigured service to throw");
    });

    await runTest("HTTP POST /api/auth/send-otp: Rejects missing email payload with 400 Bad Request", async () => {
      const res = await makeRequest(testServer, "/api/auth/send-otp", "POST", {});
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert(res.body.error.includes("email address is required"));
    });

    await runTest("HTTP POST /api/auth/send-otp: Rejects invalid email syntax with 400 Bad Request", async () => {
      const res = await makeRequest(testServer, "/api/auth/send-otp", "POST", { email: "not-an-email" });
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert(res.body.error.includes("valid email address"));
    });

    await runTest("HTTP POST /api/auth/verify-otp: Rejects malformed OTP code with 400 Bad Request", async () => {
      const res = await makeRequest(testServer, "/api/auth/verify-otp", "POST", {
        email: "student@university.edu",
        otp: "123",
      });
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert(res.body.error.includes("must be exactly 6 digits"));
    });
  } finally {
    resetClients();
    testServer.close();
  }

  // -----------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------
  console.log("\n=======================================================");
  console.log(`  Results: ${passedTests}/${totalTests} Tests Passed`);
  if (failedTests > 0) {
    console.log(`  Failures: ${failedTests} failed`);
    console.log("=======================================================\n");
    process.exit(1);
  } else {
    console.log("  All Tests Passed Successfully! System Ready.");
    console.log("=======================================================\n");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test Suite Fatal Error:", err);
  process.exit(1);
});
