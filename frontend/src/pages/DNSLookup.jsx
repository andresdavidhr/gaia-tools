import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#1a2a8a";
const ACCENT_BG = "rgba(26,42,138,0.05)";
const RECORD_TYPES = ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "SOA"];

export default function DNSLookup() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState("");
  const [rtype, setRtype] = useState("A");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  async function handleLookup() {
    if (!domain.trim()) { setError("Enter a domain."); return; }
    setError(""); setData(null); setLoading(true);
    try {
      const res = await fetch("/api/dns/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim(), record_type: rtype }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || `Error ${res.status}.`);
      setData(json);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>
      <h1 style={s.title}>DNS Lookup</h1>
      <p style={s.subtitle}>Query DNS records — A, MX, TXT, NS, CNAME and more.</p>

      <div style={s.modeTabs}>
        {RECORD_TYPES.map((t) => (
          <button key={t} style={{ ...s.modeTab, color: rtype === t ? ACCENT : "var(--text-muted)", borderBottomColor: rtype === t ? ACCENT : "transparent" }}
            onClick={() => { setRtype(t); setData(null); setError(""); }}>
            {t}
          </button>
        ))}
      </div>

      <div style={s.inputRow}>
        <input style={{ ...s.input, flex: 1 }} placeholder="example.com"
          value={domain} onChange={(e) => { setDomain(e.target.value); setData(null); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          onFocus={(e) => (e.target.style.borderColor = ACCENT)}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        <button style={{ ...s.btn, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)", opacity: loading ? 0.6 : 1 }}
          onClick={handleLookup} disabled={loading}
          onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
          {loading ? "Looking up…" : "Lookup"}
        </button>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {data && (
        <div style={s.results}>
          {data.records.length === 0 ? (
            <p style={s.error}>No {rtype} records found for {data.domain}.</p>
          ) : (
            <div style={s.table}>
              <div style={s.tableHeader}>
                <span style={{ ...s.key, color: ACCENT }}>{data.record_type}</span>
                <span style={{ ...s.key, color: "var(--text-muted)" }}>{data.domain}</span>
              </div>
              {data.records.map((r, i) => (
                <div key={i} style={s.row}>
                  <span style={s.idx}>{i + 1}</span>
                  <span style={s.val}>{r}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "640px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" },
  back: { fontSize: "0.875rem", marginBottom: "2rem", cursor: "pointer", letterSpacing: "0.02em", alignSelf: "flex-start", transition: "color 0.2s ease" },
  title: { fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "0.25rem" },
  subtitle: { fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" },
  modeTabs: { display: "flex", borderBottom: "1px solid var(--border)", flexWrap: "wrap" },
  modeTab: { fontSize: "0.8rem", padding: "0.5rem 0.85rem", cursor: "pointer", letterSpacing: "0.04em", borderBottom: "2px solid transparent", marginBottom: "-1px", transition: "color 0.2s ease, border-color 0.2s ease", background: "none", fontFamily: "ui-monospace,'SF Mono',monospace" },
  inputRow: { display: "flex", gap: "0.75rem" },
  input: { transition: "border-color 0.2s ease" },
  btn: { padding: "0.75rem 1.5rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.875rem", letterSpacing: "0.02em", cursor: "pointer", transition: "all 0.2s ease", whiteSpace: "nowrap" },
  error: { fontSize: "0.85rem", color: "#888" },
  results: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  table: { border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" },
  tableHeader: { display: "flex", gap: "1rem", padding: "0.5rem 1rem", borderBottom: "1px solid var(--border)", background: "var(--surface)" },
  key: { fontSize: "0.7rem", letterSpacing: "0.08em", fontWeight: 600, textTransform: "uppercase" },
  row: { display: "flex", gap: "0.75rem", padding: "0.5rem 1rem", borderBottom: "1px solid var(--border)", alignItems: "baseline" },
  idx: { fontSize: "0.7rem", color: "var(--text-muted)", minWidth: "14px", textAlign: "right" },
  val: { fontSize: "0.8rem", color: "var(--text)", fontFamily: "ui-monospace,'SF Mono',monospace", wordBreak: "break-all" },
};
