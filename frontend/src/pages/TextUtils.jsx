import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#1a4f8a";
const ACCENT_BG = "rgba(26,79,138,0.05)";

const TRANSFORMS = [
  { label: "UPPER",    fn: (t) => t.toUpperCase() },
  { label: "lower",    fn: (t) => t.toLowerCase() },
  { label: "Title",    fn: (t) => t.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase()) },
  { label: "Sentence", fn: (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase() },
];

const LINE_OPS = [
  { label: "Sort A→Z",    fn: (t) => t.split("\n").sort().join("\n") },
  { label: "Sort Z→A",    fn: (t) => t.split("\n").sort().reverse().join("\n") },
  { label: "Remove dups", fn: (t) => [...new Set(t.split("\n"))].join("\n") },
  { label: "Reverse",     fn: (t) => t.split("\n").reverse().join("\n") },
];

function count(text) {
  return {
    chars: text.length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split("\n").length : 0,
  };
}

export default function TextUtils() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const stats = count(text);

  function apply(fn) { setText(fn(text)); }

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>Text Utilities</h1>
      <p style={s.subtitle}>Transform and analyze text instantly.</p>

      <div style={s.stats}>
        {[["chars", stats.chars], ["words", stats.words], ["lines", stats.lines]].map(([k, v]) => (
          <div key={k} style={s.stat}>
            <span style={{ ...s.statVal, color: ACCENT }}>{v}</span>
            <span style={s.statLabel}>{k}</span>
          </div>
        ))}
      </div>

      <textarea
        style={s.textarea}
        placeholder="Paste or type text here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        onFocus={(e) => e.target.style.borderColor = ACCENT}
        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
      />

      <div style={s.section}>
        <p style={s.sectionLabel}>Transform</p>
        <div style={s.btnRow}>
          {TRANSFORMS.map(({ label, fn }) => (
            <ActionBtn key={label} label={label} accent={ACCENT} accentBg={ACCENT_BG} onClick={() => apply(fn)} />
          ))}
        </div>
      </div>

      <div style={s.section}>
        <p style={s.sectionLabel}>Lines</p>
        <div style={s.btnRow}>
          {LINE_OPS.map(({ label, fn }) => (
            <ActionBtn key={label} label={label} accent={ACCENT} accentBg={ACCENT_BG} onClick={() => apply(fn)} />
          ))}
        </div>
      </div>

      <button style={{ ...s.copy, color: copied ? ACCENT : "var(--text-muted)", borderColor: copied ? ACCENT : "var(--border)" }}
        onClick={copy}>
        {copied ? "Copied!" : "Copy text"}
      </button>
    </div>
  );
}

function ActionBtn({ label, accent, accentBg, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      style={{ padding: "0.5rem 1rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.8rem", letterSpacing: "0.03em", cursor: "pointer", transition: "all 0.2s ease", borderColor: hover ? accent : "var(--border)", color: hover ? accent : "var(--text-muted)", background: hover ? accentBg : "transparent" }}
      onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {label}
    </button>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "560px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" },
  back: { fontSize: "0.875rem", cursor: "pointer", letterSpacing: "0.02em", alignSelf: "flex-start", transition: "color 0.2s ease" },
  title: { fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "-0.75rem" },
  subtitle: { fontSize: "0.9rem", color: "var(--text-muted)" },
  stats: { display: "flex", gap: "2rem" },
  stat: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem" },
  statVal: { fontSize: "1.5rem", fontWeight: 600, fontVariantNumeric: "tabular-nums", transition: "color 0.2s ease" },
  statLabel: { fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.05em" },
  textarea: { resize: "vertical", minHeight: "160px", lineHeight: 1.6, transition: "border-color 0.2s ease" },
  section: { display: "flex", flexDirection: "column", gap: "0.6rem" },
  sectionLabel: { fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" },
  btnRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  copy: { alignSelf: "flex-start", padding: "0.5rem 1.25rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.85rem", cursor: "pointer", transition: "all 0.2s ease" },
};
