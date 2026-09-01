import { diffLines } from "diff";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#4a5a8a";
const ACCENT_BG = "rgba(74,90,138,0.05)";
const REMOVED = "#8a3a6b";
const ADDED_BG = "rgba(74,90,138,0.12)";
const REMOVED_BG = "rgba(138,58,107,0.1)";
const EMPTY_BG = "rgba(128,128,128,0.04)";

function splitLines(value) {
  if (!value) return [];
  return value.replace(/\n$/, "").split("\n");
}

// Pairs each removed chunk with the added chunk right after it so both
// versions of a change land on the same row, side by side.
function buildRows(chunks) {
  const rows = [];
  let leftNum = 0;
  let rightNum = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const lines = splitLines(chunk.value);
    if (!lines.length) continue;

    if (chunk.removed) {
      const next = chunks[i + 1];
      const addedLines = next && next.added ? splitLines(next.value) : [];
      if (addedLines.length) i++;
      const max = Math.max(lines.length, addedLines.length);
      for (let j = 0; j < max; j++) {
        rows.push({
          left: j < lines.length ? { num: ++leftNum, text: lines[j], type: "removed" } : null,
          right: j < addedLines.length ? { num: ++rightNum, text: addedLines[j], type: "added" } : null,
        });
      }
    } else if (chunk.added) {
      for (const line of lines) {
        rows.push({ left: null, right: { num: ++rightNum, text: line, type: "added" } });
      }
    } else {
      for (const line of lines) {
        rows.push({
          left: { num: ++leftNum, text: line, type: "equal" },
          right: { num: ++rightNum, text: line, type: "equal" },
        });
      }
    }
  }

  return rows;
}

function DiffCell({ cell, divider }) {
  const style = {
    ...s.cell,
    ...(divider ? s.cellDivider : null),
    background: !cell ? EMPTY_BG : cell.type === "added" ? ADDED_BG : cell.type === "removed" ? REMOVED_BG : "transparent",
  };

  if (!cell) return <div style={style} />;

  return (
    <div style={style}>
      <span style={s.lineNum}>{cell.num}</span>
      <span style={{ ...s.prefix, color: cell.type === "added" ? ACCENT : cell.type === "removed" ? REMOVED : "transparent" }}>
        {cell.type === "added" ? "+" : cell.type === "removed" ? "−" : " "}
      </span>
      <span style={{ ...s.lineText, color: cell.type === "equal" ? "var(--text-muted)" : "var(--text)" }}>
        {cell.text}
      </span>
    </div>
  );
}

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
  const rows = chunks ? buildRows(chunks) : [];

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
            <span style={{ color: REMOVED }}>−{deletions}</span>
            <span style={{ color: "var(--text-muted)" }}> deletions</span>
          </p>
          <div style={s.diffBlock}>
            <div style={s.diffHead}>
              <span style={s.headCell}>Original</span>
              <span style={{ ...s.headCell, ...s.cellDivider }}>Modified</span>
            </div>
            {rows.map((row, i) => (
              <div key={i} style={s.row}>
                <DiffCell cell={row.left} />
                <DiffCell cell={row.right} divider />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "980px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" },
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
  diffHead: { display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid var(--border)", background: "var(--surface)" },
  headCell: { padding: "0.5rem 1rem", fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr" },
  cell: { display: "flex", gap: "0.6rem", minWidth: 0, padding: "0.2rem 1rem 0.2rem 0.5rem", fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.78rem" },
  cellDivider: { borderLeft: "1px solid var(--border)" },
  lineNum: { flexShrink: 0, width: "2.2rem", textAlign: "right", color: "var(--text-muted)", opacity: 0.6, userSelect: "none" },
  prefix: { fontWeight: 700, flexShrink: 0, width: "0.8rem" },
  lineText: { minWidth: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" },
};
