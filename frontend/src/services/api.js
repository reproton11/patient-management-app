// patient-management-app/frontend/src/services/api.js
import axios from "axios";

const API_BASE_URL_FROM_ENV = import.meta.env.VITE_API_BASE_URL;

// Pastikan baseURL selalu diakhiri dengan '/' untuk konsistensi
// Atau, lebih baik lagi, hapus trailing slash dari variabel env
// dan biarkan axios menanganinya.
let finalBaseURL;
if (API_BASE_URL_FROM_ENV) {
  // Menghapus trailing slash jika ada, untuk menghindari // di URL
  finalBaseURL = API_BASE_URL_FROM_ENV.endsWith("/")
    ? API_BASE_URL_FROM_ENV.slice(0, -1)
    : API_BASE_URL_FROM_ENV;
} else {
  // Fallback untuk pengembangan lokal
  finalBaseURL = "http://localhost:5000/api";
}

const api = axios.create({
  baseURL: finalBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
