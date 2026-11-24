import { useState } from "react";
import { useAuth } from "../App";
import { apiFetch } from "../api";

const FEATURES = [
  { icon: "◈", text: "Portfolio tracking across stocks, crypto, gold & mutual funds" },
  { icon: "◈", text: "AI advisor powered by advanced language models" },
  { icon: "◈", text: "Live market news with sentiment analysis" },
  { icon: "◈", text: "Daily habits to build long-term financial discipline" },
];

export default function Login() {
  const { login } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const body = mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const res = await apiFetch(endpoint, { method: "POST", body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Something went wrong");
      login(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.shell}>
      {/* Left panel — branding */}
      <div style={styles.left}>
        <div style={styles.leftInner}>
          <div style={styles.logoRow}>
            <div style={styles.logoMark}>N</div>
            <div>
              <div style={styles.logoName}>NeuraWealth</div>
              <div style={styles.logoTagline}>AI Wealth OS</div>
            </div>
          </div>

          <div style={styles.heroText}>
            <h1 style={styles.hero}>Your wealth,<br /><em style={styles.heroItalic}>intelligently</em> managed.</h1>
            <p style={styles.heroSub}>
              Track every asset, get AI-powered insights, and build
              lasting financial habits — all in one place.
            </p>
          </div>

          <div style={styles.featureList}>
            {FEATURES.map((f, i) => (
              <div key={i} style={styles.featureItem}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </div>

          <div style={styles.leftFooter}>
            Built for Indian retail investors · Prices in ₹
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={styles.right}>
        <div style={styles.formCard}>
          {/* Mode toggle */}
          <div style={styles.modeRow}>
            <button
              style={{ ...styles.modeBtn, ...(mode === "login" ? styles.modeBtnActive : {}) }}
              onClick={() => { setMode("login"); setError(null); }}
            >
              Sign in
            </button>
            <button
              style={{ ...styles.modeBtn, ...(mode === "signup" ? styles.modeBtnActive : {}) }}
              onClick={() => { setMode("signup"); setError(null); }}
            >
              Create account
            </button>
          </div>

          <h2 style={styles.formTitle}>
            {mode === "login" ? "Welcome back" : "Start tracking your wealth"}
          </h2>
          <p style={styles.formSub}>
            {mode === "login"
              ? "Sign in to your NeuraWealth account."
              : "Free to use. No credit card required."}
          </p>

          <form onSubmit={submit} style={styles.form}>
            {mode === "signup" && (
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Full name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="Rahul Sharma"
                  required
                  autoFocus
                  style={styles.input}
                />
              </div>
            )}

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set("email", e.target.value)}
                placeholder="rahul@example.com"
                required
                autoFocus={mode === "login"}
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => set("password", e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                style={styles.input}
              />
            </div>

            {error && (
              <div style={styles.errorBox}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? (
                <span style={styles.spinner} />
              ) : (
                mode === "login" ? "Sign in" : "Create account"
              )}
            </button>
          </form>

          <p style={styles.switchText}>
            {mode === "login" ? "New to NeuraWealth? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
              style={styles.switchBtn}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>

          <p style={styles.disclaimer}>
            By continuing, you agree that NeuraWealth provides general financial information,
            not licensed investment advice.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  shell: {
    display: "flex",
    minHeight: "100vh",
    background: "var(--bg-primary)",
    overflow: "auto",
  },
  left: {
    flex: "1",
    background: "linear-gradient(160deg, #0D1B2A 0%, #122236 60%, #0D1B2A 100%)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 48px",
    position: "relative",
    overflow: "hidden",
  },
  leftInner: {
    maxWidth: 440,
    position: "relative",
    zIndex: 1,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 56,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: "linear-gradient(135deg, #C9A84C 0%, #A8873A 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 22,
    color: "#0D1B2A",
    fontWeight: 700,
    flexShrink: 0,
  },
  logoName: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 20,
    color: "var(--text-primary)",
    lineHeight: 1,
  },
  logoTagline: {
    fontSize: 10,
    fontWeight: 600,
    color: "var(--gold)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginTop: 3,
  },
  heroText: {
    marginBottom: 40,
  },
  hero: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 42,
    lineHeight: 1.1,
    color: "var(--text-primary)",
    marginBottom: 16,
  },
  heroItalic: {
    color: "var(--gold)",
    fontStyle: "italic",
  },
  heroSub: {
    fontSize: 15,
    lineHeight: 1.65,
    color: "var(--text-secondary)",
    maxWidth: 380,
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginBottom: 48,
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  featureIcon: {
    color: "var(--gold)",
    fontSize: 14,
    marginTop: 1,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    color: "var(--text-secondary)",
    lineHeight: 1.4,
  },
  leftFooter: {
    fontSize: 11,
    color: "var(--text-muted)",
    letterSpacing: "0.02em",
  },
  right: {
    width: 480,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 32px",
    background: "var(--bg-secondary)",
  },
  formCard: {
    width: "100%",
    maxWidth: 380,
  },
  modeRow: {
    display: "flex",
    gap: 2,
    background: "var(--bg-input)",
    padding: 3,
    borderRadius: 10,
    marginBottom: 28,
  },
  modeBtn: {
    flex: 1,
    padding: "8px 0",
    border: "none",
    borderRadius: 8,
    background: "none",
    fontSize: 13,
    fontWeight: 500,
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
  },
  modeBtnActive: {
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  },
  formTitle: {
    fontFamily: "'DM Serif Display', Georgia, serif",
    fontSize: 26,
    color: "var(--text-primary)",
    marginBottom: 6,
    fontWeight: 400,
  },
  formSub: {
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 28,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "11px 14px",
    fontSize: 14,
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
  },
  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    padding: "11px 14px",
    borderRadius: 10,
    background: "var(--red-dim)",
    border: "1px solid rgba(224,82,82,0.25)",
    color: "var(--red)",
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 1.4,
  },
  submitBtn: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #C9A84C 0%, #A8873A 100%)",
    color: "#0D1B2A",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    marginTop: 4,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    transition: "opacity 0.15s",
    fontFamily: "inherit",
  },
  spinner: {
    width: 18,
    height: 18,
    border: "2px solid rgba(13,27,42,0.3)",
    borderTopColor: "#0D1B2A",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  switchText: {
    textAlign: "center",
    fontSize: 13,
    color: "var(--text-secondary)",
    marginBottom: 20,
  },
  switchBtn: {
    background: "none",
    border: "none",
    color: "var(--gold)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
  },
  disclaimer: {
    fontSize: 11,
    color: "var(--text-muted)",
    textAlign: "center",
    lineHeight: 1.5,
  },
};
