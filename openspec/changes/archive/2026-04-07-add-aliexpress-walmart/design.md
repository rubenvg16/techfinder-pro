# Design: Agregar fuentes AliExpress y Walmart

## Technical Approach

Implementar dos nuevas fuentes de búsqueda:
1. **AliExpress**: Scraping con Cheerio del HTML de búsqueda (sin API key)
2. **Walmart**: Intentar API pública, fallback a scraping si no está disponible

Ambas siguen el mismo patrón que las APIs existentes (google-shopping.ts, ebay.ts).

## Architecture Decisions

### Decision: Scraping en lugar de API para AliExpress

**Choice**: Cheerio para hacer web scraping
**Alternatives considered**: 
- API oficial de AliExpress (no disponible públicamente)
- Servicios de terceros como Apify (costo adicional)
**Rationale**: Solución gratuita y sin dependencias externas. Suficiente para proyecto no profesional.

### Decision: Fallback para Walmart

**Choice**: API primero, scraper como fallback
**Alternatives considered**: Solo API o solo scraper
**Rationale**: Mayor probabilidad de éxito - si la API requiere auth compleja, el scraper garantiza resultados.

### Decision: Manejo de errores consistente

**Choice**: Retornar array vacío en vez de lanzar errores
**Alternatives considered**: Propagar errores, retornar null
**Rationale**: Mantiene consistencia con las APIs existentes (ebay, google). El agregador ya maneja fuentes que fallan.

## Data Flow

```
User Search
    │
    ▼
┌─────────────────┐
│ aggregator.ts   │ ◄── Llama a las 3 fuentes en paralelo
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ▼         ▼          ▼          ▼
┌───────┐ ┌────────┐ ┌─────────┐ ┌─────────┐
│ eBay  │ │AliExpr │ │ Walmart │ │ Google  │
│  API  │ │Scraper │ │   API   │ │  Serper │
└───┬───┘ └───┬────┘ └────┬────┘ └───┬─────┘
    │         │           │           │
    └─────────┴───────────┴───────────┘
                    │
                    ▼
            deduplicateProducts()
                    │
                    ▼
            SearchResponse
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/api/aliexpress.ts` | Modify | Reemplazar mock con implementación Cheerio |
| `src/lib/api/walmart.ts` | Create | Nueva API con scraper + fallback |
| `src/lib/aggregator.ts` | Modify | Agregar Walmart al array de fuentes |
| `src/constants/sources.ts` | Modify | Agregar WALMART al enum SOURCE_IDS |
| `package.json` | Modify (opt) | Agregar cheerio si no existe |

## Interfaces / Contracts

```typescript
// En src/constants/sources.ts
export const SOURCE_IDS = {
  EBAY: 'ebay',
  ALIEXPRESS: 'aliexpress',
  GOOGLE: 'google',
  WALMART: 'walmart',  // ← Agregar
} as const;

// La función en aliexpress.ts retorna:
interface AliExpressResponse {
  products: Product[];
  pagination?: {
    page: number;
    totalPages: number;
    totalResults: number;
  };
  isDemo: boolean;
}

// Walmart similar a google/ebay:
export async function searchWalmartProducts(query: string): Promise<Product[]>
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Funciones de parsing, mapeo de productos | Tests con datos mockeados |
| Integration | Request real a las fuentes | Tests de integración con mocks de fetch |
| E2E | Flujo completo de búsqueda | Playwright |

## Migration / Rollout

No migration required. Cambios son backward-compatible - el agregador maneja fuentes que fallan gracefully.

## Open Questions

- [ ] Walmart API pública requiere API key o es completamente abierta? → Scraper fallback responde esto
- [ ] AliExpress puede bloquear requests sin User-Agent? → Agregar header si es necesario

### Next Step
Listo para tareas (sdd-tasks).