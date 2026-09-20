// Membuat akun dokter dengan sesi permanen (login sekali, tidak perlu login lagi).
// Jalankan sekali: node scripts/seedDokter.js  (atau npm run seed:dokter dari root)
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const seedDokter = async () => {
  const username = process.env.DOKTER_USERNAME;
  const password = process.env.DOKTER_PASSWORD;
  const nama = process.env.DOKTER_NAME || "dr. Andi Zainal";

  if (!username || !password) {
    console.error(
      "DOKTER_USERNAME dan DOKTER_PASSWORD wajib diset di environment."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected (db: ${mongoose.connection.name})`);

    const normalized = username.toLowerCase().trim();
    const existing = await User.findOne({ username: normalized });

    if (existing) {
      existing.role = "dokter";
      existing.permanentSession = true;
      await existing.save();
      console.log(
        `User "${normalized}" sudah ada - role dokter & sesi permanen disinkronkan (password tidak diubah).`
      );
    } else {
      const user = new User({
        username: normalized,
        password,
        nama,
        role: "dokter",
        permanentSession: true,
      });
      await user.save();
      console.log(
        `Akun dokter "${normalized}" (${nama}) berhasil dibuat dengan sesi permanen.`
      );
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Gagal seed dokter:", err.message);
    process.exit(1);
  }
};

seedDokter();
