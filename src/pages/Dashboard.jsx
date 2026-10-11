import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { apiFetch } from "../api";

function MiniEarth() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 130, H = 130; let rot = 0;
    const dots = [];
    function isLand(lat, lon) {
      if (lat > 15 && lat < 75 && lon > -170 && lon < -50) return true;
      if (lat > -55 && lat < 15 && lon > -85 && lon < -32) return true;
      if (lat > 35 && lat < 70 && lon > -10 && lon < 40) return true;
      if (lat > -35 && lat < 38 && lon > -20 && lon < 52) return true;
      if (lat > 0 && lat < 75 && lon > 25 && lon < 145) return true;
      if (lat > -45 && lat < -10 && lon > 113 && lon < 155) return true;
      return false;
    }
    for (let la = -80; la <= 80; la += 7) for (let lo = -180; lo <= 180; lo += 7)
      dots.push({ lat: la * Math.PI / 180, lon: lo * Math.PI / 180, land: isLand(la, lo) });

    function xyz(lat, lon, r) { return { x: r * Math.cos(lat) * Math.cos(lon), y: r * Math.sin(lat), z: r * Math.cos(lat) * Math.sin(lon) }; }
    function proj(x, y, z, rot, cx, cy) {
      const cr = Math.cos(rot), sr = Math.sin(rot), rx = x * cr - z * sr, rz = x * sr + z * cr;
      return { sx: cx + rx, sy: cy - y, v: rz < 0 };
    }
    let id;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, r = 55;
      const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      sg.addColorStop(0, "rgba(20,35,80,0.7)"); sg.addColorStop(1, "rgba(5,10,30,0.9)");
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
      ctx.strokeStyle = "rgba(139,94,60,0.3)"; ctx.lineWidth = 1; ctx.stroke();
      dots.forEach(d => {
        const { x, y, z } = xyz(d.lat, d.lon, r), p = proj(x, y, z, rot, cx, cy);
        if (!p.v) return;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, d.land ? 1.8 : 0.8, 0, Math.PI * 2);
        ctx.fillStyle = d.land ? "rgba(139,94,60,0.85)" : "rgba(30,50,120,0.4)"; ctx.fill();
      });
      rot += 0.005; id = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas ref={ref} width={130} height={130} />;
}

function GaugeChart({ value = 68 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const W = 180, H = 110, cx = W / 2, cy = H - 15, r = 75;
    ctx.clearRect(0, 0, W, H);
    const segs = [
      { start: Math.PI, end: Math.PI * 1.3, color: "#b3402f" },
      { start: Math.PI * 1.3, end: Math.PI * 1.6, color: "#b7791f" },
      { start: Math.PI * 1.6, end: Math.PI * 1.8, color: "#a3e635" },
      { start: Math.PI * 1.8, end: Math.PI * 2, color: "#4a7c59" },
    ];
    segs.forEach(s => {
      ctx.beginPath(); ctx.arc(cx, cy, r, s.start, s.end);
      ctx.strokeStyle = s.color; ctx.lineWidth = 12; ctx.stroke();
    });
    const angle = Math.PI + (value / 100) * Math.PI;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
    ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(0, -(r - 15)); ctx.lineTo(4, 0);
    ctx.fillStyle = "white"; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fillStyle = "white"; ctx.fill();
    ctx.fillStyle = "var(--text-primary)"; ctx.font = "bold 20px Outfit"; ctx.textAlign = "center";
    ctx.fillText(value, cx, cy - 20);
    ctx.fillStyle = "var(--accent-green)"; ctx.font = "11px Outfit";
    ctx.fillText("GREED", cx, cy - 6);
  }, [value]);
  return <canvas ref={ref} width={180} height={110} style={{ display: "block", margin: "0 auto" }} />;
}

function PortfolioChart({ assets }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const W = c.offsetWidth || 500, H = 120;
    c.width = W; c.height = H;
    const pts = []; let val = 60;
    for (let i = 0; i < 60; i++) { val += (Math.random() - 0.35) * 5; val = Math.max(30, Math.min(100, val)); pts.push(val); }
    const min = Math.min(...pts) - 5, max = Math.max(...pts) + 5;
    const xs = pts.map((_, i) => i / (pts.length - 1) * W);
    const ys = pts.map(v => H - 10 - (v - min) / (max - min) * (H - 20));
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(124,92,191,0.4)"); grad.addColorStop(1, "rgba(139,94,60,0)");
    ctx.beginPath(); ctx.moveTo(xs[0], H);
    xs.forEach((x, i) => ctx.lineTo(x, ys[i]));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i < xs.length; i++) { const cp = (xs[i - 1] + xs[i]) / 2; ctx.bezierCurveTo(cp, ys[i - 1], cp, ys[i], xs[i], ys[i]); }
    ctx.strokeStyle = "#a47551"; ctx.lineWidth = 2; ctx.stroke();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
    ctx.fillStyle = "rgba(138,146,176,0.6)"; ctx.font = "10px Outfit";
    months.forEach((m, i) => ctx.fillText(m, i * (W / 7), H - 2));
  }, [assets]);
  return <canvas ref={ref} style={{ width: "100%", height: 120 }} />;
}

const STATS = [
  { label: "Portfolio Value", value: null, key: "total", suffix: "", prefix: "₹", color: "var(--accent-blue)", icon: "💼" },
  { label: "Today's Return", value: "+2.4%", color: "var(--accent-green)", icon: "📈" },
  { label: "Risk Score", value: "Moderate", color: "var(--accent-yellow)", icon: "🛡️" },
  { label: "Asset Classes", value: null, key: "count", color: "var(--accent-violet)", icon: "🔷" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("1Y");

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await apiFetch("/assets");
        const data = await res.json();
        if (data.assets) { setAssets(data.assets); setTotalValue(data.totalValue); }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAssets();
  }, []);

  const portfolioFormatted = totalValue >= 100000
    ? `${(totalValue / 100000).toFixed(2)}L`
    : totalValue.toLocaleString("en-IN");

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* MAIN */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Good Morning, {user?.name?.split(" ")[0]} 👋</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Your wealth intelligence report · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
          </div>
          <button onClick={() => navigate("/assets")} style={{ padding: "10px 20px", background: "var(--gradient-btn)", border: "none", borderRadius: 10, color: "white", fontFamily: "Outfit", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 15px rgba(139,94,60,0.3)" }}>
            + Add Asset
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.label}</span>
                <span style={{ fontSize: 18 }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>
                {s.key === "total" ? (loading ? "..." : `₹${portfolioFormatted}`) :
                  s.key === "count" ? (loading ? "..." : assets.length) : s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Portfolio Chart */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Portfolio Performance</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>Historical value tracking</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {["1W", "1M", "3M", "1Y", "ALL"].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{
                  padding: "5px 10px", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "Outfit",
                  background: activeTab === t ? "rgba(139,94,60,0.2)" : "transparent",
                  color: activeTab === t ? "var(--accent-blue)" : "var(--text-secondary)",
                }}>{t}</button>
              ))}
            </div>
          </div>
          <PortfolioChart assets={assets} />
        </div>

        {/* Asset list preview */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Your Holdings</div>
            <span onClick={() => navigate("/assets")} style={{ fontSize: 12, color: "var(--accent-blue)", cursor: "pointer" }}>View All →</span>
          </div>
          {loading ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13, padding: 20, textAlign: "center" }}>Loading portfolio...</div>
          ) : assets.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>No assets yet. Add your first investment!</div>
              <button onClick={() => navigate("/assets")} style={{ marginTop: 16, padding: "10px 20px", background: "var(--gradient-btn)", border: "none", borderRadius: 8, color: "white", fontFamily: "Outfit", fontSize: 13, cursor: "pointer" }}>Add Asset</button>
            </div>
          ) : (
            <div>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, padding: "8px 12px", marginBottom: 4 }}>
                {["Asset", "Price", "Quantity", "Total Value"].map(h => (
                  <span key={h} style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</span>
                ))}
              </div>
              {assets.slice(0, 5).map((a, i) => (
                <div key={a._id} style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12, padding: "12px",
                  borderRadius: 8, background: i % 2 === 0 ? "rgba(92,64,51,0.02)" : "transparent",
                  alignItems: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, rgba(139,94,60,0.3), rgba(176,137,104,0.3))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                      {a.type === "crypto" ? "₿" : a.type === "gold" ? "🥇" : "📈"}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.ticker || a.type}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>₹{Number(a.price).toLocaleString("en-IN")}</span>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{a.quantity}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-green)" }}>₹{(a.price * a.quantity).toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ width: 280, borderLeft: "1px solid var(--border)", overflowY: "auto", padding: "20px 16px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Globe */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 12, fontWeight: 600 }}>🌍 Global Markets</div>
          <MiniEarth />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>24/7 market monitoring active</div>
        </div>

        {/* Fear & Greed */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600 }}>Fear & Greed Index</div>
          <GaugeChart value={68} />
          <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>Market sentiment: Greed</div>
        </div>

        {/* Live Fetch quick access */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, rgba(139,94,60,0.3), rgba(176,137,104,0.3))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🐟</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Live Fetch</div>
              <div style={{ fontSize: 10, color: "var(--accent-green)" }}>● TinyFish online</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 10 }}>Pull live prices and market data straight off any webpage</div>
          {["NIFTY 50 live level", "Bitcoin price (USD)", "Gold price per 10g"].map(q => (
            <div key={q} onClick={() => navigate("/advisor")} style={{
              padding: "8px 10px", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border)",
              borderRadius: 8, fontSize: 12, color: "var(--text-secondary)", cursor: "pointer", marginBottom: 6,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent-blue)"; e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            >
              {q}
            </div>
          ))}
          <button onClick={() => navigate("/advisor")} style={{ width: "100%", marginTop: 6, padding: "10px", background: "var(--gradient-btn)", border: "none", borderRadius: 8, color: "white", fontFamily: "Outfit", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Open Live Fetch →
          </button>
        </div>

        {/* Achievements */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600, marginBottom: 12 }}>Achievements</div>
          {[
            { icon: "🏆", name: "Risk Taker", desc: "5 high-risk investments", color: "rgba(245,158,11,0.2)" },
            { icon: "🌿", name: "Diversifier", desc: "5+ asset classes", color: "rgba(74,124,89,0.2)" },
            { icon: "🛡️", name: "Market Survivor", desc: "Survived a crash event", color: "rgba(139,94,60,0.2)" },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: a.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{a.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
