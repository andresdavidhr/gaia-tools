# Herramienta: Conversor de Imágenes

## Qué hace

Convierte archivos de imagen entre los formatos más comunes: JPG, PNG, WebP y GIF.

## Cómo funciona

1. El usuario sube un archivo de imagen y selecciona el formato de destino.
2. El backend recibe el archivo, lo procesa con **Pillow** (la librería de manipulación de imágenes estándar de Python) y lo convierte al formato solicitado.
3. El archivo convertido se devuelve al navegador como descarga directa.
4. Los archivos temporales se eliminan tras la entrega.

## Formatos soportados

| Entrada | Salida |
|---------|--------|
| JPG / JPEG | PNG, WebP, GIF |
| PNG | JPG, WebP, GIF |
| WebP | JPG, PNG, GIF |
| GIF | JPG, PNG, WebP |

## Dependencias

- `Pillow`: librería de procesamiento de imágenes para Python.

## Consideraciones

- Las imágenes con canal alfa (transparencia) que se conviertan a JPG se fusionarán sobre fondo blanco, ya que JPG no soporta transparencia.
- El tamaño máximo de archivo está configurado en el servidor (por defecto 100 MB).
