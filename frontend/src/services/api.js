// patient-management-app/frontend/src/services/api.js
import axios from "axios";

// Menggunakan environment variable yang disuntikkan oleh Vite/Vercel
// Jika tidak ada (misal saat development lokal), fallback ke localhost
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
