import { useState, useEffect } from "react";
import { apiFetch } from "../api";

export default function GroqKeyCard() {
  const [status, setStatus] = useState(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => apiFetch("/settings/groq-key").then(r => r.json()).then(setStatus).catch(() => setStatus(null));
  useEffect(() => { load(); }, []);

  const call = async (method, body) => {
    setSaving(true); setMsg(null);
    try {
      const res = await apiFetch("/settings/groq-key", { method, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      setMsg({ ok: true, text: data.message });
      setApiKey("");
      load();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: 24, marginTop: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>Groq API Key</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>
        Powers the AI Advisor{status?.model ? ` (model: ${status.model})` : ""}
      </div>
      <div style={{
        fontSize: 12, padding: "8px 12px", borderRadius: 8, marginBottom: 16,
        background: status?.configured ? "rgba(74,124,89,0.08)" : "rgba(92,64,51,0.04)",
        border: `1px solid ${status?.configured ? "rgba(74,124,89,0.25)" : "var(--border)"}`,
      }}>
        {status?.configured
          ? <>Active — <strong>{status.masked}</strong> ({status.source === "settings" ? "set via Settings" : "from server .env"})</>
          : "No Groq key configured — AI Advisor will be unavailable"}
      </div>
      <form onSubmit={e => { e.preventDefault(); if (apiKey.trim()) call("POST", { apiKey: apiKey.trim() }); }}>
        <input
          type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="gsk_..." autoComplete="off"
          style={{
            width: "100%", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border)", borderRadius: 8,
            padding: "10px 12px", fontFamily: "monospace", fontSize: 13, color: "var(--text-primary)", outline: "none",
            marginBottom: 12, boxSizing: "border-box",
          }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit" disabled={saving || !apiKey.trim()} style={{
            padding: "9px 18px", borderRadius: 8, border: "none", background: "var(--gradient-btn)", color: "white",
            fontWeight: 600, fontSize: 13, opacity: saving || !apiKey.trim() ? 0.6 : 1,
            cursor: saving || !apiKey.trim() ? "not-allowed" : "pointer",
          }}>{saving ? "Saving…" : "Save key"}</button>
          {status?.source === "settings" && (
            <button type="button" onClick={() => call("DELETE")} disabled={saving} style={{
              padding: "9px 18px", borderRadius: 8, cursor: "pointer", background: "transparent",
              border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 13,
            }}>Clear (fall back to .env)</button>
          )}
        </div>
      </form>
      {msg && (
        <div style={{
          marginTop: 12, fontSize: 12, padding: "8px 12px", borderRadius: 8,
          background: msg.ok ? "rgba(74,124,89,0.08)" : "rgba(179,64,47,0.08)",
          border: `1px solid ${msg.ok ? "rgba(74,124,89,0.25)" : "rgba(179,64,47,0.25)"}`,
          color: msg.ok ? "var(--accent-green)" : "var(--accent-red)",
        }}>{msg.text}</div>
      )}
    </div>
  );
}
