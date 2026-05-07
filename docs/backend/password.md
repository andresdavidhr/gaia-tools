# Herramienta: Generador de Contraseñas

## Qué hace

Genera contraseñas seguras y aleatorias según los parámetros que especifique el usuario: longitud, inclusión de símbolos y números.

## Cómo funciona

1. El usuario configura las opciones desde el frontend (longitud, tipos de caracteres).
2. El backend usa el módulo `secrets` de Python, diseñado específicamente para generar valores criptográficamente seguros.
3. Se devuelve la contraseña generada en formato JSON.
4. No se almacena ninguna contraseña en el servidor.

## Parámetros

| Parámetro | Tipo | Valor por defecto | Descripción |
|-----------|------|------------------|-------------|
| `length` | entero | 16 | Longitud de la contraseña (8–128) |
| `symbols` | booleano | true | Incluir caracteres especiales (!@#$...) |
| `numbers` | booleano | true | Incluir dígitos (0–9) |

## Seguridad

El generador utiliza `secrets.choice`, que se apoya en fuentes de entropía del sistema operativo, lo que lo hace adecuado para generar contraseñas de uso real.
