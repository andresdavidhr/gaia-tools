import { useState, useRef } from "react";

export default function FileConverter({ endpoint, formats, accept, warning, accent = "#ffffff" }) {
  const accentBg = `${accent}0d`; // ~5% opacidad
  const [file, setFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState(formats[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [btnHover, setBtnHover] = useState(false);
  const [dropHover, setDropHover] = useState(false);
  const inputRef = useRef();

  async function handleConvert() {
    if (!file) { setError("Select a file first."); return; }
    setError("");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("target_format", targetFormat);
      const res = await fetch(endpoint, { method: "POST", body: form });
      if (!res.ok) {
        let msg = `Error ${res.status}.`;
        try { const d = await res.json(); msg = d.detail || msg; } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `result.${targetFormat}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.form}>
      {warning && <p style={s.warning}>{warning}</p>}

      <div
        style={{
          ...s.dropzone,
          borderColor: dropHover ? accent : "var(--border)",
          background: dropHover ? accentBg : "transparent",
        }}
        onClick={() => inputRef.current.click()}
        onMouseEnter={() => setDropHover(true)}
        onMouseLeave={() => setDropHover(false)}
      >
        {file
          ? <span style={s.filename}>{file.name}</span>
          : <span style={s.placeholder}>Drop a file here or click to select</span>
        }
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => { setFile(e.target.files[0]); setError(""); }}
      />

      <div style={s.formatRow}>
        {formats.map((f) => (
          <button
            key={f}
            style={{
              ...s.formatBtn,
              borderColor: targetFormat === f ? accent : "var(--border)",
              color: targetFormat === f ? accent : "var(--text-muted)",
            }}
            onClick={() => setTargetFormat(f)}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <button
        style={{
          ...s.action,
          borderColor: btnHover ? accent : "var(--border)",
          background: btnHover ? accentBg : "var(--surface)",
          color: btnHover ? accent : "var(--text)",
        }}
        onClick={handleConvert}
        disabled={loading}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
      >
        {loading ? "Converting…" : "Convert"}
      </button>

      {error && <p style={s.error}>{error}</p>}
    </div>
  );
}

const s = {
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  warning: { fontSize: "0.8rem", color: "var(--text-muted)", padding: "0.75rem 1rem", border: "1px solid var(--border)", borderRadius: "var(--radius)" },
  dropzone: { border: "1px dashed", borderRadius: "var(--radius)", padding: "2.5rem 1.5rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s ease, background 0.2s ease" },
  filename: { fontSize: "0.9rem", color: "var(--text)" },
  placeholder: { fontSize: "0.875rem", color: "var(--text-muted)" },
  formatRow: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  formatBtn: { padding: "0.5rem 1rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.8rem", letterSpacing: "0.05em", cursor: "pointer", transition: "border-color 0.2s ease, color 0.2s ease" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", cursor: "pointer", transition: "border-color 0.2s ease, color 0.2s ease, background 0.2s ease" },
  error: { fontSize: "0.85rem", color: "#888" },
};
