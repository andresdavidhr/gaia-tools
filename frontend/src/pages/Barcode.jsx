import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#6a5a3a";
const ACCENT_BG = "rgba(106,90,58,0.05)";

const FORMATS = [
  { id: "code128", label: "Code128", hint: "Any text or number" },
  { id: "ean13",  label: "EAN-13",  hint: "12 digits (check digit added)" },
  { id: "ean8",   label: "EAN-8",   hint: "7 digits (check digit added)" },
  { id: "code39", label: "Code39",  hint: "Uppercase letters and numbers" },
];

export default function Barcode() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [fmt, setFmt] = useState("code128");
  const [loading, setLoading] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [error, setError] = useState("");
  const [backHover, setBackHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  const currentFmt = FORMATS.find((f) => f.id === fmt);

  async function handleGenerate() {
    if (!content.trim()) { setError("Enter some content."); return; }
    setError(""); setImgSrc(null); setLoading(true);
    try {
      const form = new FormData();
      form.append("content", content.trim());
      form.append("fmt", fmt);
      const res = await fetch("/api/barcode/", { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || `Error ${res.status}.`);
      }
      const blob = await res.blob();
      setImgSrc(URL.createObjectURL(blob));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!imgSrc) return;
    const a = document.createElement("a");
    a.href = imgSrc; a.download = "barcode.png"; a.click();
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>Barcode</h1>
      <p style={s.subtitle}>Generate EAN, Code128 and other barcodes as PNG.</p>

      <div style={s.modeTabs}>
        {FORMATS.map((f) => (
          <button key={f.id} style={{ ...s.modeTab, color: fmt === f.id ? ACCENT : "var(--text-muted)", borderBottomColor: fmt === f.id ? ACCENT : "transparent" }}
            onClick={() => { setFmt(f.id); setImgSrc(null); setError(""); }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={s.form}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <input style={s.input} placeholder={currentFmt.hint}
            value={content} onChange={(e) => { setContent(e.target.value); setImgSrc(null); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            onFocus={(e) => (e.target.style.borderColor = ACCENT)}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
          <span style={s.hint}>{currentFmt.hint}</span>
        </div>

        <button style={{ ...s.action, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)", opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
          onClick={handleGenerate} disabled={loading}
          onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
          {loading ? "Generating…" : "Generate"}
        </button>

        {error && <p style={s.error}>{error}</p>}

        {imgSrc && (
          <div style={s.preview}>
            <img src={imgSrc} alt="barcode" style={s.img} />
            <button style={{ ...s.downloadBtn, color: ACCENT }} onClick={handleDownload}>
              ↓ Download PNG
            </button>
          </div>
        )}
      </div>
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
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  input: { transition: "border-color 0.2s ease" },
  hint: { fontSize: "0.75rem", color: "var(--text-muted)" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", transition: "all 0.2s ease" },
  error: { fontSize: "0.85rem", color: "#888" },
  preview: { display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1.5rem", background: "#fff" },
  img: { maxWidth: "100%", imageRendering: "crisp-edges" },
  downloadBtn: { fontSize: "0.85rem", cursor: "pointer", letterSpacing: "0.03em", transition: "opacity 0.2s ease" },
};
