import cronstrue from "cronstrue";
import { parseExpression } from "cron-parser";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#3a7a5a";
const NEXT_COUNT = 8;

const EXAMPLES = [
  { label: "Every 5 min",   expr: "*/5 * * * *" },
  { label: "Daily 9am",     expr: "0 9 * * *" },
  { label: "Weekdays 8am",  expr: "0 8 * * 1-5" },
  { label: "Every hour",    expr: "0 * * * *" },
];

function formatDate(d) {
  return d.toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function parseNext(expr) {
  const interval = parseExpression(expr, { tz: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const dates = [];
  for (let i = 0; i < NEXT_COUNT; i++) dates.push(interval.next().toDate());
  return dates;
}

export default function Cron() {
  const navigate = useNavigate();
  const [expr, setExpr] = useState("*/5 * * * *");
  const [backHover, setBackHover] = useState(false);

  let description = null;
  let nextRuns = null;
  let error = null;

  if (expr.trim()) {
    try {
      description = cronstrue.toString(expr, { verbose: true });
      nextRuns = parseNext(expr);
    } catch {
      error = "Invalid cron expression.";
    }
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>Cron</h1>
      <p style={s.subtitle}>Parse cron expressions and preview next run times.</p>

      <input style={s.input} value={expr} onChange={(e) => setExpr(e.target.value)}
        placeholder="* * * * *"
        onFocus={(e) => (e.target.style.borderColor = ACCENT)}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />

      <div style={s.examples}>
        {EXAMPLES.map((ex) => (
          <button key={ex.expr} style={s.exampleBtn} onClick={() => setExpr(ex.expr)}>
            {ex.label}
          </button>
        ))}
      </div>

      {error && <p style={s.error}>{error}</p>}

      {description && (
        <div style={s.results}>
          <p style={{ ...s.description, color: ACCENT }}>{description}</p>

          <div style={s.nextList}>
            <p style={s.nextLabel}>Next {NEXT_COUNT} runs</p>
            {nextRuns.map((d, i) => (
              <div key={i} style={s.nextRow}>
                <span style={s.nextIndex}>{i + 1}</span>
                <span style={s.nextDate}>{formatDate(d)}</span>
              </div>
            ))}
          </div>
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
  input: { fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "1rem", letterSpacing: "0.05em", transition: "border-color 0.2s ease" },
  examples: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  exampleBtn: { fontSize: "0.75rem", padding: "0.3rem 0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--text-muted)", cursor: "pointer", transition: "border-color 0.2s ease, color 0.2s ease", background: "none" },
  error: { fontSize: "0.85rem", color: "#888" },
  results: { display: "flex", flexDirection: "column", gap: "1rem" },
  description: { fontSize: "1rem", fontWeight: 500, letterSpacing: "-0.01em" },
  nextLabel: { fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" },
  nextList: { border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.4rem" },
  nextRow: { display: "flex", alignItems: "center", gap: "0.75rem" },
  nextIndex: { fontSize: "0.7rem", color: "var(--text-muted)", minWidth: "14px", textAlign: "right" },
  nextDate: { fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.8rem", color: "var(--text-muted)" },
};
