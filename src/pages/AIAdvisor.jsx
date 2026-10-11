import { useState, useRef, useEffect, useCallback } from "react";
import { apiFetch } from "../api";

const SUGGESTIONS = [
  "How should a beginner split ₹10,000 a month between SIPs and savings?",
  "What is diversification and how do I check mine?",
  "How much emergency fund should I keep before investing?",
  "Explain the risk difference between large-cap and small-cap funds.",
];
const LAST_KEY = "nw_last_chat";

export default function AIAdvisor() {
  const [chats, setChats] = useState([]);
  const [chatId, setChatId] = useState(() => localStorage.getItem(LAST_KEY));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [includePortfolio, setIncludePortfolio] = useState(true);
  const [notice, setNotice] = useState(null);
  const endRef = useRef(null);

  const refreshList = useCallback(async () => {
    try { const r = await apiFetch("/chats"); const d = await r.json(); setChats(d.chats || []); } catch {}
  }, []);

  const openChat = useCallback(async (id) => {
    try {
      const r = await apiFetch(`/chats/${id}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setChatId(id); localStorage.setItem(LAST_KEY, id); setMessages(d.chat.messages || []);
    } catch { setChatId(null); localStorage.removeItem(LAST_KEY); setMessages([]); }
  }, []);

  // On mount: load the saved list and re-open the last conversation, so switching tabs never loses it.
  useEffect(() => {
    (async () => { await refreshList(); if (chatId) await openChat(chatId); setBooting(false); })();
    // eslint-disable-next-line
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const newChat = () => { setChatId(null); localStorage.removeItem(LAST_KEY); setMessages([]); setNotice(null); };
  const removeChat = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    await apiFetch(`/chats/${id}`, { method: "DELETE" });
    if (id === chatId) newChat();
    refreshList();
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next); setInput(""); setNotice(null); setLoading(true);
    try {
      let marketNews = [];
      try {
        const newsRes = await apiFetch("/news");
        const newsData = await newsRes.json();
        marketNews = Array.isArray(newsData?.data) ? newsData.data.slice(0, 5) : [];
      } catch {
        marketNews = [];
      }

      const res = await apiFetch("/ai/chat", { method: "POST", body: JSON.stringify({ messages: next, includePortfolio, marketNews, chatId }) });
      const data = await res.json();
      if (data.status === "COMPLETED") {
        setMessages([...next, { role: "assistant", content: data.reply }]);
        if (data.chatId && data.chatId !== chatId) { setChatId(data.chatId); localStorage.setItem(LAST_KEY, data.chatId); }
        refreshList();
      } else {
        setNotice(data.message || "Something went wrong."); setMessages(next.slice(0, -1)); setInput(content);
      }
    } catch (err) {
      setNotice("Could not reach the server: " + err.message); setMessages(next.slice(0, -1)); setInput(content);
    } finally { setLoading(false); }
  };

  const fmtDay = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      {/* Saved conversations */}
      <aside style={{ width: 250, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 14 }}>
          <button onClick={newChat} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: "var(--gradient-btn)", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ New conversation</button>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--text-muted)", padding: "0 16px 6px" }}>SAVED CHATS</div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 8px 12px" }}>
          {chats.length === 0 && <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "8px 8px" }}>Nothing saved yet. Your chats are stored automatically.</div>}
          {chats.map(c => (
            <div key={c._id} onClick={() => openChat(c._id)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 10px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
              background: c._id === chatId ? "rgba(139,94,60,0.14)" : "transparent",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: c._id === chatId ? 600 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{fmtDay(c.updatedAt)} · {c.count} msgs</div>
              </div>
              <button onClick={(e) => removeChat(c._id, e)} title="Delete" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 15 }}>×</button>
            </div>
          ))}
        </div>
      </aside>

      {/* Conversation */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "24px 32px" }}>
        <div style={{ marginBottom: 14 }}>
          <h1 style={{ fontSize: 26, fontWeight: 600 }}>AI Advisor</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>
            Ask about investing and budgeting. Conversations are saved to your account, so they're here when you come back.
          </p>
        </div>

        <div style={{ flex: 1, overflow: "auto", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          {booting && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Loading your conversations…</div>}
          {!booting && messages.length === 0 && (
            <div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>Try one of these:</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)} style={{ textAlign: "left", fontSize: 12.5, padding: "9px 13px", borderRadius: 8, cursor: "pointer", background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <div style={{
                maxWidth: "78%", whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.65, padding: "10px 14px", borderRadius: 12,
                background: m.role === "user" ? "var(--gradient-btn)" : "var(--bg-card2)",
                border: m.role === "user" ? "none" : "1px solid var(--border)",
                color: m.role === "user" ? "#fffdf8" : "var(--text-primary)",
              }}>{m.content}</div>
            </div>
          ))}
          {loading && <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Thinking…</div>}
          <div ref={endRef} />
        </div>

        {notice && (
          <div style={{ marginTop: 10, fontSize: 12, padding: "8px 12px", borderRadius: 8, background: "rgba(179,64,47,0.08)", border: "1px solid rgba(179,64,47,0.25)", color: "var(--accent-red)" }}>{notice}</div>
        )}

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-secondary)", margin: "12px 0 8px" }}>
          <input type="checkbox" checked={includePortfolio} onChange={e => setIncludePortfolio(e.target.checked)} />
          Use my portfolio + current market news to suggest what to buy, hold, or avoid long-term
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask a money question…"
            style={{ flex: 1, background: "var(--bg-card)", border: "1px solid var(--border-bright)", borderRadius: 8, padding: "11px 14px", fontSize: 13.5, outline: "none" }} />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{
            padding: "0 22px", borderRadius: 8, border: "none", background: "var(--gradient-btn)", color: "white", fontWeight: 600, fontSize: 13,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer", opacity: loading || !input.trim() ? 0.6 : 1,
          }}>Send</button>
        </div>
        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>General educational information, not licensed investment advice.</p>
      </div>
    </div>
  );
}
