import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#5a7a1a";
const ACCENT_BG = "rgba(90,122,26,0.05)";

function b64decode(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;
  return atob(padded + "=".repeat(pad));
}

function decodeJWT(token) {
  const parts = token.trim().split(".");
  if (parts.length < 2) throw new Error("Not a valid JWT (expected 3 parts).");
  const header = JSON.parse(b64decode(parts[0]));
  const payload = JSON.parse(b64decode(parts[1]));
  return { header, payload, hasSignature: parts.length === 3 && parts[2].length > 0 };
}

function JSONBlock({ label, data, accent }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(data, null, 2);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={s.block}>
      <div style={s.blockHeader}>
        <span style={{ ...s.blockLabel, color: accent }}>{label}</span>
        <button style={{ ...s.copyBtn, color: copied ? accent : "var(--text-muted)" }} onClick={copy}>
          {copied ? "✓" : "Copy"}
        </button>
      </div>
      <pre style={s.pre}>{text}</pre>
    </div>
  );
}

export default function JWTDecoder() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState("");
  const [backHover, setBackHover] = useState(false);

  function handleChange(val) {
    setToken(val);
    if (!val.trim()) { setDecoded(null); setError(""); return; }
    try {
      setDecoded(decodeJWT(val));
      setError("");
    } catch (e) {
      setDecoded(null);
      setError(e.message);
    }
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>JWT Decoder</h1>
      <p style={s.subtitle}>Decode JWT tokens and inspect header and payload.</p>

      <textarea style={s.textarea} rows={4} placeholder="Paste your JWT token here…"
        value={token} onChange={(e) => handleChange(e.target.value)}
        onFocus={(e) => (e.target.style.borderColor = ACCENT)}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />

      {error && <p style={s.error}>{error}</p>}

      {decoded && (
        <div style={s.results}>
          <JSONBlock label="HEADER" data={decoded.header} accent={ACCENT} />
          <JSONBlock label="PAYLOAD" data={decoded.payload} accent={ACCENT} />
          <p style={s.sigNote}>
            {decoded.hasSignature
              ? "Signature present · not verified"
              : "No signature"}
          </p>
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
  textarea: { resize: "vertical", lineHeight: 1.5, fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.8rem", transition: "border-color 0.2s ease" },
  error: { fontSize: "0.85rem", color: "#888" },
  results: { display: "flex", flexDirection: "column", gap: "0.75rem" },
  block: { border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" },
  blockHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  blockLabel: { fontSize: "0.7rem", letterSpacing: "0.08em", fontWeight: 600 },
  copyBtn: { fontSize: "0.75rem", cursor: "pointer", transition: "color 0.2s ease", letterSpacing: "0.03em" },
  pre: { fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-all", margin: 0 },
  sigNote: { fontSize: "0.75rem", color: "var(--text-muted)", letterSpacing: "0.03em" },
};
