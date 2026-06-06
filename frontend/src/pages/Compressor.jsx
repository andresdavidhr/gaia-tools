import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#2a7a8a";
const ACCENT_BG = "rgba(42,122,138,0.05)";
const FORMATS = ["zip", "tar", "tar.gz", "tar.bz2"];
const MAX_MB = 100;

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Compressor() {
  const navigate = useNavigate();
  const inputRef = useRef();

  const [files, setFiles] = useState([]);
  const [fmt, setFmt] = useState("zip");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState(null); // null | "uploading" | "compressing" | "done"
  const [progress, setProgress] = useState(0);
  const [resultName, setResultName] = useState("");
  const [error, setError] = useState("");

  const [dropHover, setDropHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  function handleFiles(selected) {
    const list = Array.from(selected);
    const tooBig = list.filter((f) => f.size > MAX_MB * 1024 * 1024);
    if (tooBig.length) {
      setError(`These files exceed ${MAX_MB} MB: ${tooBig.map((f) => f.name).join(", ")}`);
      return;
    }
    setFiles(list);
    setError("");
    setPhase(null);
    setProgress(0);
    setResultName("");
  }

  function handleFmtChange(f) {
    setFmt(f);
    if (f !== "zip") {
      setUsePassword(false);
      setPassword("");
    }
  }

  function handleCompress() {
    if (!files.length) { setError("Select at least one file."); return; }
    setError("");
    setPhase("uploading");
    setProgress(0);
    setResultName("");

    const form = new FormData();
    files.forEach((f) => form.append("files", f));
    form.append("fmt", fmt);
    if (usePassword && password) form.append("password", password);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/compress/");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.upload.onload = () => {
      setPhase("compressing");
      setProgress(0);
    };

    xhr.onload = () => {
      if (xhr.status !== 200) {
        let msg = `Error ${xhr.status}.`;
        try { msg = JSON.parse(xhr.responseText).detail || msg; } catch {}
        setError(msg);
        setPhase(null);
        return;
      }
      const disposition = xhr.getResponseHeader("content-disposition") || "";
      const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/);
      const name = match ? match[1] : `archive.${fmt}`;
      const blob = new Blob([xhr.response]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      setResultName(name);
      setPhase("done");
      setProgress(100);
    };

    xhr.onerror = () => {
      setError("Network error.");
      setPhase(null);
    };

    xhr.responseType = "arraybuffer";
    xhr.send(form);
  }

  const busy = phase === "uploading" || phase === "compressing";

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

      <h1 style={s.title}>Compressor</h1>
      <p style={s.subtitle}>Zip files as zip, tar, tar.gz or tar.bz2 — with optional password.</p>

      {/* Dropzone */}
      <div
        style={{
          ...s.dropzone,
          borderColor: dropHover ? ACCENT : "var(--border)",
          background: dropHover ? ACCENT_BG : "transparent",
        }}
        onClick={() => !busy && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
        onDragLeave={() => setDropHover(false)}
        onDrop={(e) => { e.preventDefault(); setDropHover(false); if (!busy) handleFiles(e.dataTransfer.files); }}
        onMouseEnter={() => setDropHover(true)}
        onMouseLeave={() => setDropHover(false)}
      >
        {files.length === 0 ? (
          <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Drop files or click to select · Max {MAX_MB} MB per file
          </span>
        ) : (
          <ul style={s.fileList}>
            {files.map((f) => (
              <li key={f.name + f.size} style={s.fileItem}>
                <span style={{ color: "var(--text)" }}>{f.name}</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{fmtSize(f.size)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Options — visible only after selecting files */}
      {files.length > 0 && (
        <div style={s.options}>
          {/* Format selector */}
          <div style={s.modeTabs}>
            {FORMATS.map((f) => (
              <button
                key={f}
                style={{
                  ...s.modeTab,
                  color: fmt === f ? ACCENT : "var(--text-muted)",
                  borderBottomColor: fmt === f ? ACCENT : "transparent",
                }}
                onClick={() => handleFmtChange(f)}
                disabled={busy}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Password toggle — zip only */}
          <div style={s.passwordRow}>
            <label style={s.toggleLabel}>
              <input
                type="checkbox"
                checked={usePassword}
                disabled={fmt !== "zip" || busy}
                onChange={(e) => { setUsePassword(e.target.checked); if (!e.target.checked) setPassword(""); }}
                style={{ accentColor: ACCENT }}
              />
              <span style={{ color: fmt !== "zip" ? "var(--text-muted)" : "var(--text)", marginLeft: "0.5rem" }}>
                Password
              </span>
              {fmt !== "zip" && (
                <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginLeft: "0.5rem" }}>
                  (zip only)
                </span>
              )}
            </label>

            {usePassword && fmt === "zip" && (
              <input
                type="password"
                placeholder="Enter password…"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                style={s.passwordInput}
                onFocus={(e) => (e.target.style.borderColor = ACCENT)}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            )}
            {usePassword && fmt === "zip" && (
              <span style={{ color: "var(--text-muted)", fontSize: "0.72rem", marginTop: "0.25rem" }}>AES-256 encryption</span>
            )}
          </div>

          {/* Compress button */}
          <button
            style={{
              ...s.action,
              borderColor: btnHover ? ACCENT : "var(--border)",
              background: btnHover ? ACCENT_BG : "var(--surface)",
              color: btnHover ? ACCENT : "var(--text)",
              opacity: busy ? 0.6 : 1,
              cursor: busy ? "not-allowed" : "pointer",
            }}
            onClick={handleCompress}
            disabled={busy}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            {busy ? (phase === "uploading" ? "Uploading…" : "Compressing…") : "Compress"}
          </button>
        </div>
      )}

      {/* Progress bar */}
      {busy && (
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            {phase === "uploading" ? (
              <div style={{ ...s.progressBar, width: `${progress}%`, background: ACCENT }} />
            ) : (
              <div style={{ ...s.progressSweep, background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} />
            )}
          </div>
          <span style={s.progressLabel}>
            {phase === "uploading" ? `Uploading… ${progress}%` : "Compressing…"}
          </span>
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div style={s.progressWrap}>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressBar, width: "100%", background: ACCENT }} />
          </div>
          <span style={{ ...s.progressLabel, color: ACCENT }}>
            ↓ {resultName}
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
  fileList: { listStyle: "none", padding: 0, margin: 0, width: "100%", display: "flex", flexDirection: "column", gap: "0.4rem", textAlign: "left" },
  fileItem: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.875rem", gap: "1rem" },
  options: { display: "flex", flexDirection: "column", gap: "1rem" },
  modeTabs: { display: "flex", borderBottom: "1px solid var(--border)" },
  modeTab: { fontSize: "0.875rem", padding: "0.6rem 1rem", cursor: "pointer", letterSpacing: "0.02em", borderBottom: "2px solid transparent", marginBottom: "-1px", transition: "color 0.2s ease, border-color 0.2s ease", background: "none" },
  passwordRow: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  toggleLabel: { display: "flex", alignItems: "center", cursor: "pointer", fontSize: "0.875rem" },
  passwordInput: { padding: "0.6rem 0.9rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "0.875rem", background: "var(--surface)", color: "var(--text)", outline: "none", transition: "border-color 0.2s ease" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", transition: "all 0.2s ease" },
  progressWrap: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  progressTrack: { height: "3px", background: "var(--border)", borderRadius: "2px", overflow: "hidden", position: "relative" },
  progressBar: { height: "100%", borderRadius: "2px", transition: "width 0.3s ease" },
  progressSweep: { position: "absolute", top: 0, left: 0, height: "100%", width: "40%", animation: "sweep 1.2s ease-in-out infinite" },
  progressLabel: { fontSize: "0.78rem", color: "var(--text-muted)", letterSpacing: "0.03em" },
  error: { fontSize: "0.85rem", color: "#888" },
};
