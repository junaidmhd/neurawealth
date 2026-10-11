# NeuraWealth 🚀

AI-powered wealth management platform — no login required, no database needed.
Financial advisor chatbot that gives suggestions on **where to invest** and **where to spend/budget**, plus a portfolio tracker and market news feed.

## Stack
- **Frontend**: React + Vite (port 5173)
- **Backend**: Express.js (port 5000)
- **Storage**: Plain JSON file (`server/data/assets.json`) — auto-created on first run
- **Live Fetch**: TinyFish web agent API — this is what the UI's "Powered by TinyFish" badge calls; give it a URL and a goal in plain English and it returns structured data scraped from that page (no LLM/chat involved)
- **News**: MarketAux API (falls back to realistic mock data automatically if unavailable/rate-limited)

## Quick Start

### 1. Backend
```bash
cd server
npm install
npm run dev      # or: npm start
```

### 2. Frontend (in a second terminal, from the project root)
```bash
npm install
npm run dev
```

Open http://localhost:5173

## Enabling Live Fetch
Edit `server/.env`:
```
TINYFISH_API_KEY=tf_...        # get one at agent.tinyfish.ai/api-keys
MARKETAUX_API_KEY=...          # optional, for live news instead of mock data
```
You can also set/replace the TinyFish key at runtime from the in-app Settings page, no restart needed.

Without a `TINYFISH_API_KEY`, the Live Fetch page will say the key is missing instead of erroring out.

Once a key is set, Live Fetch:
- Takes a URL and a plain-English goal (e.g. "find the current NIFTY 50 level") and returns structured JSON scraped straight from that page — powered by TinyFish's web agent, not an LLM
- Ships with one-click presets for common finance lookups (index levels, crypto price, gold price, FX rate)
- Keeps a short session history of recent fetches for quick re-reference

## AI Advisor (Groq, no local model needed)
The **AI Advisor** page is a finance chat assistant that calls Groq's hosted API, so nothing heavy runs on your laptop.
1. Get a free key at https://console.groq.com/keys (starts with `gsk_`).
2. Put it in `server/.env` as `GROQ_API_KEY=...` or paste it in the app under Settings, Groq API Key (no restart needed).
3. Optional: change the model with `GROQ_MODEL` (default `llama-3.3-70b-versatile`).

Endpoint: `POST /api/ai/chat` (JWT required). Without a key the page shows a setup message instead of failing.

## What changed
- Removed the old Claude/Anthropic-powered chat advisor entirely — TinyFish has no chat/text-generation capability, so it can't answer open-ended questions the way an LLM could
- Replaced it with "Live Fetch": a TinyFish web-agent feature that scrapes structured data from any URL given a natural-language goal
- Settings page now manages the TinyFish key instead of an Anthropic key

## Notes
A "Notes" page (sidebar → Notes) lets you jot down research, strategy ideas, watchlist items, or reminders.
- Create, edit, pin, and delete notes, each tagged with a category (general/research/strategy/watchlist/reminder)
- Notes are private per account — scoped to the logged-in user's ID, same as Portfolio assets
- Backed by `server/routes/notes.js` + `server/models/Note.js`, exposed at `/api/notes` (all routes require the JWT `Authorization` header)

## Storage
Everything is saved as plain JSON files under `server/data/` — no database setup needed:
- `assets.json` — portfolio holdings
- `notes.json` — notes
- `users.json` — accounts (passwords are bcrypt-hashed)
- `settings.json` — the TinyFish API key if set from the in-app Settings page

The `data/` folder is created automatically on first run.

## Update: saved AI chats, Daily 1%, brown/cream theme
- **AI Advisor history**: every conversation is saved to `server/data/chats.json` (per user). Switching tabs or refreshing no longer loses the chat; the last conversation re-opens automatically and a sidebar lists all saved chats (new / open / delete). Endpoints: `GET/POST /api/chats`, `GET/PATCH/DELETE /api/chats/:id`.
- **Daily 1%** (sidebar): a daily money-habit check-in with streak, 12-week heatmap and a 1.01^days compounding counter. Saved in `server/data/habits.json`. Endpoints under `/api/habits`.
- **Theme**: brown / cream / white palette via CSS variables in `src/index.css`.
