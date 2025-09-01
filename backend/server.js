// patient-management-app/backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

/* --------------------------------------------------
   Middleware
-------------------------------------------------- */
app.use(
  cors({
    origin: "http://localhost:5173", // Frontend Vite
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* --------------------------------------------------
   Async bootstrap
-------------------------------------------------- */
async function startServer() {
  try {
    /* 1. Hubungkan MongoDB */
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected...");

    /* 2. Inisialisasi GridFS storage untuk multer
           (harus setelah koneksi terbuka) */
    const uploadController = require("./controllers/uploadController");
    uploadController.initGridFS(mongoose.connection);

    /* 3. Impor & daftarkan routes */
    const uploadRoutes = require("./routes/uploadRoutes");
    const pasienRoutes = require("./routes/pasienRoutes");
    const konsultasiRoutes = require("./routes/konsultasiRoutes");

    app.use("/api/upload", uploadRoutes);
    app.use("/api/pasien", pasienRoutes);
    app.use("/api/konsultasi", konsultasiRoutes);

    /* 4. Route default */
    app.get("/", (req, res) => {
      res.send("Patient Management API is running...");
    });

    /* 5. Jalankan server */
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB or start server:", err);
    process.exit(1);
  }
}

/* --------------------------------------------------
   Mulai server
-------------------------------------------------- */
startServer();
