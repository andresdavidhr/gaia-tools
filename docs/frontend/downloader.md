# UI: Descargador de Vídeo

## Ubicación

Página `/downloads` — accesible desde el Home pulsando la card **Downloads**.

## Qué ve el usuario

Un campo de URL con validación automática, selectores de formato y calidad, un campo opcional de nombre de archivo y un botón de descarga que se habilita solo cuando la URL es válida.

## Flujo de uso

1. El usuario pega la URL del vídeo en el campo (cualquier plataforma soportada por yt-dlp).
2. Tras 600 ms de debounce, el frontend consulta `/api/downloader/info` y muestra:
   - `"Checking…"` mientras espera.
   - `✓ Título del vídeo` en verde si la URL es válida.
   - Mensaje de error si la URL no es reconocida.
3. El botón **Download** permanece desactivado hasta que la URL sea válida.
4. El usuario selecciona:
   - **Format**: MP3 (solo audio) o MP4 (vídeo con audio).
   - **Quality**: 128 / 192 / 320 kbps para MP3; 720p / 1080p / Best para MP4.
   - **Save as** (opcional): nombre personalizado sin extensión. Si se deja vacío, se usa el título del vídeo.
5. Al pulsar **Download**, el botón muestra `"Downloading…"` y queda desactivado.
6. Cuando el archivo está listo, el navegador lo descarga con el nombre correcto y su extensión.

## Mensajes de estado

| Estado | Texto |
|--------|-------|
| Validando URL | `Checking…` |
| URL válida | `✓ Título del vídeo` (color acento) |
| URL inválida | Descripción del error devuelta por el servidor |
| Error en descarga | Descripción del error devuelta por el servidor |
