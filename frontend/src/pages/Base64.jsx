import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#8a3a6b";
const ACCENT_BG = "rgba(138,58,107,0.05)";

export default function Base64() {
  const navigate = useNavigate();
  const inputRef = useRef();

  const [tab, setTab] = useState("text");       // "text" | "file"
  const [op, setOp] = useState("encode");       // "encode" | "decode"
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [backHover, setBackHover] = useState(false);
  const [dropHover, setDropHover] = useState(false);
  const [btnHover, setBtnHover] = useState(false);

  function reset() { setResult(""); setError(""); setCopied(false); }

  function handleTextOp() {
    reset();
    if (!input.trim()) { setError("Enter some text."); return; }
    try {
      if (op === "encode") {
        setResult(btoa(unescape(encodeURIComponent(input))));
      } else {
        setResult(decodeURIComponent(escape(atob(input.trim()))));
      }
    } catch {
      setError("Invalid Base64 string.");
    }
  }

  function handleFile(f) {
    setFile(f); reset();
  }

  function handleFileOp() {
    reset();
    if (op === "encode") {
      if (!file) { setError("Select a file."); return; }
      const reader = new FileReader();
      reader.onload = (e) => setResult(e.target.result.split(",")[1]);
      reader.readAsDataURL(file);
    } else {
      if (!input.trim()) { setError("Paste a Base64 string."); return; }
      try {
        const binary = atob(input.trim());
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes]);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "decoded_file"; a.click();
        URL.revokeObjectURL(url);
        setResult("File downloaded.");
      } catch {
        setError("Invalid Base64 string.");
      }
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadTxt() {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "encoded.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  function switchTab(t) { setTab(t); setInput(""); setFile(null); reset(); }
  function switchOp(o) { setOp(o); setInput(""); setFile(null); reset(); }

  const isFileDecodeMode = tab === "file" && op === "decode";
  const showResult = result && result !== "File downloaded.";

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>Base64</h1>
      <p style={s.subtitle}>Encode or decode text and files in Base64.</p>

      <div style={s.modeTabs}>
        {["text", "file"].map((t) => (
          <button key={t} style={{ ...s.modeTab, color: tab === t ? ACCENT : "var(--text-muted)", borderBottomColor: tab === t ? ACCENT : "transparent" }}
            onClick={() => switchTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={s.opRow}>
        {["encode", "decode"].map((o) => (
          <button key={o} style={{ ...s.opBtn, borderColor: op === o ? ACCENT : "var(--border)", color: op === o ? ACCENT : "var(--text-muted)", background: op === o ? ACCENT_BG : "transparent" }}
            onClick={() => switchOp(o)}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </button>
        ))}
      </div>

      <div style={s.form}>
        {tab === "text" || isFileDecodeMode ? (
          <textarea style={s.textarea} rows={5}
            placeholder={op === "encode" ? "Enter text to encode…" : "Paste Base64 string…"}
            value={input} onChange={(e) => { setInput(e.target.value); reset(); }}
            onFocus={(e) => (e.target.style.borderColor = ACCENT)}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        ) : (
          <>
            <div style={{ ...s.dropzone, borderColor: dropHover ? ACCENT : "var(--border)", background: dropHover ? ACCENT_BG : "transparent" }}
              onClick={() => inputRef.current.click()}
              onMouseEnter={() => setDropHover(true)} onMouseLeave={() => setDropHover(false)}>
              {file
                ? <span style={{ color: "var(--text)" }}>{file.name}</span>
                : <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Drop a file or click to select</span>}
            </div>
            <input ref={inputRef} type="file" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          </>
        )}

        <button style={{ ...s.action, borderColor: btnHover ? ACCENT : "var(--border)", background: btnHover ? ACCENT_BG : "var(--surface)", color: btnHover ? ACCENT : "var(--text)" }}
          onClick={tab === "text" || isFileDecodeMode ? handleTextOp : handleFileOp}
          onMouseEnter={() => setBtnHover(true)} onMouseLeave={() => setBtnHover(false)}>
          {op === "encode" ? "Encode" : "Decode"}
        </button>

        {error && <p style={s.error}>{error}</p>}

        {showResult && (
          <div style={s.resultBlock}>
            <textarea style={{ ...s.textarea, ...s.resultArea }} readOnly value={result} rows={4} />
            <div style={s.resultActions}>
              <button style={{ ...s.copyBtn, color: copied ? ACCENT : "var(--text-muted)" }} onClick={copy}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
              {op === "encode" && tab === "file" && (
                <button style={{ ...s.copyBtn, color: "var(--text-muted)" }} onClick={downloadTxt}>
                  Download .txt
                </button>
              )}
            </div>
          </div>
        )}

        {result === "File downloaded." && (
          <p style={{ ...s.error, color: ACCENT }}>✓ File downloaded.</p>
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
  modeTabs: { display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "1rem" },
  modeTab: { fontSize: "0.875rem", padding: "0.6rem 1rem", cursor: "pointer", letterSpacing: "0.02em", borderBottom: "2px solid transparent", marginBottom: "-1px", transition: "color 0.2s ease, border-color 0.2s ease", background: "none" },
  opRow: { display: "flex", gap: "0.5rem", marginBottom: "1rem" },
  opBtn: { fontSize: "0.8rem", padding: "0.4rem 1rem", border: "1px solid", borderRadius: "var(--radius)", cursor: "pointer", letterSpacing: "0.03em", transition: "all 0.15s ease", background: "none" },
  form: { display: "flex", flexDirection: "column", gap: "1rem" },
  textarea: { resize: "vertical", lineHeight: 1.6, transition: "border-color 0.2s ease", fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.8rem" },
  dropzone: { border: "1px dashed", borderRadius: "var(--radius)", padding: "2rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s ease, background 0.2s ease" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", cursor: "pointer", transition: "all 0.2s ease" },
  error: { fontSize: "0.85rem", color: "#888" },
  resultBlock: { display: "flex", flexDirection: "column", gap: "0.5rem", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "1rem" },
  resultArea: { border: "none", padding: "0", background: "transparent", color: "var(--text-muted)" },
  resultActions: { display: "flex", gap: "1rem" },
  copyBtn: { fontSize: "0.75rem", cursor: "pointer", letterSpacing: "0.03em", transition: "color 0.2s ease" },
};
