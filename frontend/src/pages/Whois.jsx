import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#8a7a1a";
const ACCENT_BG = "rgba(138,122,26,0.05)";

export default function Whois() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  async function handleLookup() {
    if (!domain.trim()) { setError("Enter a domain."); return; }
    setError(""); setData(null); setLoading(true);
    try {
      const res = await fetch("/api/whois/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || `Error ${res.status}.`);
      setData(json);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const rows = data ? [
    ["Registrar",        data.registrar],
    ["Organization",     data.org],
    ["Country",          data.country],
    ["Status",           data.status],
    ["Created",          data.creation_date],
    ["Updated",          data.updated_date],
    ["Expires",          data.expiration_date],
  ].filter(([, v]) => v) : [];

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>
      <h1 style={s.title}>Whois</h1>
      <p style={s.subtitle}>Look up domain registration info — registrar, dates, nameservers.</p>

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
          <div style={s.table}>
            {rows.map(([k, v]) => (
              <div key={k} style={s.row}>
                <span style={s.key}>{k}</span>
                <span style={s.val}>{v}</span>
              </div>
            ))}
          </div>

          {data.nameservers?.length > 0 && (
            <div style={s.group}>
              <p style={{ ...s.groupLabel, color: ACCENT }}>Nameservers</p>
              <div style={s.nsList}>
                {data.nameservers.map((ns) => <span key={ns} style={s.nsTag}>{ns}</span>)}
              </div>
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
  inputRow: { display: "flex", gap: "0.75rem" },
  input: { transition: "border-color 0.2s ease" },
  btn: { padding: "0.75rem 1.5rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.875rem", letterSpacing: "0.02em", cursor: "pointer", transition: "all 0.2s ease", whiteSpace: "nowrap" },
  error: { fontSize: "0.85rem", color: "#888" },
  results: { display: "flex", flexDirection: "column", gap: "1rem" },
  table: { border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" },
  row: { display: "flex", gap: "1rem", padding: "0.5rem 1rem", borderBottom: "1px solid var(--border)" },
  key: { fontSize: "0.78rem", color: "var(--text-muted)", minWidth: "110px", flexShrink: 0 },
  val: { fontSize: "0.8rem", color: "var(--text)", wordBreak: "break-all", fontFamily: "ui-monospace,'SF Mono',monospace" },
  group: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  groupLabel: { fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 },
  nsList: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  nsTag: { fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "ui-monospace,'SF Mono',monospace" },
};
