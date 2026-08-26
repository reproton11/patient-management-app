// Sinkronkan password user admin dengan nilai ADMIN_PASSWORD di .env.
// Berguna saat rotasi password atau setelah seed pertama.
// Jalankan: node scripts/syncAdminPassword.js
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const syncPassword = async () => {
  const { MONGO_URI, ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_NAME } =
    process.env;

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.error("ADMIN_USERNAME dan ADMIN_PASSWORD wajib ada di .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);

    const user = await User.findOne({
      username: ADMIN_USERNAME.toLowerCase(),
    });
    if (!user) {
      console.error(
        `User "${ADMIN_USERNAME}" tidak ditemukan. Jalankan seedAdmin dulu.`
      );
      process.exit(1);
    }

    user.password = ADMIN_PASSWORD;
    if (ADMIN_NAME) user.nama = ADMIN_NAME;
    await user.save();

    console.log(
      `Password user "${user.username}" berhasil disinkronkan dengan ADMIN_PASSWORD di .env`
    );

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Gagal sinkronisasi:", err.message);
    process.exit(1);
  }
};

syncPassword();
