const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "dev-only-secret-change-me-in-production";
const TOKEN_EXPIRES_IN = "12h";

if (!process.env.JWT_SECRET) {
  console.warn(
    "[AUTH] JWT_SECRET tidak diset di environment - memakai secret development. WAJIB diset di production!"
  );
}

const signToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), nama: user.nama, username: user.username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );

const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

module.exports = { signToken, verifyToken, TOKEN_EXPIRES_IN };
