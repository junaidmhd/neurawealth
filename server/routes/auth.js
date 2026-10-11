const express = require("express");
const User = require("../models/User");
const { requireAuth, signToken } = require("../middleware/auth");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (User.findByEmail(email)) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.createUser({ name, email, password });
    const token = signToken(user);
    res.status(201).json({ user: User.toPublic(user), token });
  } catch (err) {
    res.status(500).json({ message: "Signup failed: " + err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = User.findByEmail(email);
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const valid = await User.verifyPassword(user, password);
    if (!valid) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken(user);
    res.json({ user: User.toPublic(user), token });
  } catch (err) {
    res.status(500).json({ message: "Login failed: " + err.message });
  }
});

router.get("/me", requireAuth, (req, res) => {
  const user = User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: User.toPublic(user) });
});

module.exports = router;
