import { useState, useEffect } from "react";
import { apiFetch } from "../api";
import GroqKeyCard from "./GroqKeyCard";

export default function Settings() {
  const [status, setStatus] = useState(null); // { configured, masked, source }
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiFetch("/settings/api-key")
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetch("/settings/api-key", {
        method: "POST",
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save key");
      setMsg({ type: "ok", text: "API key saved. It's now used for Live Fetch requests." });
      setApiKey("");
      load();
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const clearKey = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await apiFetch("/settings/api-key", { method: "DELETE" });
      const data = await res.json();
      setMsg({ type: "ok", text: data.message });
      load();
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: 32 }}>
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 28 }}>
          Configure the TinyFish key (Live Fetch) and the Groq key (AI Advisor). Keys are shared across
          the whole app (global, not per-user) and is stored on the server.
        </p>

        <div style={{
          background: "var(--bg-secondary)", border: "1px solid var(--border)",
          borderRadius: 12, padding: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: "rgba(139,94,60,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" style={{ color: "var(--accent-blue)" }}>
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M8 12s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>TinyFish API Key</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Powers Live Fetch (web data)</div>
            </div>
          </div>

          {loading ? (
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading…</div>
          ) : (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
                fontSize: 12, padding: "8px 12px", borderRadius: 8,
                background: status?.configured ? "rgba(74,124,89,0.08)" : "rgba(92,64,51,0.04)",
                border: `1px solid ${status?.configured ? "rgba(74,124,89,0.25)" : "var(--border)"}`,
              }}>
                <div style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: status?.configured ? "var(--accent-green)" : "var(--text-muted)",
                }} />
                {status?.configured
                  ? <span>Active — <strong>{status.masked}</strong> ({status.source === "settings" ? "set via Settings" : "from server .env"})</span>
                  : <span>No API key configured — Live Fetch will be unavailable</span>}
              </div>

              <form onSubmit={save}>
                <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  New API key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="tf_..."
                  autoComplete="off"
                  style={{
                    width: "100%", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border)",
                    borderRadius: 8, padding: "10px 12px", fontFamily: "monospace", fontSize: 13,
                    color: "var(--text-primary)", outline: "none", marginBottom: 14, boxSizing: "border-box",
                  }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" disabled={saving || !apiKey.trim()} style={{
                    padding: "9px 18px", borderRadius: 8, border: "none",
                    background: "var(--gradient-btn)", color: "white", fontWeight: 600, fontSize: 13,
                    cursor: saving || !apiKey.trim() ? "not-allowed" : "pointer",
                    opacity: saving || !apiKey.trim() ? 0.6 : 1,
                  }}>
                    {saving ? "Saving…" : "Save key"}
                  </button>
                  {status?.source === "settings" && (
                    <button type="button" onClick={clearKey} disabled={saving} style={{
                      padding: "9px 18px", borderRadius: 8, cursor: "pointer",
                      background: "transparent", border: "1px solid var(--border)",
                      color: "var(--text-secondary)", fontSize: 13,
                    }}>
                      Clear (fall back to .env)
                    </button>
                  )}
                </div>
              </form>

              {msg && (
                <div style={{
                  marginTop: 14, fontSize: 12, padding: "8px 12px", borderRadius: 8,
                  background: msg.type === "ok" ? "rgba(74,124,89,0.08)" : "rgba(179,64,47,0.08)",
                  border: `1px solid ${msg.type === "ok" ? "rgba(74,124,89,0.25)" : "rgba(179,64,47,0.25)"}`,
                  color: msg.type === "ok" ? "var(--accent-green)" : "var(--accent-red)",
                }}>
                  {msg.text}
                </div>
              )}
            </>
          )}
        </div>

        <GroqKeyCard />

        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 14 }}>
          These keys are used server-side for every Live Fetch request from every user — it is not
          per-user. Anyone who can log in can view/replace it here, so treat this as an admin setting.
        </p>
      </div>
    </div>
  );
}
