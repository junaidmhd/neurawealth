import { useEffect, useState } from "react";
import { apiFetch } from "../api";

const TAGS = ["general", "research", "strategy", "watchlist", "reminder"];
const TAG_COLORS = {
  general: "var(--accent-blue)",
  research: "var(--accent-violet)",
  strategy: "var(--accent-green)",
  watchlist: "#b7791f",
  reminder: "#b3402f",
};

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [formData, setFormData] = useState({ title: "", content: "", tag: "general", pinned: false });
  const [saving, setSaving] = useState(false);
  const [filterTag, setFilterTag] = useState("all");
  const [search, setSearch] = useState("");

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/notes");
      const data = await res.json();
      if (data.notes) setNotes(data.notes);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotes(); }, []);

  const resetForm = () => setFormData({ title: "", content: "", tag: "general", pinned: false });

  const handleSubmit = async () => {
    if (!formData.title.trim() && !formData.content.trim()) return alert("Add a title or some content");
    setSaving(true);
    try {
      const url = editNote ? `/notes/${editNote._id}` : `/notes`;
      const method = editNote ? "PUT" : "POST";
      const res = await apiFetch(url, { method, body: JSON.stringify(formData) });
      if (res.ok) {
        setShowForm(false); setEditNote(null); resetForm();
        fetchNotes();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this note?")) return;
    try {
      await apiFetch(`/notes/${id}`, { method: "DELETE" });
      fetchNotes();
    } catch (e) { console.error(e); }
  };

  const togglePin = async (note) => {
    try {
      await apiFetch(`/notes/${note._id}`, { method: "PUT", body: JSON.stringify({ pinned: !note.pinned }) });
      fetchNotes();
    } catch (e) { console.error(e); }
  };

  const openEdit = (note) => {
    setEditNote(note);
    setFormData({ title: note.title, content: note.content, tag: note.tag || "general", pinned: !!note.pinned });
    setShowForm(true);
  };

  const filtered = notes
    .filter(n => filterTag === "all" || n.tag === filterTag)
    .filter(n => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    });

  const byTag = {};
  notes.forEach(n => { byTag[n.tag] = (byTag[n.tag] || 0) + 1; });

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Notes</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Your personal research and strategy notes, saved to your account</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditNote(null); resetForm(); }} style={{
          padding: "10px 20px", background: "var(--gradient-btn)", border: "none", borderRadius: 10,
          color: "white", fontFamily: "Outfit", fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 4px 15px rgba(139,94,60,0.3)", display: "flex", alignItems: "center", gap: 8,
        }}>
          + New Note
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Total Notes</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--accent-blue)" }}>{notes.length}</div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Pinned</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--accent-violet)" }}>{notes.filter(n => n.pinned).length}</div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Categories</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--accent-green)" }}>{Object.keys(byTag).length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["all", ...TAGS].map(t => (
            <button key={t} onClick={() => setFilterTag(t)} style={{
              padding: "6px 12px", border: "1px solid " + (filterTag === t ? "var(--accent-blue)" : "var(--border)"),
              borderRadius: 8, background: filterTag === t ? "rgba(139,94,60,0.12)" : "transparent",
              color: filterTag === t ? "var(--accent-blue)" : "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontFamily: "Outfit",
            }}>
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search notes..."
          style={{
            marginLeft: "auto", padding: "8px 14px", background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 8, color: "var(--text-primary)", fontFamily: "Outfit", fontSize: 12, outline: "none", minWidth: 200,
          }}
        />
      </div>

      {/* Notes grid */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: 60, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗒️</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No notes yet</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Jot down research, strategy ideas, or reminders to keep them handy</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {filtered.map(n => (
            <div key={n._id} style={{
              background: "var(--bg-card)", border: n.pinned ? "1px solid rgba(139,94,60,0.4)" : "1px solid var(--border)",
              borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700, flex: 1, wordBreak: "break-word" }}>{n.title || "Untitled note"}</div>
                <button onClick={() => togglePin(n)} title={n.pinned ? "Unpin" : "Pin"} style={{
                  background: "none", border: "none", cursor: "pointer", fontSize: 14,
                  color: n.pinned ? "var(--accent-blue)" : "var(--text-muted)", flexShrink: 0,
                }}>
                  {n.pinned ? "📌" : "📍"}
                </button>
              </div>

              <div style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word", flex: 1 }}>
                {n.content}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 6, width: "fit-content",
                  background: "rgba(92,64,51,0.06)", color: TAG_COLORS[n.tag] || "var(--accent-blue)",
                }}>
                  {n.tag}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEdit(n)} style={{ width: 28, height: 28, border: "none", borderRadius: 6, background: "rgba(139,94,60,0.1)", cursor: "pointer", fontSize: 13 }} title="Edit">✏️</button>
                  <button onClick={() => handleDelete(n._id)} style={{ width: 28, height: 28, border: "none", borderRadius: 6, background: "rgba(179,64,47,0.1)", cursor: "pointer", fontSize: 13 }} title="Delete">🗑️</button>
                </div>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                Updated {new Date(n.updatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--bg-card2)", border: "1px solid var(--border-bright)", borderRadius: 16, padding: "32px", width: 480, animation: "fadeIn 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editNote ? "Edit Note" : "New Note"}</h2>
              <button onClick={() => { setShowForm(false); setEditNote(null); }} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Title</label>
                <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Q3 rebalancing plan" style={{
                  width: "100%", padding: "12px 14px", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border-bright)", borderRadius: 10,
                  color: "var(--text-primary)", fontFamily: "Outfit", fontSize: 14, outline: "none",
                }} />
              </div>

              <div>
                <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Content</label>
                <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="Write your note..." rows={6} style={{
                  width: "100%", padding: "12px 14px", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border-bright)", borderRadius: 10,
                  color: "var(--text-primary)", fontFamily: "Outfit", fontSize: 14, outline: "none", resize: "vertical",
                }} />
              </div>

              <div style={{ display: "flex", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Category</label>
                  <select value={formData.tag} onChange={e => setFormData({ ...formData, tag: e.target.value })} style={{
                    width: "100%", padding: "12px 14px", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border-bright)", borderRadius: 10,
                    color: "var(--text-primary)", fontFamily: "Outfit", fontSize: 14, cursor: "pointer",
                  }}>
                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input type="checkbox" checked={formData.pinned} onChange={e => setFormData({ ...formData, pinned: e.target.checked })} />
                    Pin note
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={() => { setShowForm(false); setEditNote(null); }} style={{ flex: 1, padding: 14, border: "1px solid var(--border)", borderRadius: 10, background: "transparent", color: "var(--text-secondary)", fontFamily: "Outfit", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: 14, background: "var(--gradient-btn)", border: "none", borderRadius: 10, color: "white", fontFamily: "Outfit", fontSize: 15, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : editNote ? "Update Note" : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
