import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#5a4a7a";
const ACCENT_BG = "rgba(90,74,122,0.05)";

const GROUP_ORDER = ["Image", "Camera", "Date", "GPS"];

export default function EXIF() {
  const navigate = useNavigate();
  const inputRef = useRef();

  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dropHover, setDropHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  async function handleExtract() {
    if (!file) { setError("Select an image."); return; }
    setError(""); setData(null); setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/exif/", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || `Error ${res.status}.`);
      }
      setData(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const hasAny = data && GROUP_ORDER.some((g) => Object.keys(data[g] || {}).length > 0);

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>EXIF</h1>
      <p style={s.subtitle}>Extract metadata from images — camera, GPS, date and more.</p>

      <div style={{ ...s.dropzone, borderColor: dropHover ? ACCENT : "var(--border)", background: dropHover ? ACCENT_BG : "transparent" }}
        onClick={() => !loading && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
        onDragLeave={() => setDropHover(false)}
        onDrop={(e) => { e.preventDefault(); setDropHover(false); if (!loading) setFile(e.dataTransfer.files[0]); }}
        onMouseEnter={() => setDropHover(true)} onMouseLeave={() => setDropHover(false)}>
        {file
          ? <span style={{ color: "var(--text)" }}>{file.name}</span>
          : <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Drop an image or click to select</span>}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { setFile(e.target.files[0]); setData(null); setError(""); }} />

      {file && (
        <button style={{ ...s.action, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)", opacity: loading ? 0.6 : 1 }}
          onClick={handleExtract} disabled={loading}
          onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
          {loading ? "Extracting…" : "Extract"}
        </button>
      )}

      {error && <p style={s.error}>{error}</p>}

      {data && !hasAny && (
        <p style={s.error}>No EXIF metadata found in this image.</p>
      )}

      {data && hasAny && (
        <div style={s.results}>
          {GROUP_ORDER.map((group) => {
            const entries = Object.entries(data[group] || {});
            if (!entries.length) return null;
            return (
              <div key={group} style={s.group}>
                <p style={{ ...s.groupLabel, color: ACCENT }}>{group}</p>
                <div style={s.table}>
                  {entries.map(([k, v]) => (
                    <div key={k} style={s.tableRow}>
                      <span style={s.tableKey}>{k}</span>
                      <span style={s.tableVal}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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
  dropzone: { border: "1px dashed", borderRadius: "var(--radius)", padding: "2rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s ease, background 0.2s ease" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", cursor: "pointer", transition: "all 0.2s ease" },
  error: { fontSize: "0.85rem", color: "#888" },
  results: { display: "flex", flexDirection: "column", gap: "1rem" },
  group: { display: "flex", flexDirection: "column", gap: "0.5rem" },
  groupLabel: { fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 },
  table: { border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" },
  tableRow: { display: "flex", gap: "1rem", padding: "0.5rem 1rem", borderBottom: "1px solid var(--border)", alignItems: "baseline" },
  tableKey: { fontSize: "0.78rem", color: "var(--text-muted)", minWidth: "140px", flexShrink: 0 },
  tableVal: { fontSize: "0.8rem", color: "var(--text)", wordBreak: "break-all", fontFamily: "ui-monospace,'SF Mono',monospace" },
};
