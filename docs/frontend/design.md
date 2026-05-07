# Diseño Visual y UX

## Principios

Inspirado en el diseño de Apple y Nothing: minimalismo extremo, tipografía limpia y espacio generoso. Sin colores de marca, sin gradientes, sin barra lateral.

- **Negro puro**: el fondo y las superficies son negros y grises muy oscuros.
- **Una sola fuente de acción**: cada página tiene un único objetivo claro.
- **Fricción mínima**: el flujo de uso siempre es el mismo: configurar → ejecutar → descargar.
- **Feedback inmediato**: estados de carga y error visibles durante el procesamiento.

## Sistema de Diseño

| Token | Valor |
|-------|-------|
| Fondo | `#0a0a0a` |
| Superficie | `#111111` |
| Borde | `#1c1c1c` |
| Borde hover | `#333333` |
| Texto primario | `#ffffff` |
| Texto secundario | `#666666` |
| Radio de borde | `12px` |
| Transición | `0.2s ease` |
| Fuente | `system-ui, -apple-system, "Helvetica Neue"` |

## Estructura de Páginas

### Home
- Logotipo "tools" pequeño y en minúsculas en la esquina superior izquierda.
- 3 cards centradas (máx. 560 px) con título, descripción y flecha `→`.
- Al pasar el cursor, el borde de la card se ilumina sutilmente.

### Páginas interiores (Downloads, Generator, Conversor)
- Botón `← back` en la parte superior izquierda para volver al Home.
- Título grande con tracking negativo (`letter-spacing: -0.03em`).
- Subtítulo en gris secundario.
- Formulario con bordes finos, sin fondos rellenos en los controles.

## Flujo de Usuario Genérico

```
Home
  │  (clic en card)
  ▼
Página de herramienta
  │  Configurar parámetros
  ▼
Pulsar botón de acción
  │  Indicador de carga
  ▼
Descarga automática del resultado
```

## Estados de la Interfaz

| Estado | Comportamiento |
|--------|---------------|
| Inactivo | Formulario vacío, botón activo |
| Cargando | Botón desactivado, texto "…ing" |
| Éxito | Descarga automática del archivo |
| Error | Mensaje en gris oscuro bajo el botón |

## Accesibilidad

- Controles con etiquetas semánticas (`<label>`).
- Navegación posible con teclado (Tab, Enter).
- Reducción de movimiento respetada por las transiciones cortas (0.2s).
