// "Daily 1%" — tiny money habits, one check-in per day, stored in data/habits.json
const express = require("express");
const fs = require("fs");
const path = require("path");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();
router.use(requireAuth);

const DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
const FILE = path.join(DIR, "habits.json");
const read = () => { try { return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : {}; } catch { return {}; } };
const write = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2), "utf8");

const DEFAULTS = ["Tracked today's spending", "Skipped one impulse buy", "Saved or invested something", "Read 10 minutes of market news", "Reviewed my portfolio"];
const state = (all, uid) => {
  if (!all[uid]) all[uid] = { habits: DEFAULTS.map((t, i) => ({ id: "h" + i, title: t })), log: {} };
  return all[uid];
};
const dayKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "") ? s : new Date().toISOString().slice(0, 10);

router.get("/", (req, res) => { const all = read(); const s = state(all, req.userId); write(all); res.json(s); });

router.post("/toggle", (req, res) => {
  const { habitId, date } = req.body; const day = dayKey(date);
  const all = read(); const s = state(all, req.userId);
  if (!s.habits.some(h => h.id === habitId)) return res.status(404).json({ message: "Habit not found" });
  const done = new Set(s.log[day] || []);
  done.has(habitId) ? done.delete(habitId) : done.add(habitId);
  s.log[day] = [...done]; write(all); res.json(s);
});

router.post("/habits", (req, res) => {
  const title = String(req.body.title || "").trim().slice(0, 80);
  if (!title) return res.status(400).json({ message: "Title required" });
  const all = read(); const s = state(all, req.userId);
  if (s.habits.length >= 12) return res.status(400).json({ message: "Max 12 habits" });
  s.habits.push({ id: "h" + Date.now().toString(36), title }); write(all); res.json(s);
});

router.delete("/habits/:id", (req, res) => {
  const all = read(); const s = state(all, req.userId);
  s.habits = s.habits.filter(h => h.id !== req.params.id); write(all); res.json(s);
});

module.exports = router;
