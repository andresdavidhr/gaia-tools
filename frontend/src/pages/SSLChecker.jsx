import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#1a7a4a";
const ACCENT_BG = "rgba(26,122,74,0.05)";

export default function SSLChecker() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  async function handleCheck() {
    if (!input.trim()) { setError("Enter a hostname."); return; }
    setError(""); setData(null); setLoading(true);
    try {
      const res = await fetch("/api/ssl/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname: input.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || `Error ${res.status}.`);
      setData(json);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const statusColor = data
    ? data.expired ? "#8a2a1a" : data.days_left < 14 ? "#8a6a1a" : ACCENT
    : ACCENT;

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>
      <h1 style={s.title}>SSL Checker</h1>
      <p style={s.subtitle}>Inspect TLS certificates — validity, issuer, SANs and expiry.</p>

      <div style={s.inputRow}>
        <input style={{ ...s.input, flex: 1 }} placeholder="example.com"
          value={input} onChange={(e) => { setInput(e.target.value); setData(null); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleCheck()}
          onFocus={(e) => (e.target.style.borderColor = ACCENT)}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        <button style={{ ...s.btn, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)", opacity: loading ? 0.6 : 1 }}
          onClick={handleCheck} disabled={loading}
          onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
          {loading ? "Checking…" : "Check"}
        </button>
      </div>

      {error && <p style={s.error}>{error}</p>}

      {data && (
        <div style={s.results}>
          <div style={{ ...s.statusBadge, borderColor: statusColor, color: statusColor }}>
            {data.expired ? "Expired" : data.trusted ? `Valid · ${data.days_left} days left` : `Untrusted · ${data.days_left} days left`}
          </div>

          <div style={s.table}>
            {[
              ["Common Name",  data.subject_cn],
              ["Issuer",       data.issuer_cn || data.issuer_o],
              ["Valid From",   data.not_before],
              ["Valid To",     data.not_after],
              ["TLS Version",  data.tls_version],
              ["Cipher",       data.cipher],
            ].map(([k, v]) => v ? (
              <div key={k} style={s.row}><span style={s.key}>{k}</span><span style={s.val}>{v}</span></div>
            ) : null)}
          </div>

          {data.sans.length > 0 && (
            <div style={s.group}>
              <p style={{ ...s.groupLabel, color: ACCENT }}>Subject Alt Names</p>
              <div style={s.sansList}>
                {data.sans.map((san) => <span key={san} style={s.sanTag}>{san}</span>)}
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
  statusBadge: { alignSelf: "flex-start", padding: "0.35rem 0.9rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.8rem", letterSpacing: "0.04em", fontWeight: 500 },
  table: { border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" },
  row: { display: "flex", gap: "1rem", padding: "0.5rem 1rem", borderBottom: "1px solid var(--border)" },
  key: { fontSize: "0.78rem", color: "var(--text-muted)", minWidth: "120px", flexShrink: 0 },
  val: { fontSize: "0.8rem", color: "var(--text)", fontFamily: "ui-monospace,'SF Mono',monospace", wordBreak: "break-all" },
  group: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  groupLabel: { fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 },
  sansList: { display: "flex", flexWrap: "wrap", gap: "0.35rem" },
  sanTag: { fontSize: "0.75rem", padding: "0.2rem 0.6rem", border: "1px solid var(--border)", borderRadius: "6px", color: "var(--text-muted)", fontFamily: "ui-monospace,'SF Mono',monospace" },
};
