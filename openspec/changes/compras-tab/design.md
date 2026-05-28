# Design: Compras Tab

## Technical Approach

Single `CompraController` (`POST /api/compras/crear`) backed by `CompraService` that orchestrates in one EF transaction: validate caja → create/resolve productos → upsert stock → create Gasto → commit. Frontend mirrors `VentasPage` layout. `CierrePreviewDto` gains computed `TotalGastos` from the new `Gasto` table.

## Architecture Decisions

### Gasto: New Entity vs Caja Field

| Option | Tradeoff | Decision |
|--------|----------|----------|
| New `Gasto` entity | Tracks individual compras; queryable; cierre preview sums them; existing `Caja.MONTO_GASTOS` keeps its role as close-time snapshot | ✅ **Chosen** — granularity matters for auditability |
| Store on `Caja` | No new table; loses traceability per purchase | ❌ Rejected — blocks future purchase history/returns |

### Single Endpoint with `nuevosProductos` vs. Separate Product Creation

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inline `nuevosProductos[]` | Atomic single transaction; client creates products on the fly | ✅ **Chosen** — matches spec, matches UX (scan unknown barcode → quick create) |
| Separate REST calls | More canonical; not atomic | ❌ Rejected — two-phase flow breaks transaction safety |

### Stock Upsert Strategy

`AumentarStock()` requires an existing `StockSucursal` row. For uninitialized product/sucursal pairs: find-or-create the row first, then `AumentarStock`. Same pattern as `StockSucursalService.AjustarStock` already uses.

### Cierre Integration

`TotalGastos` is **computed** at query time (`SUM(Gasto.MONTO) WHERE ID_CAJA = active`). The existing `Caja.MONTO_GASTOS` / `CerrarCajaRequest.Gastos` remains the close-time snapshot. The preview shows the computed sum; the close flow still accepts manual override (frontend can default to the computed value in a future iteration).

## Data Flow

```
POST /api/compras/crear
  │
  ├─ Validate items & nuevosProductos
  ├─ Find active Caja (throws 400 if none)
  ├─ Create/resolve Productos from nuevosProductos
  ├─ For each item:
  │   ├─ Find or create StockSucursal row
  │   └─ stockSucursal.AumentarStock(cantidad)
  ├─ Compute totalGasto = Σ(item.cantidad × item.costoUnitario)
  ├─ Create Gasto(ID_CAJA, MONTO, DETALLE="Compra")
  ├─ _context.SaveChangesAsync() ← atomic commit
  └─ Return CompraResponse
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `PosWeb.Domain/Gasto.cs` | **Create** | New entity: ID_GASTO, ID_CAJA, MONTO, FECHA, DETALLE |
| `PosWeb.Contracts/CompraRequestDto.cs` | **Create** | CompraRequestDto, CompraItemDto, NuevoProductoDto |
| `PosWeb.Contracts/CompraResponseDto.cs` | **Create** | CompraResponseDto, CompraItemResultDto |
| `PosWeb/Application/Compras/CompraService.cs` | **Create** | Orchestrates compra in one transaction |
| `PosWeb/Controllers/CompraController.cs` | **Create** | `POST /api/compras/crear` |
| `PosWeb/Data/PosDbContext.cs` | **Modify** | Add `DbSet<Gasto>`, inline Gasto config in `OnModelCreating` |
| `PosWeb.Contracts/CierrePreviewDto.cs` | **Modify** | Add `decimal TotalGastos { get; set; }` |
| `PosWeb/Application/Cajas/CajaService.cs` | **Modify** | `ObtenerPreviewCierre`: query `Gasto.MONTO` sum (materialize, then `.Sum()` — SQLite can't SUM decimal server-side) |
| Migration `YYYYMMDDHHMMSS_AddGasto.cs` | **Create** | New `GASTOS` table creation |
| `frontend/src/pages/CompraPage.tsx` | **Create** | Purchase screen: product search grid, cart panel, costo inputs, confirm |
| `frontend/src/types/index.ts` | **Modify** | Add `CompraItemDto`, `CompraRequestDto`, `CompraResponseDto`, `NuevoProductoDto` |
| `frontend/src/api/client.ts` | **Modify** | Add `api.compras.crear(dto)` |
| `frontend/src/App.tsx` | **Modify** | Add `<Route path="/compras" element={<CompraPage />} />` |
| `frontend/src/components/Layout.tsx` | **Modify** | Add `/compras` nav link and `['F6', () => navigate('/compras')]` |

## API Contracts

```csharp
// CompraRequestDto
public class CompraRequestDto {
    public int SucursalId { get; set; }
    public List<CompraItemDto> Items { get; set; } = new();
    public List<NuevoProductoDto>? NuevosProductos { get; set; }
}
public class CompraItemDto {
    public int ProductoId { get; set; }
    public int Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
}
public class NuevoProductoDto {
    public string CodigoBarra { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public decimal Precio { get; set; }
    public decimal Costo { get; set; }
    public string? Tamano { get; set; }
}

// CompraResponseDto
public class CompraResponseDto {
    public int GastoId { get; set; }
    public decimal TotalGasto { get; set; }
    public DateTime Fecha { get; set; }
    public List<CompraItemResultDto> Items { get; set; } = new();
}
public class CompraItemResultDto {
    public int ProductoId { get; set; }
    public string ProductoNombre { get; set; } = null!;
    public int Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
    public decimal Subtotal { get; set; }
}

// Updated CierrePreviewDto (add one field)
public class CierrePreviewDto {
    public int CajaId { get; set; }
    public decimal MontoInicial { get; set; }
    public decimal TotalVentas { get; set; }
    public decimal TotalGastos { get; set; }  // ← NEW
    public List<PagoPorMedioDto> DesglosePagos { get; set; } = new();
}
```

## Gasto Entity

```csharp
public class Gasto {
    public int ID_GASTO { get; private set; }
    public int ID_CAJA { get; private set; }
    public decimal MONTO { get; private set; }
    public DateTime FECHA { get; private set; }
    public string DETALLE { get; private set; } = null!;
    // EF constructor
    protected Gasto() { }
    public Gasto(int idCaja, decimal monto, string detalle) { ... }
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (Domain) | `Gasto` entity construction validation | xUnit, direct instantiation |
| Integration (Application) | `CompraService` happy path: creates Gasto + increases stock | xUnit + EF Core InMemory (follows `VentaServiceTest` pattern) |
| Integration | No active caja → throws `CompraSinCajaActivaException` | Same InMemory setup |
| Integration | Empty items → validation error | Same |
| Integration | `nuevosProductos` creates products atomically | Same |
| Integration | Duplicate barcode in `nuevosProductos` → conflict | Same |
| Integration | Stock upsert for uninitialized product/sucursal | Same |
| Frontend | None (no test framework per config) | Manual + `npm run lint && npx tsc -b` |

## Migration

New table in a single EF Core migration:

```sql
CREATE TABLE "GASTOS" (
    "ID_GASTO" INTEGER NOT NULL CONSTRAINT "PK_GASTOS" PRIMARY KEY AUTOINCREMENT,
    "ID_CAJA" INTEGER NOT NULL,
    "MONTO" decimal(18,2) NOT NULL,
    "FECHA" TEXT NOT NULL,
    "DETALLE" TEXT NOT NULL,
    CONSTRAINT "FK_GASTOS_CAJAS_ID_CAJA" FOREIGN KEY ("ID_CAJA")
        REFERENCES "CAJAS" ("ID_CAJA") ON DELETE CASCADE
);
CREATE INDEX "IX_GASTOS_ID_CAJA" ON "GASTOS" ("ID_CAJA");
```

## Open Questions

None.
