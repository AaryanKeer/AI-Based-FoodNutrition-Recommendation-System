// backend/routes/recommendRoutes.js
const express = require("express");
const router = express.Router();
const { recommendMeals } = require("../controllers/recommendController");

router.post("/", recommendMeals);

module.exports = router;
