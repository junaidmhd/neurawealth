const express = require("express");
const { requireAuth } = require("../middleware/auth");
const Chat = require("../models/Chat");
const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try { res.json({ chats: await Chat.list(req.userId) }); } 
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.post("/", async (req, res) => {
  try { res.json({ chat: await Chat.create(req.userId) }); }
  catch (e) { res.status(500).json({ message: e.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    const c = await Chat.get(req.params.id, req.userId);
    return c ? res.json({ chat: c }) : res.status(404).json({ message: "Chat not found" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.patch("/:id", async (req, res) => {
  try {
    const c = await Chat.rename(req.params.id, req.userId, req.body.title || "");
    return c ? res.json({ chat: c }) : res.status(404).json({ message: "Chat not found" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    const ok = await Chat.remove(req.params.id, req.userId);
    return ok ? res.json({ message: "Deleted" }) : res.status(404).json({ message: "Chat not found" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
