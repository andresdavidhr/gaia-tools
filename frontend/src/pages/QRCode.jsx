import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#1a6b4a";
const ACCENT_BG = "rgba(26,107,74,0.05)";

export default function QRCode() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [size, setSize] = useState("M");
  const [imgUrl, setImgUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [btnHover, setBtnHover] = useState(false);
  const [backHover, setBackHover] = useState(false);

  async function handleGenerate() {
    if (!text.trim()) { setError("Enter text or a URL."); return; }
    setError("");
    setLoading(true);
    if (imgUrl) URL.revokeObjectURL(imgUrl);
    try {
      const res = await fetch("/api/qr/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, size }),
      });
      if (!res.ok) {
        let msg = `Error ${res.status}.`;
        try { const d = await res.json(); msg = d.detail || msg; } catch {}
        throw new Error(msg);
      }
      const blob = await res.blob();
      setImgUrl(URL.createObjectURL(blob));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = "qrcode.png";
    a.click();
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>QR Code</h1>
      <p style={s.subtitle}>Generate a QR code from any text or URL.</p>

      <div style={s.form}>
        <input
          type="text"
          placeholder="https://example.com"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />

        <div style={s.sizeRow}>
          {["S", "M", "L"].map((s_) => (
            <button key={s_}
              style={{ ...s.sizeBtn, borderColor: size === s_ ? ACCENT : "var(--border)", color: size === s_ ? ACCENT : "var(--text-muted)" }}
              onClick={() => setSize(s_)}>
              {s_ === "S" ? "Small" : s_ === "M" ? "Medium" : "Large"}
            </button>
          ))}
        </div>

        <button style={{ ...s.action, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)" }}
          onClick={handleGenerate} disabled={loading}
          onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
          {loading ? "Generating…" : "Generate"}
        </button>

        {error && <p style={s.error}>{error}</p>}

        {imgUrl && (
          <div style={s.preview}>
            <img src={imgUrl} alt="QR Code" style={{ ...s.qrImg, borderColor: ACCENT }} />
            <button style={{ ...s.dlBtn, borderColor: ACCENT, color: ACCENT }}
              onClick={handleDownload}>
              Download PNG
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "560px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column" },
  back: { fontSize: "0.875rem", marginBottom: "3rem", cursor: "pointer", letterSpacing: "0.02em", alignSelf: "flex-start", transition: "color 0.2s ease" },
  title: { fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "0.5rem" },
  subtitle: { fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "3rem" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  sizeRow: { display: "flex", gap: "0.5rem" },
  sizeBtn: { padding: "0.6rem 1.25rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.8rem", letterSpacing: "0.03em", cursor: "pointer", transition: "border-color 0.2s ease, color 0.2s ease" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", cursor: "pointer", transition: "border-color 0.2s ease, color 0.2s ease, background 0.2s ease", marginTop: "0.5rem" },
  error: { fontSize: "0.85rem", color: "#888" },
  preview: { display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginTop: "0.5rem" },
  qrImg: { width: "200px", height: "200px", border: "1px solid", borderRadius: "var(--radius)", imageRendering: "pixelated" },
  dlBtn: { padding: "0.6rem 1.5rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.85rem", letterSpacing: "0.03em", cursor: "pointer", transition: "opacity 0.2s ease" },
};
