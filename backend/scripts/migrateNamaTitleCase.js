// Migrasi sekali jalan: konversi semua nama pasien di database ke Title Case.
// Jalankan: node scripts/migrateNamaTitleCase.js
require("dotenv").config();
const mongoose = require("mongoose");
const Pasien = require("../models/Pasien");

const toTitleCase = (str) =>
  String(str)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|\s)[a-z]/g, (ch) => ch.toUpperCase());

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const patients = await Pasien.find().select("nama").lean();
    let changed = 0;

    for (const p of patients) {
      const fixed = toTitleCase(p.nama);
      if (fixed !== p.nama) {
        await Pasien.updateOne({ _id: p._id }, { $set: { nama: fixed } });
        console.log(`  "${p.nama}" -> "${fixed}"`);
        changed++;
      }
    }

    console.log(
      `Selesai: ${changed} dari ${patients.length} nama dikonversi ke Title Case.`
    );

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Migrasi gagal:", err.message);
    process.exit(1);
  }
};

migrate();
