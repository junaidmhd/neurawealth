const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Routes
const authRoutes = require("../routes/auth");
const notesRoutes = require("../routes/notes");
const chatsRoutes = require("../routes/chats");
const habitsRoutes = require("../routes/habits");

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Cached DB connection for serverless
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    res.status(503).json({ message: "Database temporarily unavailable: " + err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/habits", habitsRoutes);
app.get("/api/health", (req, res) => res.json({ status: "ok", env: !!process.env.MONGODB_URI }));

module.exports = app;
