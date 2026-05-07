import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FileConverter from "../components/FileConverter";

const ACCENT = "#6b3fa0";

const TYPES = [
  { key: "image",    label: "Image",    endpoint: "/api/convert/image",    formats: ["jpg","png","webp","gif"],  accept: "image/*" },
  { key: "video",    label: "Video",    endpoint: "/api/convert/video",    formats: ["mp4","avi","mkv"],         accept: "video/*",      warning: "Large files may take several minutes." },
  { key: "audio",    label: "Audio",    endpoint: "/api/convert/audio",    formats: ["mp3","wav","ogg"],         accept: "audio/*" },
  { key: "document", label: "Document", endpoint: "/api/convert/document", formats: ["pdf","docx","txt"],        accept: ".pdf,.docx,.txt", warning: "PDF to DOCX may not preserve all formatting." },
];

export default function Conversor() {
  const navigate = useNavigate();
  const [active, setActive] = useState("image");
  const [backHover, setBackHover] = useState(false);
  const type = TYPES.find((t) => t.key === active);

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

      <h1 style={s.title}>Conversor</h1>
      <p style={s.subtitle}>Convert images, video, audio and documents.</p>

      <div style={s.tabs}>
        {TYPES.map((t) => (
          <button
            key={t.key}
            style={{
              ...s.tab,
              color: active === t.key ? ACCENT : "var(--text-muted)",
              borderBottomColor: active === t.key ? ACCENT : "transparent",
            }}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <FileConverter
        key={active}
        endpoint={type.endpoint}
        formats={type.formats}
        accept={type.accept}
        warning={type.warning}
        accent={ACCENT}
      />
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", maxWidth: "560px", margin: "0 auto", padding: "2rem", display: "flex", flexDirection: "column" },
  back: { fontSize: "0.875rem", marginBottom: "3rem", cursor: "pointer", letterSpacing: "0.02em", alignSelf: "flex-start", transition: "color 0.2s ease" },
  title: { fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.03em", marginBottom: "0.5rem" },
  subtitle: { fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "2rem" },
  tabs: { display: "flex", borderBottom: "1px solid var(--border)", marginBottom: "2rem" },
  tab: { fontSize: "0.875rem", padding: "0.6rem 1rem", cursor: "pointer", letterSpacing: "0.02em", borderBottom: "1px solid transparent", marginBottom: "-1px", transition: "color 0.2s ease, border-color 0.2s ease" },
};
