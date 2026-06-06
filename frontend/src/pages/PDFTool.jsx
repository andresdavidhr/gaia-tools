import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#7a2a2a";
const ACCENT_BG = "rgba(122,42,42,0.05)";

function fmtSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useXHRDownload({ onDone, onError }) {
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
      const filename = match ? match[1] : "output.pdf";
      const blob = new Blob([xhr.response], { type: "application/pdf" });
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

export default function PDFTool() {
  const navigate = useNavigate();
  const mergeInputRef = useRef();
  const splitInputRef = useRef();

  const [tab, setTab] = useState("merge");
  const [mergeFiles, setMergeFiles] = useState([]);
  const [splitFile, setSplitFile] = useState(null);
  const [pagesExpr, setPagesExpr] = useState("");
  const [error, setError] = useState("");
  const [resultName, setResultName] = useState("");

  const [dropHover, setDropHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const { phase, progress, send } = useXHRDownload({
    onDone: (name) => { setResultName(name); setError(""); },
    onError: (msg) => setError(msg),
  });
  const busy = phase === "uploading" || phase === "processing";

  function switchTab(t) { setTab(t); setError(""); setResultName(""); }

  function moveFile(idx, dir) {
    const arr = [...mergeFiles];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setMergeFiles(arr);
  }

  function removeFile(idx) {
    setMergeFiles(mergeFiles.filter((_, i) => i !== idx));
  }

  function handleMerge() {
    if (mergeFiles.length < 2) { setError("Select at least two PDF files."); return; }
    setError(""); setResultName("");
    const form = new FormData();
    mergeFiles.forEach((f) => form.append("files", f));
    send("/api/pdf/merge", form);
  }

  function handleSplit() {
    if (!splitFile) { setError("Select a PDF file."); return; }
    if (!pagesExpr.trim()) { setError("Enter a page range."); return; }
    setError(""); setResultName("");
    const form = new FormData();
    form.append("file", splitFile);
    form.append("pages", pagesExpr);
    send("/api/pdf/split", form);
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>PDF</h1>
      <p style={s.subtitle}>Merge multiple PDFs or extract a page range.</p>

      <div style={s.modeTabs}>
        {["merge", "split"].map((t) => (
          <button key={t} style={{ ...s.modeTab, color: tab === t ? ACCENT : "var(--text-muted)", borderBottomColor: tab === t ? ACCENT : "transparent" }}
            onClick={() => switchTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "merge" ? (
        <div style={s.form}>
          <div style={{ ...s.dropzone, borderColor: dropHover ? ACCENT : "var(--border)", background: dropHover ? ACCENT_BG : "transparent" }}
            onClick={() => !busy && mergeInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
            onDragLeave={() => setDropHover(false)}
            onDrop={(e) => {
              e.preventDefault(); setDropHover(false);
              if (!busy) setMergeFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
            }}
            onMouseEnter={() => setDropHover(true)} onMouseLeave={() => setDropHover(false)}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {mergeFiles.length === 0 ? "Drop PDFs or click to add files" : `+ Add more PDFs`}
            </span>
          </div>
          <input ref={mergeInputRef} type="file" accept="application/pdf" multiple style={{ display: "none" }}
            onChange={(e) => { setMergeFiles((prev) => [...prev, ...Array.from(e.target.files)]); e.target.value = ""; }} />

          {mergeFiles.length > 0 && (
            <div style={s.fileList}>
              {mergeFiles.map((f, i) => (
                <div key={`${f.name}-${i}`} style={s.fileRow}>
                  <span style={s.fileIndex}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: "0.875rem", color: "var(--text)" }}>{f.name}</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{fmtSize(f.size)}</span>
                  <div style={s.orderBtns}>
                    <button style={s.orderBtn} onClick={() => moveFile(i, -1)} disabled={i === 0 || busy}>↑</button>
                    <button style={s.orderBtn} onClick={() => moveFile(i, 1)} disabled={i === mergeFiles.length - 1 || busy}>↓</button>
                    <button style={{ ...s.orderBtn, color: "#8a3a6b" }} onClick={() => removeFile(i)} disabled={busy}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={s.form}>
          <div style={{ ...s.dropzone, borderColor: dropHover ? ACCENT : "var(--border)", background: dropHover ? ACCENT_BG : "transparent" }}
            onClick={() => !busy && splitInputRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
            onDragLeave={() => setDropHover(false)}
            onDrop={(e) => { e.preventDefault(); setDropHover(false); if (!busy) setSplitFile(e.dataTransfer.files[0]); }}
            onMouseEnter={() => setDropHover(true)} onMouseLeave={() => setDropHover(false)}>
            {splitFile
              ? <span style={{ color: "var(--text)" }}>{splitFile.name}</span>
              : <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Drop a PDF or click to select</span>}
          </div>
          <input ref={splitInputRef} type="file" accept="application/pdf" style={{ display: "none" }}
            onChange={(e) => setSplitFile(e.target.files[0])} />

          {splitFile && (
            <input style={s.pagesInput} placeholder='Pages — e.g. 1-3, 5, 7-10'
              value={pagesExpr} onChange={(e) => setPagesExpr(e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = ACCENT)}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
          )}
        </div>
      )}

      {(tab === "merge" ? mergeFiles.length >= 2 : splitFile) && (
        <button style={{ ...s.action, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)", opacity: busy ? 0.6 : 1, cursor: busy ? "not-allowed" : "pointer" }}
          onClick={tab === "merge" ? handleMerge : handleSplit}
          disabled={busy}
          onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
          {busy ? (phase === "uploading" ? "Uploading…" : "Processing…") : tab === "merge" ? "Merge" : "Split"}
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
          <div style={s.progressTrack}>
            <div style={{ ...s.progressBar, width: "100%" }} />
          </div>
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
  form: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  dropzone: { border: "1px dashed", borderRadius: "var(--radius)", padding: "1.5rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s ease, background 0.2s ease" },
  fileList: { display: "flex", flexDirection: "column", gap: "0.35rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.75rem" },
  fileRow: { display: "flex", alignItems: "center", gap: "0.75rem" },
  fileIndex: { fontSize: "0.7rem", color: "var(--text-muted)", minWidth: "14px", textAlign: "right" },
  orderBtns: { display: "flex", gap: "0.25rem" },
  orderBtn: { fontSize: "0.75rem", color: "var(--text-muted)", cursor: "pointer", padding: "0.1rem 0.3rem", transition: "color 0.15s ease" },
  pagesInput: { transition: "border-color 0.2s ease" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", transition: "all 0.2s ease" },
  progressWrap: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  progressTrack: { height: "3px", background: "var(--border)", borderRadius: "2px", overflow: "hidden", position: "relative" },
  progressBar: { height: "100%", background: ACCENT, borderRadius: "2px", transition: "width 0.3s ease" },
  progressSweep: { position: "absolute", top: 0, left: 0, height: "100%", width: "40%", background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, animation: "sweep 1.2s ease-in-out infinite" },
  progressLabel: { fontSize: "0.78rem", color: "var(--text-muted)", letterSpacing: "0.03em" },
  error: { fontSize: "0.85rem", color: "#888" },
};
