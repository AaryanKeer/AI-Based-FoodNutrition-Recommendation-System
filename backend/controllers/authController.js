// backend/controllers/authController.js
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Small helper: remove password before sending to frontend
function sanitizeUser(userDoc) {
  const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
  const { password, __v, ...rest } = obj;
  return rest;
}

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
      weight_kg,
      height_cm,
      preference,
      activity_level,
      disease,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email and password are required",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      age,
      weight_kg,
      height_cm,
      preference: preference || "both",
      activity_level: activity_level || "moderate",
      disease: disease || "",
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // 🔴 IMPORTANT: guard against missing user or missing password hash
    if (!user || !user.password) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    return res.json({
      message: "Login successful",
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      id,
      age,
      weight_kg,
      height_cm,
      activity_level,
      preference,
      disease,
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Missing user id" });
    }

    const updateFields = {
      age,
      weight_kg,
      height_cm,
      activity_level,
      preference,
      disease,
    };

    const user = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    }).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      message: "Profile updated",
      user,
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
