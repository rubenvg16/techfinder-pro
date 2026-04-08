# Walmart Search Specification

## Purpose

Implementar búsqueda de productos en Walmart mediante API pública o fallback a scraper. Esta capability permite obtener productos de Walmart como fuente adicional de comparación.

## Requirements

### Requirement: Búsqueda por关键词

El sistema DEBE poder buscar productos en Walmart usando un query de texto.

- GIVEN el usuario ingresa un término de búsqueda
- WHEN el sistema envía la búsqueda a Walmart
- THEN DEBE retornar un array de productos con título, precio, URL e imagen

#### Scenario: Búsqueda exitosa con API

- GIVEN el usuario busca "Samsung TV 55"
- WHEN el sistema realiza la búsqueda en Walmart API
- THEN DEBE retornar al menos 1 producto con título, precio y URL válida
- AND el precio DEBE ser un número válido

#### Scenario: Búsqueda con fallback a scraper

- GIVEN la API de Walmart no está disponible o requiere auth
- WHEN el sistema hace fallback a scraping
- THEN DEBE retornar productos del HTML de Walmart si está disponible

#### Scenario: Sin resultados

- GIVEN el usuario busca un término que no existe en Walmart
- WHEN no hay productos que coincidan
- THEN el sistema DEBE retornar un array vacío

### Requirement: Estructura del producto

Cada producto retornado DEBE tener la siguiente estructura:

- `id`: Identificador único (string)
- `title`: Título del producto (string)
- `price`: Precio como número (number)
- `currency`: Código de moneda (string, default USD)
- `source`: Fuente del producto (string, debe ser "walmart")
- `url`: URL del producto (string)
- `imageUrl`: URL de la imagen (string, puede estar vacía)

### Requirement: Autenticación

El sistema DEBE manejar la autenticación de forma transparente.

- GIVEN la API de Walmart requiere API key
- WHEN no hay key configurada
- THEN el sistema DEBE intentar fallback a scraper
- AND si el scraper también falla, retornar array vacío

### Requirement: Rate Limiting

El sistema DEBE implementar delays para evitar bloqueo.

- GIVEN múltiples búsquedas en corto tiempo
- WHEN cada request successive
- THEN el sistema DEBE esperar entre requests

## Acceptance Criteria

- [ ] Búsqueda retorna productos de Walmart cuando está disponible
- [ ] Fallback a scraper funciona si API falla
- [ ] Cada producto tiene todos los campos requeridos
- [ ] Errores no rompen la aplicación
- [ ] El código compila sin errores TypeScript