import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#7a4520";
const ACCENT_BG = "rgba(122,69,32,0.05)";
const ALGOS = ["md5", "sha1", "sha256"];

export default function HashGen() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [hashes, setHashes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const [btnHover, setBtnHover] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [dropHover, setDropHover] = useState(false);
  const inputRef = useRef();

  async function handleGenerate() {
    setError(""); setHashes(null);
    const form = new FormData();
    if (mode === "text") {
      if (!text.trim()) { setError("Enter some text."); return; }
      form.append("text", text);
    } else {
      if (!file) { setError("Select a file."); return; }
      form.append("file", file);
    }
    setLoading(true);
    try {
      const res = await fetch("/api/hash/generate", { method: "POST", body: form });
      if (!res.ok) {
        let msg = `Error ${res.status}.`;
        try { const d = await res.json(); msg = d.detail || msg; } catch {}
        throw new Error(msg);
      }
      setHashes(await res.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function copy(algo) {
    await navigator.clipboard.writeText(hashes[algo]);
    setCopied(algo);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>Hash Generator</h1>
      <p style={s.subtitle}>Compute MD5, SHA1 and SHA256 checksums.</p>

      <div style={s.modeTabs}>
        {["text", "file"].map((m) => (
          <button key={m} style={{ ...s.modeTab, color: mode === m ? ACCENT : "var(--text-muted)", borderBottomColor: mode === m ? ACCENT : "transparent" }}
            onClick={() => { setMode(m); setHashes(null); setError(""); }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div style={s.form}>
        {mode === "text" ? (
          <textarea style={s.textarea} placeholder="Enter text to hash…" value={text}
            onChange={(e) => setText(e.target.value)} rows={5}
            onFocus={(e) => e.target.style.borderColor = ACCENT}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"} />
        ) : (
          <>
            <div style={{ ...s.dropzone, borderColor: dropHover ? ACCENT : "var(--border)", background: dropHover ? ACCENT_BG : "transparent" }}
              onClick={() => inputRef.current.click()}
              onMouseEnter={() => setDropHover(true)} onMouseLeave={() => setDropHover(false)}>
              {file ? <span style={{ color: "var(--text)" }}>{file.name}</span>
                    : <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Drop a file or click to select</span>}
            </div>
            <input ref={inputRef} type="file" style={{ display: "none" }}
              onChange={(e) => { setFile(e.target.files[0]); setHashes(null); }} />
          </>
        )}

        <button style={{ ...s.action, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)" }}
          onClick={handleGenerate} disabled={loading}
          onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
          {loading ? "Computing…" : "Generate"}
        </button>

        {error && <p style={s.error}>{error}</p>}

        {hashes && (
          <div style={s.results}>
            {ALGOS.map((algo) => (
              <div key={algo} style={s.hashRow}>
                <span style={{ ...s.algoLabel, color: ACCENT }}>{algo.toUpperCase()}</span>
                <span style={s.hashVal}>{hashes[algo]}</span>
                <button style={{ ...s.copyBtn, color: copied === algo ? ACCENT : "var(--text-muted)" }}
                  onClick={() => copy(algo)}>
                  {copied === algo ? "✓" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "640px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column" },
  back: { fontSize: "0.875rem", marginBottom: "3rem", cursor: "pointer", letterSpacing: "0.02em", alignSelf: "flex-start", transition: "color 0.2s ease" },
  title: { fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "0.5rem" },
  subtitle: { fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.5rem" },
  modeTabs: { display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1.5rem" },
  modeTab: { fontSize: "0.875rem", padding: "0.6rem 1rem", cursor: "pointer", letterSpacing: "0.02em", borderBottom: "1px solid transparent", marginBottom: "-1px", transition: "color 0.2s ease, border-color 0.2s ease" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  textarea: { resize: "vertical", lineHeight: 1.6, transition: "border-color 0.2s ease" },
  dropzone: { border: "1px dashed", borderRadius: "var(--radius)", padding: "2rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s ease, background 0.2s ease" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", cursor: "pointer", transition: "all 0.2s ease" },
  error: { fontSize: "0.85rem", color: "#888" },
  results: { display: "flex", flexDirection: "column", gap: "0.75rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem" },
  hashRow: { display: "flex", alignItems: "center", gap: "0.75rem" },
  algoLabel: { fontSize: "0.7rem", letterSpacing: "0.08em", fontWeight: 600, minWidth: "52px" },
  hashVal: { flex: 1, fontSize: "0.75rem", fontFamily: "ui-monospace,'SF Mono',monospace", color: "var(--text-muted)", wordBreak: "break-all" },
  copyBtn: { fontSize: "0.75rem", cursor: "pointer", flexShrink: 0, transition: "color 0.2s ease", letterSpacing: "0.03em" },
};
