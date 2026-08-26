const { verifyToken } = require("../utils/jwt");

// Middleware verifikasi Bearer token untuk semua route terproteksi
const auth = (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Akses ditolak. Token tidak ada." });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token tidak valid atau kadaluarsa" });
  }
};

module.exports = auth;
