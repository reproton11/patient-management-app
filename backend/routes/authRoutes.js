const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const {
  login,
  getMe,
  getUsers,
} = require("../controllers/authController");

// @route   POST api/auth/login
// @access  Public
router.post("/login", login);

router.use(auth);

// @route   GET api/auth/me
// @access  Private
router.get("/me", getMe);

// @route   GET api/auth/users
// @access  Private
router.get("/users", getUsers);

module.exports = router;
