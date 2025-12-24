// src/pages/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_BASE = "http://localhost:5000";

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "myMeals" | "profile"

  // Profile form
  const [form, setForm] = useState({
    age: 23,
    weight_kg: 70,
    height_cm: 170,
    activity_level: "moderate",
    preference: "vegetarian",
    disease: "",
  });

  const [loadingPlan, setLoadingPlan] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [plan, setPlan] = useState(null); // response from backend
  const [error, setError] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [search, setSearch] = useState("");

  // My Meals state
  const [myMeals, setMyMeals] = useState({
    Breakfast: [],
    Lunch: [],
    Snack: [],
    Dinner: [],
  });

  // ---- Load logged-in user from localStorage ----
  useEffect(() => {
    const stored = localStorage.getItem("nutrigraph_user");
    if (!stored) {
      navigate("/");
      return;
    }
    const u = JSON.parse(stored);
    setUser(u);

    // pre-fill form from user profile if available
    setForm((prev) => ({
      ...prev,
      age: u.age || prev.age,
      weight_kg: u.weight_kg || prev.weight_kg,
      height_cm: u.height_cm || prev.height_cm,
      activity_level: u.activity_level || prev.activity_level,
      preference:
        u.preference === "non_vegetarian"
          ? "non-vegetarian"
          : u.preference || prev.preference,
      disease: u.disease || "",
    }));
  }, [navigate]);

  // ---- Logout ----
  const handleLogout = () => {
    localStorage.removeItem("nutrigraph_user");
    navigate("/");
  };

  // ---- Form change ----
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ---- Save profile to MongoDB ----
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    setProfileMsg("");
    setError("");

    try {
      const payload = {
        id: user._id || user.id,
        age: Number(form.age),
        weight_kg: Number(form.weight_kg),
        height_cm: Number(form.height_cm),
        activity_level: form.activity_level,
        // convert back to backend-friendly value
        preference:
          form.preference === "non-vegetarian"
            ? "non_vegetarian"
            : form.preference,
        disease: form.disease,
      };

      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // update local user + storage
      setUser(data.user);
      localStorage.setItem("nutrigraph_user", JSON.stringify(data.user));
      setProfileMsg("Profile updated successfully ✅");
    } catch (err) {
      console.error(err);
      setError(err.message || "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // ---- Call backend /api/recommend ----
  const handleRecommend = async (e) => {
    e.preventDefault();
    if (!user) return;

    setLoadingPlan(true);
    setError("");
    setPlan(null);

    try {
      const payload = {
        name: user.name,
        age: Number(form.age),
        weight_kg: Number(form.weight_kg),
        height_cm: Number(form.height_cm),
        activity_level: form.activity_level,
        preference: form.preference,
        disease: form.disease,
      };

      const res = await fetch(`${API_BASE}/api/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `API error: ${res.status}`);
      }

      setPlan(data);
    } catch (err) {
      console.error(err);
      setError(
        "Could not fetch recommendation. Is backend running at " + API_BASE + "?"
      );
    } finally {
      setLoadingPlan(false);
    }
  };

  // ---- Add item to My Meals ----
  const handleAddToMeal = (item) => {
    const mealName = item.mealName || "Other";

    setMyMeals((prev) => {
      const current = prev[mealName] || [];
      // avoid duplicates by food_name
      const exists = current.some((m) => m.food_name === item.food_name);
      if (exists) return prev;

      return {
        ...prev,
        [mealName]: [...current, item],
      };
    });

    // switch to My Meals tab
    setActiveTab("myMeals");
  };

  const handleClearMyMeals = () => {
    setMyMeals({
      Breakfast: [],
      Lunch: [],
      Snack: [],
      Dinner: [],
    });
  };

  // ---- Aggregate totals from meals (for summary cards) ----
  const summaryTotals = useMemo(() => {
    if (!plan || !plan.meals) return null;

    const all = Object.values(plan.meals).flat();
    if (!all.length) return null;

    const sum = (key) =>
      all.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);

    return {
      calories: sum("calories"),
      protein: sum("protein"),
      carbs: sum("carbs"),
      fat: sum("fat"),
      fiber: sum("fiber"),
    };
  }, [plan]);

  // ---- Filter foods by search for "Recommendations" list ----
  const recommendedList = useMemo(() => {
    if (!plan || !plan.meals) return [];
    const all = Object.entries(plan.meals).flatMap(([mealName, items]) =>
      items.map((item) => ({
        ...item,
        mealName,
      }))
    );

    if (!search.trim()) return all;

    const s = search.toLowerCase();
    return all.filter((item) =>
      String(item.food_name || "").toLowerCase().includes(s)
    );
  }, [plan, search]);

  const metricCards = [
    { label: "Calories", key: "calories", unit: "kcal" },
    { label: "Protein", key: "protein", unit: "g" },
    { label: "Carbs", key: "carbs", unit: "g" },
    { label: "Fat", key: "fat", unit: "g" },
    { label: "Fiber", key: "fiber", unit: "g" },
  ];

  // ---------- RENDER HELPERS ----------

  const renderProfileForm = () => (
    <form onSubmit={handleSaveProfile} className="profile-form">
      <div className="form-row">
        <label>
          Age
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
            min="10"
            max="90"
          />
        </label>
        <label>
          Activity
          <select
            name="activity_level"
            value={form.activity_level}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          Weight (kg)
          <input
            type="number"
            name="weight_kg"
            value={form.weight_kg}
            onChange={handleChange}
            step="0.1"
          />
        </label>
        <label>
          Height (cm)
          <input
            type="number"
            name="height_cm"
            value={form.height_cm}
            onChange={handleChange}
            step="0.1"
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Preference
          <select
            name="preference"
            value={form.preference}
            onChange={handleChange}
          >
            <option value="vegetarian">Vegetarian</option>
            <option value="non-vegetarian">Non-Vegetarian</option>
            <option value="both">Both</option>
          </select>
        </label>
        <label>
          Disease
          <select
            name="disease"
            value={form.disease}
            onChange={handleChange}
          >
            <option value="">None</option>
            <option value="Diabetes">Diabetes</option>
            <option value="Heart">Heart / Hypertension</option>
          </select>
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" className="primary-btn" disabled={savingProfile}>
          {savingProfile ? "Saving..." : "Save Profile"}
        </button>

        <button
          type="button"
          className="secondary-btn"
          onClick={handleRecommend}
          disabled={loadingPlan}
        >
          {loadingPlan ? "Generating..." : "Recommend Food for Today"}
        </button>
      </div>

      {profileMsg && <p className="success-text">{profileMsg}</p>}
      {error && <p className="error-text">{error}</p>}
    </form>
  );

  const renderRecommendedFoods = () => (
    <section className="recommendations card">
      <h2>Recommended Foods for Today</h2>
      {!plan ? (
        <p className="muted">
          No recommendations yet. Update your profile and click{" "}
          <strong>Recommend Food for Today</strong>.
        </p>
      ) : recommendedList.length === 0 ? (
        <p className="muted">No foods match your search.</p>
      ) : (
        <div className="food-list">
          {recommendedList.map((item, index) => (
            <div key={index} className="food-card">
              <div className="food-header">
                <span className="meal-tag">{item.mealName}</span>
                {item.is_dessert && (
                  <span className="dessert-tag">Dessert</span>
                )}
              </div>
              <h3>{item.food_name}</h3>
              <p>Calories: {item.calories.toFixed(0)} kcal</p>
              <p>
                P: {item.protein.toFixed(1)} g | C:{" "}
                {(item.carbs || 0).toFixed(1)} g | F:{" "}
                {item.fat.toFixed(1)} g
              </p>
              <p className="sub-text">
                Sugar: {item.sugar.toFixed(1)} g | Sodium:{" "}
                {item.sodium.toFixed(0)} mg
              </p>
              <button
                className="secondary-btn"
                onClick={() => handleAddToMeal(item)}
              >
                Add to Meal
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );

  const renderMyMeals = () => (
    <section className="card mymeals-card">
      <div className="mymeals-header">
        <h2>My Meals for Today</h2>
        <button className="secondary-btn" onClick={handleClearMyMeals}>
          Clear All
        </button>
      </div>
      {["Breakfast", "Lunch", "Snack", "Dinner"].map((meal) => (
        <div key={meal} className="mymeal-section">
          <h3>{meal}</h3>
          {(!myMeals[meal] || myMeals[meal].length === 0) ? (
            <p className="muted">No items added yet.</p>
          ) : (
            <div className="mymeal-list">
              {myMeals[meal].map((item, idx) => (
                <div key={idx} className="mymeal-item">
                  <div className="mymeal-main">
                    <strong>{item.food_name}</strong>
                    <span>{item.calories.toFixed(0)} kcal</span>
                  </div>
                  <div className="mymeal-sub">
                    P: {item.protein.toFixed(1)} | C:{" "}
                    {(item.carbs || 0).toFixed(1)} | F:{" "}
                    {item.fat.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </section>
  );

  const renderProfileTab = () => (
    <section className="card profile-card-full">
      <h2>Profile</h2>
      {renderProfileForm()}
    </section>
  );

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <h1 className="logo">NutriTrack</h1>
        <nav className="nav-vertical">
          <button
            className={`nav-link ${
              activeTab === "dashboard" ? "active" : ""
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`nav-link ${activeTab === "myMeals" ? "active" : ""}`}
            onClick={() => setActiveTab("myMeals")}
          >
            My Meals
          </button>
          <button
            className={`nav-link ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          {/* Scanner / Search placeholders left in UI if you want later */}
          <button className="nav-link" disabled>
            Scanner (coming soon)
          </button>
          <button className="nav-link" disabled>
            Search Food (coming soon)
          </button>
          <button className="nav-link logout" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          <input
            type="text"
            className="search-input"
            placeholder="Search food in today's plan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="profile-summary">
            <p>
              <strong>Hello, {user?.name || "User"} 👋</strong>
            </p>
            <p>Diet: {form.preference || "Balanced"}</p>
          </div>
        </div>

        {/* Content depending on tab */}
        {activeTab === "dashboard" && (
          <>
            {/* Profile + Daily Eating Summary */}
            <section className="top-section">
              {/* Profile Form */}
              <div className="card profile-card">
                <h2>Your Profile</h2>
                {renderProfileForm()}
              </div>

              {/* Summary Cards */}
              <section className="summary card">
                <h2>Daily Eating Summary</h2>
                <div className="summary-grid">
                  {metricCards.map((metric) => (
                    <div key={metric.key} className="summary-card">
                      <h3>{metric.label}</h3>
                      <p>
                        {summaryTotals
                          ? `${summaryTotals[metric.key].toFixed(1)} ${
                              metric.unit
                            }`
                          : "--"}
                      </p>
                    </div>
                  ))}
                  <div className="summary-card">
                    <h3>Calorie Match</h3>
                    <p>
                      {plan
                        ? `${plan.summary.calorie_match_percent.toFixed(1)}%`
                        : "--"}
                    </p>
                  </div>
                </div>
              </section>
            </section>

            {/* Recommended Foods */}
            {renderRecommendedFoods()}
          </>
        )}

        {activeTab === "myMeals" && renderMyMeals()}

        {activeTab === "profile" && renderProfileTab()}
      </main>
    </div>
  );
};

export default Dashboard;
