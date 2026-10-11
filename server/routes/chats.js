const express = require("express");
const { requireAuth } = require("../middleware/auth");
const Chat = require("../models/Chat");
const router = express.Router();
router.use(requireAuth);

router.get("/", (req, res) => res.json({ chats: Chat.list(req.userId) }));
router.post("/", (req, res) => res.json({ chat: Chat.create(req.userId) }));
router.get("/:id", (req, res) => {
  const c = Chat.get(req.params.id, req.userId);
  return c ? res.json({ chat: c }) : res.status(404).json({ message: "Chat not found" });
});
router.patch("/:id", (req, res) => {
  const c = Chat.rename(req.params.id, req.userId, req.body.title || "");
  return c ? res.json({ chat: c }) : res.status(404).json({ message: "Chat not found" });
});
router.delete("/:id", (req, res) =>
  Chat.remove(req.params.id, req.userId) ? res.json({ message: "Deleted" }) : res.status(404).json({ message: "Chat not found" }));

module.exports = router;
