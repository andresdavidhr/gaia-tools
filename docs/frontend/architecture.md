# Arquitectura del Frontend

## Visión General

El frontend de **tools** es una aplicación de página única (SPA) construida con **React 18** y **Vite**. Se sirve como archivos estáticos desde un contenedor **nginx** y se comunica con el backend mediante peticiones HTTP a la API REST.

## Estructura de Componentes

```
App
 ├── pages/Home          Página de inicio con 7 cards agrupadas en 3 secciones
 ├── pages/Downloads     Descargador multi-plataforma (MP3 / MP4, calidad, nombre)
 ├── pages/Generator     Generador de contraseñas
 ├── pages/Conversor     Conversores de archivo (Image, Video, Audio, Document)
 │    └── components/FileConverter   Componente reutilizable de subida y conversión
 ├── pages/QRCode        Generador de códigos QR
 ├── pages/TextUtils     Utilidades de texto (transformar, contar, ordenar líneas)
 ├── pages/HashGen       Generador de checksums MD5 / SHA1 / SHA256
 └── pages/JSONFormatter Formateador, minificador y validador de JSON
```

No hay barra lateral ni componente de navegación persistente. Cada página incluye su propio botón de retorno al Home.

## Estructura de Archivos

```
frontend/src/
├── index.css
├── main.jsx
├── App.jsx
├── pages/
│   ├── Home.jsx
│   ├── Downloads.jsx
│   ├── Generator.jsx
│   ├── Conversor.jsx
│   ├── QRCode.jsx
│   ├── TextUtils.jsx
│   ├── HashGen.jsx
│   └── JSONFormatter.jsx
└── components/
    └── FileConverter.jsx
```

## Decisiones Técnicas

| Decisión | Razón |
|----------|-------|
| React + Vite | Ecosistema consolidado, arranque en desarrollo instantáneo |
| Sin librería de estado global | Cada página es independiente y gestiona su propio estado local |
| Fetch API nativa | Sin dependencias extra para llamadas HTTP |
| Sin barra lateral | Navegación simplificada desde el Home; reduce complejidad visual |
| nginx en producción | Servidor estático eficiente, mínima huella en el contenedor Docker |
| Estilos inline con variables CSS | Sin dependencias de CSS-in-JS; tokens centralizados en `index.css` |

## Routing

| Ruta | Página |
|------|--------|
| `/` | Home — 7 cards agrupadas en secciones (Media / Dev / Text & Data) |
| `/downloads` | Downloads — descargador multi-plataforma (YouTube, Vimeo, TikTok…) |
| `/generator` | Generator — generador de contraseñas |
| `/conversor` | Conversor — conversores de imagen, vídeo, audio y documentos |
| `/qr` | QR Code — generador de códigos QR |
| `/text` | Text Utilities — transformación y análisis de texto |
| `/hash` | Hash Generator — checksums MD5, SHA1 y SHA256 |
| `/json` | JSON Formatter — formatear, minificar y validar JSON |

## Comunicación con el Backend

Todas las llamadas usan la URL base relativa `/api` (el proxy de nginx redirige al backend en el puerto 8000). Las respuestas de archivo se reciben como `Blob` y se ofrecen al usuario como descarga directa mediante un enlace temporal.
