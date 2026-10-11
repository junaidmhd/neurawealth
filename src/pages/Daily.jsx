import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "../api";

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export default function Daily() {
  const [data, setData] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [err, setErr] = useState(null);
  const today = iso(new Date());

  const load = async () => { try { const r = await apiFetch("/habits"); setData(await r.json()); } catch (e) { setErr("Could not load habits"); } };
  useEffect(() => { load(); }, []);

  const toggle = async (habitId) => { const r = await apiFetch("/habits/toggle", { method: "POST", body: JSON.stringify({ habitId }) }); setData(await r.json()); };
  const add = async () => {
    if (!newTitle.trim()) return;
    const r = await apiFetch("/habits/habits", { method: "POST", body: JSON.stringify({ title: newTitle }) });
    const d = await r.json(); if (r.ok) { setData(d); setNewTitle(""); setErr(null); } else setErr(d.message);
  };
  const remove = async (id) => { const r = await apiFetch(`/habits/habits/${id}`, { method: "DELETE" }); setData(await r.json()); };

  const stats = useMemo(() => {
    if (!data) return null;
    const total = data.habits.length || 1;
    const doneOn = (k) => (data.log[k] || []).filter(id => data.habits.some(h => h.id === id)).length;
    // A day "counts" as a 1% day if at least one habit was done.
    let streak = 0; let cursor = new Date();
    if (!doneOn(iso(cursor))) cursor = addDays(cursor, -1);
    while (doneOn(iso(cursor)) > 0) { streak++; cursor = addDays(cursor, -1); }
    const activeDays = Object.keys(data.log).filter(k => doneOn(k) > 0).length;
    const grid = Array.from({ length: 84 }, (_, i) => { const k = iso(addDays(new Date(), i - 83)); return { k, pct: doneOn(k) / total }; });
    return { streak, activeDays, grid, todayDone: doneOn(today), total, compound: Math.pow(1.01, activeDays) };
  }, [data, today]);

  if (!data || !stats) return <div style={{ padding: 32, color: "var(--text-muted)" }}>{err || "Loading…"}</div>;
  const doneToday = new Set(data.log[today] || []);
  const yearTarget = Math.pow(1.01, 365);

  const Card = ({ label, value, sub }) => (
    <div style={{ flex: 1, minWidth: 160, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--text-muted)" }}>{label}</div>
      <div className="num" style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 2 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "24px 32px" }}>
      <h1 style={{ fontSize: 26, fontWeight: 600 }}>Daily 1%</h1>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "4px 0 20px", maxWidth: 560 }}>
        Small money habits, done daily. Get 1% better each day and it compounds to roughly {yearTarget.toFixed(1)}× in a year.
      </p>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <Card label="CURRENT STREAK" value={`${stats.streak} day${stats.streak === 1 ? "" : "s"}`} sub="consecutive days with a check-in" />
        <Card label="TODAY" value={`${stats.todayDone}/${data.habits.length}`} sub="habits completed" />
        <Card label="COMPOUNDED SO FAR" value={`${stats.compound.toFixed(2)}×`} sub={`1.01 ^ ${stats.activeDays} active days`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px, 1fr) minmax(300px, 1fr)", gap: 18 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Today's check-in</div>
          {data.habits.map(h => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
              <button onClick={() => toggle(h.id)} aria-label={`Toggle ${h.title}`} style={{
                width: 22, height: 22, borderRadius: 6, cursor: "pointer", flexShrink: 0, color: "#fffdf8", fontSize: 13, lineHeight: 1,
                border: "1.5px solid var(--accent-blue)", background: doneToday.has(h.id) ? "var(--accent-blue)" : "transparent",
              }}>{doneToday.has(h.id) ? "✓" : ""}</button>
              <span style={{ flex: 1, fontSize: 13.5, textDecoration: doneToday.has(h.id) ? "line-through" : "none", color: doneToday.has(h.id) ? "var(--text-muted)" : "var(--text-primary)" }}>{h.title}</span>
              <button onClick={() => remove(h.id)} title="Remove" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 15 }}>×</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder="Add your own habit…"
              style={{ flex: 1, background: "var(--bg-primary)", border: "1px solid var(--border-bright)", borderRadius: 8, padding: "9px 12px", fontSize: 13, outline: "none" }} />
            <button onClick={add} style={{ padding: "0 16px", borderRadius: 8, border: "none", background: "var(--gradient-btn)", color: "white", fontWeight: 600, cursor: "pointer" }}>Add</button>
          </div>
          {err && <div style={{ fontSize: 12, color: "var(--accent-red)", marginTop: 8 }}>{err}</div>}
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Last 12 weeks</div>
          <div style={{ display: "grid", gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column", gap: 4 }}>
            {stats.grid.map(c => (
              <div key={c.k} title={`${c.k}: ${Math.round(c.pct * 100)}%`} style={{
                aspectRatio: "1", borderRadius: 3, border: c.k === today ? "1.5px solid var(--accent-blue)" : "1px solid var(--border)",
                background: c.pct === 0 ? "var(--bg-card2)" : `rgba(139,94,60,${0.25 + c.pct * 0.75})`,
              }} />
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: 14, lineHeight: 1.6 }}>
            Darker squares mean more habits done that day. A day with at least one habit counts toward your streak and your compounding.
          </div>
        </div>
      </div>
    </div>
  );
}
