// patient-management-app/backend/server.js
require("dotenv").config();
const express = require("express"); // <--- PASTIKAN BARIS INI ADA!
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN; // Pastikan ini membaca dari env var

// Konfigurasi CORS
const corsOptions = {
  origin: CORS_ORIGIN ? CORS_ORIGIN.split(",") : "*", // Menggunakan CORS_ORIGIN
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions)); // Aplikasi menggunakan opsi CORS ini

// ... (middleware, route definitions, etc.) ...
