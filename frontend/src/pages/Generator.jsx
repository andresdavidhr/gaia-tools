import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#a07820";
const ACCENT_BG = "rgba(160,120,32,0.05)";

export default function Generator() {
  const navigate = useNavigate();
  const [length, setLength] = useState(16);
  const [symbols, setSymbols] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [copyHover, setCopyHover] = useState(false);

  async function generate() {
    setLoading(true);
    setCopied(false);
    const params = new URLSearchParams({ length, symbols, numbers });
    const res = await fetch(`/api/password/generate?${params}`);
    const data = await res.json();
    setPassword(data.password);
    setLoading(false);
  }

  async function copy() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={s.page}>
      <button
        style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")}
        onMouseEnter={() => setBackHover(true)}
        onMouseLeave={() => setBackHover(false)}
      >
        ← back
      </button>

      <h1 style={s.title}>Generator</h1>
      <p style={s.subtitle}>Create strong, random passwords.</p>

      <div style={s.form}>
        <div style={s.row}>
          <span style={s.label}>Length</span>
          <span style={{ ...s.value, color: ACCENT }}>{length}</span>
        </div>
        <input
          type="range" min={8} max={128} value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          style={{ accentColor: ACCENT }}
        />

        <div style={s.toggleRow}>
          {[{ label: "Numbers", val: numbers, set: setNumbers }, { label: "Symbols", val: symbols, set: setSymbols }].map(({ label, val, set }) => (
            <label key={label} style={{ ...s.toggle, color: val ? ACCENT : "var(--text-muted)" }}>
              <input
                type="checkbox"
                checked={val}
                onChange={(e) => set(e.target.checked)}
                style={{ accentColor: ACCENT }}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <button
          style={{
            ...s.action,
            borderColor: btnHover ? ACCENT : "var(--border)",
            background: btnHover ? ACCENT_BG : "var(--surface)",
            color: btnHover ? ACCENT : "var(--text)",
          }}
          onClick={generate}
          disabled={loading}
          onMouseEnter={() => setBtnHover(true)}
          onMouseLeave={() => setBtnHover(false)}
        >
          {loading ? "Generating…" : "Generate"}
        </button>

        {password && (
          <div style={{ ...s.result, borderColor: copied ? ACCENT : "var(--border)" }}>
            <span style={s.passwordText}>{password}</span>
            <button
              style={{ ...s.copyBtn, color: copyHover || copied ? ACCENT : "var(--text-muted)" }}
              onClick={copy}
              onMouseEnter={() => setCopyHover(true)}
              onMouseLeave={() => setCopyHover(false)}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "560px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column" },
  back: { fontSize: "0.875rem", marginBottom: "3rem", cursor: "pointer", letterSpacing: "0.02em", alignSelf: "flex-start", transition: "color 0.2s ease" },
  title: { fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "0.5rem" },
  subtitle: { fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "3rem" },
  form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: "0.875rem", color: "var(--text-muted)" },
  value: { fontSize: "0.875rem", fontVariantNumeric: "tabular-nums", transition: "color 0.2s ease" },
  toggleRow: { display: "flex", gap: "2rem" },
  toggle: { display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "0.875rem", cursor: "pointer", transition: "color 0.2s ease" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", cursor: "pointer", transition: "border-color 0.2s ease, color 0.2s ease, background 0.2s ease", marginTop: "0.25rem" },
  result: { display: "flex", alignItems: "center", gap: "0.75rem", border: "1px solid", borderRadius: "var(--radius)", padding: "0.75rem 1rem", transition: "border-color 0.2s ease" },
  passwordText: { flex: 1, fontSize: "0.95rem", letterSpacing: "0.04em", fontFamily: "ui-monospace, 'SF Mono', monospace", wordBreak: "break-all" },
  copyBtn: { fontSize: "0.8rem", letterSpacing: "0.03em", cursor: "pointer", flexShrink: 0, transition: "color 0.2s ease" },
};
