import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../App";

const NAV = [
  {
    section: "Overview",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: IconDashboard },
      { path: "/assets",    label: "Portfolio",  icon: IconPortfolio },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { path: "/ai-advisor", label: "AI Advisor",  icon: IconAI },
      { path: "/news",        label: "Market News", icon: IconNews },
      { path: "/advisor",     label: "Live Fetch",  icon: IconFetch },
    ],
  },
  {
    section: "Growth",
    items: [
      { path: "/daily", label: "Daily 1%",  icon: IconDaily },
      { path: "/notes", label: "Notes",     icon: IconNotes },
      { path: "/game",  label: "Quiz Game", icon: IconGame },
    ],
  },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const initials = user?.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        {/* Logo */}
        <div style={S.logoWrap} onClick={() => navigate("/dashboard")}>
          <div style={S.logoMark}>N</div>
          <div>
            <div style={S.logoName}>NeuraWealth</div>
            <div style={S.logoSub}>AI Wealth OS</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={S.nav}>
          {NAV.map(group => (
            <div key={group.section}>
              <div style={S.navSection}>{group.section}</div>
              {group.items.map(item => {
                const active = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    style={{ ...S.navItem, ...(active ? S.navItemActive : {}) }}
                  >
                    <span style={{ ...S.navIcon, ...(active ? S.navIconActive : {}) }}>
                      <item.icon />
                    </span>
                    <span style={S.navLabel}>{item.label}</span>
                    {active && <span style={S.navDot} />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={S.sidebarFooter}>
          <button onClick={() => navigate("/settings")} style={S.settingsBtn}>
            <IconSettings />
            <span style={S.navLabel}>Settings</span>
          </button>
          <div style={S.userRow}>
            <div style={S.avatar}>{initials}</div>
            <div style={S.userInfo}>
              <div style={S.userName}>{user?.name || "User"}</div>
              <div style={S.userEmail}>{user?.email || ""}</div>
            </div>
            <button onClick={logout} style={S.logoutBtn} title="Sign out">
              <IconLogout />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>{children}</main>
    </div>
  );
}

/* ── Styles ── */
const S = {
  sidebar: {
    width: 220,
    flexShrink: 0,
    background: "var(--bg-secondary)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "20px 18px 16px",
    borderBottom: "1px solid var(--border)",
    cursor: "pointer",
  },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "linear-gradient(135deg, #C9A84C 0%, #A8873A 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 17,
    color: "#0D1B2A",
    fontWeight: 700,
    flexShrink: 0,
  },
  logoName: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 15,
    color: "var(--text-primary)",
    lineHeight: 1,
  },
  logoSub: {
    fontSize: 9,
    fontWeight: 600,
    color: "var(--gold)",
    letterSpacing: "0.09em",
    textTransform: "uppercase",
    marginTop: 2,
  },
  nav: {
    flex: 1,
    overflowY: "auto",
    padding: "10px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  navSection: {
    fontSize: 9,
    fontWeight: 700,
    color: "var(--text-muted)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: "12px 10px 4px",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 8,
    cursor: "pointer",
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 450,
    transition: "background 0.1s, color 0.1s",
    textDecoration: "none",
    border: "none",
    background: "none",
    width: "100%",
    textAlign: "left",
    position: "relative",
    fontFamily: "inherit",
  },
  navItemActive: {
    background: "rgba(201,168,76,0.1)",
    color: "var(--gold)",
    fontWeight: 600,
  },
  navIcon: {
    width: 16,
    height: 16,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-muted)",
  },
  navIconActive: {
    color: "var(--gold)",
  },
  navLabel: {
    flex: 1,
  },
  navDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "var(--gold)",
    flexShrink: 0,
  },
  sidebarFooter: {
    padding: "10px 10px",
    borderTop: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  settingsBtn: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 10px",
    borderRadius: 8,
    cursor: "pointer",
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 450,
    border: "none",
    background: "none",
    width: "100%",
    textAlign: "left",
    transition: "background 0.1s, color 0.1s",
    fontFamily: "inherit",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 8,
    marginTop: 2,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "rgba(201,168,76,0.12)",
    border: "1px solid rgba(201,168,76,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--gold)",
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  userEmail: {
    fontSize: 10,
    color: "var(--text-muted)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  logoutBtn: {
    width: 24,
    height: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    background: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    borderRadius: 6,
    transition: "color 0.1s",
    padding: 0,
    flexShrink: 0,
  },
  main: {
    flex: 1,
    overflowY: "auto",
    minWidth: 0,
    background: "var(--bg-primary)",
  },
};

/* ── Icons ── */
function IconDashboard() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8"/></svg>;
}
function IconPortfolio() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 7h6v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IconAI() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function IconNews() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M4 6h16M4 10h10M4 14h12M4 18h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function IconFetch() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M2 12h4M18 12h4M12 2v4M12 18v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function IconDaily() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>;
}
function IconNotes() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 2v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function IconGame() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7l3-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>;
}
function IconSettings() {
  return <svg width="15" height="15" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg>;
}
function IconLogout() {
  return <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
