# AliExpress Search Specification

## Purpose

Implementar búsqueda de productos en AliExpress mediante web scraping con Cheerio. Esta capability permite obtener productos de AliExpress sin necesidad de API key oficial.

## Requirements

### Requirement: Búsqueda por关键词

El sistema DEBE poder buscar productos en AliExpress usando un query de texto.

- GIVEN el usuario ingresa un término de búsqueda
- WHEN el sistema envía la búsqueda a AliExpress
- THEN DEBE retornar un array de productos con título, precio, URL e imagen

#### Scenario: Búsqueda exitosa

- GIVEN el usuario busca "iPhone 15 case"
- WHEN el sistema realiza la búsqueda en AliExpress
- THEN DEBE retornar al menos 1 producto con título, precio y URL válida
- AND el precio DEBE ser un número válido

#### Scenario: Sin resultados

- GIVEN el usuario busca un término que no existe
- WHEN AliExpress no encuentra productos
- THEN el sistema DEBE retornar un array vacío
- AND no DEBE lanzar error

#### Scenario: Error de red

- GIVEN hay un problema de conexión con AliExpress
- WHEN la request falla
- THEN el sistema DEBE capturar el error y retornar array vacío
- AND NO DEBE lanzar excepción no manejada

### Requirement: Estructura del producto

Cada producto retornado DEBE tener la siguiente estructura:

- `id`: Identificador único (string)
- `title`: Título del producto (string)
- `price`: Precio como número (number)
- `currency`: Código de moneda (string, default USD)
- `source`: Fuente del producto (string, debe ser "aliexpress")
- `url`: URL del producto (string)
- `imageUrl`: URL de la imagen (string, puede estar vacía)

### Requirement: Rate Limiting

El sistema DEBE implementar delays entre requests para evitar bloqueo.

- GIVEN el usuario hace múltiples búsquedas
- WHEN cada request successive
- THEN el sistema DEBE esperar al menos 1 segundo entre requests

### Requirement: Fallback

Si Cheerio falla o AliExpress bloquea, el sistema DEBE retornar productos vacíos sin fallar.

- GIVEN AliExpress detecta y bloquea el scraping
- WHEN la respuesta es fallida o vacía
- THEN el sistema DEBE retornar productos vacíos
- AND no DEBE propagar el error al usuario

## Acceptance Criteria

- [ ] Búsqueda con query válido retorna productos reales de AliExpress
- [ ] Cada producto tiene todos los campos requeridos
- [ ] Errors de red no rompen la aplicación
- [ ] El delay entre requests evita bloqueo básico
- [ ] El código compila sin errores TypeScript