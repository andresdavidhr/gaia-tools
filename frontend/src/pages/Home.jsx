import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SECTIONS = [
  {
    label: "Media",
    cards: [
      { to: "/downloads", title: "Downloads", description: "Download videos from YouTube, Vimeo, TikTok and more.", color: "#9b2335", colorBg: "rgba(155,35,53,0.05)" },
      { to: "/conversor", title: "Conversor",  description: "Convert images, video, audio and documents.", color: "#6b3fa0", colorBg: "rgba(107,63,160,0.05)" },
      { to: "/compress",  title: "Compressor", description: "Zip files as zip, tar, tar.gz or tar.bz2 — with optional password.", color: "#2a7a8a", colorBg: "rgba(42,122,138,0.05)" },
      { to: "/resize",    title: "Resize",     description: "Resize or crop images to exact dimensions.",                         color: "#1a5a6a", colorBg: "rgba(26,90,106,0.05)"  },
    ],
  },
  {
    label: "Dev",
    cards: [
      { to: "/generator", title: "Generator",  description: "Create strong, random passwords instantly.",  color: "#a07820", colorBg: "rgba(160,120,32,0.05)" },
      { to: "/hash",      title: "Hash",        description: "Compute MD5, SHA1 and SHA256 checksums.",    color: "#7a4520", colorBg: "rgba(122,69,32,0.05)" },
      { to: "/qr",        title: "QR Code",     description: "Generate QR codes from any text or URL.",    color: "#1a6b4a", colorBg: "rgba(26,107,74,0.05)" },
      { to: "/base64",    title: "Base64",      description: "Encode or decode text and files in Base64.", color: "#8a3a6b", colorBg: "rgba(138,58,107,0.05)" },
      { to: "/jwt",       title: "JWT",         description: "Decode JWT tokens and inspect header and payload.", color: "#5a7a1a", colorBg: "rgba(90,122,26,0.05)"  },
      { to: "/cron",      title: "Cron",        description: "Parse cron expressions and preview next run times.",  color: "#3a7a5a", colorBg: "rgba(58,122,90,0.05)"   },
      { to: "/color",     title: "Color",       description: "Convert between HEX, RGB and HSL color formats.",    color: "#6a3a8a", colorBg: "rgba(106,58,138,0.05)"  },
      { to: "/barcode",   title: "Barcode",     description: "Generate EAN, Code128 and other barcodes as PNG.",   color: "#6a5a3a", colorBg: "rgba(106,90,58,0.05)"   },
    ],
  },
  {
    label: "Files",
    cards: [
      { to: "/optimize", title: "Optimize",   description: "Reduce image file size with adjustable quality.",           color: "#8a5a1a", colorBg: "rgba(138,90,26,0.05)"  },
      { to: "/pdf",      title: "PDF",         description: "Merge multiple PDFs or extract a page range.",             color: "#7a2a2a", colorBg: "rgba(122,42,42,0.05)"  },
      { to: "/exif",     title: "EXIF",        description: "Extract metadata from images — camera, GPS, date and more.", color: "#5a4a7a", colorBg: "rgba(90,74,122,0.05)"  },
      { to: "/metadata", title: "Metadata",    description: "Strip EXIF and metadata from images for privacy.",           color: "#8a2a1a", colorBg: "rgba(138,42,26,0.05)"  },
    ],
  },
  {
    label: "Network",
    cards: [
      { to: "/ssl",     title: "SSL",          description: "Inspect TLS certificates — validity, issuer, SANs and expiry.", color: "#1a7a4a", colorBg: "rgba(26,122,74,0.05)"   },
      { to: "/headers", title: "HTTP Headers", description: "Inspect response headers and status code of any URL.",          color: "#8a1a6a", colorBg: "rgba(138,26,106,0.05)"  },
      { to: "/dns",     title: "DNS Lookup",   description: "Query DNS records — A, MX, TXT, NS, CNAME and more.",          color: "#1a2a8a", colorBg: "rgba(26,42,138,0.05)"   },
      { to: "/whois",   title: "Whois",        description: "Look up domain registration info — registrar, dates, nameservers.", color: "#8a7a1a", colorBg: "rgba(138,122,26,0.05)" },
    ],
  },
  {
    label: "Text & Data",
    cards: [
      { to: "/text", title: "Text", description: "Transform and analyze text instantly.",  color: "#1a4f8a", colorBg: "rgba(26,79,138,0.05)" },
      { to: "/json", title: "JSON", description: "Format, minify and validate JSON.",      color: "#3a6b6b", colorBg: "rgba(58,107,107,0.05)" },
      { to: "/diff", title: "Diff",          description: "Compare two texts and highlight the differences.", color: "#4a5a8a", colorBg: "rgba(74,90,138,0.05)" },
      { to: "/sql",  title: "SQL",           description: "Format and beautify SQL queries with dialect support.", color: "#5a7a3a", colorBg: "rgba(90,122,58,0.05)" },
    ],
  },
];

function Card({ card }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <button
      style={{
        ...s.card,
        borderColor: hovered ? card.color : "var(--border)",
        background: hovered ? card.colorBg : "var(--surface)",
      }}
      onClick={() => navigate(card.to)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={s.cardBody}>
        <p style={s.cardTitle}>{card.title}</p>
        <p style={s.cardDesc}>{card.description}</p>
      </div>
      <span style={{ ...s.arrow, color: hovered ? card.color : "var(--text-muted)" }}>
        →
      </span>
    </button>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");

  const q = query.toLowerCase();
  const filtered = SECTIONS.map((sec) => ({
    ...sec,
    cards: sec.cards.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    ),
  })).filter((sec) => sec.cards.length > 0);

  return (
    <div style={s.page}>
      <header style={s.header}>
        <span style={s.logo}>tools</span>
      </header>

      <input
        style={s.search}
        placeholder="Search tools…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={(e) => (e.target.style.borderColor = "var(--border-hover)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />

      <main style={s.main}>
        {filtered.length === 0 ? (
          <p style={s.empty}>No tools match.</p>
        ) : (
          filtered.map((sec) => (
            <div key={sec.label} style={s.section}>
              <p style={s.sectionLabel}>{sec.label}</p>
              <div style={s.grid}>
                {sec.cards.map((c) => (
                  <Card key={c.to} card={c} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}

const s = {
  page: {
    maxWidth: "700px",
    margin: "0 auto",
    padding: "2rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  header: {},
  logo: {
    fontSize: "0.875rem",
    letterSpacing: "0.08em",
    color: "var(--text-muted)",
    fontWeight: 500,
  },
  search: {
    padding: "0.6rem 0.9rem",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    fontSize: "0.875rem",
    background: "var(--surface)",
    color: "var(--text)",
    outline: "none",
    transition: "border-color 0.2s ease",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    gap: "2rem",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  sectionLabel: {
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "0.75rem",
  },
  empty: {
    fontSize: "0.875rem",
    color: "var(--text-muted)",
  },
  card: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.75rem 1.5rem",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    cursor: "pointer",
    textAlign: "left",
    transition: "border-color 0.2s ease, background 0.2s ease",
  },
  cardBody: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  cardTitle: {
    fontSize: "1.1rem",
    fontWeight: 500,
    color: "var(--text)",
    letterSpacing: "-0.01em",
  },
  cardDesc: {
    fontSize: "0.875rem",
    color: "var(--text-muted)",
    fontWeight: 400,
  },
  arrow: {
    fontSize: "1.1rem",
    flexShrink: 0,
    marginLeft: "1rem",
    transition: "color 0.2s ease",
  },
};
