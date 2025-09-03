// Memuat variabel lingkungan dari file .env
require("dotenv").config();

// Mengimpor modul yang diperlukan
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Membuat instance aplikasi Express
const app = express();

// Mengambil PORT dari environment variables (disuntikkan oleh Railway)
// Jika tidak ada, fallback ke port 3000 (untuk development lokal)
const PORT = process.env.PORT || 3000;

// Mengambil URI koneksi MongoDB dari environment variables
const MONGO_URI = process.env.MONGO_URI;

// Mengambil Origin yang diizinkan untuk CORS dari environment variables
// Jika tidak ada, default ke '*' (mengizinkan semua origin, hanya untuk debugging/development awal)
const CORS_ORIGIN = process.env.CORS_ORIGIN;

// Konfigurasi CORS (Cross-Origin Resource Sharing)
// Ini memungkinkan frontend Anda (yang berada di domain berbeda) untuk berkomunikasi dengan backend
const corsOptions = {
  // origin bisa berupa string tunggal, array string, atau fungsi
  // jika CORS_ORIGIN disetel (misal: "https://your-frontend.vercel.app"), maka itu yang diizinkan.
  // jika CORS_ORIGIN memiliki beberapa domain dipisahkan koma (misal: "domA,domB"), maka array akan dibuat.
  // jika tidak disetel, default ke '*' (SEMUA origin diizinkan - TIDAK AMAN UNTUK PRODUKSI)
  origin: CORS_ORIGIN ? CORS_ORIGIN.split(",") : "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Metode HTTP yang diizinkan
  credentials: true, // Izinkan pengiriman cookies, header otorisasi, dll.
  optionsSuccessStatus: 204, // Status untuk preflight request OPTIONS
};
app.use(cors(corsOptions)); // Mengaktifkan CORS untuk semua rute

// Middleware untuk mengurai body permintaan dalam format JSON
// Ini penting agar Anda bisa menerima data JSON dari frontend (misal: saat mendaftar pasien)
app.use(express.json());

// Middleware untuk mengurai body permintaan dalam format URL-encoded
// (extended: true memungkinkan penguraian objek dan array bersarang)
app.use(express.urlencoded({ extended: true }));

// Koneksi ke MongoDB menggunakan Mongoose
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected successfully!")) // Log sukses koneksi
  .catch((err) => {
    // Log error koneksi database secara detail
    console.error("Failed to connect to MongoDB:", err.message);
    // Jika koneksi DB gagal, aplikasi mungkin tidak bisa berfungsi.
    // Opsional: Anda bisa memilih untuk menghentikan aplikasi di sini
    // process.exit(1);
  });

// Mengimpor modul rute yang telah kita buat
const pasienRoutes = require("./routes/pasienRoutes");
const konsultasiRoutes = require("./routes/konsultasiRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

// Menggunakan modul rute dengan prefix API
// Semua rute di pasienRoutes akan diakses melalui /api/pasien
app.use("/api/pasien", pasienRoutes);
// Semua rute di konsultasiRoutes akan diakses melalui /api/konsultasi
app.use("/api/konsultasi", konsultasiRoutes);
// Semua rute di uploadRoutes akan diakses melalui /api/upload
app.use("/api/upload", uploadRoutes);

// Rute dasar untuk Healthcheck Railway (PENTING untuk Railway Healthcheck Path: `/`)
// Ini merespons dengan status 200 OK secara cepat
app.get("/", (req, res) => {
  res.status(200).send("Service is healthy"); // Respons sederhana untuk Healthcheck
});

// Rute dasar untuk menguji URL API Base (jika Healthcheck Path Railway diatur ke `/api`)
// Ini juga memberikan respons yang jelas saat diakses di browser
app.get("/api", (req, res) => {
  res.send("Patient Management API is running...");
});

// Middleware untuk menangani rute yang tidak ditemukan (404 Not Found)
// Ini akan merespons jika tidak ada rute di atas yang cocok dengan permintaan
app.use((req, res, next) => {
  res.status(404).json({ message: "API Endpoint Not Found" });
});

// Middleware penanganan kesalahan global
// Ini akan menangkap error yang terjadi di rute atau middleware sebelumnya
app.use((err, req, res, next) => {
  console.error(err.stack); // Log stack trace error ke konsol server
  res.status(500).send("Something broke on the server!"); // Kirim respons 500 ke klien
});

// Memulai server Express
// app.listen(PORT, '0.0.0.0', ...) membuat server mendengarkan di semua antarmuka jaringan
// pada port yang ditentukan oleh Railway atau default ke 3000.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`); // Log URL lokal server
  console.log(`CORS allowed origin(s): ${CORS_ORIGIN || "*"}`); // Log origin CORS yang diizinkan
});
