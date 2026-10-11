import { useState } from "react";
import { apiFetch } from "../api";

const PRESETS = [
  { label: "NIFTY 50 live level", url: "https://www.nseindia.com", goal: "Find the current NIFTY 50 index level and today's % change. Return as JSON: {\"level\": str, \"change_pct\": str}" },
  { label: "Bitcoin price (USD)", url: "https://www.coingecko.com/en/coins/bitcoin", goal: "Find the current Bitcoin price in USD. Return as JSON: {\"price_usd\": str}" },
  { label: "Gold price per 10g (India)", url: "https://www.goodreturns.in/gold-rates/", goal: "Find today's gold price per 10 grams in India. Return as JSON: {\"price_per_10g\": str, \"city\": str}" },
  { label: "USD/INR exchange rate", url: "https://www.google.com/finance/quote/USD-INR", goal: "Find the current USD to INR exchange rate. Return as JSON: {\"rate\": str}" },
];

function StatusBadge({ status }) {
  const map = {
    IDLE: { color: "var(--text-muted)", label: "Ready" },
    RUNNING: { color: "var(--accent-blue)", label: "Fetching…" },
    COMPLETED: { color: "var(--accent-green)", label: "Done" },
    NOT_CONFIGURED: { color: "var(--accent-red)", label: "Key missing" },
    FAILED: { color: "var(--accent-red)", label: "Failed" },
    ERROR: { color: "var(--accent-red)", label: "Error" },
  };
  const s = map[status] || map.IDLE;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, animation: status === "RUNNING" ? "pulse 1.2s infinite" : "none" }} />
      {s.label}
    </div>
  );
}

function pretty(value) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

export default function WebFetch() {
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState("");
  const [status, setStatus] = useState("IDLE");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [runs, setRuns] = useState([]); // history of past fetches this session

  const runFetch = async (presetUrl, presetGoal) => {
    const u = presetUrl ?? url;
    const g = presetGoal ?? goal;
    if (!u.trim() || !g.trim() || status === "RUNNING") return;

    setUrl(u); setGoal(g);
    setStatus("RUNNING");
    setResult(null);
    setMessage(null);

    try {
      const res = await apiFetch("/ai/fetch", {
        method: "POST",
        body: JSON.stringify({ url: u.trim(), goal: g.trim() }),
      });
      const data = await res.json();
      setStatus(data.status || "ERROR");
      if (data.status === "COMPLETED") {
        setResult(data.result);
        setRuns(prev => [{ url: u, goal: g, result: data.result, at: new Date() }, ...prev].slice(0, 8));
      } else {
        setMessage(data.message || "The run didn't complete.");
      }
    } catch (e) {
      setStatus("ERROR");
      setMessage("I'm having trouble connecting. Please ensure the backend server is running on port 5000. 🔧");
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); runFetch(); };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, rgba(139,94,60,0.3), rgba(176,137,104,0.3))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, border: "1px solid rgba(139,94,60,0.3)" }}>🐟</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Live Web Fetch</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                Powered by TinyFish · Pulls live data straight off any webpage
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={{ padding: "24px", flexShrink: 0 }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Page URL</label>
              <input
                type="text" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/prices"
                style={{ width: "100%", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border-bright)", borderRadius: 10, padding: "10px 14px", fontFamily: "monospace", fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>What should it find?</label>
              <textarea
                value={goal} onChange={e => setGoal(e.target.value)} rows={3}
                placeholder='e.g. "Find the current gold price per 10g. Return as JSON: {\"price\": str}"'
                style={{ width: "100%", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border-bright)", borderRadius: 10, padding: "10px 14px", fontFamily: "Outfit", fontSize: 13, color: "var(--text-primary)", outline: "none", boxSizing: "border-box", resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button type="submit" disabled={!url.trim() || !goal.trim() || status === "RUNNING"} style={{
                padding: "10px 20px", borderRadius: 10, border: "none",
                background: url.trim() && goal.trim() && status !== "RUNNING" ? "var(--gradient-btn)" : "rgba(92,64,51,0.06)",
                color: "white", fontWeight: 600, fontSize: 13,
                cursor: url.trim() && goal.trim() && status !== "RUNNING" ? "pointer" : "not-allowed",
              }}>
                {status === "RUNNING" ? "Fetching…" : "Fetch live data"}
              </button>
              <StatusBadge status={status} />
            </div>
          </form>
        </div>

        {/* Result */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 24px" }}>
          {message && (
            <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(179,64,47,0.08)", border: "1px solid rgba(179,64,47,0.25)", fontSize: 13, color: "var(--text-primary)", marginBottom: 16 }}>
              {message}
            </div>
          )}
          {result !== null && (
            <div style={{ padding: "18px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px" }}>Result</div>
              <pre style={{ margin: 0, fontFamily: "monospace", fontSize: 13, color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {pretty(result)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Right panel - presets & history */}
      <div style={{ width: 300, borderLeft: "1px solid var(--border)", overflowY: "auto", padding: "20px 16px", flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quick Fetches</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {PRESETS.map(p => (
            <div key={p.label} onClick={() => runFetch(p.url, p.goal)} style={{
              padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10,
              fontSize: 12, color: "var(--text-secondary)", cursor: "pointer", lineHeight: 1.4, transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-blue)"; e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "rgba(139,94,60,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "var(--bg-card)"; }}
            >
              {p.label}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Fetches</div>
        {runs.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Nothing fetched yet this session.</div>
        )}
        {runs.map((r, i) => (
          <div key={i} style={{ padding: "10px 12px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.url}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{r.at.toLocaleTimeString()}</div>
          </div>
        ))}

        <div style={{ marginTop: 16, padding: "12px", background: "rgba(139,94,60,0.08)", border: "1px solid rgba(139,94,60,0.2)", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-blue)", marginBottom: 4 }}>⚡ How it works</div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            TinyFish's web agent opens the URL, follows your goal in plain English, and returns structured data — no scraper code needed.
          </div>
        </div>
      </div>
    </div>
  );
}
