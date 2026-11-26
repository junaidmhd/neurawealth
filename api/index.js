const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("../routes/auth");
const notesRoutes = require("../routes/notes");
const chatsRoutes = require("../routes/chats");
const habitsRoutes = require("../routes/habits");
const aiRoutes = require("../routes/ai");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
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
    console.error("MongoDB error:", err.message);
    return res.status(503).json({ message: "Database temporarily unavailable: " + err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/habits", habitsRoutes);
app.use("/api/ai", aiRoutes);

app.get("/api/health", (req, res) => res.json({
  status: "ok",
  mongoUri: !!process.env.MONGODB_URI,
  jwtSecret: !!process.env.JWT_SECRET,
  groqKey: !!process.env.GROQ_API_KEY
}));

app.use((req, res) => {
  res.status(404).json({ message: "API route not found", path: req.path, method: req.method });
});

module.exports = app;
