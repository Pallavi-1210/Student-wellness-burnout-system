# Student Burnout & Wellness System — Production Deployment Guide

This guide provides end-to-end instructions for deploying the **Student Burnout & Wellness Assessment System** to production.

---

## 1. System Architecture Overview

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Chart.js, CSS3 | Single-Page Application (SPA) responsive dashboard & assessment form |
| **Backend API** | Node.js (v18+ / v20+), Express 5 | REST API, JWT authentication, OTP verification, database controllers |
| **ML Engine** | Python 3, scikit-learn, joblib, pandas | 50-tree Random Forest classifier predicting burnout risk (`Low`, `Medium`, `High`) |
| **Database** | MongoDB Atlas (v6.0+) | Persistent storage for users, hashed OTPs, and historical assessment records |
| **Email Service** | Nodemailer + Brevo SMTP (port 2525) | Time-limited 6-digit OTP dispatch for registration |

---

## 2. Environment Variables Reference

### Backend (`backend/.env`)
Create a `.env` file inside `backend/` using `backend/.env.example` as a template.

| Variable | Required | Example / Description |
| :--- | :---: | :--- |
| `NODE_ENV` | **Yes** | `production` |
| `PORT` | No | `5000` (Defaults to 5000 if omitted) |
| `CLIENT_URL` | **Yes** | `https://your-frontend.vercel.app` (Comma-separated for multiple origins) |
| `MONGODB_URI` | **Yes** | `mongodb+srv://user:pass@cluster.mongodb.net/student_burnout?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | 256-bit secret string (Generate via `openssl rand -base64 32`) |
| `JWT_EXPIRES_IN` | No | `7d` (Token validity duration) |
| `EMAIL_HOST` | **Yes** | `smtp-relay.brevo.com` |
| `EMAIL_PORT` | **Yes** | `2525` — use this on Render Free (ports 465/587 are blocked) |
| `EMAIL_SECURE` | **Yes** | `false` (STARTTLS on port 2525; only set `true` for port 465) |
| `EMAIL_USER` | **Yes** | Your Brevo login email address |
| `EMAIL_PASS` | **Yes** | Brevo SMTP key from Dashboard → SMTP & API → SMTP |
| `EMAIL_FROM` | **Yes** | `Student Wellness System <your-verified-sender@example.com>` — must match a verified sender in Brevo |
| `PYTHON_PATH` | No | Optional override path to Python binary (e.g. `/usr/bin/python3`) |

### Frontend (`frontend/.env`)

| Variable | Required | Example / Description |
| :--- | :---: | :--- |
| `VITE_API_URL` | **Yes** | Base URL of deployed backend (e.g. `https://student-wellness-api.onrender.com`) |

---

## 3. Brevo SMTP Setup (Required for Render)

Render Free tier explicitly blocks outbound SMTP on ports 25, 465, and 587 — any connection attempt produces `ETIMEDOUT`.
Port **2525** is not in the blocked list and is confirmed working with Brevo on Render Free.

### Steps

1. **Create a free Brevo account** at [https://brevo.com](https://brevo.com) — any email works, no custom domain required.

2. **Verify your sender address** (required, takes ~1 minute — no DNS records):
   - Dashboard → **Senders & IP** → **Senders** → **Add a Sender**
   - Enter the email address you want to appear as the sender (e.g. your Gmail)
   - Click the verification link sent to that inbox

3. **Get your SMTP credentials**:
   - Dashboard → **SMTP & API** → **SMTP** → **Generate SMTP key**
   - `EMAIL_USER` = your Brevo login email
   - `EMAIL_PASS` = the generated SMTP key (long string)

4. **Add all six email variables to Render**:
   - Render Dashboard → your Web Service → **Environment** → add variables:

   | Variable | Value |
   | :--- | :--- |
   | `EMAIL_HOST` | `smtp-relay.brevo.com` |
   | `EMAIL_PORT` | `2525` |
   | `EMAIL_SECURE` | `false` |
   | `EMAIL_USER` | Your Brevo login email |
   | `EMAIL_PASS` | Your Brevo SMTP key |
   | `EMAIL_FROM` | `Student Wellness System <your-verified-sender@example.com>` |

5. **Redeploy** the Render service after adding variables.

### Brevo Free Tier Limits

| Limit | Value |
| :--- | :--- |
| Emails per day | 300 |
| Emails per month | 9,000 |
| Custom domain required | No |
| Sender verification | Single-sender email link (no DNS) |

### If Port 2525 is Blocked on Render

Port 2525 is not in Render's published block list, but Render may restrict it in the future.
If you see `ETIMEDOUT` in Render logs after deploying:

```
[EmailService] SMTP verification timed out (ETIMEDOUT): cannot reach smtp-relay.brevo.com:2525.
```

**Fallback options (in order of reliability):**
1. Switch to an HTTPS email API (e.g. Resend, SendGrid, Brevo API) — port 443 is never blocked
2. Upgrade to a Render paid plan — removes the SMTP port block on 465/587

---

## 4. Deployment Methods

### Option A: Cloud Platforms (Vercel + Render)

#### 1. Backend Deployment (Render)

1. In Render, click **New +** → **Web Service**
2. Connect your GitHub repository
3. Choose **Docker** as the Runtime:
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Context**: Root of repository (`.`)
4. Add environment variables from Section 2 above
5. Click **Create Web Service**
6. Note your backend URL (e.g. `https://student-wellness-api.onrender.com`)

*(Alternative — Native Node+Python build without Docker):*
- **Root Directory**: Leave blank (root)
- **Build Command**: `pip install -r ml/requirements.txt && cd backend && npm ci --omit=dev`
- **Start Command**: `cd backend && npm start`

#### 2. Frontend Deployment (Vercel)

1. In Vercel, click **New Project** and import the repository
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Under **Environment Variables**, set `VITE_API_URL` to your backend URL
4. Deploy, then update `CLIENT_URL` in your backend Render environment variables

---

### Option B: Docker / VPS (Ubuntu / AWS EC2 / DigitalOcean)

```bash
# 1. Clone repository
git clone https://github.com/your-username/student-burnout-system.git
cd student-burnout-system

# 2. Configure environment
cp backend/.env.example backend/.env
nano backend/.env   # fill in all required values

# 3. Build and launch
docker compose up -d --build

# 4. Verify
docker compose ps
curl http://localhost:5000/health
```

---

## 5. Local Production Verification

Run the test suite and verify builds locally before pushing:

```bash
# 1. Run Backend Automated Test Suite (21 tests)
cd backend
npm test

# 2. Verify Frontend Linting & Production Build
cd ../frontend
npm run lint
npm run build
```

---

## 6. Health Check & Diagnostics

- **Health check**: `GET /health` → Returns database connectivity status, uptime, and server timestamp.
- **Root ping**: `GET /` → Returns API service status and version.
- **Startup log** (check Render logs after deploy):
  ```
  [EmailService] Startup: EMAIL_HOST=smtp-relay.brevo.com, EMAIL_PORT=2525, ...
  [EmailService] Provider: Brevo SMTP (smtp-relay.brevo.com:2525, secure=false).
  [EmailService] SMTP connection verified successfully.
  ```
  If you see `SMTP verification timed out` instead, port 2525 is blocked — see fallback options above.
