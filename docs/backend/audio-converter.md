# Herramienta: Conversor de Audio

## Qué hace

Convierte archivos de audio entre los formatos más comunes: MP3, WAV y OGG.

## Cómo funciona

1. El usuario sube un archivo de audio y selecciona el formato de destino.
2. El backend invoca **ffmpeg** para realizar la conversión.
3. El archivo convertido se devuelve al navegador como descarga directa.
4. Los archivos temporales se eliminan tras la entrega.

## Formatos soportados

| Entrada | Salida |
|---------|--------|
| MP3 | WAV, OGG |
| WAV | MP3, OGG |
| OGG | MP3, WAV |

## Dependencias

- `ffmpeg`: herramienta de referencia para procesamiento de audio y vídeo, instalada en el contenedor Docker.

## Consideraciones

- La conversión a MP3 usa una tasa de bits de 192 kbps por defecto, equilibrando calidad y tamaño.
- WAV es un formato sin compresión; los archivos resultantes serán significativamente más grandes.
- OGG es un formato libre y de código abierto con buena relación calidad/tamaño.
