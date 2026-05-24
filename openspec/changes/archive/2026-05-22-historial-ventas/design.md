# Design: Historial de Ventas

## Technical Approach

Add read-only query capability to the existing `VentaService` + `VentasController`. All queries use manual LINQ joins (no nav properties added to domain). Frontend: new `/historial` page under `<Layout>` outlet with filter bar, paginated table, and inline-expandable detail. Offset pagination (per spec — supersedes proposal's cursor approach).

## Architecture Decisions

### Decision: Pagination Model

| Option | Tradeoff | Decision |
|--------|----------|----------|
| **Cursor** (proposal) | No drift on append-only data, but frontend unfamiliar | **Rejected** — spec defines page/pageSize/totalCount clearly |
| **Offset** (spec) | Familiar, 1-based pages, `Math.Ceiling(totalCount / pageSize)` | **Chosen** — matches spec contracts |

### Decision: Detail Loading Strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Eager-load all items in list query | Single round-trip, but list response heavier | **Rejected** — spec says lazy on expand |
| **Lazy per expand** | N+1 per expanded row, but list stays light | **Chosen** — sales are small (1-10 items), 1 extra call per expand is fine |

### Decision: Query Joins

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Add nav properties to Domain entities | Cleaner LINQ, but violates domain purity, need shadow FK access | **Rejected** — keeps domain untouched |
| **Manual LINQ joins** | Uglier code, no domain change | **Chosen** — follows spec requirement |

### Decision: Default Date Logic

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Defaults in controller | Simple, explicit in the HTTP layer | **Chosen** — controller sets defaults before calling service |
| Defaults in service | Service becomes HTTP-aware or needs nullable params | **Rejected** — service stays pure |

## Data Flow

```
[Browser] ──GET /api/ventas?fechaDesde=&fechaHasta=&sucursalId=&page=&pageSize──→
  VentasController.ObtenerHistorial()
    → VentaService.ObtenerHistorial(filtro)
      → PosDbContext (manual joins: VENTAS ⨝ SUCURSALES)
      → Count(), Skip(), Take(), OrderByDescending(FECHA)
    → PagedResult<VentaHistorialDto>
  ← JSON 200

[Browser] ──GET /api/ventas/{id}──→
  VentasController.ObtenerDetalle(id)
    → VentaService.ObtenerDetalle(id)
      → PosDbContext
        → VENTAS ⨝ SUCURSALES (single row)
        → RENGLONES_VENTA ⨝ PRODUCTOS (where FK = ventaId)
    → VentaDetalleDto or null
  ← JSON 200 | 404
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `PosWeb.Contracts/VentaHistorialDto.cs` | Create | Sale summary DTO |
| `PosWeb.Contracts/VentaDetalleDto.cs` | Create | Sale detail with items |
| `PosWeb.Contracts/RenglonHistorialDto.cs` | Create | Line item DTO |
| `PosWeb.Contracts/PagedResult.cs` | Create | Generic paginated result wrapper |
| `PosWeb.Contracts/VentaHistorialFiltro.cs` | Create | Filter/query params DTO |
| `PosWeb/Application/Ventas/VentaService.cs` | Modify | Add `ObtenerHistorial()` + `ObtenerDetalle()` |
| `PosWeb/Controllers/VentasController.cs` | Modify | Add `GET /api/ventas` + `GET /api/ventas/{id}` |
| `frontend/src/types/index.ts` | Modify | Add `VentaHistorialDto`, `VentaDetalleDto`, `RenglonHistorialDto`, `PagedResult<T>`, `VentaHistorialParams` |
| `frontend/src/api/client.ts` | Modify | Add `api.ventas.historial()`, `api.ventas.detalle()` |
| `frontend/src/pages/HistorialVentasPage.tsx` | Create | Full feature page |
| `frontend/src/components/Layout.tsx` | Modify | Add nav link between Ventas and Productos |
| `frontend/src/App.tsx` | Modify | Add `<Route path="/historial">` |

## Interfaces / Contracts

### DTOs — PosWeb.Contracts

```csharp
public class VentaHistorialDto {
    public int VentaId { get; set; }
    public DateTime Fecha { get; set; }
    public string SucursalNombre { get; set; } = null!;
    public decimal Total { get; set; }
    public int CantidadItems { get; set; }
}

public class VentaDetalleDto {
    public int VentaId { get; set; }
    public DateTime Fecha { get; set; }
    public int SucursalId { get; set; }
    public string SucursalNombre { get; set; } = null!;
    public decimal Total { get; set; }
    public List<RenglonHistorialDto> Items { get; set; } = new();
}

public class RenglonHistorialDto {
    public int ProductoId { get; set; }
    public string ProductoNombre { get; set; } = null!;
    public string CodigoBarra { get; set; } = null!;
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}

public class PagedResult<T> {
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
}

public class VentaHistorialFiltro {
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
    public int? SucursalId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
```

### Service — VentaService additions

```csharp
// Query — manual joins, sync (existing pattern)
public PagedResult<VentaHistorialDto> ObtenerHistorial(VentaHistorialFiltro filtro)
public VentaDetalleDto? ObtenerDetalle(int ventaId)
```

**Query approach** — both methods use manual `join` LINQ across `Ventas`, `Sucursales`, `RenglonesVenta`, and `Productos`. No `Include()` or navigation properties. The RenglonVenta → Venta FK (`ID_VENTA`) is a shadow property; use the configured `v.RENGLONES` navigation for the count, and manual join for RenglonVenta → Producto.

`ObtenerHistorial` builds an `IQueryable` with joins, applies optional `sucursalId` filter, then `.Count()` for total, `.Skip()/.Take()` for page, `.OrderByDescending(v => v.FECHA)`. Each projected row counts renglones via subquery on `v.RENGLONES.Count`.

`ObtenerDetalle` queries the single Venta + Sucursal first, then queries RenglonesVenta ⨝ Productos filtered by ventaId, and maps to the DTO.

### Controller — VentasController additions

```csharp
[HttpGet]
public ActionResult<PagedResult<VentaHistorialDto>> ObtenerHistorial(
    [FromQuery] DateTime? fechaDesde,
    [FromQuery] DateTime? fechaHasta,
    [FromQuery] int? sucursalId,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20)
{
    if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde > fechaHasta)
        return BadRequest(new { error = "fechaDesde no puede ser posterior a fechaHasta" });

    // Defaults: last 30 days
    fechaDesde ??= DateTime.Today.AddDays(-30);
    fechaHasta ??= DateTime.Today.AddDays(1); // inclusive end-of-day

    var filtro = new VentaHistorialFiltro { FechaDesde = fechaDesde, ... };
    return Ok(_ventaService.ObtenerHistorial(filtro));
}

[HttpGet("{id}")]
public ActionResult<VentaDetalleDto> ObtenerDetalle(int id)
{
    var result = _ventaService.ObtenerDetalle(id);
    if (result == null) return NotFound(new { error = "Venta no encontrada" });
    return Ok(result);
}
```

### Types — frontend

```typescript
interface VentaHistorialDto {
  ventaId: number
  fecha: string
  sucursalNombre: string
  total: number
  cantidadItems: number
}

interface VentaDetalleDto {
  ventaId: number
  fecha: string
  sucursalId: number
  sucursalNombre: string
  total: number
  items: RenglonHistorialDto[]
}

interface RenglonHistorialDto {
  productoId: number
  productoNombre: string
  codigoBarra: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

interface VentaHistorialParams {
  fechaDesde?: string
  fechaHasta?: string
  sucursalId?: number
  page?: number
  pageSize?: number
}
```

### API client — frontend extension

```typescript
ventas: {
  crear: /* existing */,
  historial: (params: VentaHistorialParams) =>
    request<PagedResult<VentaHistorialDto>>(
      `/ventas?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== '')
            .map(([k, v]) => [k, String(v)])
        )
      ).toString()}`
    ),

  detalle: (id: number) =>
    request<VentaDetalleDto>(`/ventas/${id}`),
},
```

## Frontend Component Tree

```
<Layout>
  └─ <HistorialVentasPage>
       ├─ <FilterBar>
       │    ├─ <input type="date"> (fechaDesde)
       │    ├─ <input type="date"> (fechaHasta)
       │    ├─ <select> (sucursal — populated from api.sucursales.listar, "Todas" default)
       │    └─ <button> Buscar
       │
       ├─ <LoadingSpinner />        — while fetching list
       ├─ <ErrorBanner />           — on fetch error, with retry
       ├─ <EmptyState />            — no results
       │
       ├─ <table>                   — Venta rows
       │    └─ <tr>                 — expandable
       │         └─ <ExpandedDetail> — lazy-loaded via api.ventas.detalle(id)
       │              └─ nested <table> (codigoBarra | producto | cantidad | precio | subtotal)
       │
       └─ <Pagination>
            ├─ [← Anterior]         — disabled on page 1
            ├─ Página X de Y
            └─ [Siguiente →]        — disabled when page >= totalPages
```

### State Management (single component)

```typescript
// All state in HistorialVentasPage with useState:
const [filters, setFilters] = useState({ fechaDesde, fechaHasta, sucursalId: undefined })
const [page, setPage] = useState(1)
const [data, setData] = useState<PagedResult<VentaHistorialDto> | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [expandedId, setExpandedId] = useState<number | null>(null)
const [detailCache, setDetailCache] = useState<Map<number, VentaDetalleDto>>(new Map())
```

### Pagination Flow

1. User enters filters → clicks Buscar → `page` resets to 1 → fetch list
2. API returns `{ items, totalCount, page, pageSize }` → compute `totalPages = Math.ceil(totalCount / pageSize)`
3. Anterior/Siguiente buttons call `setPage(p +- 1)` → `useEffect` re-fetches with new page
4. If page is beyond valid range, API returns `items: []` with correct totalCount — UI shows empty table row + correct pagination info
5. On filter change → page resets to 1 automatically

### Error Handling

| Layer | Scenario | Response |
|-------|----------|----------|
| **Controller** | `fechaDesde > fechaHasta` | 400 `{ error: "fechaDesde no puede ser posterior a fechaHasta" }` |
| **Controller** | `sucursalId` doesn't exist | 400 `{ error: "Sucursal no encontrada" }` |
| **Controller** | Venta not found (`{id}`) | 404 `{ error: "Venta no encontrada" }` |
| **Middleware** | `DomainException` (any validation) | 400 `{ error: ex.Message }` |
| **Middleware** | `ServiceException` (conflict) | 409 `{ error: ex.Message }` |
| **Middleware** | Unhandled exception | 500 `{ error: "Error interno del servidor" }` |
| **Frontend** | API 400 (server validation) | Red banner with server's `error` message |
| **Frontend** | Network / 500 | Red banner "Error de conexión" + [Reintentar] button |
| **Frontend** | Client-side: fechaDesde > fechaHasta | Disable Buscar button, inline validation text |

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Filter logic, date defaults, pagination math | Service tests with in-memory SQLite or mocked DbContext |
| Integration | Controller endpoints return correct status + body | Integration tests against test DB |
| E2E | Full filter + expand + pagination flow | Playwright or manual |
| Frontend | Loading/empty/error states, expand/collapse | Component tests or storybook |

- **If existing test infra** (e.g., xUnit project): add unit tests for `VentaService.ObtenerHistorial` with controlled filter inputs.
- **If no test infra**: defer to manual testing via Swagger + browser.

## Migration / Rollout

No migration required — reads existing `VENTAS`, `RENGLONES_VENTA`, `SUCURSALES`, `PRODUCTOS` tables only. Purely additive, no schema changes.

## Open Questions

- [ ] `RenglonVenta` shadow FK `ID_VENTA` — confirm `v.RENGLONES.Count` translates correctly in EF Core, or fall back to manual join via raw SQL / `EF.Property`. Implementation will verify this.
