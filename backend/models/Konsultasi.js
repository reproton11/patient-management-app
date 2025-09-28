const mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require("mongoose-paginate-v2");

const logAktivitasSchema = new Schema({
  aksi: { type: String, required: true },
  oleh: { type: String, required: true },
  pada: { type: Date, default: Date.now },
  catatan: { type: String },
});

const konsultasiSchema = new Schema(
  {
    pasienId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pasien",
      required: true,
    },
    tanggalKonsultasi: {
      type: Date,
      default: Date.now,
    },
    soap: {
      S: { type: String, trim: true }, // Subjective (keluhan pasien)
      O: {
        // Objective
        tensi: {
          sistolik: { type: Number },
          diastolik: { type: Number },
        },
        tinggiBadan: { type: Number },
        beratBadan: { type: Number },
        tambahan: { type: String, trim: true }, // Untuk penambahan manual jika perlu
      },
      A: { type: String, trim: true }, // Assessment (diagnosis dokter)
      P: { type: String, trim: true }, // Plan (rencana tindakan)
    },
    therapy: { type: String, trim: true }, // Resep obat, tindakan medis
    petugasKonsultasi: {
      // Dokter atau petugas yang menangani konsultasi
      type: String,
      required: true,
    },
    logAktivitas: [logAktivitasSchema],
  },
  {
    timestamps: true, // Otomatis menambahkan createdAt dan updatedAt
  }
);

konsultasiSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Konsultasi", konsultasiSchema);
