# Proposal: Agregar fuentes de búsqueda AliExpress y Walmart

## Intent

Reemplazar el mock de AliExpress con una implementación real y agregar Walmart como nueva fuente de búsqueda para ampliar la cobertura de productos tecnológicos y generales.

## Scope

### In Scope
- Implementar scraper de AliExpress usando Cheerio
- Agregar Walmart API como fuente de búsqueda
- Actualizar el agregador para incluir la nueva fuente
- Agregar配置 de las nuevas fuentes en sources.ts

### Out of Scope
- Testing exhaustivo de las APIs (solo tests básicos)
- Monitoreo de rate limits avanzado
- Cache específico para cada nueva fuente

## Capabilities

### New Capabilities
- `aliexpress-search`: Búsqueda de productos en AliExpress mediante web scraping con Cheerio
- `walmart-search`: Búsqueda de productos en Walmart mediante su API pública

### Modified Capabilities
- `product-aggregation`: Expandir para incluir AliExpress y Walmart

## Approach

1. **AliExpress**: Implementar scraper con Cheerio que haga request a la búsqueda de AliExpress y parseé los resultados HTML. No requiere API key.
2. **Walmart**: Utilizar la API pública de Walmart (o fallback a scraper si la API requiere autenticación compleja).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/api/aliexpress.ts` | Modified | Reemplazar mock con implementación Cheerio |
| `src/lib/api/walmart.ts` | New | Nueva API para Walmart |
| `src/lib/aggregator.ts` | Modified | Agregar Walmart y actualizar AliExpress |
| `src/constants/sources.ts` | Modified | Agregar WALMART al enum y fuentes |
| `package.json` | Modified | Agregar dependencia cheerio si no existe |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| AliExpress detecta scraping y bloquea | Medium | User-Agent rotativo, delays entre requests |
| Walmart API requiere auth compleja | Medium | Scraper fallback si API no es accesible |
| Cambios en HTML de AliExpress rompen scraper | High | Monitorizar y actualizar selector |

## Rollback Plan

1. Revertir cambios en `aliexpress.ts` y `aggregator.ts`
2. Eliminar `walmart.ts`
3. Eliminar WALMART de `sources.ts`
4. Rollback package.json si se agregó cheerio

## Dependencies

- Cheerio (para scraping) - verificar si ya está en dependencies

## Success Criteria

- [ ] Búsqueda en AliExpress retorna productos reales
- [ ] Búsqueda en Walmart retorna productos reales
- [ ] El agregador combina resultados de todas las fuentes
- [ ] Build pasa sin errores TypeScript
- [ ] Tests unitarios existentes siguen pasando