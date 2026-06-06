import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#1a5a6a";
const ACCENT_BG = "rgba(26,90,106,0.05)";

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useXHR(onDone, onError) {
  const [phase, setPhase] = useState(null);
  const [progress, setProgress] = useState(0);

  function send(url, form) {
    setPhase("uploading"); setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "arraybuffer";
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.upload.onload = () => { setPhase("processing"); setProgress(0); };
    xhr.onload = () => {
      if (xhr.status !== 200) {
        let msg = `Error ${xhr.status}.`;
        try { msg = JSON.parse(new TextDecoder().decode(xhr.response)).detail || msg; } catch {}
        onError(msg); setPhase(null); return;
      }
      const disposition = xhr.getResponseHeader("content-disposition") || "";
      const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/);
      const filename = match ? match[1] : "output";
      const blob = new Blob([xhr.response]);
      const url2 = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url2; a.download = filename; a.click();
      URL.revokeObjectURL(url2);
      onDone(filename); setPhase("done"); setProgress(100);
    };
    xhr.onerror = () => { onError("Network error."); setPhase(null); };
    xhr.send(form);
  }

  return { phase, progress, send };
}

export default function Resize() {
  const navigate = useNavigate();
  const inputRef = useRef();

  const [tab, setTab] = useState("resize");
  const [file, setFile] = useState(null);
  const [imgSize, setImgSize] = useState(null); // {w, h}
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [keepRatio, setKeepRatio] = useState(true);
  const [cropX, setCropX] = useState("0");
  const [cropY, setCropY] = useState("0");
  const [cropW, setCropW] = useState("");
  const [cropH, setCropH] = useState("");
  const [error, setError] = useState("");
  const [resultName, setResultName] = useState("");
  const [dropHover, setDropHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const { phase, progress, send } = useXHR(
    (name) => { setResultName(name); setError(""); },
    (msg) => setError(msg),
  );
  const busy = phase === "uploading" || phase === "processing";

  function handleFile(f) {
    setFile(f); setError(""); setResultName("");
    const img = new Image();
    const url = URL.createObjectURL(f);
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
      setCropW(String(img.naturalWidth));
      setCropH(String(img.naturalHeight));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function handleWidthChange(val) {
    setWidth(val);
    if (keepRatio && imgSize && val) {
      const ratio = imgSize.h / imgSize.w;
      setHeight(String(Math.round(Number(val) * ratio)));
    }
  }

  function handleHeightChange(val) {
    setHeight(val);
    if (keepRatio && imgSize && val) {
      const ratio = imgSize.w / imgSize.h;
      setWidth(String(Math.round(Number(val) * ratio)));
    }
  }

  function handleSubmit() {
    if (!file) { setError("Select an image."); return; }
    setError(""); setResultName("");
    const form = new FormData();
    form.append("file", file);
    if (tab === "resize") {
      form.append("width", width);
      form.append("height", height);
      form.append("keep_ratio", keepRatio);
      send("/api/resize/resize", form);
    } else {
      form.append("x", cropX);
      form.append("y", cropY);
      form.append("width", cropW);
      form.append("height", cropH);
      send("/api/resize/crop", form);
    }
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>Resize</h1>
      <p style={s.subtitle}>Resize or crop images to exact dimensions.</p>

      <div style={s.modeTabs}>
        {["resize", "crop"].map((t) => (
          <button key={t} style={{ ...s.modeTab, color: tab === t ? ACCENT : "var(--text-muted)", borderBottomColor: tab === t ? ACCENT : "transparent" }}
            onClick={() => { setTab(t); setError(""); setResultName(""); }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ ...s.dropzone, borderColor: dropHover ? ACCENT : "var(--border)", background: dropHover ? ACCENT_BG : "transparent" }}
        onClick={() => !busy && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
        onDragLeave={() => setDropHover(false)}
        onDrop={(e) => { e.preventDefault(); setDropHover(false); if (!busy) handleFile(e.dataTransfer.files[0]); }}
        onMouseEnter={() => setDropHover(true)} onMouseLeave={() => setDropHover(false)}>
        {file ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
            <span style={{ color: "var(--text)" }}>{file.name}</span>
            {imgSize && <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{imgSize.w} × {imgSize.h} · {fmtSize(file.size)}</span>}
          </div>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Drop an image or click to select</span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])} />

      {file && tab === "resize" && (
        <div style={s.fields}>
          <div style={s.dimRow}>
            <div style={s.dimField}>
              <label style={s.dimLabel}>Width</label>
              <input style={s.dimInput} type="number" min={1} value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>
            <span style={s.dimSep}>×</span>
            <div style={s.dimField}>
              <label style={s.dimLabel}>Height</label>
              <input style={s.dimInput} type="number" min={1} value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
            </div>
          </div>
          <label style={s.toggleLabel}>
            <input type="checkbox" checked={keepRatio} onChange={(e) => setKeepRatio(e.target.checked)} style={{ accentColor: ACCENT }} />
            <span style={{ marginLeft: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>Keep aspect ratio</span>
          </label>
        </div>
      )}

      {file && tab === "crop" && (
        <div style={s.fields}>
          <div style={s.dimRow}>
            {[["X", cropX, setCropX], ["Y", cropY, setCropY], ["Width", cropW, setCropW], ["Height", cropH, setCropH]].map(([label, val, set]) => (
              <div key={label} style={s.dimField}>
                <label style={s.dimLabel}>{label}</label>
                <input style={s.dimInput} type="number" min={0} value={val}
                  onChange={(e) => set(e.target.value)}
                  onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
              </div>
            ))}
          </div>
        </div>
      )}

      {file && (
        <button style={{ ...s.action, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)", opacity: busy ? 0.6 : 1, cursor: busy ? "not-allowed" : "pointer" }}
          onClick={handleSubmit} disabled={busy}
          onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
          {busy ? (phase === "uploading" ? "Uploading…" : "Processing…") : tab === "resize" ? "Resize" : "Crop"}
        </button>
      )}

      {busy && (
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            {phase === "uploading"
              ? <div style={{ ...s.progressBar, width: `${progress}%` }} />
              : <div style={s.progressSweep} />}
          </div>
          <span style={s.progressLabel}>{phase === "uploading" ? `Uploading… ${progress}%` : "Processing…"}</span>
        </div>
      )}

      {phase === "done" && resultName && (
        <div style={s.progressWrap}>
          <div style={s.progressTrack}><div style={{ ...s.progressBar, width: "100%" }} /></div>
          <span style={{ ...s.progressLabel, color: ACCENT }}>↓ {resultName}</span>
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
  modeTabs: { display: "flex", borderBottom: "1px solid var(--border)" },
  modeTab: { fontSize: "0.875rem", padding: "0.6rem 1rem", cursor: "pointer", letterSpacing: "0.02em", borderBottom: "2px solid transparent", marginBottom: "-1px", transition: "color 0.2s ease, border-color 0.2s ease", background: "none" },
  dropzone: { border: "1px dashed", borderRadius: "var(--radius)", padding: "2rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s ease, background 0.2s ease" },
  fields: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  dimRow: { display: "flex", alignItems: "flex-end", gap: "0.75rem", flexWrap: "wrap" },
  dimField: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  dimLabel: { fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" },
  dimInput: { width: "100px", textAlign: "center", transition: "border-color 0.2s ease", fontVariantNumeric: "tabular-nums" },
  dimSep: { fontSize: "1rem", color: "var(--text-muted)", marginBottom: "0.6rem" },
  toggleLabel: { display: "flex", alignItems: "center", cursor: "pointer" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", transition: "all 0.2s ease" },
  progressWrap: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  progressTrack: { height: "3px", background: "var(--border)", borderRadius: "2px", overflow: "hidden", position: "relative" },
  progressBar: { height: "100%", background: ACCENT, borderRadius: "2px", transition: "width 0.3s ease" },
  progressSweep: { position: "absolute", top: 0, left: 0, height: "100%", width: "40%", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, animation: "sweep 1.2s ease-in-out infinite" },
  progressLabel: { fontSize: "0.78rem", color: "var(--text-muted)", letterSpacing: "0.03em" },
  error: { fontSize: "0.85rem", color: "#888" },
};
