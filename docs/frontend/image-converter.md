# UI: Conversor de Imágenes

## Ubicación

Página `/conversor`, pestaña **Image** — accesible desde el Home pulsando la card **Conversor**.

## Qué ve el usuario

Una zona de arrastrar y soltar, un selector de formato de destino como botones de texto y un botón de conversión. Todo el Conversor comparte la misma página con pestañas de texto (Image · Video · Audio · Document) en la parte superior.

## Flujo de Uso

1. El usuario selecciona la pestaña "Image".
2. Arrastra una imagen a la zona designada o hace clic para abrir el explorador.
3. El nombre del archivo seleccionado aparece en la zona de drop.
4. Elige el formato de destino (JPG, PNG, WebP, GIF).
5. Pulsa "Convert".
6. Mientras el servidor procesa, el botón muestra "Converting…".
7. Cuando finaliza, el navegador descarga el archivo como `result.{formato}`.

## Formatos Disponibles

JPG · PNG · WebP · GIF
