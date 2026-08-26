// Membuat akun admin/petugas pertama dari environment variables.
// Jalankan sekali: node scripts/seedAdmin.js  (atau npm run seed:admin dari root)
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const seedAdmin = async () => {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const nama = process.env.ADMIN_NAME || process.env.ADMIN_USERNAME;

  if (!username || !password) {
    console.error(
      "ADMIN_USERNAME dan ADMIN_PASSWORD wajib diset di environment."
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const existing = await User.findOne({
      username: username.toLowerCase(),
    });
    if (existing) {
      console.log(
        `User "${username}" sudah ada. Tidak ada perubahan dilakukan.`
      );
    } else {
      const user = new User({
        username,
        password,
        nama,
      });
      await user.save();
      console.log(`User "${username}" berhasil dibuat.`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Gagal seed admin:", err.message);
    process.exit(1);
  }
};

seedAdmin();
