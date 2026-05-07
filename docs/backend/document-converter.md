# Herramienta: Conversor de Documentos

## Qué hace

Convierte documentos entre los formatos más habituales: PDF, DOCX y TXT.

## Cómo funciona

1. El usuario sube un documento y selecciona el formato de destino.
2. El backend utiliza **pypandoc** (interfaz Python para Pandoc) para realizar la conversión.
3. El documento convertido se devuelve al navegador como descarga directa.
4. Los archivos temporales se eliminan tras la entrega.

## Formatos soportados

| Entrada | Salida |
|---------|--------|
| DOCX | PDF, TXT |
| TXT | PDF, DOCX |
| PDF | TXT |

## Dependencias

- `pypandoc`: interfaz Python para Pandoc, el conversor de documentos universal.
- `pandoc`: herramienta de conversión instalada en el contenedor Docker.

## Consideraciones

- La conversión de PDF a DOCX con formato rico (tablas, imágenes complejas) puede no preservar el diseño original al 100%.
- La conversión a TXT extrae el texto plano sin ningún formato.
- Para documentos con fuentes o estilos especiales, el resultado puede variar según el contenido original.
