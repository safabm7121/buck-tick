const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const authenticateToken = require("../middleware/authMiddleware.js");

const router = express.Router();
const dbPath = path.join(__dirname, "../db.json");

function readUsers() {
  if (!fs.existsSync(dbPath)) return [];
  try {
    const data = fs.readFileSync(dbPath);
    const json = JSON.parse(data);
    return json.users || [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(dbPath, JSON.stringify({ users }, null, 2));
}

// Signup
router.post("/signup", (req, res) => {
  const { name, email, password, profileImage, signupDate } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required" });
  }

  const users = readUsers();
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    name,
    email,
    password: hashedPassword,
    profileImage: profileImage || "",
    signupDate: signupDate || new Date().toLocaleDateString(),
  };

  users.push(newUser);
  writeUsers(users);

  return res
    .status(201)
    .json({ message: "Signup successful", user: { name, email } });
});

// Login
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const users = readUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(400).json({ message: "User not found" });

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid password" });

  const token = jwt.sign(
    { email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  return res.json({ message: "Login successful", token });
});

// Account (protected)
router.get("/account", authenticateToken, (req, res) => {
  const users = readUsers();
  const user = users.find((u) => u.email === req.user.email);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
});

module.exports = router;
