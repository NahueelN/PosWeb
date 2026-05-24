# Design: Stock por Sucursal

## Technical Approach

Service-layer solution (proposal Option B): StockSucursal is a domain entity with behavior (DescontarStock, AumentarStock, AjustarStock), but the dual deduction orchestration lives in VentaService — not in Venta.AgregarRenglon. This keeps zero domain coupling between Venta and StockSucursal, and the blast radius of the change is contained to the service layer.

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────────┐
│  StockController     │────→│  StockSucursalService  │────→ DbContext → SQLite
│  GET /api/stock      │     │  (Application)          │
│  PUT /api/stock/     │     └──────────────────────┘
│    ajustar           │
└─────────────────────┘
                              ┌──────────────────────┐
┌─────────────────────┐     │  VentaService          │
│  VentasController    │────→│  (modified)            │────→ DbContext → SQLite
│  POST /api/ventas    │     │  - Stock check before  │
└─────────────────────┘     │  - Dual deduction      │
                              └──────────────────────┘

Frontend: StockPage.tsx → api.client.ts → StockController
```

## Architecture Decisions

### Decision: Domain Entity with Behavior vs Data-Only

| Option | Tradeoff | Decision |
|--------|----------|----------|
| A — Data-only (no domain methods) | Thinner domain, validation lives in service | ❌ Rejected — misses domain invariants |
| B — Entity with DescontarStock/AumentarStock/AjustarStock | Same pattern as Producto, domain exceptions propagate cleanly | ✅ **Chosen** |

**Rationale**: Follows existing Producto pattern exactly. Validation (insufficient stock, negative amounts) lives in the entity where it belongs, thrown as DomainException (→ 400) not ServiceException (→ 409).

### Decision: Dual Deduction Location

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Venta.AgregarRenglon takes StockSucursal param | Pure DDD but couples Venta→StockSucursal | ❌ Disruptive |
| VentaService loads + checks + deducts both | Same correctness, zero domain coupling | ✅ **Chosen** |

**Rationale**: Matches proposal Option B. VentaService already owns the transaction — loading StockSucursal and Producto before the sale is a single `SaveChanges` unit.

## Entity Design — StockSucursal

**File**: `PosWeb.Domain/StockSucursal.cs`

```csharp
namespace PosWeb.Domain;

public class StockSucursal
{
    public int ID_STOCK_SUCURSAL { get; private set; }  // PK auto
    public int ID_PRODUCTO { get; private set; }        // FK → Producto
    public int ID_SUCURSAL { get; private set; }        // FK → Sucursal
    public int STOCK { get; private set; }

    // Navigation
    public Producto Producto { get; private set; }
    public Sucursal Sucursal { get; private set; }

    private StockSucursal() { } // EF

    public StockSucursal(int idProducto, int idSucursal, int stockInicial) { ... }
    public void DescontarStock(int cantidad) { ... }  // throws if STOCK < cantidad
    public void AumentarStock(int cantidad) { ... }
    public void AjustarStock(int nuevoStock) { ... }  // inventory adjustment
}
```

DescontarStock/AumentarStock follow Producto exact signature: throw `CantidadInvalidaException` (domain) for ≤ 0, throw `StockInsuficienteException` (domain, extended with idSucursal) for insufficient stock.

## Database Config

**File**: `PosWeb/Data/PosDbContext.cs` — add Fluent API block:

| Config | Value |
|--------|-------|
| Table | `STOCK_POR_SUCURSAL` |
| PK | `ID_STOCK_SUCURSAL` (auto-increment) |
| Index | Unique composite `IX_STOCK_PRODUCTO_SUCURSAL` on (`ID_PRODUCTO`, `ID_SUCURSAL`) |
| FK → Producto | `HasOne(p => p.Producto).WithMany().HasForeignKey(s => s.ID_PRODUCTO)` |
| FK → Sucursal | `HasOne(s => s.Sucursal).WithMany().HasForeignKey(s => s.ID_SUCURSAL)` |
| Column names | SCREAMING_SNAKE_CASE matching entity properties |

## Service Layer

**File**: `PosWeb/Application/StockSucursalService.cs`

```csharp
public class StockSucursalService
{
    private readonly PosDbContext _context;

    public List<StockSucursalDto> ListarPorSucursal(int sucursalId) { ... }
    public StockSucursalDto? Obtener(int productoId, int sucursalId) { ... }
    public void AjustarStock(int productoId, int sucursalId, int nuevoStock) { ... }
    public List<StockSucursalDto> ListarBajoStock(int sucursalId, int limite) { ... }
}
```

- `AjustarStock` calls `entity.AjustarStock(nuevoStock)` then `SaveChanges`
- `ListarBajoStock`: `.Where(s => s.ID_SUCURSAL == sucursalId && s.STOCK <= limite)`
- All queries `.Include(s => s.Producto)` to populate `ProductoNombre` and `CodigoBarra` in DTO

## Dual Deduction Flow (VentaService.CrearVenta)

```
foreach item in dto.Items:
    producto = _context.Productos.Find(item.ProductoId)   // already exists
    stockSuc = _context.StockSucursales
        .FirstOrDefault(s => s.ID_PRODUCTO == item.ProductoId
                           && s.ID_SUCURSAL == dto.SucursalId)
    
    if stockSuc == null 
        → throw StockSucursalNoExisteException (ServiceException, 409)
    if stockSuc.STOCK < item.Cantidad
        → new StockInsuficienteException with sucursal info (DomainException → 400)

    // Deduct both (inside loop, before SaveChanges)
    stockSuc.DescontarStock(item.Cantidad)
    producto.DescontarStock(item.Cantidad)   // already called in venta.AgregarRenglon
    
    venta.AgregarRenglon(producto, item.Cantidad)  // deducts global stock again

_context.Ventas.Add(venta)
_context.SaveChanges()    // single transaction
```

**Important**: The existing `venta.AgregarRenglon` already calls `producto.DescontarStock(cantidad)`. That call stays — the global stock deduction happens once there, not duplicated. The service layer adds the per-sucursal check and deduction *before* calling `AgregarRenglon`.

So the corrected flow:

```
foreach item:
    producto = find
    stockSuc = find by (productoId, sucursalId)
    validate stockSuc.STOCK >= item.Cantidad
    
    stockSuc.DescontarStock(item.Cantidad)    // NEW — per-sucursal
    venta.AgregarRenglon(producto, item.Cantidad)  // already deducts global stock
```

## Controller API

**File**: `PosWeb/Controllers/StockController.cs`

| Method | Route | Action | Request | Response |
|--------|-------|--------|---------|----------|
| GET | `/api/stock?sucursalId=` | `Listar` | query | `List<StockSucursalDto>` |
| GET | `/api/stock/bajo?sucursalId=&limite=5` | `BajoStock` | query | `List<StockSucursalDto>` |
| PUT | `/api/stock/ajustar` | `AjustarStock` | body: `{ productoId, sucursalId, stock }` | 204 NoContent |

Route: `[Route("api/stock")]` — separate controller to avoid scope creep.

## DTO

**File**: `PosWeb.Contracts/StockSucursalDto.cs`

```csharp
public class StockSucursalDto
{
    [JsonPropertyName("productoId")]
    public int ProductoId { get; set; }
    
    [JsonPropertyName("productoNombre")]
    public string ProductoNombre { get; set; } = string.Empty;
    
    [JsonPropertyName("codigoBarra")]
    public string CodigoBarra { get; set; } = string.Empty;
    
    [JsonPropertyName("sucursalId")]
    public int SucursalId { get; set; }
    
    [JsonPropertyName("stock")]
    public int Stock { get; set; }
}
```

Uses class + JsonPropertyName to match existing codebase convention (ProductoDto, SucursalDto), not the `record` proposal — consistency > novelty.

## Exceptions

| Exception | Location | Base | Code |
|-----------|----------|------|------|
| `StockSucursalNoExisteException` (no record for combo) | `PosWeb/Exceptions/` | ServiceException | 409 |
| `StockInsuficienteException` (exists but insufficient) | Already exists in Domain.Exceptions | DomainException | 400 — extend message to show sucursal |

## Frontend — StockPage

**File**: `frontend/src/pages/StockPage.tsx`

```
StockPage
├── Header: "Stock por Sucursal"
├── SucursalSelector (dropdown)
│   └── loads from api.sucursales.listar()
├── SearchBar (filtro local por nombre/código)
├── StockTable
│   ├── Columnas: Producto | Código | Stock | Acción
│   ├── Inline editing: click stock → input → save → api PUT /api/stock/ajustar
│   └── Low stock rows: bg-red-50 when stock <= limite (default 5)
└── Empty state: "Seleccioná una sucursal"
```

**State**: `useState` for sucursalId, stockList, editingCell, filter (no external lib, matches existing pages).

**API client** additions in `frontend/src/api/client.ts`:

```typescript
stock: {
  listar: (sucursalId: number) => request<StockSucursalDto[]>(`/stock?sucursalId=${sucursalId}`),
  bajoStock: (sucursalId: number, limite?: number) => request<StockSucursalDto[]>(`/stock/bajo?sucursalId=${sucursalId}&limite=${limite ?? 5}`),
  ajustar: (dto: AjustarStockDto) => request<void>('/stock/ajustar', { method: 'PUT', body: JSON.stringify(dto) }),
}
```

**Types** in `frontend/src/types/index.ts`:

```typescript
export interface StockSucursalDto {
  productoId: number
  productoNombre: string
  codigoBarra: string
  sucursalId: number
  stock: number
}

export interface AjustarStockDto {
  productoId: number
  sucursalId: number
  stock: number
}
```

**Routing** — add to `App.tsx` and `Layout.tsx`:

| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Add `<Route path="/stock" element={<StockPage />} />` |
| `frontend/src/components/Layout.tsx` | Add `{ to: '/stock', label: 'Stock', icon: '📊' }` to links array |

## DI Registration

```csharp
// PosWeb/Program.cs
builder.Services.AddScoped<StockSucursalService>();
```

Order: add next to `VentaService` registration.

## Migration Plan

1. Create `StockSucursal` entity + DTO + exceptions (no migration yet)
2. Add DbSet + Fluent API config to PosDbContext
3. `dotnet ef migrations Add StockPorSucursal`
4. Run migration → `STOCK_POR_SUCURSAL` table created (all stock = 0)
5. Implement service + controller
6. Modify VentaService with per-sucursal check/deduction
7. Build frontend page + API client + route
8. Manual test: create stock, sell, verify deduction per sucursal

All stock starts at 0 — UI enforces initial entry per proposal.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `PosWeb.Domain/StockSucursal.cs` | Create | Entity with behavior |
| `PosWeb.Domain/Exceptions/StockInsuficienteException.cs` | Modify | Extend with sucursal info |
| `PosWeb.Contracts/StockSucursalDto.cs` | Create | Response DTO |
| `PosWeb/Data/PosDbContext.cs` | Modify | DbSet + Fluent config |
| `PosWeb/Application/StockSucursalService.cs` | Create | Service layer |
| `PosWeb/Controllers/StockController.cs` | Create | REST controller |
| `PosWeb/Application/Ventas/VentaService.cs` | Modify | Per-sucursal check + deduction |
| `PosWeb/Program.cs` | Modify | DI registration |
| `frontend/src/types/index.ts` | Modify | New types |
| `frontend/src/api/client.ts` | Modify | Stock API methods |
| `frontend/src/pages/StockPage.tsx` | Create | Stock grid page |
| `frontend/src/App.tsx` | Modify | Route for /stock |
| `frontend/src/components/Layout.tsx` | Modify | Sidebar link |

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Domain | StockSucursal methods (Descontar, Aumentar, Ajustar) | Unit test — create entity, verify state changes and exception throws |
| Integration | StockSucursalService queries + AjustarStock | EF InMemory via PosWeb.Application.Test patterns |
| Integration | VentaService dual deduction | Create StockSucursal + Producto, run CrearVenta, verify both deducted |
| Frontend | StockPage renders, editing flow | `npx tsc -b` passes |

## Open Questions

- None — all decisions are scoped per proposal and verified against existing codebase conventions.
