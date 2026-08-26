const asyncHandler = require("../middlewares/asyncHandler");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const Joi = require("@hapi/joi");

const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    "any.required": "Username wajib diisi",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password wajib diisi",
  }),
});

// @route   POST api/auth/login
// @desc    Login petugas, kembalikan JWT
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    return res.status(400).json({
      message: "Validasi gagal",
      errors: error.details.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  const username = value.username.toLowerCase().trim();
  const user = await User.findOne({ username });
  const isMatch = user ? await user.comparePassword(value.password) : false;

  if (!user || !isMatch) {
    return res.status(401).json({ message: "Username atau password salah" });
  }

  res.json({
    message: "Login berhasil",
    token: signToken(user),
    user: { id: user._id, nama: user.nama, username: user.username },
  });
});

// @route   GET api/auth/me
// @desc    Profil user yang sedang login
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }
  res.json({ user });
});

// @route   GET api/auth/users
// @desc    Daftar user untuk keperluan filter
// @access  Private
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("nama username").sort({ nama: 1 });
  res.json({ users });
});
