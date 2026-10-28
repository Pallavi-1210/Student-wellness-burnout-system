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
| **Email Service** | Resend HTTPS API (primary) / Nodemailer SMTP (local fallback) | Time-limited 6-digit OTP dispatch for registration via HTTPS — bypasses Render's SMTP block |

---

## 2. Environment Variables Reference

### Backend (`backend/.env`)
Create a `.env` file inside `backend/` using `backend/.env.example` as a template:

| Variable | Required | Example / Description |
| :--- | :---: | :--- |
| `NODE_ENV` | **Yes** | `production` |
| `PORT` | No | `5000` (Defaults to 5000 if omitted) |
| `CLIENT_URL` | **Yes** | `https://your-frontend.vercel.app` (Comma-separated for multiple origins) |
| `MONGODB_URI` | **Yes** | `mongodb+srv://user:pass@cluster.mongodb.net/student_burnout?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | 256-bit secret string (Generate via `openssl rand -base64 32`) |
| `JWT_EXPIRES_IN` | No | `7d` (Token validity duration) |
| `RESEND_API_KEY` | **Yes** *(cloud)* | Resend API key (starts with `re_`). Get one free at [resend.com](https://resend.com). **Required on Render — outbound SMTP is blocked.** |
| `EMAIL_FROM` | No | `Student Wellness System <noreply@yourdomain.com>` — only set after verifying a domain in Resend. Leave blank to use `onboarding@resend.dev` (test sender). |
| `EMAIL_USER` | No *(local only)* | Gmail address — only used as SMTP fallback when `RESEND_API_KEY` is absent. Not needed on Render. |
| `EMAIL_PASS` | No *(local only)* | Gmail 16-char App Password — only used as SMTP fallback when `RESEND_API_KEY` is absent. Not needed on Render. |
| `PYTHON_PATH` | No | Optional override path to Python binary (e.g. `/usr/bin/python3`) |

### Frontend (`frontend/.env`)
Create a `.env` file inside `frontend/` using `frontend/.env.example` as a template:

| Variable | Required | Example / Description |
| :--- | :---: | :--- |
| `VITE_API_URL` | **Yes** | Base URL of deployed backend (e.g. `https://student-wellness-api.onrender.com`) |

---

## 3. Deployment Methods

### Option A: Recommended — Cloud Platforms (Vercel + Render)

#### 1. Backend Deployment (Render / Railway)
Because the backend executes a Python ML prediction script from Node.js, the backend host must have both Node.js and Python installed. **Docker-based deployment on Render or Railway is the most reliable method:**

1. In Render, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Choose **Docker** as the Runtime:
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Context**: Root of repository (`.`)
4. Under **Environment Variables**, add the variables from Section 2 above. **Critical email note:** Render Free tier blocks outbound SMTP (ports 465/587). You must set `RESEND_API_KEY` — do **not** rely on `EMAIL_USER`/`EMAIL_PASS` alone on Render.

   | Variable | Value to add in Render |
   | :--- | :--- |
   | `RESEND_API_KEY` | Your Resend API key (e.g. `re_abc123…`) — see [Resend Setup](#resend-email-api-setup-required-for-render) below |
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_SECRET` | Your 256-bit secret |
   | `CLIENT_URL` | Your Vercel frontend URL |
   | `NODE_ENV` | `production` |

5. Click **Create Web Service**.
6. Note your backend URL (e.g., `https://student-wellness-api.onrender.com`).

*(Alternative Native Node+Python Build on Render Web Service without Docker):*
- **Root Directory**: Leave blank (root)
- **Build Command**: `pip install -r ml/requirements.txt && cd backend && npm ci --omit=dev`
- **Start Command**: `cd backend && npm start`

#### 2. Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
1. In Vercel or Netlify, click **New Project** and import the repository.
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Under **Environment Variables**, set:
   - `VITE_API_URL`: Your backend URL from Step 1 (e.g., `https://student-wellness-api.onrender.com`)
4. Click **Deploy**.
5. Once deployed, copy your frontend domain (e.g. `https://student-wellness.vercel.app`) and update `CLIENT_URL` in your backend environment variables.

---

### Resend Email API Setup (Required for Render)

Render Free tier blocks all outbound SMTP connections (ports 465 and 587), which causes the `ETIMEDOUT` error. The backend already supports the [Resend](https://resend.com) HTTPS API as its primary email provider — you only need to create an API key and add it to Render.

#### Steps

1. **Create a free Resend account** at [https://resend.com](https://resend.com)
2. **Generate an API key**: Dashboard → **API Keys** → **Add API Key** → copy the key (starts with `re_`)
3. **Add to Render environment variables**: Dashboard → your Web Service → **Environment** → add `RESEND_API_KEY = re_yourkey`
4. **Redeploy** the Render service (or it will auto-deploy on next push)

#### Free Plan Limitation

On the Resend free tier, using the default `onboarding@resend.dev` sender address, emails can **only be delivered to your own Resend account email address** (not to students). To send to all users:

- Add and verify a custom domain at [https://resend.com/domains](https://resend.com/domains)
- Then set `EMAIL_FROM=Student Wellness System <noreply@yourdomain.com>` in Render environment variables

> **Why not SMTP?** Gmail SMTP (and all outbound SMTP) is blocked on Render Free infrastructure at the network level. This is an infrastructure policy — correct credentials will still produce `ETIMEDOUT`. Resend uses HTTPS (port 443) which is always open.

---

### Option B: Docker / VPS Deployment (Ubuntu / AWS EC2 / DigitalOcean)

Run the full backend stack using Docker Compose:

```bash
# 1. Clone repository
git clone https://github.com/your-username/student-burnout-system.git
cd student-burnout-system

# 2. Configure environment
cp backend/.env.example backend/.env
nano backend/.env

# 3. Build and launch container in background
docker compose up -d --build

# 4. Verify running status
docker compose ps
curl http://localhost:5000/health
```

---

## 4. Local Production Verification

Run the test suite and verify builds locally before pushing:

```bash
# 1. Run Backend Automated Test Suite (13 tests)
cd backend
npm test

# 2. Verify Frontend Linting & Production Build
cd ../frontend
npm run lint
npm run build
```

---

## 5. Health Check & Diagnostics

- **Health check**: `GET /health` → Returns database connectivity status, uptime, and server timestamp.
- **Root ping**: `GET /` → Returns API service status and version.
