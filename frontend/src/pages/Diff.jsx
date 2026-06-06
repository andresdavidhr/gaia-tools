import { diffLines } from "diff";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#4a5a8a";
const ACCENT_BG = "rgba(74,90,138,0.05)";

export default function Diff() {
  const navigate = useNavigate();
  const [original, setOriginal] = useState("");
  const [modified, setModified] = useState("");
  const [chunks, setChunks] = useState(null);
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  function handleCompare() {
    setChunks(diffLines(original, modified));
  }

  const additions = chunks ? chunks.filter((c) => c.added).reduce((n, c) => n + c.count, 0) : 0;
  const deletions = chunks ? chunks.filter((c) => c.removed).reduce((n, c) => n + c.count, 0) : 0;

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>Diff</h1>
      <p style={s.subtitle}>Compare two texts and highlight the differences.</p>

      <div style={s.textareaGroup}>
        <div style={s.textareaWrap}>
          <p style={s.label}>Original</p>
          <textarea style={s.textarea} rows={10} value={original}
            onChange={(e) => { setOriginal(e.target.value); setChunks(null); }}
            onFocus={(e) => (e.target.style.borderColor = ACCENT)}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        </div>
        <div style={s.textareaWrap}>
          <p style={s.label}>Modified</p>
          <textarea style={s.textarea} rows={10} value={modified}
            onChange={(e) => { setModified(e.target.value); setChunks(null); }}
            onFocus={(e) => (e.target.style.borderColor = ACCENT)}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        </div>
      </div>

      <button style={{ ...s.action, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)" }}
        onClick={handleCompare}
        onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
        Compare
      </button>

      {chunks && (
        <div style={s.results}>
          <p style={s.summary}>
            <span style={{ color: ACCENT }}>+{additions}</span>
            <span style={{ color: "var(--text-muted)" }}> additions · </span>
            <span style={{ color: "#8a3a6b" }}>−{deletions}</span>
            <span style={{ color: "var(--text-muted)" }}> deletions</span>
          </p>
          <div style={s.diffBlock}>
            {chunks.map((chunk, i) => {
              const lines = chunk.value.replace(/\n$/, "").split("\n");
              return lines.map((line, j) => (
                <div key={`${i}-${j}`} style={{
                  ...s.diffLine,
                  background: chunk.added ? "rgba(74,90,138,0.12)" : chunk.removed ? "rgba(138,58,107,0.1)" : "transparent",
                }}>
                  <span style={{
                    ...s.diffPrefix,
                    color: chunk.added ? ACCENT : chunk.removed ? "#8a3a6b" : "transparent",
                  }}>
                    {chunk.added ? "+" : chunk.removed ? "−" : " "}
                  </span>
                  <span style={{ color: chunk.added || chunk.removed ? "var(--text)" : "var(--text-muted)" }}>
                    {line}
                  </span>
                </div>
              ));
            })}
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
  textareaGroup: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" },
  textareaWrap: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" },
  textarea: { resize: "vertical", lineHeight: 1.5, fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.8rem", transition: "border-color 0.2s ease" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", cursor: "pointer", transition: "all 0.2s ease" },
  results: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  summary: { fontSize: "0.8rem", letterSpacing: "0.02em" },
  diffBlock: { border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" },
  diffLine: { display: "flex", gap: "0.75rem", padding: "0.2rem 1rem", fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.78rem" },
  diffPrefix: { fontWeight: 700, flexShrink: 0, width: "0.8rem" },
};
