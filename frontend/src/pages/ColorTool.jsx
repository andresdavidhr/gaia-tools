import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ACCENT = "#6a3a8a";
const ACCENT_BG = "rgba(106,58,138,0.05)";

// --- conversions ---
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  if (isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, Math.round(Number(v) || 0))); }

export default function ColorTool() {
  const navigate = useNavigate();
  const [hex, setHex] = useState("#6a3a8a");
  const [rgb, setRgb] = useState({ r: 106, g: 58, b: 138 });
  const [hsl, setHsl] = useState({ h: 280, s: 43, l: 38 });
  const [copied, setCopied] = useState(null);
  const [backHover, setBackHover] = useState(false);
  const [hexError, setHexError] = useState(false);

  function fromHex(val) {
    setHex(val);
    setHexError(false);
    const normalized = val.startsWith("#") ? val : `#${val}`;
    const r = hexToRgb(normalized);
    if (!r) { setHexError(true); return; }
    setRgb(r);
    setHsl(rgbToHsl(r));
  }

  function fromRgb(key, val) {
    const next = { ...rgb, [key]: clamp(val, 0, 255) };
    setRgb(next);
    setHex(rgbToHex(next));
    setHsl(rgbToHsl(next));
    setHexError(false);
  }

  function fromHsl(key, val) {
    const max = key === "h" ? 360 : 100;
    const next = { ...hsl, [key]: clamp(val, 0, max) };
    setHsl(next);
    const r = hslToRgb(next);
    setRgb(r);
    setHex(rgbToHex(r));
    setHexError(false);
  }

  async function copy(label, text) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  const hexStr = hex.startsWith("#") ? hex : `#${hex}`;
  const rgbStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  const hslStr = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  return (
    <div style={s.page}>
      <button style={{ ...s.back, color: backHover ? ACCENT : "var(--text-muted)" }}
        onClick={() => navigate("/")} onMouseEnter={() => setBackHover(true)} onMouseLeave={() => setBackHover(false)}>
        ← back
      </button>

      <h1 style={s.title}>Color</h1>
      <p style={s.subtitle}>Convert between HEX, RGB and HSL color formats.</p>

      {/* Swatch */}
      <div style={{ ...s.swatch, background: hexError ? "var(--surface)" : hexStr }} />

      {/* HEX */}
      <div style={s.row}>
        <span style={s.rowLabel}>HEX</span>
        <input style={{ ...s.input, ...s.mono, borderColor: hexError ? "#8a3a3a" : "var(--border)", flex: 1 }}
          value={hex} onChange={(e) => fromHex(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = ACCENT)}
          onBlur={(e) => (e.target.style.borderColor = hexError ? "#8a3a3a" : "var(--border)")} />
        <button style={{ ...s.copyBtn, color: copied === "hex" ? ACCENT : "var(--text-muted)" }}
          onClick={() => copy("hex", hexStr)}>
          {copied === "hex" ? "✓" : "Copy"}
        </button>
      </div>

      {/* RGB */}
      <div style={s.row}>
        <span style={s.rowLabel}>RGB</span>
        {["r", "g", "b"].map((k) => (
          <input key={k} type="number" min={0} max={255} style={{ ...s.input, ...s.numInput }}
            value={rgb[k]} onChange={(e) => fromRgb(k, e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = ACCENT)}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        ))}
        <button style={{ ...s.copyBtn, color: copied === "rgb" ? ACCENT : "var(--text-muted)" }}
          onClick={() => copy("rgb", rgbStr)}>
          {copied === "rgb" ? "✓" : "Copy"}
        </button>
      </div>

      {/* HSL */}
      <div style={s.row}>
        <span style={s.rowLabel}>HSL</span>
        {[["h", 360], ["s", 100], ["l", 100]].map(([k, max]) => (
          <input key={k} type="number" min={0} max={max} style={{ ...s.input, ...s.numInput }}
            value={hsl[k]} onChange={(e) => fromHsl(k, e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = ACCENT)}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")} />
        ))}
        <button style={{ ...s.copyBtn, color: copied === "hsl" ? ACCENT : "var(--text-muted)" }}
          onClick={() => copy("hsl", hslStr)}>
          {copied === "hsl" ? "✓" : "Copy"}
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "640px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" },
  back: { fontSize: "0.875rem", marginBottom: "2rem", cursor: "pointer", letterSpacing: "0.02em", alignSelf: "flex-start", transition: "color 0.2s ease" },
  title: { fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "0.25rem" },
  subtitle: { fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" },
  swatch: { height: "80px", borderRadius: "var(--radius)", border: "1px solid var(--border)", transition: "background 0.15s ease" },
  row: { display: "flex", alignItems: "center", gap: "0.5rem" },
  rowLabel: { fontSize: "0.7rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase", minWidth: "32px" },
  input: { transition: "border-color 0.2s ease" },
  mono: { fontFamily: "ui-monospace,'SF Mono',monospace", fontSize: "0.875rem" },
  numInput: { width: "72px", textAlign: "center", fontVariantNumeric: "tabular-nums" },
  copyBtn: { fontSize: "0.75rem", cursor: "pointer", letterSpacing: "0.03em", transition: "color 0.2s ease", flexShrink: 0, minWidth: "34px" },
};
