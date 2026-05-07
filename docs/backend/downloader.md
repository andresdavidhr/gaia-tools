# Herramienta: Descargador de Vídeo

## Qué hace

Recibe una URL de cualquier plataforma soportada por yt-dlp (YouTube, Vimeo, Twitter/X, TikTok, Instagram…) y devuelve el archivo en el formato y calidad elegidos por el usuario, listo para descargar.

## Cómo funciona

1. El usuario proporciona la URL del vídeo.
2. El backend consulta los metadatos del vídeo sin descargarlo (`GET /api/downloader/info`) para validar la URL y obtener el título.
3. El usuario selecciona formato (MP3 / MP4), calidad y, opcionalmente, un nombre de archivo.
4. Al confirmar, el backend utiliza **yt-dlp** para descargar el contenido con los parámetros indicados.
5. Si se solicita MP3, el audio se extrae y convierte mediante **ffmpeg**.
6. El archivo resultante se envía al navegador como descarga directa con el nombre correcto.
7. El archivo temporal se elimina del servidor tras la entrega.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/downloader/info?url=` | Devuelve `{title, duration}` sin descargar |
| `POST` | `/api/downloader/download` | Descarga y devuelve el archivo |

### Parámetros de `/download`

| Campo | Tipo | Valores | Por defecto |
|-------|------|---------|-------------|
| `url` | string | URL de la plataforma | — |
| `format` | string | `"mp3"` \| `"mp4"` | `"mp3"` |
| `quality` | string | MP3: `"128"` `"192"` `"320"` / MP4: `"720"` `"1080"` `"best"` | `"best"` |
| `custom_filename` | string | Nombre sin extensión; vacío usa el título del vídeo | `""` |

## Dependencias

- `yt-dlp`: descarga y extracción de contenido de más de 1 000 plataformas.
- `ffmpeg`: conversión de audio/vídeo (instalado como binario del sistema en el contenedor Docker).

## Limitaciones

- Disponible solo para vídeos públicos o no restringidos por región.
- El tiempo de procesamiento depende de la duración y calidad del vídeo.
- No almacena ningún archivo de forma permanente en el servidor.
