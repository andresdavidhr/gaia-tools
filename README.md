# gaia-tools

Suite de utilidades web auto-hospedada: descargador de vídeos, generador de contraseñas, conversores de archivos, QR codes, utilidades de texto, checksums y formateador JSON.

## Herramientas

| Herramienta | Descripción |
|-------------|-------------|
| Downloads | Descarga vídeos de YouTube, Vimeo, Twitter/X, TikTok y más como MP3 o MP4 |
| Generator | Genera contraseñas seguras y aleatorias |
| Conversor | Convierte imágenes, vídeo, audio y documentos |
| QR Code | Genera códigos QR a partir de cualquier texto o URL |
| Text | Transforma y analiza texto (mayúsculas, ordenar líneas, contar palabras…) |
| Hash | Calcula checksums MD5, SHA1 y SHA256 |
| JSON | Formatea, minifica y valida JSON |

## Estructura

```
gaia-tools/
├── frontend/               React + Vite → servido por nginx
├── backend/                Python + FastAPI
├── docs/                   Documentación por área
├── docker-compose.local.yaml   Despliegue local (build desde código fuente)
└── docker-compose.github.yaml  Despliegue desde GitHub (build desde el repo)
```

## Despliegue

### Requisitos

- Docker y Docker Compose instalados en el servidor.
- Puertos `3000` (frontend) y `8000` (backend) disponibles.

### Desde GitHub (producción — NAS, servidor remoto)

Un solo comando descarga el script de despliegue y levanta los servicios directamente desde el repositorio de GitHub, sin necesidad de clonar el código:

```bash
curl -fsSL https://raw.githubusercontent.com/andresdavidhr/gaia-tools/main/deploy.sh | bash
```

El frontend queda disponible en `http://<IP>:3000`.

### Local (desarrollo)

Con el repositorio clonado en la máquina:

```bash
docker compose -f docker-compose.local.yaml up --build -d
```

### Actualizar a la última versión

```bash
curl -fsSL https://raw.githubusercontent.com/andresdavidhr/gaia-tools/main/deploy.sh | bash
```

### Ver logs

```bash
docker compose -f docker-compose.github.yaml logs -f
```

### Parar los servicios

```bash
docker compose -f docker-compose.github.yaml down
```

## Documentación técnica

| Área | Arquitectura | Diseño |
|------|-------------|--------|
| [Backend](docs/backend/) | [architecture.md](docs/backend/architecture.md) | [design.md](docs/backend/design.md) |
| [Frontend](docs/frontend/) | [architecture.md](docs/frontend/architecture.md) | [design.md](docs/frontend/design.md) |

### Documentación por herramienta

| Herramienta | Backend | Frontend |
|-------------|---------|----------|
| Descargador de vídeo | [downloader.md](docs/backend/downloader.md) | [downloader.md](docs/frontend/downloader.md) |
| Generador de contraseñas | [password.md](docs/backend/password.md) | [password.md](docs/frontend/password.md) |
| Conversor de imágenes | [image-converter.md](docs/backend/image-converter.md) | [image-converter.md](docs/frontend/image-converter.md) |
| Conversor de vídeo | [video-converter.md](docs/backend/video-converter.md) | [video-converter.md](docs/frontend/video-converter.md) |
| Conversor de audio | [audio-converter.md](docs/backend/audio-converter.md) | [audio-converter.md](docs/frontend/audio-converter.md) |
| Conversor de documentos | [document-converter.md](docs/backend/document-converter.md) | [document-converter.md](docs/frontend/document-converter.md) |

## Aviso legal

La descarga de vídeos de plataformas como YouTube puede infringir sus Términos de Servicio. Esta herramienta está diseñada para uso personal en red privada. El usuario es responsable del cumplimiento de las leyes y términos de uso aplicables.
