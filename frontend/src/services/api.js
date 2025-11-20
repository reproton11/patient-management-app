// patient-management-app/frontend/src/services/api.js
import axios from "axios";

// Vite akan menyisipkan nilai ini dari konfigurasi `define`
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Tambahkan log untuk debugging
console.log("Axios API_BASE_URL:", API_BASE_URL);

const api = axios.create({
  // Gunakan URL yang disuntikkan oleh Vite
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
