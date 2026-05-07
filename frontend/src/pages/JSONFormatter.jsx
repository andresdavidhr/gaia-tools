import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#3a6b6b";
const ACCENT_BG = "rgba(58,107,107,0.05)";

const ACTIONS = [
  { label: "Format",   fn: (t) => JSON.stringify(JSON.parse(t), null, 2) },
  { label: "Minify",   fn: (t) => JSON.stringify(JSON.parse(t)) },
  { label: "Validate", fn: (t) => { JSON.parse(t); return t; } },
];

export default function JSONFormatter() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState(null);
  const [copied, setCopied] = useState(false);
  const [backHover, setBackHover] = useState(false);

  function apply(fn, label) {
    try {
      const result = fn(input);
      setOutput(result);
      setStatus({ ok: true, msg: label === "Validate" ? "Valid JSON ✓" : "Done" });
    } catch (e) {
      setOutput("");
      setStatus({ ok: false, msg: `Invalid JSON: ${e.message}` });
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(output || input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>JSON</h1>
      <p style={s.subtitle}>Format, minify and validate JSON.</p>

      <div style={s.layout}>
        <div style={s.col}>
          <p style={s.colLabel}>Input</p>
          <textarea style={s.textarea} placeholder='{"key": "value"}'
            value={input} onChange={(e) => { setInput(e.target.value); setStatus(null); setOutput(""); }}
            spellCheck={false}
            onFocus={(e) => e.target.style.borderColor = ACCENT}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
        </div>

        <div style={s.controls}>
          {ACTIONS.map(({ label, fn }) => (
            <ActionBtn key={label} label={label} accent={ACCENT} accentBg={ACCENT_BG}
              onClick={() => apply(fn, label)} />
          ))}
        </div>

        <div style={s.col}>
          <p style={s.colLabel}>Output</p>
          <textarea style={{ ...s.textarea, color: output ? "var(--text)" : "var(--text-muted)" }}
            readOnly value={output || ""} placeholder="Result will appear here…" spellCheck={false} />
        </div>
      </div>

      <div style={s.footer}>
        {status && (
          <span style={{ fontSize: "0.85rem", color: status.ok ? ACCENT : "#888" }}>
            {status.msg}
          </span>
        )}
        <button style={{ ...s.copy, color: copied ? ACCENT : "var(--text-muted)", borderColor: copied ? ACCENT : "var(--border)" }}
          onClick={copy}>
          {copied ? "Copied!" : "Copy output"}
        </button>
      </div>
    </div>
  );
}

function ActionBtn({ label, accent, accentBg, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button style={{ padding: "0.5rem 0.75rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.8rem", letterSpacing: "0.03em", cursor: "pointer", transition: "all 0.2s ease", borderColor: hover ? accent : "var(--border)", color: hover ? accent : "var(--text-muted)", background: hover ? accentBg : "transparent", whiteSpace: "nowrap" }}
      onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {label}
    </button>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "900px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" },
  back: { fontSize: "0.875rem", cursor: "pointer", letterSpacing: "0.02em", alignSelf: "flex-start", transition: "color 0.2s ease" },
  title: { fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "-1rem" },
  subtitle: { fontSize: "0.9rem", color: "var(--text-muted)" },
  layout: { display: "flex", gap: "1rem", alignItems: "flex-start" },
  col: { flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" },
  colLabel: { fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" },
  textarea: { resize: "vertical", minHeight: "320px", fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.8rem", lineHeight: 1.6, transition: "border-color 0.2s ease" },
  controls: { display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "1.5rem" },
  footer: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  copy: { padding: "0.5rem 1.25rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s ease" },
};
