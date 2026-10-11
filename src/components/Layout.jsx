import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";

const NAV_ITEMS = [
  {
    path: "/dashboard", label: "Dashboard", icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    )
  },
  {
    path: "/assets", label: "Portfolio", icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    path: "/advisor", label: "Live Fetch", icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M8 12s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="9" cy="9" r="1" fill="currentColor"/>
        <circle cx="15" cy="9" r="1" fill="currentColor"/>
      </svg>
    )
  },
  {
    path: "/daily", label: "Daily 1%", icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M15 7h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    path: "/ai-advisor", label: "AI Advisor", icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.3A8 8 0 1121 12z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    path: "/news", label: "Market News", icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8L2 8v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M8 2v6H2M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    path: "/notes", label: "Notes", icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    path: "/game", label: "Sim Game", icon: (
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.8"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" strokeWidth="1.8"/>
        <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8"/>
      </svg>
    )
  },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: authLogout } = useAuth();
  const logout = () => { authLogout(); navigate("/login"); };
  const [notifOpen, setNotifOpen] = useState(false);

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "NW";

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)" }}>
      {/* TOPBAR */}
      <div style={{
        height: 56, background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 20px", gap: 16, flexShrink: 0,
        position: "relative", zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 200 }}>
          <svg width="28" height="28" viewBox="0 0 52 52" fill="none">
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="52" y2="52" gradientUnits="userSpaceOnUse">
                <stop stopColor="#8b5e3c"/><stop offset="1" stopColor="#b08968"/>
              </linearGradient>
            </defs>
            <rect width="52" height="52" rx="12" fill="url(#logoGrad)" fillOpacity="0.15"/>
            <path d="M40 20C30 20 22 26 22 34c0 4 2 8 6 10-2 2-3 5-2 8 1 4 5 6 9 5 1 2 3 4 5 4s4-2 5-4c4 1 8-1 9-5 1-3 0-6-2-8 4-2 6-6 6-10 0-8-8-14-18-14z" fill="rgba(139,94,60,0.2)" stroke="rgba(139,94,60,0.7)" strokeWidth="1.5"/>
            <path d="M34 35c0 0 2 3 4 2 2-1 4-5 6-4 2 1 2 5 4 4" fill="none" stroke="rgba(176,137,104,0.9)" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="34" cy="35" r="2" fill="#8b5e3c"/>
            <circle cx="44" cy="33" r="2" fill="#b08968"/>
          </svg>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, background: "linear-gradient(135deg, #8b5e3c, #b08968)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              NeuraWealth
            </div>
            <div style={{ fontSize: 9, letterSpacing: "2px", color: "var(--text-muted)" }}>AI WEALTH OS</div>
          </div>
        </div>

        {/* Search */}
        <div style={{
          flex: 1, maxWidth: 420, display: "flex", alignItems: "center", gap: 10,
          background: "rgba(92,64,51,0.04)", border: "1px solid var(--border)", borderRadius: 8,
          padding: "8px 14px", marginLeft: 20,
        }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input placeholder="Search assets, news, insights..." style={{
            flex: 1, background: "none", border: "none", outline: "none",
            fontFamily: "Outfit", fontSize: 13, color: "var(--text-primary)",
          }} />
          <span style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(92,64,51,0.06)", padding: "2px 6px", borderRadius: 4 }}>⌘K</span>
        </div>

        {/* Right section */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          {/* Market status */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent-green)", boxShadow: "0 0 6px var(--accent-green)", animation: "pulse 2s infinite" }} />
            <span style={{ color: "var(--accent-green)", fontWeight: 700 }}>LIVE</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginLeft: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>MARKET OPEN</span>
              <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{timeStr} IST</span>
            </div>
          </div>

          {/* Notification */}
          <div onClick={() => setNotifOpen(!notifOpen)} style={{
            position: "relative", width: 36, height: 36, background: "rgba(92,64,51,0.05)",
            border: "1px solid var(--border)", borderRadius: 8, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)",
          }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <div style={{
              position: "absolute", top: -4, right: -4, width: 16, height: 16,
              background: "var(--accent-blue)", borderRadius: "50%", fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", color: "white",
            }}>3</div>
          </div>

          {/* User */}
          <div onClick={logout} title="Click to logout" style={{
            display: "flex", alignItems: "center", gap: 10, padding: "4px 12px 4px 4px",
            background: "rgba(92,64,51,0.04)", border: "1px solid var(--border)", borderRadius: 8,
            cursor: "pointer",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6, background: "var(--gradient-btn)",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13,
            }}>{initials}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name?.split(" ")[0]}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Sign Out</div>
            </div>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SIDEBAR */}
        <div style={{
          width: 220, background: "var(--bg-secondary)", borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column", padding: "20px 12px", gap: 4, flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, letterSpacing: "2px", color: "var(--text-muted)", padding: "0 8px", marginBottom: 8 }}>NAVIGATION</div>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <div key={item.path} onClick={() => navigate(item.path)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                borderRadius: 8, cursor: "pointer",
                background: active ? "rgba(139,94,60,0.12)" : "transparent",
                border: active ? "1px solid rgba(139,94,60,0.25)" : "1px solid transparent",
                color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(92,64,51,0.04)"; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                {item.icon}
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{item.label}</span>
                {active && <div style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "var(--accent-blue)" }} />}
              </div>
            );
          })}

          {/* Bottom section */}
          <div style={{ marginTop: "auto" }}>
            <div style={{
              padding: "14px", background: "rgba(139,94,60,0.08)", border: "1px solid rgba(139,94,60,0.2)",
              borderRadius: 10, marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>🤖 AI Status</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-green)" }}>● Neural Engine Active</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 4 }}>24/7 Portfolio Monitoring</div>
            </div>
            <div onClick={() => navigate("/settings")} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
              borderRadius: 8, cursor: "pointer",
              color: location.pathname === "/settings" ? "var(--accent-blue)" : "var(--text-muted)",
            }}
              onMouseEnter={e => { if (location.pathname !== "/settings") e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { if (location.pathname !== "/settings") e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 13 }}>Settings</span>
            </div>
            <div onClick={logout} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
              borderRadius: 8, cursor: "pointer", color: "var(--text-muted)",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--accent-red)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: 13 }}>Logout</span>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
