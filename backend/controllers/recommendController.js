// backend/controllers/recommendController.js
const path = require("path");
const fs = require("fs");

const dataPath = path.join(__dirname, "..", "data", "merged_food.json");

let foodData = [];
try {
  const raw = fs.readFileSync(dataPath, "utf-8");
  foodData = JSON.parse(raw);
  console.log("✅ Loaded merged_food.json with", foodData.length, "rows");
} catch (err) {
  console.error("❌ Failed to load merged_food.json:", err.message);
  foodData = [];
}

// Helpers
function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return 0;
  const h = heightCm / 100;
  if (!h) return 0;
  return Number((weightKg / (h * h)).toFixed(2));
}

function calorieRangeFromBMI(bmi, activity) {
  const a = (activity || "").toLowerCase();
  let base;
  if (a === "low") base = 1800;
  else if (a === "moderate") base = 2200;
  else base = 2600;

  if (bmi < 18.5) return [base + 200, base + 400];
  if (bmi < 25) return [base - 100, base + 100];
  if (bmi < 30) return [base - 300, base - 100];
  return [base - 500, base - 200];
}

function recommendMealsForUser(user) {
  const meals = ["Breakfast", "Lunch", "Snack", "Dinner"];
  let foods = [...foodData];

  foods = foods.map((f) => ({
    ...f,
    preference: (f.preference || "").toLowerCase(),
    meal_time: f.meal_time || "",
    is_dessert: Boolean(f.is_dessert),
    calories: Number(f.calories) || 0,
    carbs: Number(f.carbs) || 0,
    protein: Number(f.protein) || 0,
    fat: Number(f.fat) || 0,
    sugar: Number(f.sugar) || 0,
    fiber: Number(f.fiber) || 0,
    sodium: Number(f.sodium) || 0,
  }));

  // Preference filter
  const pref = (user.preference || "").toLowerCase();
  if (pref === "vegetarian") {
    foods = foods.filter((f) => f.preference === "vegetarian");
  } else if (
    ["non-vegetarian", "non_vegetarian", "non vegetarian"].includes(pref)
  ) {
    foods = foods.filter((f) => f.preference === "non_vegetarian");
  }

  // Disease flags
  const disease = (user.disease || "").toLowerCase();
  const isDiabetes = disease.includes("diabetes");
  const isHeart = disease.includes("heart") || disease.includes("hypertension");

  // Global soft filters
  if (isDiabetes) {
    foods = foods.filter((f) => f.sugar <= 15 && f.calories <= 650);
  }
  if (isHeart) {
    foods = foods.filter((f) => f.sodium <= 500 && f.fat <= 20);
  }

  const bmi = calculateBMI(user.weight_kg, user.height_cm);
  const [low, high] = calorieRangeFromBMI(bmi, user.activity_level);
  const totalTarget = (low + high) / 2;
  const perMeal = totalTarget / meals.length;

  const used = new Set();

  function pickMealItems(mealName) {
    let subset = foods.filter((f) =>
      f.meal_time.toLowerCase().includes(mealName.toLowerCase())
    );

    // No dessert as main meals
    if (["breakfast", "lunch", "dinner"].includes(mealName.toLowerCase())) {
      subset = subset.filter((f) => !f.is_dessert);
    }

    // Disease per-meal
    if (isDiabetes) {
      if (mealName === "Snack") {
        subset = subset.filter((f) => f.sugar <= 10);
      } else {
        subset = subset.filter((f) => f.sugar <= 12);
      }
      subset = subset.filter((f) => f.fiber >= 1.5);
    }

    if (isHeart) {
      subset = subset.filter((f) => f.fat <= 15 && f.sodium <= 400);
    }

    // Macro constraints
    subset = subset.filter((f) => f.protein >= 8 && f.fat >= 3);

    if (!subset.length) return [];

    subset = subset.filter((f) => !used.has(f.food_name));
    if (!subset.length) return [];

    subset = subset
      .map((f) => ({
        ...f,
        cal_diff: Math.abs(f.calories - perMeal),
      }))
      .sort((a, b) => a.cal_diff - b.cal_diff);

    const best = subset.slice(0, Math.min(20, subset.length));

    let selected = null;
    const attempts = 500;

    for (let i = 0; i < attempts; i++) {
      const n = Math.min(2, best.length);
      const chosen = [];
      while (chosen.length < n) {
        const idx = Math.floor(Math.random() * best.length);
        if (!chosen.includes(best[idx])) chosen.push(best[idx]);
      }
      const totalCal = chosen.reduce((s, f) => s + f.calories, 0);
      if (totalCal >= perMeal * 0.8 && totalCal <= perMeal * 1.2) {
        selected = chosen;
        break;
      }
    }

    if (!selected) {
      selected = [best[0]];
    }

    selected.forEach((f) => used.add(f.food_name));
    return selected;
  }

  const mealsObj = {};
  let allItems = [];

  for (const m of meals) {
    const items = pickMealItems(m);
    mealsObj[m] = items;
    allItems = allItems.concat(items);
  }

  if (!allItems.length) {
    return {
      bmi,
      totalTarget,
      totalCalories: 0,
      totalProtein: 0,
      totalFat: 0,
      totalSugar: 0,
      totalSodium: 0,
      match: 0,
      meals: mealsObj,
    };
  }

  const totalCalories = allItems.reduce((s, f) => s + f.calories, 0);
  const totalProtein = allItems.reduce((s, f) => s + f.protein, 0);
  const totalFat = allItems.reduce((s, f) => s + f.fat, 0);
  const totalSugar = allItems.reduce((s, f) => s + f.sugar, 0);
  const totalSodium = allItems.reduce((s, f) => s + f.sodium, 0);
  const match = (1 - Math.abs(totalCalories - totalTarget) / totalTarget) * 100;

  return {
    bmi,
    totalTarget,
    totalCalories,
    totalProtein,
    totalFat,
    totalSugar,
    totalSodium,
    match,
    meals: mealsObj,
  };
}

exports.recommendMeals = (req, res) => {
  try {
    const {
      name,
      age,
      weight_kg,
      height_cm,
      activity_level,
      preference,
      disease,
    } = req.body;

    if (!name || !weight_kg || !height_cm || !activity_level || !preference) {
      return res.status(400).json({
        error:
          "Missing required fields: name, weight_kg, height_cm, activity_level, preference",
      });
    }

    const user = {
      name,
      age,
      weight_kg: Number(weight_kg),
      height_cm: Number(height_cm),
      activity_level,
      preference,
      disease: disease || "",
    };

    const result = recommendMealsForUser(user);

    return res.json({
      user,
      summary: {
        bmi: result.bmi,
        target_calories: result.totalTarget,
        total_calories: result.totalCalories,
        total_protein: result.totalProtein,
        total_fat: result.totalFat,
        total_sugar: result.totalSugar,
        total_sodium: result.totalSodium,
        calorie_match_percent: result.match,
      },
      meals: result.meals,
    });
  } catch (err) {
    console.error("Recommendation error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
