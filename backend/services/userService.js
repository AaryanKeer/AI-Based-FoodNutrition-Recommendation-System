// backend/services/userService.js
const path = require("path");
const xlsx = require("xlsx");

// Path to Excel
const usersPath = path.join(__dirname, "..", "data", "users.xlsx");

// Load once at startup
let users = [];

function loadUsers() {
  try {
    const wb = xlsx.readFile(usersPath);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];

    // Convert to JSON
    const json = xlsx.utils.sheet_to_json(sheet, { defval: null });

    // Normalize keys: lower + replace spaces + brackets
    users = json.map((row, idx) => {
      const obj = {};
      Object.entries(row).forEach(([key, value]) => {
        const normKey = String(key)
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_")
          .replace("(kg)", "kg")
          .replace("(cm)", "cm");
        obj[normKey] = value;
      });
      // Add an id field
      obj.id = idx + 1;
      return obj;
    });

    console.log(`✅ Loaded ${users.length} users from Excel`);
  } catch (err) {
    console.error("❌ Failed to load users.xlsx:", err.message);
    users = [];
  }
}

function getUsers() {
  if (!users.length) loadUsers();
  return users;
}

function findUserByEmail(email) {
  const all = getUsers();
  const e = (email || "").trim().toLowerCase();
  return all.find((u) => String(u.email || "").toLowerCase() === e);
}

function findUserByName(name) {
  const all = getUsers();
  const n = (name || "").trim().toLowerCase();
  return all.find((u) => String(u.name || "").toLowerCase() === n);
}

module.exports = {
  loadUsers,
  getUsers,
  findUserByEmail,
  findUserByName,
};
