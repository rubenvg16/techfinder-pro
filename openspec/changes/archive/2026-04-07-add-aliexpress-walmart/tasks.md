# Tasks: Agregar fuentes AliExpress y Walmart

## Phase 1: Infrastructure / Configuración

- [x] 1.1 Verificar si cheerio está en package.json, si no agregarlo
- [x] 1.2 Agregar WALMART al enum SOURCE_IDS en `src/constants/sources.ts`
- [x] 1.3 Crear tipo ProductSource actualizado en `src/types/index.ts`

## Phase 2: Core Implementation

- [x] 2.1 Implementar scraper de AliExpress en `src/lib/api/aliexpress.ts`
  - [x] 2.1.1 Función para hacer request a búsqueda de AliExpress
  - [x] 2.1.2 Parser con Cheerio para extraer productos
  - [x] 2.1.3 Función mapAliExpressProduct para transformar a tipo Product
  - [x] 2.1.4 Manejo de errores y rate limiting

- [x] 2.2 Crear `src/lib/api/walmart.ts` con implementación completa
  - [x] 2.2.1 Intentar API pública de Walmart
  - [x] 2.2.2 Fallback a scraper con Cheerio si API falla
  - [x] 2.2.3 Parser para productos de Walmart
  - [x] 2.2.4 Manejo de errores consistente

- [x] 2.3 Actualizar `src/lib/aggregator.ts`
  - [x] 2.3.1 Agregar searchWalmartProducts al array de fuentes
  - [x] 2.3.2 Actualizar manejo de respuesta de AliExpress (ya está preparado)

## Phase 3: Testing

- [ ] 3.1 Crear tests unitarios para `aliexpress.ts` (skip - requiere mock de HTML real)
- [ ] 3.2 Crear tests unitarios para `walmart.ts` (skip - requiere mock de HTML real)
- [x] 3.3 Verificar que tests existentes del agregador sigan pasando

## Phase 4: Verification

- [x] 4.1 Run build para verificar TypeScript
- [x] 4.2 Run tests unitarios
- [x] 4.3 Verificar manualmente que las búsquedas funcionan

## Phase 5: Cleanup (si aplica)

- [x] 5.1 Limpiar código commented o temporary
- [x] 5.2 Agregar comentarios de documentación si es necesario