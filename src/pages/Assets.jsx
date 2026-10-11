import { useEffect, useState } from "react";
import { useAuth } from "../App";
import { apiFetch } from "../api";

const ASSET_TYPES = ["stock", "crypto", "mutual_fund", "gold", "real_estate", "other"];
const TYPE_ICONS = { stock: "📈", crypto: "₿", mutual_fund: "🏦", gold: "🥇", real_estate: "🏠", other: "💎" };

export default function Assets() {
  // no auth needed
  const [assets, setAssets] = useState([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  const [formData, setFormData] = useState({ name: "", ticker: "", type: "stock", price: "", quantity: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("value");

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/assets");
      const data = await res.json();
      if (data.assets) { setAssets(data.assets); setTotalValue(data.totalValue); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAssets(); }, []);

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.quantity) return alert("Fill all required fields");
    setSaving(true);
    try {
      const url = editAsset ? `/assets/${editAsset._id}` : `/assets`;
      const method = editAsset ? "PUT" : "POST";
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowForm(false); setEditAsset(null);
        setFormData({ name: "", ticker: "", type: "stock", price: "", quantity: "", notes: "" });
        fetchAssets();
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this asset?")) return;
    try {
      await apiFetch(`/assets/${id}`, { method: "DELETE" });
      fetchAssets();
    } catch (e) { console.error(e); }
  };

  const openEdit = (asset) => {
    setEditAsset(asset);
    setFormData({ name: asset.name, ticker: asset.ticker || "", type: asset.type || "stock", price: asset.price, quantity: asset.quantity, notes: asset.notes || "" });
    setShowForm(true);
  };

  const filtered = assets.filter(a => filter === "all" || a.type === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "value") return (b.price * b.quantity) - (a.price * a.quantity);
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "date") return new Date(b.createdAt) - new Date(a.createdAt);
    return 0;
  });

  const byType = {};
  assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + a.price * a.quantity; });

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Portfolio Manager</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Track and manage your investment portfolio</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditAsset(null); setFormData({ name: "", ticker: "", type: "stock", price: "", quantity: "", notes: "" }); }} style={{
          padding: "10px 20px", background: "var(--gradient-btn)", border: "none", borderRadius: 10,
          color: "white", fontFamily: "Outfit", fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: "0 4px 15px rgba(139,94,60,0.3)", display: "flex", alignItems: "center", gap: 8,
        }}>
          + Add Investment
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Total Portfolio Value</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--accent-blue)" }}>₹{totalValue.toLocaleString("en-IN")}</div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Total Investments</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--accent-violet)" }}>{assets.length}</div>
        </div>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>Asset Classes</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--accent-green)" }}>{Object.keys(byType).length}</div>
        </div>
      </div>

      {/* Allocation breakdown */}
      {Object.keys(byType).length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 24px", marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Allocation Breakdown</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(byType).map(([type, val]) => {
              const pct = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : 0;
              return (
                <div key={type} style={{ flex: "1 1 180px", background: "rgba(92,64,51,0.03)", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{TYPE_ICONS[type]} {type.replace("_", " ")}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-blue)" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(92,64,51,0.06)", borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "var(--gradient-btn)", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>₹{val.toLocaleString("en-IN")}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {["all", ...ASSET_TYPES].map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: "6px 12px", border: "1px solid " + (filter === t ? "var(--accent-blue)" : "var(--border)"),
              borderRadius: 8, background: filter === t ? "rgba(139,94,60,0.12)" : "transparent",
              color: filter === t ? "var(--accent-blue)" : "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontFamily: "Outfit",
            }}>
              {t === "all" ? "All" : TYPE_ICONS[t] + " " + t.replace("_", " ")}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
          marginLeft: "auto", padding: "6px 12px", background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 8, color: "var(--text-secondary)", fontFamily: "Outfit", fontSize: 12, cursor: "pointer",
        }}>
          <option value="value">Sort: Value</option>
          <option value="name">Sort: Name</option>
          <option value="date">Sort: Date</option>
        </select>
      </div>

      {/* Asset table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
          {["Asset", "Type", "Price", "Quantity", "Total Value", "Actions"].map(h => (
            <span key={h} style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</span>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No investments yet</div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Add your first asset to start tracking your portfolio</div>
          </div>
        ) : (
          sorted.map((a, i) => (
            <div key={a._id} style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 80px", gap: 12,
              padding: "14px 20px", borderBottom: i < sorted.length - 1 ? "1px solid rgba(92,64,51,0.08)" : "none",
              alignItems: "center", transition: "background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(92,64,51,0.02)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgba(139,94,60,0.25), rgba(176,137,104,0.25))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  {TYPE_ICONS[a.type] || "💎"}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.ticker || "—"}</div>
                </div>
              </div>
              <span style={{ fontSize: 12, padding: "3px 8px", background: "rgba(139,94,60,0.1)", borderRadius: 6, color: "var(--accent-blue)", width: "fit-content" }}>
                {a.type?.replace("_", " ")}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>₹{Number(a.price).toLocaleString("en-IN")}</span>
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{a.quantity}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-green)" }}>₹{(a.price * a.quantity).toLocaleString("en-IN")}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => openEdit(a)} style={{ width: 30, height: 30, border: "none", borderRadius: 6, background: "rgba(139,94,60,0.1)", cursor: "pointer", fontSize: 14 }} title="Edit">✏️</button>
                <button onClick={() => handleDelete(a._id)} style={{ width: 30, height: 30, border: "none", borderRadius: 6, background: "rgba(179,64,47,0.1)", cursor: "pointer", fontSize: 14 }} title="Delete">🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(4px)" }}>
          <div style={{ background: "var(--bg-card2)", border: "1px solid var(--border-bright)", borderRadius: 16, padding: "32px", width: 480, animation: "fadeIn 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{editAsset ? "Edit Investment" : "Add Investment"}</h2>
              <button onClick={() => { setShowForm(false); setEditAsset(null); }} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: 20 }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { label: "Asset Name *", key: "name", placeholder: "e.g. Reliance Industries" },
                { label: "Ticker Symbol", key: "ticker", placeholder: "e.g. RELIANCE" },
              ].map(f => (
                <div key={f.key} style={f.key === "name" ? { gridColumn: "1 / -1" } : {}}>
                  <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input value={formData[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} placeholder={f.placeholder} style={{
                    width: "100%", padding: "12px 14px", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border-bright)", borderRadius: 10,
                    color: "var(--text-primary)", fontFamily: "Outfit", fontSize: 14, outline: "none",
                  }} />
                </div>
              ))}

              <div>
                <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Asset Type *</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{
                  width: "100%", padding: "12px 14px", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border-bright)", borderRadius: 10,
                  color: "var(--text-primary)", fontFamily: "Outfit", fontSize: 14, cursor: "pointer",
                }}>
                  {ASSET_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t.replace("_", " ")}</option>)}
                </select>
              </div>

              {[
                { label: "Purchase Price (₹) *", key: "price", placeholder: "0.00", type: "number" },
                { label: "Quantity *", key: "quantity", placeholder: "1", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input type={f.type} value={formData[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} placeholder={f.placeholder} style={{
                    width: "100%", padding: "12px 14px", background: "rgba(92,64,51,0.04)", border: "1px solid var(--border-bright)", borderRadius: 10,
                    color: "var(--text-primary)", fontFamily: "Outfit", fontSize: 14, outline: "none",
                  }} />
                </div>
              ))}

              {formData.price && formData.quantity && (
                <div style={{ gridColumn: "1 / -1", padding: "12px 14px", background: "rgba(74,124,89,0.08)", border: "1px solid rgba(74,124,89,0.2)", borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total Value: </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-green)" }}>₹{(formData.price * formData.quantity).toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button onClick={() => { setShowForm(false); setEditAsset(null); }} style={{ flex: 1, padding: 14, border: "1px solid var(--border)", borderRadius: 10, background: "transparent", color: "var(--text-secondary)", fontFamily: "Outfit", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: 14, background: "var(--gradient-btn)", border: "none", borderRadius: 10, color: "white", fontFamily: "Outfit", fontSize: 15, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : editAsset ? "Update Asset" : "Add Asset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
