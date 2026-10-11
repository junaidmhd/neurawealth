import { useState, useEffect, useRef } from "react";
import { useAuth } from "../App";

const STOCKS = [
  { name: "Reliance", ticker: "RELIANCE", sector: "Energy", basePrice: 2800 },
  { name: "TCS", ticker: "TCS", sector: "IT", basePrice: 3900 },
  { name: "HDFC Bank", ticker: "HDFCBANK", sector: "Banking", basePrice: 1600 },
  { name: "Infosys", ticker: "INFY", sector: "IT", basePrice: 1700 },
  { name: "ICICI Bank", ticker: "ICICIBANK", sector: "Banking", basePrice: 1100 },
  { name: "Wipro", ticker: "WIPRO", sector: "IT", basePrice: 480 },
];

const NEWS_EVENTS = [
  { text: "🚀 RBI cuts repo rate by 25bps — Banking stocks rally!", effect: { Banking: 0.06, IT: 0.01 } },
  { text: "📉 Global recession fears mount — Markets fall!", effect: { Energy: -0.07, Banking: -0.05, IT: -0.04 } },
  { text: "💻 India IT exports hit record high!", effect: { IT: 0.08 } },
  { text: "⛽ Crude oil prices crash 15% — Energy pain!", effect: { Energy: -0.09 } },
  { text: "🏦 NPAs rise in banking sector — Caution!", effect: { Banking: -0.06 } },
  { text: "🌍 FII inflows surge ₹12,000Cr — Bull run!", effect: { Banking: 0.04, IT: 0.05, Energy: 0.03 } },
  { text: "📊 Quarterly results beat estimates across board!", effect: { IT: 0.05, Banking: 0.04, Energy: 0.03 } },
  { text: "💸 Rupee weakens to 85/USD — IT benefits!", effect: { IT: 0.06, Energy: -0.02 } },
];

export default function Game() {
  const { user } = useAuth();
  const [cash, setCash] = useState(100000);
  const [portfolio, setPortfolio] = useState({});
  const [prices, setPrices] = useState(() =>
    Object.fromEntries(STOCKS.map((s) => [s.ticker, s.basePrice]))
  );
  const [round, setRound] = useState(1);
  const [event, setEvent] = useState(null);
  const [log, setLog] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [qty, setQty] = useState({});
  const MAX_ROUNDS = 10;

  const totalPortfolioValue = Object.entries(portfolio).reduce(
    (sum, [ticker, q]) => sum + (prices[ticker] || 0) * q,
    0
  );
  const netWorth = cash + totalPortfolioValue;
  const pnl = netWorth - 100000;
  const pnlPct = ((pnl / 100000) * 100).toFixed(1);

  const simulateRound = () => {
    if (round > MAX_ROUNDS) { setGameOver(true); return; }
    const e = NEWS_EVENTS[Math.floor(Math.random() * NEWS_EVENTS.length)];
    setEvent(e);
    setPrices((prev) => {
      const next = { ...prev };
      STOCKS.forEach((s) => {
        const sectorEffect = e.effect[s.sector] || 0;
        const randomNoise = (Math.random() - 0.5) * 0.04;
        const change = 1 + sectorEffect + randomNoise;
        next[s.ticker] = Math.max(10, Math.round(prev[s.ticker] * change));
      });
      return next;
    });
    setLog((prev) => [`Round ${round}: ${e.text}`, ...prev.slice(0, 9)]);
    setRound((r) => r + 1);
    if (round >= MAX_ROUNDS) setGameOver(true);
  };

  const buy = (ticker) => {
    const q = parseInt(qty[ticker] || 1);
    const cost = prices[ticker] * q;
    if (cost > cash) return alert("Not enough cash!");
    setCash((c) => c - cost);
    setPortfolio((p) => ({ ...p, [ticker]: (p[ticker] || 0) + q }));
    setLog((prev) => [`Bought ${q}x ${ticker} @ ₹${prices[ticker]}`, ...prev.slice(0, 9)]);
  };

  const sell = (ticker) => {
    const q = parseInt(qty[ticker] || 1);
    const held = portfolio[ticker] || 0;
    if (q > held) return alert("Not enough shares!");
    setCash((c) => c + prices[ticker] * q);
    setPortfolio((p) => { const n = { ...p }; n[ticker] -= q; if (n[ticker] === 0) delete n[ticker]; return n; });
    setLog((prev) => [`Sold ${q}x ${ticker} @ ₹${prices[ticker]}`, ...prev.slice(0, 9)]);
  };

  const reset = () => {
    setCash(100000); setPortfolio({}); setRound(1); setEvent(null); setLog([]); setGameOver(false);
    setPrices(Object.fromEntries(STOCKS.map((s) => [s.ticker, s.basePrice])));
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>📈 Market Simulator</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Practice investing with ₹1,00,000 virtual cash — {MAX_ROUNDS - round + 1} rounds left
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={simulateRound} disabled={gameOver} style={{ padding: "10px 20px", background: "var(--gradient-btn)", border: "none", borderRadius: 10, color: "white", fontFamily: "Outfit", fontWeight: 600, cursor: gameOver ? "not-allowed" : "pointer", opacity: gameOver ? 0.5 : 1 }}>
            ⏭ Next Round
          </button>
          <button onClick={reset} style={{ padding: "10px 20px", background: "rgba(92,64,51,0.06)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-secondary)", fontFamily: "Outfit", cursor: "pointer" }}>
            🔄 Reset
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Cash", value: `₹${cash.toLocaleString("en-IN")}`, color: "var(--accent-blue)" },
          { label: "Portfolio Value", value: `₹${totalPortfolioValue.toLocaleString("en-IN")}`, color: "var(--accent-violet)" },
          { label: "Net Worth", value: `₹${netWorth.toLocaleString("en-IN")}`, color: "var(--accent-green)" },
          { label: "P&L", value: `${pnl >= 0 ? "+" : ""}₹${pnl.toLocaleString("en-IN")} (${pnlPct}%)`, color: pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Event banner */}
      {event && (
        <div style={{ background: "rgba(139,94,60,0.1)", border: "1px solid rgba(139,94,60,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, fontSize: 14, fontWeight: 600 }}>
          {event.text}
        </div>
      )}

      {gameOver && (
        <div style={{ background: pnl >= 0 ? "rgba(74,124,89,0.12)" : "rgba(179,64,47,0.12)", border: `1px solid ${pnl >= 0 ? "rgba(74,124,89,0.3)" : "rgba(179,64,47,0.3)"}`, borderRadius: 12, padding: "20px 24px", marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 28 }}>{pnl >= 0 ? "🏆" : "📉"}</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 8 }}>Game Over! Final Net Worth: ₹{netWorth.toLocaleString("en-IN")}</div>
          <div style={{ fontSize: 14, color: pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)", marginTop: 4 }}>
            {pnl >= 0 ? `You made a profit of ₹${pnl.toLocaleString("en-IN")} 🎉` : `You lost ₹${Math.abs(pnl).toLocaleString("en-IN")} 😔`}
          </div>
        </div>
      )}

      {/* Stock grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {STOCKS.map((s) => {
          const change = prices[s.ticker] - s.basePrice;
          const changePct = ((change / s.basePrice) * 100).toFixed(1);
          const held = portfolio[s.ticker] || 0;
          return (
            <div key={s.ticker} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{s.ticker} · {s.sector}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>₹{prices[s.ticker].toLocaleString("en-IN")}</div>
                  <div style={{ fontSize: 12, color: change >= 0 ? "var(--accent-green)" : "var(--accent-red)" }}>
                    {change >= 0 ? "▲" : "▼"} {Math.abs(changePct)}%
                  </div>
                </div>
              </div>
              {held > 0 && <div style={{ fontSize: 11, color: "var(--accent-blue)", marginBottom: 8 }}>Held: {held} shares (₹{(held * prices[s.ticker]).toLocaleString("en-IN")})</div>}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="number" min="1" value={qty[s.ticker] || 1} onChange={(e) => setQty((q) => ({ ...q, [s.ticker]: e.target.value }))}
                  style={{ width: 60, padding: "6px 8px", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontFamily: "Outfit", fontSize: 12 }} />
                <button onClick={() => buy(s.ticker)} disabled={gameOver} style={{ flex: 1, padding: "7px 0", background: "rgba(74,124,89,0.15)", border: "1px solid rgba(74,124,89,0.3)", borderRadius: 8, color: "var(--accent-green)", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "Outfit" }}>Buy</button>
                <button onClick={() => sell(s.ticker)} disabled={gameOver || !held} style={{ flex: 1, padding: "7px 0", background: "rgba(179,64,47,0.15)", border: "1px solid rgba(179,64,47,0.3)", borderRadius: 8, color: "var(--accent-red)", cursor: held && !gameOver ? "pointer" : "not-allowed", opacity: held ? 1 : 0.4, fontSize: 12, fontWeight: 600, fontFamily: "Outfit" }}>Sell</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log */}
      {log.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>Activity Log</div>
          {log.map((l, i) => (
            <div key={i} style={{ fontSize: 12, color: "var(--text-secondary)", padding: "4px 0", borderBottom: i < log.length - 1 ? "1px solid rgba(92,64,51,0.04)" : "none" }}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
}
