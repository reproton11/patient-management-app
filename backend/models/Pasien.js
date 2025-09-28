const mongoose = require("mongoose");
const { Schema } = mongoose;
const mongoosePaginate = require("mongoose-paginate-v2");

const logAktivitasSchema = new Schema({
  aksi: { type: String, required: true }, // ex: "CREATE", "UPDATE", "DELETE"
  oleh: { type: String, required: true }, // Nama Petugas
  pada: { type: Date, default: Date.now },
  catatan: { type: String }, // ex: "Mengubah alamat pasien dari X ke Y"
});

const pasienSchema = new Schema(
  {
    noKartu: {
      type: String,
      required: true,
      unique: true,
    },
    nama: {
      type: String,
      required: true,
      trim: true,
      match: /^[a-zA-Z\s]+$/, // Hanya huruf dan spasi
    },
    alamat: {
      provinsi: { type: String, required: true },
      kabupaten: { type: String, required: true },
      kecamatan: { type: String, required: true },
      kelurahan: { type: String, required: true },
    },
    jenisKelamin: {
      type: String,
      enum: ["Laki-laki", "Perempuan", "Other"], // Menambah "Other" sebagai opsi aman
      required: true,
    },
    tanggalLahir: {
      type: Date,
      required: true,
    },
    noHP: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 15,
      match: /^[0-9]+$/, // Hanya angka
    },
    tensi: {
      sistolik: { type: Number, min: 60, max: 200 },
      diastolik: { type: Number, min: 40, max: 120 },
    },
    tinggiBadan: {
      type: Number,
      min: 50, // cm
      max: 250, // cm
    },
    beratBadan: {
      type: Number,
      min: 10, // kg
      max: 300, // kg
    },
    tanggalDaftar: {
      type: Date,
      default: Date.now,
    },
    terakhirDiUpdate: {
      type: Date,
      default: Date.now,
    },
    petugasPendaftaran: {
      type: String,
      enum: [
        "Arif",
        "Rani",
        "Nunung",
        "Heni",
        "Maria",
        "Emy",
        "Fadil",
        "Rayhan",
      ],
      required: true,
    },
    logAktivitas: [logAktivitasSchema],
  },
  {
    timestamps: true, // Otomatis menambahkan createdAt dan updatedAt
  }
);

// Middleware untuk update terakhirDiUpdate
pasienSchema.pre("findOneAndUpdate", function (next) {
  this._update.terakhirDiUpdate = new Date();
  next();
});

// Middleware untuk memformat jamDaftar saat output (tidak disimpan di DB sebagai field terpisah)
// pasienSchema.virtual('jamDaftar').get(function() {
//   return this.tanggalDaftar ? new Date(this.tanggalDaftar).toLocaleTimeString('en-GB') : '';
// });
pasienSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Pasien", pasienSchema);
