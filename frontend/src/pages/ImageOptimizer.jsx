import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#8a5a1a";
const ACCENT_BG = "rgba(138,90,26,0.05)";

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ImageOptimizer() {
  const navigate = useNavigate();
  const inputRef = useRef();

  const [file, setFile] = useState(null);
  const [quality, setQuality] = useState(80);
  const [phase, setPhase] = useState(null);   // null | "uploading" | "processing" | "done"
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState(null);   // { original, compressed, filename }
  const [error, setError] = useState("");

  const [dropHover, setDropHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  function handleFile(f) {
    setFile(f); setPhase(null); setProgress(0); setStats(null); setError("");
  }

  function handleOptimize() {
    if (!file) { setError("Select an image."); return; }
    setError(""); setPhase("uploading"); setProgress(0); setStats(null);

    const form = new FormData();
    form.append("file", file);
    form.append("quality", quality);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/optimize/");
    xhr.responseType = "arraybuffer";

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.upload.onload = () => { setPhase("processing"); setProgress(0); };

    xhr.onload = () => {
      if (xhr.status !== 200) {
        let msg = `Error ${xhr.status}.`;
        try { msg = JSON.parse(new TextDecoder().decode(xhr.response)).detail || msg; } catch {}
        setError(msg); setPhase(null); return;
      }
      const orig = parseInt(xhr.getResponseHeader("x-original-size") || "0");
      const comp = parseInt(xhr.getResponseHeader("x-compressed-size") || "0");
      const disposition = xhr.getResponseHeader("content-disposition") || "";
      const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/);
      const filename = match ? match[1] : "optimized";

      const blob = new Blob([xhr.response]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);

      setStats({ original: orig, compressed: comp, filename });
      setPhase("done"); setProgress(100);
    };

    xhr.onerror = () => { setError("Network error."); setPhase(null); };
    xhr.send(form);
  }

  const busy = phase === "uploading" || phase === "processing";
  const saved = stats ? Math.round((1 - stats.compressed / stats.original) * 100) : 0;

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>Optimize</h1>
      <p style={s.subtitle}>Reduce image file size with adjustable quality. Supports JPEG, PNG, WebP.</p>

      <div style={{ ...s.dropzone, borderColor: dropHover ? ACCENT : "var(--border)", background: dropHover ? ACCENT_BG : "transparent" }}
        onClick={() => !busy && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
        onDragLeave={() => setDropHover(false)}
        onDrop={(e) => { e.preventDefault(); setDropHover(false); if (!busy) handleFile(e.dataTransfer.files[0]); }}
        onMouseEnter={() => setDropHover(true)} onMouseLeave={() => setDropHover(false)}>
        {file ? (
          <div style={s.fileInfo}>
            <span style={{ color: "var(--text)" }}>{file.name}</span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{fmtSize(file.size)}</span>
          </div>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Drop an image or click to select · JPEG, PNG, WebP
          </span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])} />

      {file && (
        <div style={s.controls}>
          <div style={s.sliderRow}>
            <span style={s.sliderLabel}>Quality</span>
            <input type="range" min={1} max={100} value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              disabled={busy}
              style={{ flex: 1, accentColor: ACCENT }} />
            <span style={s.qualityVal}>{quality}</span>
          </div>

          <button style={{ ...s.action, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)", opacity: busy ? 0.6 : 1, cursor: busy ? "not-allowed" : "pointer" }}
            onClick={handleOptimize} disabled={busy}
            onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
            {busy ? (phase === "uploading" ? "Uploading…" : "Processing…") : "Optimize"}
          </button>
        </div>
      )}

      {busy && (
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            {phase === "uploading"
              ? <div style={{ ...s.progressBar, width: `${progress}%` }} />
              : <div style={{ ...s.progressSweep }} />}
          </div>
          <span style={s.progressLabel}>{phase === "uploading" ? `Uploading… ${progress}%` : "Processing…"}</span>
        </div>
      )}

      {phase === "done" && stats && (
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressBar, width: "100%" }} />
          </div>
          <span style={{ ...s.progressLabel, color: ACCENT }}>
            {fmtSize(stats.original)} → {fmtSize(stats.compressed)} · saved {saved}% · ↓ {stats.filename}
          </span>
        </div>
      )}

      {error && <p style={s.error}>{error}</p>}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "640px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" },
  back: { fontSize: "0.875rem", marginBottom: "2rem", cursor: "pointer", letterSpacing: "0.02em", alignSelf: "flex-start", transition: "color 0.2s ease" },
  title: { fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "0.25rem" },
  subtitle: { fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" },
  dropzone: { border: "1px dashed", borderRadius: "var(--radius)", padding: "2rem 1.5rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s ease, background 0.2s ease", minHeight: "90px", display: "flex", alignItems: "center", justifyContent: "center" },
  fileInfo: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" },
  controls: { display: "flex", flexDirection: "column", gap: "1rem" },
  sliderRow: { display: "flex", alignItems: "center", gap: "1rem" },
  sliderLabel: { fontSize: "0.875rem", color: "var(--text-muted)", minWidth: "48px" },
  qualityVal: { fontSize: "0.875rem", minWidth: "28px", textAlign: "right", fontVariantNumeric: "tabular-nums" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", transition: "all 0.2s ease" },
  progressWrap: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  progressTrack: { height: "3px", background: "var(--border)", borderRadius: "2px", overflow: "hidden", position: "relative" },
  progressBar: { height: "100%", background: ACCENT, borderRadius: "2px", transition: "width 0.3s ease" },
  progressSweep: { position: "absolute", top: 0, left: 0, height: "100%", width: "40%", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, animation: "sweep 1.2s ease-in-out infinite" },
  progressLabel: { fontSize: "0.78rem", color: "var(--text-muted)", letterSpacing: "0.03em" },
  error: { fontSize: "0.85rem", color: "#888" },
};
