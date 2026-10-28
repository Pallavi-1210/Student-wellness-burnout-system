# ==============================================================================
# Student Burnout & Wellness System - Production Backend Dockerfile
# Multi-runtime environment providing both Node.js (v20) and Python (v3)
# ==============================================================================

FROM node:20-bookworm-slim

# Set environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    PYTHONUNBUFFERED=1

# Install Python3, pip, and essential build libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Install Python ML dependencies
COPY ml/requirements.txt ./ml/requirements.txt
RUN python3 -m venv /app/ml/venv && \
    /app/ml/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/ml/venv/bin/pip install --no-cache-dir -r ./ml/requirements.txt

# 2. Install Node.js backend dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev --ignore-scripts

# 3. Copy application source code
WORKDIR /app
COPY backend ./backend
COPY ml ./ml

WORKDIR /app/backend

# Explicitly configure Python path for prediction controller
ENV PYTHON_PATH=/app/ml/venv/bin/python

EXPOSE 5000

CMD ["node", "server.js"]
