# Herramienta: Conversor de Vídeo

## Qué hace

Convierte archivos de vídeo entre los formatos más habituales: MP4, AVI y MKV.

## Cómo funciona

1. El usuario sube un archivo de vídeo y selecciona el formato de destino.
2. El backend invoca **ffmpeg** para realizar la transcodificación.
3. El archivo convertido se devuelve al navegador como descarga directa.
4. Los archivos temporales se eliminan tras la entrega.

## Formatos soportados

| Entrada | Salida |
|---------|--------|
| MP4 | AVI, MKV |
| AVI | MP4, MKV |
| MKV | MP4, AVI |

## Dependencias

- `ffmpeg`: herramienta de referencia para procesamiento de audio y vídeo, instalada en el contenedor Docker.

## Consideraciones

- La conversión de vídeo es intensiva en CPU; los archivos grandes pueden tardar varios minutos.
- El tamaño máximo de archivo está configurado en el servidor (por defecto 100 MB).
- Los códecs utilizados son los predeterminados de ffmpeg para garantizar la máxima compatibilidad.
