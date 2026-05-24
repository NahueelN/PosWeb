# Design: Separate Catalog from Stock — Slice 1

## Technical Approach

Slice 1 keeps persistence compatible but splits read/write intent. Product create/edit becomes catalog-only through dedicated write DTOs, while branch stock gets its own read model for stock and sales flows. `PRODUCTOS.STOCK` stays mapped in EF/Core for now, but UI and operational queries stop treating it as truth.

## Quick path

1. Add catalog-only product request contracts and stop `ProductoService` from mutating `Producto.STOCK` on create/edit.
2. Redesign `StockSucursalService` queries to start from active `Productos` and left-join `StockSucursales` for one branch.
3. Route product creation to `/stock` with product context so stock initialization is an explicit next step.
4. Make sales suggestions branch-aware via a stock-scoped lookup endpoint; never show `ProductoDto.stock` in sales UX.

## Architecture Decisions

| Topic | Decision |
|-------|----------|
| Product write contract | Add `ProductoUpsertDto` for `POST/PUT /api/productos`; keep `ProductoDto` temporarily for read compatibility only. |
| Stock list truth | `GET /api/stock?sucursalId=` projects from active catalog + optional branch row, returning `stock=0` plus `inicializado=false` when missing. |
| Sales lookup | Add branch-aware lookup under stock/application boundary instead of extending catalog search with operational meaning. |
| Compatibility | Keep `Producto.STOCK` column/domain property physically untouched; stop writing it from product maintenance and stop rendering it in product/sales UI. |

**Rationale**: This minimizes blast radius. The dangerous shared DTO is split only where behavior changes, and operational stock moves behind branch-scoped queries without forcing a schema migration in the first PR slice.

## Data Flow

```text
ProductosPage submit
  -> POST /api/productos (catalog-only)
  -> ProductoService.Crear(dto)
  -> new Producto(..., stock: existing value preserved as compat default)
  -> success banner + CTA/link to /stock?productoId={id}

StockPage load (selected branch)
  -> GET /api/stock?sucursalId=A
  -> Productos LEFT JOIN StockSucursales(A)
  -> [{ productoId, nombre, codigoBarra, stock, inicializado }]

VentasPage typeahead
  -> GET /api/stock/buscar?sucursalId=A&q=term
  -> same branch-scoped projection
  -> suggestions show only branch stock or “sin inicializar”
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `PosWeb.Contracts/ProductoDto.cs` | Modify | Keep read shape; mark `Stock` compatibility-only if retained. |
| `PosWeb.Contracts/ProductoUpsertDto.cs` | Create | Catalog-only create/update request contract. |
| `PosWeb.Contracts/StockSucursalDto.cs` | Modify | Add `Inicializado` boolean for missing-row visibility. |
| `PosWeb.Contracts/ProductoSucursalLookupDto.cs` | Create | Branch-aware sales/search projection. |
| `PosWeb/Application/Productos/ProductoService.cs` | Modify | Use catalog-only writes; remove `CambiarStock()` from edit path. |
| `PosWeb/Application/StockSucursal/StockSucursalService.cs` | Modify | Left-join active products with branch stock; add branch-aware search. |
| `PosWeb/Controllers/ProductosController.cs` | Modify | `POST/PUT` accept `ProductoUpsertDto`. |
| `PosWeb/Controllers/StockController.cs` | Modify | Expose full-catalog list and branch-aware search endpoint. |
| `frontend/src/types/index.ts` | Modify | Add new request/read-model types and `inicializado`. |
| `frontend/src/api/client.ts` | Modify | Split product write payload type usage; add `api.stock.buscarProductos()`. |
| `frontend/src/pages/ProductosPage.tsx` | Modify | Remove stock input/badges; add post-create CTA to stock initialization. |
| `frontend/src/pages/StockPage.tsx` | Modify | Show uninitialized rows, support targeted product highlight/filter, inline initialize. |
| `frontend/src/pages/VentasPage.tsx` | Modify | Use branch-aware lookup; remove global-stock badge. |
| `PosWeb.Application.Test/*.cs` | Modify | Cover catalog-only writes, full-catalog stock listing, missing-row initialization, branch-aware lookup. |

## Interfaces / Contracts

```csharp
public class ProductoUpsertDto {
    public string CodigoBarra { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public decimal Costo { get; set; }
}

public class StockSucursalDto {
    public int ProductoId { get; set; }
    public string ProductoNombre { get; set; } = string.Empty;
    public string CodigoBarra { get; set; } = string.Empty;
    public int SucursalId { get; set; }
    public int Stock { get; set; }
    public bool Inicializado { get; set; }
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|--------------|----------|
| Unit/Application | Product edit no longer resets stock; create/edit accept no stock | Extend `ProductoServiceTest` with in-memory DB assertions. |
| Integration/Application | Stock list returns active products without rows as zero/uninitialized; adjust creates row | Extend stock service/controller tests around left-join projection and `PUT /ajustar`. |
| Integration/UI contract | Sales search never returns global stock display data | Add service/controller tests for branch-aware lookup; frontend type-check/build for page wiring. |

## Migration / Rollout

No schema migration in slice 1. `PRODUCTOS.STOCK` remains mapped for backward compatibility and rollback, but new code treats it as legacy-only. Risk is products becoming unsellable until branch stock is initialized; mitigation is the explicit post-create CTA plus visible uninitialized rows in `/stock`.

## Suggested Implementation Boundaries

- PR 1: contracts + `ProductoService`/`ProductosController` write split + product page CTA.
- PR 2: stock query/read-model changes + stock page uninitialized flow.
- PR 3: sales branch-aware lookup + sales UI badge cleanup.

## Open Questions

- [ ] None blocking for slice 1.
