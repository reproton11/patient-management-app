// patient-management-app/frontend/src/services/api.js
import axios from "axios";

// Ini adalah pendekatan yang paling aman.
// `import.meta.env.VITE_API_BASE_URL` akan disisipkan langsung oleh Vite/Vercel saat build.
// Pastikan Vercel ENVIRONMENT VARIABLE bernama VITE_API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  // Hanya jika VITE_API_BASE_URL tidak ada (misal, saat dev lokal)
  // Fallback ke localhost. Atau bisa throw error jika ini adalah build produksi.
  console.warn(
    "VITE_API_BASE_URL is not set. Falling back to localhost for API calls."
  );
}

const api = axios.create({
  // Gunakan API_BASE_URL, dengan fallback jika perlu
  baseURL: API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
