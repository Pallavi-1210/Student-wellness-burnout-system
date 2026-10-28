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
| **Email Service** | Nodemailer (Gmail / SMTP) | Time-limited 6-digit OTP dispatch for registration |

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
| `EMAIL_SERVICE` | **Yes** | `gmail` (or configure `EMAIL_HOST`, `EMAIL_PORT`) |
| `EMAIL_USER` | **Yes** | `your-email@gmail.com` |
| `EMAIL_PASS` | **Yes** | Google 16-character App Password (from [Google App Passwords](https://myaccount.google.com/apppasswords)) |
| `EMAIL_FROM` | No | `"Student Wellness System" <no-reply@studentwellness.edu>` |
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
4. Under **Environment Variables**, add the variables from Section 2 above (`MONGODB_URI`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `CLIENT_URL`, etc.).
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
