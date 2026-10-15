const express = require("express");

const User = require("../models/User");

const { requireAuth, signToken } = require("../middleware/auth");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// SIGN UP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const user = await User.createUser({
      name,
      email,
      password,
    });

    const token = signToken(user);

    return res.status(201).json({
      user: User.toPublic(user),
      token,
    });
  } catch (err) {
    console.error("Signup error:", err.message);

    if (err.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Signup failed. Please try again.",
    });
  }
});

// LOG IN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const valid = await User.verifyPassword(user, password);

    if (!valid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = signToken(user);

    return res.json({
      user: User.toPublic(user),
      token,
    });
  } catch (err) {
    console.error("Login error:", err.message);

    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
});

// GET CURRENT USER
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json({
      user: User.toPublic(user),
    });
  } catch (err) {
    console.error("Get user error:", err.message);

    return res.status(500).json({
      message: "Could not retrieve user information",
    });
  }
});

module.exports = router;