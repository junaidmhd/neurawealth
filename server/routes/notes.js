const express = require("express");
const Note = require("../models/Note");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, (req, res) => {
  const notes = Note.findAllByUser(req.userId);
  res.json({ notes, count: notes.length });
});

router.post("/", requireAuth, (req, res) => {
  const { title, content, tag, pinned } = req.body;
  if (!title && !content) {
    return res.status(400).json({ message: "Title or content is required" });
  }
  const note = Note.createNote({ userId: req.userId, title, content, tag, pinned });
  res.status(201).json(note);
});

router.put("/:id", requireAuth, (req, res) => {
  const note = Note.updateNote(req.params.id, req.userId, req.body);
  if (!note) return res.status(404).json({ message: "Note not found" });
  res.json(note);
});

router.delete("/:id", requireAuth, (req, res) => {
  const deleted = Note.deleteNote(req.params.id, req.userId);
  if (!deleted) return res.status(404).json({ message: "Note not found" });
  res.json({ message: "Note deleted" });
});

module.exports = router;
