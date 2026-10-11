const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const https = require("https");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");
const chatsRoutes = require("./routes/chats");
const habitsRoutes = require("./routes/habits");
const Chat = require("./models/Chat");
const { requireAuth } = require("./middleware/auth");
const { buildAiInvestmentContext } = require("./lib/aiContext");

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());

/* ─── AUTH ─── */
app.use("/api/auth", authRoutes);

/* ─── NOTES ─── */
app.use("/api/notes", notesRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/habits", habitsRoutes);

/* ─── TEXT FILE STORAGE ─── */
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const ASSETS_FILE = path.join(DATA_DIR, "assets.json");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return {};
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
  } catch { return {}; }
}
function writeSettings(data) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf8");
}
// The key a logged-in admin has saved via the Settings page always wins over
// the .env fallback, so you can swap keys at runtime without restarting.
function getTinyfishKey() {
  const saved = readSettings().tinyfishApiKey;
  if (saved) return saved;
  return process.env.TINYFISH_API_KEY;
}

// Groq key: same pattern as the TinyFish key — Settings page value wins over .env.
function getGroqKey() {
  const saved = readSettings().groqApiKey;
  if (saved) return saved;
  return process.env.GROQ_API_KEY;
}
function groqConfigured(key) {
  return !!key && !key.startsWith("your_") && key.trim().length > 10;
}

function readAssets() {
  try {
    if (!fs.existsSync(ASSETS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ASSETS_FILE, "utf8"));
  } catch { return []; }
}
function writeAssets(data) {
  fs.writeFileSync(ASSETS_FILE, JSON.stringify(data, null, 2), "utf8");
}

/* ─── SETTINGS (global API key, editable from the UI) ─── */
app.get("/api/settings/api-key", requireAuth, (req, res) => {
  const key = getTinyfishKey();
  const configured = !!key && !key.startsWith("your_");
  res.json({
    configured,
    masked: configured ? `${key.slice(0, 6)}...${key.slice(-4)}` : null,
    source: readSettings().tinyfishApiKey ? "settings" : "env",
  });
});

app.post("/api/settings/api-key", requireAuth, (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return res.status(400).json({ message: "apiKey is required" });
  }
  const settings = readSettings();
  settings.tinyfishApiKey = apiKey.trim();
  writeSettings(settings);
  res.json({ message: "API key saved" });
});

app.delete("/api/settings/api-key", requireAuth, (req, res) => {
  const settings = readSettings();
  delete settings.tinyfishApiKey;
  writeSettings(settings);
  res.json({ message: "API key cleared, falling back to .env" });
});

/* ─── SETTINGS: Groq key ─── */
app.get("/api/settings/groq-key", requireAuth, (req, res) => {
  const key = getGroqKey();
  const configured = groqConfigured(key);
  res.json({
    configured,
    masked: configured ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
    source: readSettings().groqApiKey ? "settings" : "env",
    model: process.env.GROQ_MODEL || GROQ_DEFAULT_MODEL,
  });
});
app.post("/api/settings/groq-key", requireAuth, (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return res.status(400).json({ message: "apiKey is required" });
  }
  const settings = readSettings();
  settings.groqApiKey = apiKey.trim();
  writeSettings(settings);
  res.json({ message: "Groq API key saved" });
});
app.delete("/api/settings/groq-key", requireAuth, (req, res) => {
  const settings = readSettings();
  delete settings.groqApiKey;
  writeSettings(settings);
  res.json({ message: "Groq key cleared, falling back to .env" });
});

/* ─── ASSETS (scoped to the logged-in user) ─── */
function userAssets(userId) {
  return readAssets().filter(a => a.userId === userId);
}

app.get("/api/assets", requireAuth, (req, res) => {
  const assets = userAssets(req.userId);
  const total = assets.reduce((sum, a) => sum + a.price * a.quantity, 0);
  res.json({ assets, totalValue: total });
});

app.get("/api/assets/summary", requireAuth, (req, res) => {
  const assets = userAssets(req.userId);
  const totalValue = assets.reduce((s, a) => s + a.price * a.quantity, 0);
  const byType = {};
  assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + a.price * a.quantity; });
  res.json({ totalValue, count: assets.length, byType });
});

app.post("/api/assets", requireAuth, (req, res) => {
  const { name, ticker, type, price, quantity, notes } = req.body;
  if (!name || !price || !quantity) return res.status(400).json({ message: "Name, price, quantity required" });
  const assets = readAssets();
  const asset = {
    _id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    userId: req.userId,
    name, ticker, type: type || "Stock",
    price: parseFloat(price),
    quantity: parseFloat(quantity),
    notes: notes || "",
    createdAt: new Date().toISOString(),
  };
  assets.unshift(asset);
  writeAssets(assets);
  res.status(201).json(asset);
});

app.put("/api/assets/:id", requireAuth, (req, res) => {
  const assets = readAssets();
  const idx = assets.findIndex(a => a._id === req.params.id && a.userId === req.userId);
  if (idx === -1) return res.status(404).json({ message: "Asset not found" });
  assets[idx] = { ...assets[idx], ...req.body, _id: assets[idx]._id, userId: assets[idx].userId };
  writeAssets(assets);
  res.json(assets[idx]);
});

app.delete("/api/assets/:id", requireAuth, (req, res) => {
  const assets = readAssets();
  const filtered = assets.filter(a => !(a._id === req.params.id && a.userId === req.userId));
  if (filtered.length === assets.length) return res.status(404).json({ message: "Asset not found" });
  writeAssets(filtered);
  res.json({ message: "Asset deleted" });
});

/* ─── AI (TinyFish web agent) ─── */
// Runs a TinyFish agent automation (goal + url) via the streaming /run-sse endpoint
// and resolves once the run reaches a terminal state, returning the final event payload.
function runTinyfishAgent(apiKey, { url, goal }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ url, goal });
    const req2 = https.request({
      hostname: "agent.tinyfish.ai",
      path: "/v1/automation/run-sse",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
        "Content-Length": Buffer.byteLength(body),
      },
    }, (r) => {
      let buffer = "";
      let lastEvent = null;
      let settled = false;

      // Non-2xx responses (bad/expired key, malformed request, etc.) usually come back
      // as a plain JSON error body, not an SSE stream — catch that case explicitly
      // instead of silently falling through to "stream ended with no result".
      if (r.statusCode < 200 || r.statusCode >= 300) {
        let raw = "";
        r.on("data", (chunk) => { raw += chunk.toString("utf8"); });
        r.on("end", () => {
          if (settled) return;
          settled = true;
          let errMsg = `TinyFish request failed (HTTP ${r.statusCode})`;
          try {
            const parsed = JSON.parse(raw);
            errMsg = parsed.error?.message || parsed.error || parsed.message || errMsg;
          } catch { /* body wasn't JSON, keep the generic message */ }
          if (r.statusCode === 401 || r.statusCode === 403) {
            errMsg = "TinyFish rejected the API key (unauthorized). Check that the key in Settings or server/.env is a valid key from agent.tinyfish.ai/api-keys (it should start with 'tf_').";
          }
          resolve({ status: "FAILED", error: errMsg });
        });
        return;
      }

      r.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep any partial line for the next chunk
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const event = JSON.parse(payload);
            lastEvent = event;
            const status = (event.status || event.type || "").toString().toUpperCase();
            if (["COMPLETED", "FAILED", "CANCELLED", "ERROR"].includes(status)) {
              settled = true;
              resolve(event);
              r.destroy();
            }
          } catch {
            // ignore malformed/partial SSE frames
          }
        }
      });

      r.on("end", () => {
        if (!settled) resolve(lastEvent || { status: "FAILED", error: "Stream ended with no result" });
      });
      r.on("error", (err) => { if (!settled) reject(err); });
    });
    req2.on("error", reject);
    req2.write(body);
    req2.end();
  });
}

app.post("/api/ai/fetch", requireAuth, async (req, res) => {
  try {
    const { url, goal } = req.body;
    if (!url || !goal) return res.status(400).json({ message: "url and goal are required" });

    const apiKey = getTinyfishKey();
    if (!apiKey || apiKey.startsWith("your_")) {
      return res.json({
        status: "NOT_CONFIGURED",
        message: "Add a TinyFish API key in Settings (or TINYFISH_API_KEY in server/.env) to enable live web fetches.",
      });
    }

    const event = await runTinyfishAgent(apiKey, { url, goal });
    const status = (event.status || event.type || "UNKNOWN").toString().toUpperCase();

    if (status === "COMPLETED") {
      return res.json({ status, result: event.result ?? event.data ?? event });
    }
    return res.status(502).json({
      status,
      message: event.error?.message || event.error || "TinyFish run did not complete successfully",
    });
  } catch (error) {
    res.status(500).json({ status: "ERROR", message: "TinyFish error: " + error.message });
  }
});

/* ─── AI ADVISOR (Groq hosted LLM — nothing runs on the local machine) ─── */
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

function groqChat(apiKey, messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: process.env.GROQ_MODEL || GROQ_DEFAULT_MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 700,
    });
    const r = https.request({
      hostname: "api.groq.com",
      path: "/openai/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 30000,
    }, (resp) => {
      let raw = "";
      resp.on("data", (c) => (raw += c.toString("utf8")));
      resp.on("end", () => {
        let parsed = null;
        try { parsed = JSON.parse(raw); } catch { /* non-JSON body */ }
        if (resp.statusCode >= 200 && resp.statusCode < 300) {
          const text = parsed?.choices?.[0]?.message?.content;
          return text ? resolve(text) : reject(new Error("Groq returned an empty reply"));
        }
        const detail = parsed?.error?.message || `HTTP ${resp.statusCode}`;
        const err = new Error(detail);
        err.status = resp.statusCode;
        reject(err);
      });
    });
    r.on("timeout", () => r.destroy(new Error("Groq request timed out")));
    r.on("error", reject);
    r.write(body);
    r.end();
  });
}

const ADVISOR_SYSTEM = `You are NeuraWealth's educational finance assistant for Indian retail investors.
Give clear, practical, balanced guidance on investing, budgeting and spending (prices in INR unless asked otherwise).
Use the user's tracked portfolio and current market news as context to tell them what is a good long-term buy candidate, what should be a watchlist item, and what to avoid or trim for long-term risk.
Rules: keep answers under 220 words; use short paragraphs or a few bullets; explain risks, not only upsides;
never promise returns; never invent live prices or news — if asked for a current figure, tell the user to use the Live Fetch page;
remind the user once, briefly, that this is general information and not licensed investment advice.`;

app.post("/api/ai/chat", requireAuth, async (req, res) => {
  try {
    const apiKey = getGroqKey();
    if (!groqConfigured(apiKey)) {
      return res.json({
        status: "NOT_CONFIGURED",
        message: "Add a Groq API key in Settings (or GROQ_API_KEY in server/.env) to enable the AI advisor.",
      });
    }
    const incoming = Array.isArray(req.body.messages) ? req.body.messages : [];
    const history = incoming
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));
    if (!history.length || history[history.length - 1].role !== "user") {
      return res.status(400).json({ message: "A user message is required" });
    }

    const assets = userAssets(req.userId);
    let marketNews = Array.isArray(req.body.marketNews) ? req.body.marketNews : [];
    if (!marketNews.length) {
      marketNews = (MOCK_NEWS.data || []).slice(0, 5);
    }

    let context = "";
    if (req.body.includePortfolio !== false) {
      context = `\n${buildAiInvestmentContext({ assets, marketNews })}`;
    } else if (marketNews.length) {
      context = `\nRecent market news context:\n${marketNews.slice(0, 4).map((item, index) => `${index + 1}. ${item.title}${item.source ? ` (${item.source})` : ''}`).join('\n')}`;
    }

    const reply = await groqChat(apiKey, [{ role: "system", content: ADVISOR_SYSTEM + context }, ...history]);

    // Save both sides of the exchange to the user's chat history file.
    let chatId = req.body.chatId;
    if (!chatId || !Chat.get(chatId, req.userId)) chatId = Chat.create(req.userId)._id;
    Chat.addMessages(chatId, req.userId, [history[history.length - 1], { role: "assistant", content: reply }]);
    res.json({ status: "COMPLETED", reply, chatId });
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      return res.status(502).json({ status: "FAILED", message: "Groq rejected the API key. Check it in Settings (keys start with 'gsk_')." });
    }
    if (error.status === 429) {
      return res.status(429).json({ status: "RATE_LIMITED", message: "Groq rate limit reached. Wait a moment and try again." });
    }
    res.status(500).json({ status: "ERROR", message: "AI advisor error: " + error.message });
  }
});

/* ─── NEWS ─── */
// Uses built-in https module — works on Node 14/16/18+ without fetch
function httpsGetJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (r) => {
      let data = "";
      r.on("data", chunk => data += chunk);
      r.on("end", () => {
        if (r.statusCode >= 400) return reject(new Error(`HTTP ${r.statusCode}`));
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

const MOCK_NEWS = { data: [
  { title: "Nifty 50 hits all-time high as FII inflows surge", description: "FIIs poured ₹8,200 crore into Indian equities, pushing Nifty to record levels amid positive global cues.", url: "https://economictimes.indiatimes.com", source: "Economic Times", published_at: new Date().toISOString(), entities: [{ symbol: "NIFTY", sentiment_score: 0.78 }] },
  { title: "Bitcoin surpasses $72,000 amid institutional buying", description: "BTC crossed $72,000 as major hedge funds and pension funds increased crypto allocations.", url: "https://coindesk.com", source: "CoinDesk", published_at: new Date().toISOString(), entities: [{ symbol: "BTC", sentiment_score: 0.65 }] },
  { title: "RBI holds repo rate steady at 6.5%", description: "RBI signals potential cuts later in the year if inflation moderates.", url: "https://rbi.org.in", source: "RBI", published_at: new Date().toISOString(), entities: [{ symbol: "INR", sentiment_score: 0.51 }] },
  { title: "NVIDIA Q1 earnings beat estimates; stock up 12%", description: "Record $26B revenue driven by exploding AI chip demand from cloud providers.", url: "https://nvidia.com", source: "Reuters", published_at: new Date().toISOString(), entities: [{ symbol: "NVDA", sentiment_score: 0.88 }] },
  { title: "Gold prices drop 2% on strong dollar", description: "A rebounding US dollar pushed gold lower as safe-haven demand faded.", url: "https://mcxindia.com", source: "MCX India", published_at: new Date().toISOString(), entities: [{ symbol: "GOLD", sentiment_score: 0.28 }] },
  { title: "Sensex gains 800 points; IT and banking stocks lead", description: "TCS and Infosys strong results pushed Sensex higher while credit growth improved.", url: "https://bseindia.com", source: "BSE India", published_at: new Date().toISOString(), entities: [{ symbol: "SENSEX", sentiment_score: 0.72 }] },
  { title: "Adani Ports posts record quarterly revenue", description: "Strong cargo volumes and new terminal additions drove a 22% YoY revenue jump.", url: "https://adaniports.com", source: "NSE India", published_at: new Date().toISOString(), entities: [{ symbol: "ADANIPORTS", sentiment_score: 0.80 }] },
  { title: "Crude oil dips below $80 on demand concerns", description: "Weak China manufacturing data and rising US inventory sent crude prices lower.", url: "https://oilprice.com", source: "OilPrice", published_at: new Date().toISOString(), entities: [{ symbol: "CRUDE", sentiment_score: 0.22 }] },
  { title: "Reliance Industries eyes $10B green energy push", description: "RIL announced major capex plans for solar and hydrogen projects across India.", url: "https://ril.com", source: "Business Standard", published_at: new Date().toISOString(), entities: [{ symbol: "RELIANCE", sentiment_score: 0.74 }] },
]};

app.get("/api/news", async (req, res) => {
  try {
    const apiToken = process.env.MARKETAUX_API_KEY || "";
    if (!apiToken) {
      console.log("ℹ️  No MARKETAUX_API_KEY — serving mock news data");
      return res.json(MOCK_NEWS);
    }
    const symbols = req.query.symbols || "TSLA,AAPL,BTCUSD,NVDA,NIFTY";
    const url = `https://api.marketaux.com/v1/news/all?symbols=${symbols}&filter_entities=true&language=en&api_token=${apiToken}`;
    const data = await httpsGetJSON(url);
    res.json(data);
  } catch (err) {
    console.log("⚠️  News API failed, using mock data:", err.message);
    res.json(MOCK_NEWS);
  }
});

app.get("/", (req, res) => res.json({ message: "NeuraWealth Backend 🚀", mode: "jwt-auth, file-storage" }));
app.get("/api/message", (req, res) => res.json({ message: "Backend Connected 🚀" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 NeuraWealth on http://localhost:${PORT}`);
  console.log(`📁 Storage: ${DATA_DIR}`);
  console.log(`🔐 JWT auth required for /api/assets, /api/ai/fetch and /api/ai/chat\n`);
});
