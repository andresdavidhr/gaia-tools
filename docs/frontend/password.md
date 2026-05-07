# UI: Generador de Contraseñas

## Ubicación

Página `/generator` — accesible desde el Home pulsando la card **Generator**.

## Qué ve el usuario

Un slider para la longitud, dos checkboxes para activar números y símbolos, y un botón de generación. El resultado aparece en un recuadro con borde fino junto a un botón "Copy" inline.

## Flujo de Uso

1. El usuario ajusta la longitud con el slider (8–128 caracteres).
2. Activa o desactiva números y símbolos mediante los checkboxes.
3. Pulsa "Generate".
4. La contraseña aparece en el campo de resultado en tipografía monoespaciada.
5. El usuario pulsa "Copy" para copiarla al portapapeles; el botón cambia a "Copied" durante 2 segundos.

## Funcionalidades Adicionales

- El botón de generar puede pulsarse repetidamente para obtener nuevas contraseñas.
- El campo de resultado es de solo lectura.
