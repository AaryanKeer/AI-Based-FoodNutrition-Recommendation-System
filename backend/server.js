// backend/server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect Mongo
connectDB();

// Middleware
app.use(express.json());

// CORS – allow Vite frontend
app.use(
  cors({
    origin: "http://localhost:5173", // Vite default
    credentials: false,
  })
);

// Test route
app.get("/", (req, res) => {
  res.send("NutriGraph backend is running");
});

// Routes
const authRoutes = require("./routes/authRoutes");
const recommendRoutes = require("./routes/recommendRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/recommend", recommendRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
