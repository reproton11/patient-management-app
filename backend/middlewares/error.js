// Error middleware terpusat: mapping error umum menjadi response JSON konsisten
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  if (err.name === "CastError") {
    return res.status(404).json({ message: "Data tidak ditemukan" });
  }

  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validasi gagal",
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
      })),
    });
  }

  if (err.code === 11000) {
    return res
      .status(400)
      .json({ message: "Data duplikat: nomor kartu pasien sudah ada." });
  }

  res.status(500).json({ message: "Terjadi kesalahan pada server" });
};

module.exports = errorHandler;
