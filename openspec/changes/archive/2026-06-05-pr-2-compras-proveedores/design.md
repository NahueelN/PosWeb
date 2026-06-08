# Design: PR 2 — Compras & Proveedores

## Technical Approach

Rewrite `CompraService.CrearCompra` as an atomic transaction that persists the full `Compra` + `RenglonCompra` entity graph, replaces free-text proveedor with `proveedorId`, tracks `userId`, and links the `Gasto` back to `Compra`. Add `ProveedorService` + `ProveedoresController`. Update frontend DTOs and add a proveedor searchable selector.

## Architecture Decisions

### Decision: Transaction strategy

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `IDbContextTransaction` via `Database.BeginTransaction()` | Simple, matches existing EF Core patterns | **Chosen** |
| Unit of Work abstraction | Overkill for a single bounded operation | Rejected |

### Decision: Provedor auto-code

`COD_PROVEEDOR` is required by the entity. Auto-generate from `NOMBRE`: take first 50 chars, uppercase, trim. Avoids requiring user to input a code on creation.

### Decision: Comprobante number

Generate as `YYYYMMDD + sequential int` using the max existing `NUMERO_COMPROBANTE` per day. Query `_context.Compras.Where(c => c.FECHA_COMPRA.Date == today).Max(n => n.NUMERO_COMPROBANTE)` + 1. Fallback to `YYYYMMDD * 1000 + 1`.

### Decision: Old method compatibility

Keep `CrearCompra(CompraRequestDto)` as an `[Obsolete]` wrapper that maps to the new signature with `userId: 0`. This avoids breaking callers while the frontend updates.

## Data Flow

```
Controller                           Service                           EF Core
    │                                   │                                │
    │  POST /api/compras/crear          │                                │
    │  (proveedorId, userId, items)     │                                │
    │──────────────────────────────────>│                                │
    │                                   │  BeginTransaction()            │
    │                                   │───────────────────────────────>│
    │                                   │  Validate: items, caja,       │
    │                                   │  productos, stock              │
    │                                   │                                │
    │                                   │  new Compra(...)               │
    │                                   │  _context.Compras.Add(compra)  │
    │                                   │                                │
    │                                   │  for each item:               │
    │                                   │    new RenglonCompra(...)      │
    │                                   │    compra.AgregarRenglon(r)    │
    │                                   │    stock.AumentarStock(cant)   │
    │                                   │                                │
    │                                   │  new Gasto(...)                │
    │                                   │  _context.Gastos.Add(gasto)    │
    │                                   │                                │
    │                                   │  compra.AsignarGasto(gastoId)  │
    │                                   │  SaveChanges()                 │
    │                                   │───────────────────────────────>│
    │                                   │  Commit()                      │
    │                                   │───────────────────────────────>│
    │  { compraId, gastoId, items }     │                                │
    │<──────────────────────────────────│                                │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `PosWeb.Contracts/CompraRequestDto.cs` | Modify | `Proveedor` → `ProveedorId: int`; add `UserId: int?` |
| `PosWeb.Contracts/CompraResponseDto.cs` | Modify | Add `CompraId: int`; remove `Proveedor` |
| `PosWeb.Contracts/ProveedorDto.cs` | Create | `Id`, `Codigo`, `Nombre`, `Telefono`, `Domicilio`, `Mail` |
| `PosWeb.Contracts/CrearProveedorRequestDto.cs` | Create | `Nombre`, `TipoDocumento`, `NroDocumento`, `Telefono`, `Domicilio`, `Mail` |
| `PosWeb.Application/Compras/CompraService.cs` | Modify | New atomic `CrearCompra(sucursalId, proveedorId, userId, items, fechaCompra?)`; old method → `[Obsolete]` wrapper |
| `PosWeb.Application/Proveedores/ProveedorService.cs` | Create | `Listar(search?)`, `Crear(dto)`, `ObtenerPorId(id)` — follows `ProductoService` pattern |
| `PosWeb/Controllers/CompraController.cs` | Modify | Extract `userId` via `GetUserId()`; pass `proveedorId` and `userId` to service |
| `PosWeb/Controllers/ProveedoresController.cs` | Create | `GET /api/proveedores?search=`, `POST /api/proveedores`, `GET /api/proveedores/{id}` |
| `PosWeb/Program.cs` | Modify | Add `builder.Services.AddScoped<ProveedorService>()` |
| `frontend/src/types/index.ts` | Modify | `CompraRequestDto.proveedor` → `proveedorId: number`; `CompraResponseDto` add `compraId`; add `ProveedorDto` |
| `frontend/src/api/client.ts` | Modify | Add `api.proveedores.listar(search?)`, `.obtener(id)`, `.crear(dto)` |
| `frontend/src/pages/CompraPage.tsx` | Modify | Replace text input with searchable proveedor dropdown; update confirm flow to send `proveedorId`; display `compraId` in receipt |

## Interfaces / Contracts

### ProveedorDto (new)
```csharp
public class ProveedorDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Domicilio { get; set; }
    public string? Mail { get; set; }
}
```

### CrearProveedorRequestDto (new)
```csharp
public class CrearProveedorRequestDto
{
    public string Nombre { get; set; } = null!;
    public string? TipoDocumento { get; set; }
    public string? NroDocumento { get; set; }
    public string? Telefono { get; set; }
    public string? Domicilio { get; set; }
    public string? Mail { get; set; }
}
```

### CompraService new method
```csharp
public CompraResponseDto CrearCompra(int sucursalId, int proveedorId, int userId,
    List<CompraItemDto> items, DateTime? fechaCompra = null)
```

## Error Handling Strategy

- **Domain exceptions** bubble up from entity constructors (`ArgumentException`, `ProductoInvalidoException`, etc.) — no wrapping needed
- **Infrastructure failures** (DB deadlock, constraint violation) roll back the transaction automatically via `using` on the transaction scope
- **Business validation** (no items, no active caja, duplicate barcode) throws existing typed exceptions caught by the controller
- **Proveedor not found**: throw `ProveedorNoEncontradoException` (new, extends `ServiceException`)
- **CompraService** no longer catches exceptions — the transaction's `using` block ensures rollback on any throw

### ProveedorService methods
```csharp
// List with optional search (name or document contains)
public List<ProveedorDto> Listar(string? search = null)

// Create, auto-generates COD_PROVEEDOR from NOMBRE
public ProveedorDto Crear(CrearProveedorRequestDto dto)

// Get by ID, throws ProveedorNoEncontradoException if not found
public ProveedorDto ObtenerPorId(int id)
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | `CompraService.CrearCompra` atomicity | InMemory DB: verify Compra + Renglones + Gasto + stock all persisted after commit, none after rollback |
| Unit | `CompraService` validation | Empty items, no caja, missing proveedor, invalid userId |
| Unit | `ProveedorService.Crear` | Creates with auto-code, duplicate name allowed |
| Unit | `ProveedorService.Listar` | With/without search term |
| Integration | Proveedor API | `GET /api/proveedores`, `POST`, `GET /api/proveedores/{id}` via controller |
| Frontend | TypeScript | `npx tsc -b` passes with new types |
| Frontend | Lint | `npm run lint` passes |
