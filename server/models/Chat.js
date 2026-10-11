// Plain JSON-file store for AI Advisor conversations (no database needed).
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const FILE = path.join(DATA_DIR, "chats.json");

const read = () => { try { return fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : []; } catch { return []; } };
const write = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2), "utf8");
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function list(userId) {
  return read().filter(c => c.userId === userId)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map(({ messages, ...meta }) => ({ ...meta, count: messages.length }));
}
function get(id, userId) { return read().find(c => c._id === id && c.userId === userId) || null; }
function create(userId, title = "New conversation") {
  const all = read(); const now = new Date().toISOString();
  const chat = { _id: newId(), userId, title, messages: [], createdAt: now, updatedAt: now };
  all.unshift(chat); write(all); return chat;
}
function addMessages(id, userId, msgs) {
  const all = read(); const c = all.find(x => x._id === id && x.userId === userId);
  if (!c) return null;
  const now = new Date().toISOString();
  msgs.forEach(m => c.messages.push({ role: m.role, content: m.content, at: now }));
  if (c.title === "New conversation") {
    const first = c.messages.find(m => m.role === "user");
    if (first) c.title = first.content.slice(0, 48) + (first.content.length > 48 ? "…" : "");
  }
  c.updatedAt = now; write(all); return c;
}
function rename(id, userId, title) {
  const all = read(); const c = all.find(x => x._id === id && x.userId === userId);
  if (!c) return null; c.title = String(title).slice(0, 80) || c.title; write(all); return c;
}
function remove(id, userId) {
  const all = read(); const rest = all.filter(c => !(c._id === id && c.userId === userId));
  if (rest.length === all.length) return false; write(rest); return true;
}
module.exports = { list, get, create, addMessages, rename, remove };
