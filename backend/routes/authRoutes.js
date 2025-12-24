// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();

const {
  login,
  register,
  updateProfile,
} = require("../controllers/authController");

router.post("/login", login);
router.post("/register", register);
router.put("/profile", updateProfile);

module.exports = router;
