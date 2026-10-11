import { useEffect, useState } from "react";

const API = "/api";

const SENTIMENT_MAP = {
  positive: { label: "Positive", color: "var(--accent-green)", bg: "rgba(74,124,89,0.1)" },
  neutral:  { label: "Neutral",  color: "var(--accent-yellow)", bg: "rgba(245,158,11,0.1)" },
  negative: { label: "Negative", color: "var(--accent-red)",   bg: "rgba(179,64,47,0.1)" },
};

function getSentiment(score) {
  if (score >= 0.65) return "positive";
  if (score >= 0.4)  return "neutral";
  return "negative";
}

function NewsCard({ item }) {
  const sentimentScore = item.entities?.[0]?.sentiment_score ?? 0.5;
  const sentiment = getSentiment(sentimentScore);
  const s = SENTIMENT_MAP[sentiment];
  const date = new Date(item.published_at);
  const timeAgo = Math.round((Date.now() - date) / 3600000);

  return (
    <div
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14,
        overflow: "hidden", transition: "border-color 0.2s, transform 0.2s", cursor: "pointer",
      }}
      onClick={() => window.open(item.url, "_blank")}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-bright)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Image / emoji placeholder */}
      <div style={{ height: 160, background: "linear-gradient(135deg, rgba(139,94,60,0.15), rgba(176,137,104,0.15))", position: "relative", overflow: "hidden" }}>
        {item.image_url ? (
          <img src={item.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
            {item.entities?.[0]?.symbol?.includes("BTC")   ? "₿" :
             item.entities?.[0]?.symbol?.includes("GOLD")  ? "🥇" :
             item.entities?.[0]?.symbol?.includes("NIFTY") ? "📊" :
             item.entities?.[0]?.symbol?.includes("CRUDE") ? "🛢️" : "📰"}
          </div>
        )}
        <div style={{ position: "absolute", top: 10, right: 10, padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color, backdropFilter: "blur(4px)" }}>
          {s.label} {Math.round(sentimentScore * 100)}%
        </div>
      </div>

      <div style={{ padding: "16px 18px 18px" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          {item.entities?.slice(0, 2).map((e, i) => (
            <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "rgba(139,94,60,0.1)", borderRadius: 5, color: "var(--accent-blue)", fontWeight: 600 }}>
              {e.symbol}
            </span>
          ))}
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, marginBottom: 10, color: "var(--text-primary)" }}>{item.title}</h3>
        {item.description && (
          <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.description}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: "var(--text-muted)" }}>
          <span>{item.source || "Market News"}</span>
          <span>{timeAgo > 0 ? `${timeAgo}h ago` : "Just now"}</span>
        </div>
      </div>
    </div>
  );
}

export default function News() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API}/news`);
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();
        if (data.data && Array.isArray(data.data)) {
          setNews(data.data);
        } else {
          throw new Error("Unexpected response format");
        }
      } catch (e) {
        console.error("News fetch error:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const FILTERS = ["all", "positive", "neutral", "negative"];

  const filtered = filter === "all"
    ? news
    : news.filter(item => getSentiment(item.entities?.[0]?.sentiment_score ?? 0.5) === filter);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Market Intelligence</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 4 }}>Real-time financial news with AI sentiment analysis</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "rgba(74,124,89,0.08)", border: "1px solid rgba(74,124,89,0.2)", borderRadius: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-green)", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent-green)" }}>LIVE FEED</span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(179,64,47,0.08)", border: "1px solid rgba(179,64,47,0.25)", borderRadius: 10, marginBottom: 20, fontSize: 13, color: "var(--accent-red)" }}>
          ⚠️ Could not load news: {error}. Make sure the backend server is running on port 5000.
        </div>
      )}

      {/* Sentiment summary */}
      {!loading && news.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
          {["positive", "neutral", "negative"].map(sentKey => {
            const count = news.filter(n => getSentiment(n.entities?.[0]?.sentiment_score ?? 0.5) === sentKey).length;
            const pct = Math.round((count / news.length) * 100);
            const info = SENTIMENT_MAP[sentKey];
            return (
              <div key={sentKey} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", textTransform: "capitalize" }}>{sentKey} Sentiment</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: info.color }}>{pct}%</span>
                </div>
                <div style={{ height: 3, background: "rgba(92,64,51,0.06)", borderRadius: 2 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: info.color, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>{count} articles</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 16px",
            border: "1px solid " + (filter === f ? "var(--accent-blue)" : "var(--border)"),
            borderRadius: 8,
            background: filter === f ? "rgba(139,94,60,0.12)" : "transparent",
            color: filter === f ? "var(--accent-blue)" : "var(--text-secondary)",
            fontSize: 12, cursor: "pointer", fontFamily: "Outfit", textTransform: "capitalize",
          }}>{f}</button>
        ))}
      </div>

      {/* News grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, height: 320, animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {filtered.map((item, i) => <NewsCard key={i} item={item} />)}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No {filter} news found</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 8 }}>Try selecting a different filter</div>
        </div>
      )}
    </div>
  );
}
