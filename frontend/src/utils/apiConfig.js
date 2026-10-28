/**
 * Unified API Configuration
 * Supports environment variable VITE_API_URL for production deployment (e.g., Render, Railway, AWS).
 * Defaults to http://localhost:5000 in local development.
 */
const rawUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_BASE_URL = rawUrl.replace(/\/+$/, "");

export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/api/auth`,
  ASSESSMENTS: `${API_BASE_URL}/api/assessments`,
  PREDICT: `${API_BASE_URL}/api/predict`,
  HEALTH: `${API_BASE_URL}/health`,
};

export default API_ENDPOINTS;
