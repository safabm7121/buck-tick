const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const dbPath = path.join(__dirname, "../db.json");
const SECRET = "bucktick-secret"; // move to env in production

const readDB = () => {
  const data = fs.readFileSync(dbPath, "utf8");
  return data ? JSON.parse(data) : { users: [] };
};

const writeDB = (db) => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
};

// SIGNUP
const signup = (req, res) => {
  const { name, email, password, profileImage, signupDate } = req.body;
  const db = readDB();

  if (db.users.find((u) => u.email === email)) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    name,
    email,
    password: hashedPassword,
    profileImage,
    signupDate,
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({ message: "Signup successful" });
};

// LOGIN
const login = (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const user = db.users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword)
    return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ email: user.email }, SECRET, { expiresIn: "1h" });
  res.json({ message: "Login successful", token });
};

// CREATE (admin use)
const addUser = (res, currentUser) => {
  const db = readDB();
  if (db.users.find((u) => u.email === currentUser.email)) {
    return res.status(409).json({ message: "User already exists" });
  }

  const hashedPassword = bcrypt.hashSync(currentUser.password, 10);
  const newUser = { ...currentUser, password: hashedPassword };

  db.users.push(newUser);
  writeDB(db);

  return res.status(201).json({ message: "User added to database" });
};

// READ ALL
const getAllUsers = (res) => {
  const db = readDB();
  res.json(db.users);
};

// READ ONE
const getUserByEmail = (res, email) => {
  const db = readDB();
  const user = db.users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

// UPDATE
const updateUser = (res, email, updates) => {
  const db = readDB();
  const idx = db.users.findIndex((u) => u.email === email);
  if (idx === -1) return res.status(404).json({ message: "User not found" });

  if (updates.password) {
    updates.password = bcrypt.hashSync(updates.password, 10);
  }

  db.users[idx] = { ...db.users[idx], ...updates };
  writeDB(db);

  res.json({ message: "User updated", user: db.users[idx] });
};

// DELETE
const deleteUser = (res, email) => {
  const db = readDB();
  const newUsers = db.users.filter((u) => u.email !== email);
  if (newUsers.length === db.users.length) {
    return res.status(404).json({ message: "User not found" });
  }

  db.users = newUsers;
  writeDB(db);

  res.json({ message: "User deleted" });
};

module.exports = {
  signup,
  login,
  addUser,
  getAllUsers,
  getUserByEmail,
  updateUser,
  deleteUser,
};
