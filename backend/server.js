// patient-management-app/backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000; // Gunakan PORT dari env atau fallback ke 3000
const MONGO_URI = process.env.MONGO_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

// Konfigurasi CORS
// Contoh di Node.js dengan Express dan middleware CORS
const cors = require('cors');

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Koneksi ke MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.error("Failed to connect to MongoDB:", err)); // Log error lebih detail

// Impor rute
const pasienRoutes = require("./routes/pasienRoutes");
const konsultasiRoutes = require("./routes/konsultasiRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// Gunakan rute dengan prefix /api
app.use("/api/pasien", pasienRoutes);
app.use("/api/konsultasi", konsultasiRoutes);
app.use("/api/upload", uploadRoutes);

// Rute default untuk testing base URL
app.get("/api", (req, res) => {
  // UBAH INI: Pastikan ada /api di sini
  res.send("Patient Management API is running...");
});

// Handle 404 Not Found untuk semua rute yang tidak terdefinisi
app.use((req, res, next) => {
  res.status(404).json({ message: "API Endpoint Not Found" });
});

// Global Error Handler (opsional, tapi baik untuk debugging)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Mulai server
app.listen(PORT, "0.0.0.0", () => {
  // PENTING: Listen di '0.0.0.0'
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed origin(s): ${CORS_ORIGIN || "*"}`);
});
