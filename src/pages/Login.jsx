import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";

const API = "https://neurawealth-e8ay-beige.vercel.app/api";

function EarthCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let rotation = 0;
    let W, H;

    function resize() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

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
    for (let lat = -80; lat <= 80; lat += 5)
      for (let lon = -180; lon <= 180; lon += 5)
        dots.push({ lat: lat * Math.PI / 180, lon: lon * Math.PI / 180, isLand: isLand(lat, lon) });

    const orbits = [
      { tiltX: 0.3, tiltY: 0, speed: 0.4, phase: 0 },
      { tiltX: -0.5, tiltY: 0.2, speed: 0.6, phase: 1 },
      { tiltX: 0.1, tiltY: 0.5, speed: 0.5, phase: 2.5 },
    ];

    const connections = [
      { lat1: 40.7, lon1: -74, lat2: 51.5, lon2: -0.1 },
      { lat1: 51.5, lon1: -0.1, lat2: 35.6, lon2: 139.6 },
      { lat1: 35.6, lon1: 139.6, lat2: 22.3, lon2: 114.1 },
      { lat1: 22.3, lon1: 114.1, lat2: 28.6, lon2: 77.2 },
      { lat1: 28.6, lon1: 77.2, lat2: -33.8, lon2: 151.2 },
    ];

    function latLonToXYZ(lat, lon, r) {
      return { x: r * Math.cos(lat) * Math.cos(lon), y: r * Math.sin(lat), z: r * Math.cos(lat) * Math.sin(lon) };
    }

    function projectPoint(x, y, z, rot, cx, cy, r) {
      const cosR = Math.cos(rot), sinR = Math.sin(rot);
      const rx = x * cosR - z * sinR, rz = x * sinR + z * cosR;
      const tilt = 0.2, cosT = Math.cos(tilt), sinT = Math.sin(tilt);
      const ty = y * cosT - rz * sinT, tz = y * sinT + rz * cosT;
      const p = 2.5, scale = p / (p + tz / r);
      return { sx: cx + rx * scale, sy: cy - ty * scale, visible: tz < 0 };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const cx = W * 0.42, cy = H * 0.5, r = Math.min(W, H) * 0.35;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.5);
      grad.addColorStop(0, "rgba(30,20,80,0.4)"); grad.addColorStop(0.5, "rgba(15,10,50,0.2)"); grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      const og = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.3);
      og.addColorStop(0, "rgba(139,94,60,0.15)"); og.addColorStop(1, "transparent");
      ctx.fillStyle = og; ctx.beginPath(); ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2); ctx.fill();

      orbits.forEach((orb, i) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(orb.tiltX); ctx.scale(1, 0.35 + orb.tiltY * 0.3);
        ctx.beginPath(); ctx.arc(0, 0, r * (1.1 + i * 0.08), 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(139,94,60,0.2)"; ctx.lineWidth = 0.8; ctx.setLineDash([4, 8]); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        const angle = rotation * orb.speed + orb.phase;
        const px = cx + Math.cos(angle) * r * (1.1 + i * 0.08);
        const py = cy + Math.sin(angle) * r * (0.35 + orb.tiltY * 0.3) * (1.1 + i * 0.08);
        ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fillStyle = "#8b5e3c"; ctx.fill();
      });

      const sg = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.1, cx, cy, r);
      sg.addColorStop(0, "rgba(30,50,120,0.3)"); sg.addColorStop(1, "rgba(5,10,30,0.6)");
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();
      ctx.strokeStyle = "rgba(139,94,60,0.2)"; ctx.lineWidth = 1; ctx.stroke();

      connections.forEach(conn => {
        const p1 = latLonToXYZ(conn.lat1 * Math.PI / 180, conn.lon1 * Math.PI / 180, r);
        const p2 = latLonToXYZ(conn.lat2 * Math.PI / 180, conn.lon2 * Math.PI / 180, r);
        const sp1 = projectPoint(p1.x, p1.y, p1.z, rotation, cx, cy, r);
        const sp2 = projectPoint(p2.x, p2.y, p2.z, rotation, cx, cy, r);
        if (!sp1.visible || !sp2.visible) return;
        const mx = (sp1.sx + sp2.sx) / 2, my = (sp1.sy + sp2.sy) / 2 - 30;
        ctx.beginPath(); ctx.moveTo(sp1.sx, sp1.sy); ctx.quadraticCurveTo(mx, my, sp2.sx, sp2.sy);
        ctx.strokeStyle = "rgba(176,137,104,0.4)"; ctx.lineWidth = 0.8; ctx.setLineDash([3, 6]); ctx.stroke(); ctx.setLineDash([]);
      });

      dots.forEach(dot => {
        const { x, y, z } = latLonToXYZ(dot.lat, dot.lon, r);
        const p = projectPoint(x, y, z, rotation, cx, cy, r);
        if (!p.visible) return;
        const size = dot.isLand ? 2.2 : 1.2;
        ctx.beginPath(); ctx.arc(p.sx, p.sy, size, 0, Math.PI * 2);
        if (dot.isLand) {
          const hi = ((dot.lat * 180 / Math.PI + dot.lon * 180 / Math.PI) % 7 < 1);
          ctx.fillStyle = hi ? "rgba(176,137,104,0.9)" : "rgba(139,94,60,0.9)";
        } else { ctx.fillStyle = "rgba(92,64,51,0.3)"; }
        ctx.fill();
      });

      const hotspots = [{ lat: 40.7, lon: -74 }, { lat: 51.5, lon: -0.1 }, { lat: 35.6, lon: 139.6 }, { lat: 22.3, lon: 114.1 }, { lat: 28.6, lon: 77.2 }];
      hotspots.forEach(hs => {
        const { x, y, z } = latLonToXYZ(hs.lat * Math.PI / 180, hs.lon * Math.PI / 180, r);
        const p = projectPoint(x, y, z, rotation, cx, cy, r);
        if (!p.visible) return;
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 800);
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 5 + pulse * 4, 0, Math.PI * 2); ctx.fillStyle = `rgba(176,137,104,${0.3 * pulse})`; ctx.fill();
        ctx.beginPath(); ctx.arc(p.sx, p.sy, 3, 0, Math.PI * 2); ctx.fillStyle = "rgba(176,137,104,0.9)"; ctx.fill();
      });

      rotation += 0.003;
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setError(""); setLoading(true);
    try {
      const endpoint = isSignup ? "signup" : "login";
      const body = isSignup ? { name, email, password } : { email, password };
      const res = await fetch(`${API}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Auth failed"); return; }
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError("Connection error. Make sure backend is running.");
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleAuth(); };

  const tickers = [
    { name: "NIFTY 50", val: "22,147", chg: "+1.2%", up: true },
    { name: "BTC/USD", val: "$67,842", chg: "+3.4%", up: true },
    { name: "SENSEX", val: "73,088", chg: "-0.3%", up: false },
    { name: "GOLD/10g", val: "₹71,420", chg: "+0.8%", up: true },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", background: "#f5ecdd" }}>
      {/* LEFT — Earth */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "flex-end", padding: 48 }}>
        <EarthCanvas />

        {/* Ticker chips */}
        {tickers.map((t, i) => (
          <div key={i} style={{
            position: "absolute",
            top: i < 2 ? 30 : "auto", bottom: i >= 2 ? `${35 + (i - 2) * 15}%` : "auto",
            left: i === 0 || i === 2 ? 30 : "auto", right: i === 1 || i === 3 ? "38%" : "auto",
            background: "rgba(13,18,32,0.85)", border: "1px solid rgba(92,64,51,0.3)",
            borderRadius: 10, padding: "10px 16px", backdropFilter: "blur(10px)",
            fontFamily: "Space Grotesk", zIndex: 2,
          }}>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{t.name}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{t.val}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: t.up ? "var(--accent-green)" : "var(--accent-red)" }}>{t.chg}</div>
          </div>
        ))}

        {/* Quote */}
        <div style={{
          position: "absolute", bottom: 60, left: 48, right: 48,
          fontSize: 32, fontWeight: 700, color: "white", lineHeight: 1.3,
          textShadow: "0 2px 20px rgba(0,0,0,0.8)", zIndex: 2,
        }}>
          <span style={{ color: "var(--accent-blue)", fontSize: 48 }}>"</span>
          Wealth is not about having a lot of money — it's about having a lot of options.
          <span style={{ color: "var(--accent-blue)", fontSize: 48 }}>"</span>
        </div>

        <div style={{ position: "absolute", bottom: 20, left: 48, fontSize: 13, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8, zIndex: 2 }}>
          <span style={{ color: "var(--accent-blue)", fontWeight: 600 }}>Powered by TinyFish</span>
          · Real-time markets · Portfolio analytics
        </div>
      </div>

      {/* RIGHT — Login form */}
      <div style={{
        width: 420, background: "rgba(10,14,26,0.95)", borderLeft: "1px solid var(--border)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "48px 40px", position: "relative",
      }}>
        {/* Market badge */}
        <div style={{ position: "absolute", top: 24, right: 24, display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-green)", boxShadow: "0 0 8px var(--accent-green)", animation: "pulse 2s infinite" }} />
          <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>LIVE</span>
          <span>Market Open</span>
        </div>

        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ marginBottom: 12 }}>
            <defs>
              <linearGradient id="lg1" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8b5e3c"/><stop offset="1" stopColor="#b08968"/>
              </linearGradient>
            </defs>
            <rect width="52" height="52" rx="14" fill="url(#lg1)" fillOpacity="0.15" stroke="rgba(139,94,60,0.4)" strokeWidth="1"/>
            <path d="M40 20C30 20 22 26 22 34c0 4 2 8 6 10-2 2-3 5-2 8 1 4 5 6 9 5 1 2 3 4 5 4s4-2 5-4c4 1 8-1 9-5 1-3 0-6-2-8 4-2 6-6 6-10 0-8-8-14-18-14z" fill="rgba(139,94,60,0.2)" stroke="rgba(139,94,60,0.6)" strokeWidth="1.5"/>
            <path d="M34 35c0 0 2 3 4 2 2-1 4-5 6-4" fill="none" stroke="rgba(176,137,104,0.8)" strokeWidth="1" strokeLinecap="round"/>
            <circle cx="34" cy="35" r="2" fill="#8b5e3c"/>
            <circle cx="44" cy="33" r="2" fill="#b08968"/>
          </svg>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #8b5e3c, #b08968)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            NeuraWealth
          </div>
          <div style={{ fontSize: 11, letterSpacing: "3px", color: "var(--text-secondary)", marginTop: 2, fontWeight: 500 }}>AI WEALTH OS</div>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", background: "rgba(92,64,51,0.04)", borderRadius: 10, padding: 4, width: "100%", marginBottom: 24 }}>
          {["Login", "Sign Up"].map((label, i) => (
            <button key={label} onClick={() => { setIsSignup(i === 1); setError(""); }} style={{
              flex: 1, padding: "10px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "Outfit", fontSize: 14, fontWeight: 600, transition: "all 0.2s",
              background: (i === 0 ? !isSignup : isSignup) ? "rgba(139,94,60,0.2)" : "transparent",
              color: (i === 0 ? !isSignup : isSignup) ? "var(--accent-blue)" : "var(--text-secondary)",
            }}>{label}</button>
          ))}
        </div>

        {/* Name field (signup only) */}
        {isSignup && (
          <div style={{ width: "100%", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border-bright)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} onKeyDown={handleKeyDown} style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "Outfit", fontSize: 15, color: "var(--text-primary)" }} />
          </div>
        )}

        {/* Email */}
        <div style={{ width: "100%", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border-bright)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.8"/>
            <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "Outfit", fontSize: 15, color: "var(--text-primary)" }} />
        </div>

        {/* Password */}
        <div style={{ width: "100%", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border-bright)", borderRadius: 10, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          <input type={showPw ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: "Outfit", fontSize: 15, color: "var(--text-primary)" }} />
          <button onClick={() => setShowPw(!showPw)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
            {showPw ? "🙈" : "👁️"}
          </button>
        </div>

        {error && <div style={{ width: "100%", marginBottom: 12, padding: "10px 14px", background: "rgba(179,64,47,0.1)", border: "1px solid rgba(179,64,47,0.3)", borderRadius: 8, fontSize: 13, color: "var(--accent-red)" }}>{error}</div>}

        <button onClick={handleAuth} disabled={loading} style={{
          width: "100%", padding: 15, background: "var(--gradient-btn)", border: "none", borderRadius: 10,
          color: "white", fontFamily: "Outfit", fontSize: 16, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: "0 4px 20px rgba(139,94,60,0.4)", marginBottom: 20, opacity: loading ? 0.7 : 1,
          transition: "opacity 0.2s, transform 0.1s",
        }}>
          {loading ? "⏳ Authenticating..." : (isSignup ? "Create Account →" : "Sign In →")}
        </button>

        {/* Secure note */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: "rgba(92,64,51,0.02)", border: "1px solid var(--border)", borderRadius: 10, width: "100%" }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8"/>
          </svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>256-bit AES Encryption</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Bank-grade security · SEBI Compliant</div>
          </div>
        </div>
      </div>
    </div>
  );
}
