const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const NOTES_FILE = path.join(DATA_DIR, "notes.json");

function readNotes() {
  try {
    if (!fs.existsSync(NOTES_FILE)) return [];
    return JSON.parse(fs.readFileSync(NOTES_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeNotes(notes) {
  fs.writeFileSync(NOTES_FILE, JSON.stringify(notes, null, 2), "utf8");
}

function findAllByUser(userId) {
  return readNotes()
    .filter(n => n.userId === userId)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
}

function findById(id, userId) {
  return readNotes().find(n => n._id === id && n.userId === userId) || null;
}

function createNote({ userId, title, content, tag, pinned }) {
  const notes = readNotes();
  const now = new Date().toISOString();
  const note = {
    _id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    userId,
    title: title || "Untitled note",
    content: content || "",
    tag: tag || "general",
    pinned: !!pinned,
    createdAt: now,
    updatedAt: now,
  };
  notes.unshift(note);
  writeNotes(notes);
  return note;
}

function updateNote(id, userId, updates) {
  const notes = readNotes();
  const idx = notes.findIndex(n => n._id === id && n.userId === userId);
  if (idx === -1) return null;
  const { _id, userId: _uid, createdAt, ...safeUpdates } = updates;
  notes[idx] = { ...notes[idx], ...safeUpdates, updatedAt: new Date().toISOString() };
  writeNotes(notes);
  return notes[idx];
}

function deleteNote(id, userId) {
  const notes = readNotes();
  const filtered = notes.filter(n => !(n._id === id && n.userId === userId));
  const deleted = filtered.length !== notes.length;
  if (deleted) writeNotes(filtered);
  return deleted;
}

module.exports = { readNotes, writeNotes, findAllByUser, findById, createNote, updateNote, deleteNote };
