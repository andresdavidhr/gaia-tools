# Diseño de la API

## Principios

- Cada herramienta tiene su propio prefijo de ruta (`/api/youtube`, `/api/password`, `/api/convert`).
- Las respuestas de archivo usan `StreamingResponse` para no cargar el archivo entero en memoria.
- Los errores devuelven JSON con código HTTP apropiado (400 para entrada inválida, 500 para errores internos).

## Endpoints

| Método | Ruta | Entrada | Salida |
|--------|------|---------|--------|
| POST | `/api/youtube/download` | JSON: `{url, format}` | Archivo MP3 o MP4 |
| GET | `/api/password/generate` | Query: `length`, `symbols`, `numbers` | JSON: `{password}` |
| POST | `/api/convert/image` | Form: `file`, `target_format` | Archivo de imagen |
| POST | `/api/convert/video` | Form: `file`, `target_format` | Archivo de vídeo |
| POST | `/api/convert/audio` | Form: `file`, `target_format` | Archivo de audio |
| POST | `/api/convert/document` | Form: `file`, `target_format` | Archivo de documento |

## Convenciones de Respuesta

**Éxito con datos:**
```json
{ "password": "Xk9#mP2!qL7@nR4$" }
```

**Éxito con archivo:** respuesta binaria con `Content-Disposition: attachment; filename="song_TYlSh0vGLow.mp3"` (YouTube usa el ID del vídeo; los conversores usan `result.{formato}`)

**Error:**
```json
{ "detail": "Formato de destino no soportado: xyz" }
```

## CORS

El backend permite peticiones desde el frontend en `http://localhost:3000` y desde el dominio configurado en producción. La configuración está centralizada en `app/main.py`.
