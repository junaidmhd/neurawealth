const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("../routes/auth");
const notesRoutes = require("../routes/notes");
const chatsRoutes = require("../routes/chats");
const habitsRoutes = require("../routes/habits");

const app = express();

// MongoDB connection (cached for serverless)
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
}

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || origin.endsWith(".vercel.app") || origin.includes("localhost")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ message: "Database temporarily unavailable" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/habits", habitsRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

module.exports = app;
