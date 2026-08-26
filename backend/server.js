require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// Railway/Vercel menghantarkan request lewat proxy - agar rate-limit & req.ip
// membaca IP klien asli dari X-Forwarded-For (hop pertama yang dipercaya)
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;

const MONGO_URI = process.env.MONGO_URI;

// Origin yang diizinkan dari env, dipisah koma.
// Tanpa CORS_ORIGIN, semua origin diizinkan (hanya untuk development).
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : true;

const corsOptions = {
  origin: allowedOrigins,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limit global untuk seluruh /api
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Terlalu banyak permintaan, coba lagi nanti." },
});

// Rate limit ketat khusus login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
  },
});

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected successfully!"))
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
  });

const pasienRoutes = require("./routes/pasienRoutes");
const konsultasiRoutes = require("./routes/konsultasiRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const authRoutes = require("./routes/authRoutes");

app.get("/", (req, res) => {
  res.status(200).send("Service is healthy");
});

app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/pasien", apiLimiter, pasienRoutes);
app.use("/api/konsultasi", apiLimiter, konsultasiRoutes);
app.use("/api/analytics", apiLimiter, analyticsRoutes);

app.get("/api", (req, res) => {
  res.send("Patient Management API is running...");
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "API Endpoint Not Found" });
});

// Error handler terpusat
const errorHandler = require("./middlewares/error");
app.use(errorHandler);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} diterima - mematikan server...`);
  server.close(() => {
    mongoose.connection
      .close()
      .then(() => {
        console.log("Koneksi MongoDB ditutup. Proses selesai.");
        process.exit(0);
      })
      .catch(() => process.exit(0));
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
