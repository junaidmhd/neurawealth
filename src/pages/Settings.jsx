import { useState } from "react";
import { useAuth } from "../App";
import { apiFetch } from "../api";

export default function Settings() {
  const { user, logout } = useAuth();
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  const setPw = (k, v) => setPwForm(f => ({ ...f, [k]: v }));

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ ok: false, text: "New passwords don't match." });
      return;
    }
    if (pwForm.next.length < 8) {
      setPwMsg({ ok: false, text: "Password must be at least 8 characters." });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password");
      setPwMsg({ ok: true, text: "Password updated." });
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err) {
      setPwMsg({ ok: false, text: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Settings</h1>
        <p style={S.sub}>Manage your account.</p>
      </div>

      <div style={S.body}>
        {/* Account info */}
        <section style={S.card}>
          <h3 style={S.cardTitle}>Account</h3>
          <div style={S.infoRow}>
            <span style={S.infoLabel}>Name</span>
            <span style={S.infoValue}>{user?.name || "—"}</span>
          </div>
          <div style={S.infoRow}>
            <span style={S.infoLabel}>Email</span>
            <span style={S.infoValue}>{user?.email || "—"}</span>
          </div>
          <div style={S.infoRow}>
            <span style={S.infoLabel}>Member since</span>
            <span style={S.infoValue}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long" })
                : "—"}
            </span>
          </div>
        </section>

        {/* AI Status */}
        <section style={S.card}>
          <h3 style={S.cardTitle}>AI Advisor</h3>
          <div style={S.aiStatus}>
            <div style={S.aiDot} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}>Active</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Powered by Groq · llama-3.3-70b-versatile · Managed by NeuraWealth
              </div>
            </div>
          </div>
          <p style={S.aiNote}>
            The AI advisor is managed by NeuraWealth — no API key is needed from you.
            It provides general financial information, not licensed investment advice.
          </p>
        </section>

        {/* Change password */}
        <section style={S.card}>
          <h3 style={S.cardTitle}>Change password</h3>
          <form onSubmit={changePassword} style={S.form}>
            <div style={S.fieldGroup}>
              <label style={S.label}>Current password</label>
              <input
                type="password"
                value={pwForm.current}
                onChange={e => setPw("current", e.target.value)}
                style={S.input}
                placeholder="••••••••"
                required
              />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>New password</label>
              <input
                type="password"
                value={pwForm.next}
                onChange={e => setPw("next", e.target.value)}
                style={S.input}
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>
            <div style={S.fieldGroup}>
              <label style={S.label}>Confirm new password</label>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={e => setPw("confirm", e.target.value)}
                style={S.input}
                placeholder="••••••••"
                required
              />
            </div>
            {pwMsg && (
              <div style={{ ...S.msg, ...(pwMsg.ok ? S.msgOk : S.msgErr) }}>
                {pwMsg.text}
              </div>
            )}
            <button type="submit" disabled={pwLoading} style={S.btn}>
              {pwLoading ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>

        {/* Danger zone */}
        <section style={{ ...S.card, borderColor: "rgba(224,82,82,0.2)" }}>
          <h3 style={{ ...S.cardTitle, color: "var(--red)" }}>Sign out</h3>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
            You'll need to sign back in to access your portfolio and AI advisor.
          </p>
          <button onClick={logout} style={S.dangerBtn}>Sign out</button>
        </section>
      </div>
    </div>
  );
}

const S = {
  page: { flex: 1, overflow: "auto", animation: "fadeIn 0.3s ease" },
  header: { padding: "28px 32px 0" },
  title: { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 26, color: "var(--text-primary)" },
  sub: { fontSize: 13, color: "var(--text-secondary)", marginTop: 4 },
  body: { padding: "24px 32px 48px", maxWidth: 560, display: "flex", flexDirection: "column", gap: 16 },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: 24,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: 18,
    fontFamily: "'Inter', sans-serif",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid var(--border)",
  },
  infoLabel: { fontSize: 13, color: "var(--text-secondary)" },
  infoValue: { fontSize: 13, fontWeight: 500, color: "var(--text-primary)" },
  aiStatus: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "12px 14px",
    background: "rgba(61,170,114,0.06)",
    border: "1px solid rgba(61,170,114,0.2)",
    borderRadius: 10,
    marginBottom: 14,
  },
  aiDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--green)",
    marginTop: 4,
    flexShrink: 0,
    boxShadow: "0 0 6px rgba(61,170,114,0.5)",
  },
  aiNote: {
    fontSize: 12,
    color: "var(--text-muted)",
    lineHeight: 1.5,
  },
  form: { display: "flex", flexDirection: "column" },
  fieldGroup: { marginBottom: 14 },
  label: { display: "block", fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 },
  input: {
    width: "100%",
    background: "var(--bg-input)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 14,
    color: "var(--text-primary)",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.15s",
  },
  msg: {
    padding: "10px 14px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 14,
  },
  msgOk: {
    background: "var(--green-dim)",
    border: "1px solid rgba(61,170,114,0.25)",
    color: "var(--green)",
  },
  msgErr: {
    background: "var(--red-dim)",
    border: "1px solid rgba(224,82,82,0.25)",
    color: "var(--red)",
  },
  btn: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #C9A84C 0%, #A8873A 100%)",
    color: "#0D1B2A",
    border: "none",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    width: "fit-content",
    fontFamily: "inherit",
  },
  dangerBtn: {
    padding: "9px 18px",
    background: "var(--red-dim)",
    border: "1px solid rgba(224,82,82,0.3)",
    color: "var(--red)",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
};
