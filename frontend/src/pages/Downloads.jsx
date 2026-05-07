import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#9b2335";
const ACCENT_BG = "rgba(155,35,53,0.05)";

const QUALITY_OPTS = {
  mp3: [["128", "128 kbps"], ["192", "192 kbps"], ["320", "320 kbps"]],
  mp4: [["720", "720p"], ["1080", "1080p"], ["best", "Best"]],
};

export default function Downloads() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("mp3");
  const [quality, setQuality] = useState("192");
  const [saveName, setSaveName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(null);
  const [checking, setChecking] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [backHover, setBackHover] = useState(false);

  function setFormatAndReset(f) {
    setFormat(f);
    setQuality(f === "mp3" ? "192" : "best");
  }

  useEffect(() => {
    if (!url.trim()) {
      setInfo(null);
      setInfoError("");
      setChecking(false);
      return;
    }
    setChecking(true);
    setInfo(null);
    setInfoError("");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/downloader/info?url=${encodeURIComponent(url)}`);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.detail || `Error ${res.status}`);
        }
        setInfo(await res.json());
      } catch (e) {
        setInfoError(e.message);
      } finally {
        setChecking(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [url]);

  async function handleDownload() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/downloader/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format, quality, custom_filename: saveName.trim() }),
      });
      if (!res.ok) {
        let msg = `Error ${res.status}.`;
        try { const d = await res.json(); msg = d.detail || msg; } catch {}
        throw new Error(msg);
      }
      const disposition = res.headers.get("content-disposition") || "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `download.${format}`;
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const canDownload = !!info && !loading;

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

      <h1 style={s.title}>Downloads</h1>
      <p style={s.subtitle}>Save videos from YouTube, Vimeo, Twitter/X, TikTok and more.</p>

      <div style={s.form}>
        <div>
          <input
            type="url"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = ACCENT)}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          {checking && <p style={s.hint}>Checking…</p>}
          {info && <p style={{ ...s.hint, color: ACCENT }}>✓ {info.title}</p>}
          {infoError && <p style={{ ...s.hint, color: "#888" }}>{infoError}</p>}
        </div>

        <div>
          <p style={s.rowLabel}>Format</p>
          <div style={s.row}>
            {["mp3", "mp4"].map((f) => (
              <button
                key={f}
                style={{ ...s.toggleBtn, borderColor: format === f ? ACCENT : "var(--border)", color: format === f ? ACCENT : "var(--text-muted)" }}
                onClick={() => setFormatAndReset(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={s.rowLabel}>Quality</p>
          <div style={s.row}>
            {QUALITY_OPTS[format].map(([v, label]) => (
              <button
                key={v}
                style={{ ...s.toggleBtn, borderColor: quality === v ? ACCENT : "var(--border)", color: quality === v ? ACCENT : "var(--text-muted)" }}
                onClick={() => setQuality(v)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          placeholder="Save as… (optional)"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = ACCENT)}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />

        <button
          style={{
            ...s.action,
            borderColor: canDownload ? ACCENT : "var(--border)",
            background: canDownload ? ACCENT_BG : "var(--surface)",
            color: canDownload ? ACCENT : "var(--text-muted)",
            cursor: canDownload ? "pointer" : "not-allowed",
            opacity: canDownload ? 1 : 0.5,
          }}
          onClick={handleDownload}
          disabled={!canDownload}
        >
          {loading ? "Downloading…" : "Download"}
        </button>

        {error && <p style={s.error}>{error}</p>}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "560px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column" },
  back: { fontSize: "0.875rem", marginBottom: "3rem", cursor: "pointer", letterSpacing: "0.02em", alignSelf: "flex-start", transition: "color 0.2s ease" },
  title: { fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "0.5rem" },
  subtitle: { fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "3rem" },
  form: { display: "flex", flexDirection: "column", gap: "1.25rem" },
  rowLabel: { fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.5rem" },
  row: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  toggleBtn: { padding: "0.6rem 1.25rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.8rem", letterSpacing: "0.05em", cursor: "pointer", transition: "border-color 0.2s ease, color 0.2s ease" },
  action: { padding: "0.85rem", border: "1px solid", borderRadius: "var(--radius)", fontSize: "0.95rem", letterSpacing: "0.02em", transition: "all 0.2s ease", marginTop: "0.25rem" },
  hint: { fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.4rem" },
  error: { fontSize: "0.85rem", color: "#888" },
};
