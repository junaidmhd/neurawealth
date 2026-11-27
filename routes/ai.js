const express = require("express");
const { requireAuth } = require("../middleware/auth");
const Chat = require("../models/Chat");
const { buildSystemPrompt } = require("../lib/aiContext");
const router = express.Router();
router.use(requireAuth);

router.post("/chat", async (req, res) => {
  try {
    const { messages = [], includePortfolio = false, marketNews = [], chatId } = req.body;
    if (!messages.length) return res.status(400).json({ message: "No messages provided" });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) return res.status(503).json({ message: "AI service not configured." });

    const systemPrompt = buildSystemPrompt({ includePortfolio, assets: [], marketNews });

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [{ role: "system", content: systemPrompt }, ...messages.slice(-10)],
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const groqData = await groqRes.json();
    if (!groqRes.ok) return res.status(502).json({ message: groqData.error?.message || "AI service error" });

    const reply = groqData.choices?.[0]?.message?.content || "I could not generate a response.";

    let currentChatId = chatId;
    try {
      if (!currentChatId) {
        const newChat = await Chat.create(req.userId);
        currentChatId = newChat._id;
      }
      const userMsg = messages[messages.length - 1];
      await Chat.addMessages(currentChatId, req.userId, [
        { role: userMsg.role, content: userMsg.content },
        { role: "assistant", content: reply }
      ]);
    } catch (e) { console.error("Chat save error:", e.message); }

    return res.json({ status: "COMPLETED", reply, chatId: currentChatId });
  } catch (err) {
    console.error("AI route error:", err.message);
    return res.status(500).json({ message: "AI error: " + err.message });
  }
});

module.exports = router;
