# Arquitectura del Backend

## Visión General

El backend de gaia-tools es una API REST construida sobre **FastAPI** (Python), diseñada para ejecutarse como un servicio ligero dentro de un contenedor Docker. Su responsabilidad es procesar las solicitudes de las herramientas web y devolver los resultados al frontend.

## Capas del Sistema

```
Solicitud HTTP
      │
      ▼
  [Routers]          Punto de entrada de cada herramienta. Valida la solicitud
      │              y delega el trabajo a la capa de utilidades.
      ▼
  [Utils]            Lógica de negocio pura. Cada herramienta tiene su propio
      │              módulo con funciones especializadas.
      ▼
  [Dependencias]     Librerías externas (yt-dlp, Pillow, ffmpeg, pypandoc)
      │              y el sistema de archivos temporal.
      ▼
  Respuesta HTTP
```

## Decisiones Técnicas

| Decisión | Razón |
|----------|-------|
| FastAPI sobre Flask | Validación automática de parámetros, documentación Swagger integrada, rendimiento superior |
| Ficheros pequeños por herramienta | Facilita el mantenimiento y la localización de errores |
| Procesamiento síncrono | Las herramientas actuales no requieren concurrencia compleja; simplifica el código |
| Docker `python:3.12-slim` | Imagen mínima que reduce el tiempo de arranque y el tamaño del contenedor |
| ffmpeg como binario del sistema | Herramienta de referencia para audio y vídeo; más fiable que wrappers Python |

## Flujo de una Solicitud Típica

1. El frontend envía una petición HTTP al backend (puerto 8000).
2. El router correspondiente recibe y valida los parámetros.
3. La función utilitaria ejecuta la transformación (conversión, descarga, etc.).
4. El resultado (archivo o datos JSON) se devuelve al cliente.
5. Los archivos temporales se eliminan tras la descarga.
