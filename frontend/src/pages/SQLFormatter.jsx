import { format } from "sql-formatter";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#5a7a3a";
const ACCENT_BG = "rgba(90,122,58,0.05)";

const DIALECTS = [
  { id: "sql",        label: "SQL" },
  { id: "mysql",      label: "MySQL" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "tsql",       label: "T-SQL" },
];

export default function SQLFormatter() {
  const navigate = useNavigate();
  const [sql, setSql] = useState("");
  const [dialect, setDialect] = useState("sql");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  function handleFormat() {
    if (!sql.trim()) { setError("Enter a SQL query."); return; }
    setError("");
    try {
      setResult(format(sql, { language: dialect, tabWidth: 2, keywordCase: "upper" }));
    } catch (e) {
      setError(e.message);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>
      <h1 style={s.title}>SQL Formatter</h1>
      <p style={s.subtitle}>Format and beautify SQL queries with dialect support.</p>

      <div style={s.modeTabs}>
        {DIALECTS.map((d) => (
          <button key={d.id} style={{ ...s.modeTab, color: dialect === d.id ? ACCENT : "var(--text-muted)", borderBottomColor: dialect === d.id ? ACCENT : "transparent" }}
            onClick={() => { setDialect(d.id); setResult(""); setError(""); }}>
            {d.label}
          </button>
        ))}
      </div>

      <textarea style={{ ...s.textarea, ...s.mono }} rows={10}
        placeholder="SELECT * FROM users WHERE active = 1 AND created_at > '2024-01-01';"
        value={sql} onChange={(e) => { setSql(e.target.value); setResult(""); setError(""); }}
        onFocus={(e) => (e.target.style.borderColor = ACCENT)}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />

      <button style={{ ...s.action, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)" }}
        onClick={handleFormat}
        onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
        Format
      </button>

      {error && <p style={s.error}>{error}</p>}

      {result && (
        <div style={s.resultBlock}>
          <div style={s.resultHeader}>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Result</span>
            <button style={{ ...s.copyBtn, color: copied ? ACCENT : "var(--text-muted)" }} onClick={copy}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <pre style={s.pre}>{result}</pre>
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
  modeTabs: { display: "flex", borderBottom: "1px solid var(--border)" },
  modeTab: { fontSize: "0.875rem", padding: "0.6rem 1rem", cursor: "pointer", letterSpacing: "0.02em", borderBottom: "2px solid transparent", marginBottom: "-1px", transition: "color 0.2s ease, border-color 0.2s ease", background: "none" },
  textarea: { resize: "vertical", lineHeight: 1.6, transition: "border-color 0.2s ease" },
  mono: { fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.8rem" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", cursor: "pointer", transition: "all 0.2s ease" },
  error: { fontSize: "0.85rem", color: "#888" },
  resultBlock: { border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" },
  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 1rem", borderBottom: "1px solid var(--border)", background: "var(--surface)" },
  copyBtn: { fontSize: "0.75rem", cursor: "pointer", transition: "color 0.2s ease" },
  pre: { fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0, padding: "1rem", lineHeight: 1.6 },
};
