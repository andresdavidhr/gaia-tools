import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#8a1a6a";
const ACCENT_BG = "rgba(138,26,106,0.05)";

function statusColor(code) {
  if (code < 300) return "#3a7a5a";
  if (code < 400) return "#8a7a1a";
  if (code < 500) return "#8a5a1a";
  return "#8a2a1a";
}

export default function HTTPHeaders() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [copied, setCopied] = useState(null);

  async function handleFetch() {
    if (!url.trim()) { setError("Enter a URL."); return; }
    setError(""); setData(null); setLoading(true);
    try {
      const res = await fetch("/api/headers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || `Error ${res.status}.`);
      setData(json);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function copy(key, val) {
    await navigator.clipboard.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>
      <h1 style={s.title}>HTTP Headers</h1>
      <p style={s.subtitle}>Inspect response headers and status code of any URL.</p>

      <div style={s.inputRow}>
        <input style={{ ...s.input, flex: 1 }} placeholder="https://example.com"
          value={url} onChange={(e) => { setUrl(e.target.value); setData(null); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          onFocus={(e) => (e.target.style.borderColor = ACCENT)}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        <button style={{ ...s.btn, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)", opacity: loading ? 0.6 : 1 }}
          onClick={handleFetch} disabled={loading}
          onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
          {loading ? "Fetching…" : "Fetch"}
        </button>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {data && (
        <div style={s.results}>
          <div style={{ ...s.statusBadge, color: statusColor(data.status_code), borderColor: statusColor(data.status_code) }}>
            {data.status_code}
          </div>
          {data.url !== url && (
            <p style={s.redirect}>↳ redirected to <span style={{ color: "var(--text)", fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.78rem" }}>{data.url}</span></p>
          )}
          <div style={s.table}>
            {Object.entries(data.headers).map(([k, v]) => (
              <div key={k} style={s.row}>
                <span style={s.key}>{k}</span>
                <span style={s.val}>{v}</span>
                <button style={{ ...s.copyBtn, color: copied === k ? ACCENT : "var(--text-muted)" }}
                  onClick={() => copy(k, v)}>
                  {copied === k ? "✓" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "760px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" },
  back: { fontSize: "0.875rem", marginBottom: "2rem", cursor: "pointer", letterSpacing: "0.02em", alignSelf: "flex-start", transition: "color 0.2s ease" },
  title: { fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "0.25rem" },
  subtitle: { fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" },
  inputRow: { display: "flex", gap: "0.75rem" },
  input: { transition: "border-color 0.2s ease" },
  btn: { padding: "0.75rem 1.5rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.875rem", letterSpacing: "0.02em", cursor: "pointer", transition: "all 0.2s ease", whiteSpace: "nowrap" },
  error: { fontSize: "0.85rem", color: "#888" },
  results: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  statusBadge: { alignSelf: "flex-start", padding: "0.3rem 0.75rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.9rem", fontWeight: 600, fontFamily: "ui-monospace,'SF Mono',monospace" },
  redirect: { fontSize: "0.78rem", color: "var(--text-muted)" },
  table: { border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" },
  row: { display: "flex", gap: "0.75rem", padding: "0.45rem 1rem", borderBottom: "1px solid var(--border)", alignItems: "baseline" },
  key: { fontSize: "0.75rem", color: "var(--text-muted)", minWidth: "200px", flexShrink: 0, fontFamily: "ui-monospace,'SF Mono',monospace" },
  val: { fontSize: "0.75rem", color: "var(--text)", flex: 1, wordBreak: "break-all", fontFamily: "ui-monospace,'SF Mono',monospace" },
  copyBtn: { fontSize: "0.7rem", cursor: "pointer", transition: "color 0.15s ease", flexShrink: 0 },
};
