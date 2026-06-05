# Design: Schema Foundation (PR 1)

## Technical Approach

Map 21 tables to domain entities using the existing Producto/Cliente pattern (private setters, behavior methods, protected EF constructor). Fluent API in `OnModelCreating` with `HasColumnType("decimal(18,2)")` and unique `COD_` indexes. SQLite table-rebuild migration for all modified entities. PagoVenta in-place rename to Pago. New entities are CREATE TABLE only.

## Architecture Decisions

### Decision: StockSucursal naming convention

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Keep camelCase (`IdProducto`) | Inconsistent with every other entity | **Standardize to SCREAMING_SNAKE_CASE** (`ID_PRODUCTO`) |
| Adopt SCREAMING_SNAKE_CASE | Breaks all 109 existing references | Align with Producto, Cliente, etc. — migration handles it |

**Rationale**: The only entity using camelCase; every other domain class maps 1:1 properties to columns. Consistency wins.

### Decision: PagoVenta → Pago migration

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Compat shim (keep PagoVenta, add Pago) | Dead code lives on, confusion | **In-place rename** — rewrite `PagoVenta.cs` → `Pago.cs` |
| New file, delete old | Requires finding all references | Update 37 references across Domain, Data, Application, Contracts, Tests |

**Rationale**: PR 1 is the schema foundation — this is the right time to break things. No compat shim. Update all references in one pass.

### Decision: Full table rebuild vs ALTER TABLE ADD

| Change Type | Entities | Strategy |
|-------------|----------|----------|
| Add-only columns | None (all modified have renames/removals too) | N/A |
| Rename + remove + type change | Producto, Sucursal, Cliente, Venta, Gasto, MedioPago, Usuario, StockSucursal, RenglonVenta, Pago | **Full rebuild**: CREATE → INSERT ... SELECT → DROP → RENAME |
| New entities | Suscripcion, Empresa, Categoria, UnidadMedida, Proveedor, Compra, RenglonCompra, Deuda | **CREATE TABLE** only |
| Kept as-is | Caja | No migration code needed |

**Rationale**: SQLite cannot do ALTER COLUMN/DROP COLUMN/RENAME COLUMN. Every modified entity needs at least one unsupported operation, so all-in on rebuilds.

## Entity Implementation Plan

### Pattern (all entities follow this)

```csharp
public class Xxx
{
    [Key]
    public int ID_XXX { get; private set; }  // Primary key
    public string PROP { get; private set; } = null!;  // Required string
    public decimal MONTO { get; private set; }  // Monetary
    public bool ACTIVO { get; private set; }  // Soft delete

    // Public constructor — validates via behavior methods
    public Xxx(string prop, decimal monto) { ... ACTIVO = true; }

    // Protected EF Core constructor
    protected Xxx() { }

    // Behavior methods
    public void CambiarProp(string prop) { ... }
    public void Activar() { ACTIVO = true; }
    public void Desactivar() { ACTIVO = false; }
}
```

### New entities

| Class | Table | Constructor | Key behavior |
|-------|-------|-------------|--------------|
| `Suscripcion` | `SUSCRIPCIONES` | `(string codSuscripcion, string descSuscripcion, decimal precio, int diasVigencia)` | Guard: precio >= 0, diasVigencia > 0 |
| `Empresa` | `EMPRESAS` | `(string codEmpresa, string descEmpresa, int? idSuscripcion)` — sets `FECHA_ALTA = DateTime.UtcNow` | `Desactivar()` sets `FECHA_BAJA` |
| `Categoria` | `CATEGORIAS` | `(string codCategoria, string descCategoria, int? idCategoriaPadre)` | Self-referencing hierarchy |
| `UnidadMedida` | `UNIDADES_MEDIDA` | `(string codUnidadMedida, string descUnidadMedida)` | Short codes ("KG", "UN") |
| `Proveedor` | `PROVEEDORES` | `(string codProveedor, string descProveedor, string? nroDoc, string? tel, string? dom, string? mail)` | All optionals after desc |
| `Compra` | `COMPRAS` | `(int idProveedor, int idSucursal, int idUsuarioRegistra)` — sets `FECHA_COMPRA`, `TOTAL = 0` | `private readonly List<RenglonCompra>` + `AgregarRenglon()` |
| `RenglonCompra` | `RENGLONES_COMPRA` | `(int idCompra, int idProducto, decimal cantidad, decimal precioUnitario)` — computes SUBTOTAL | cantidad/precio > 0 |
| `Deuda` | `DEUDAS` | `(int idProveedor, decimal montoOriginal, DateTime? fechaVencimiento)` — sets `ESTADO = "Pendiente"` | `RegistrarPago(decimal monto)`, `Estado` string validation |

### Modified entities

| Entity | Changes to properties | Changes to behavior |
|--------|----------------------|---------------------|
| **Producto** | Remove `STOCK`, `CambiarStock()`, `DescontarStock()`, `AumentarStock()`. Add `COD_PRODUCTO`, `ID_CATEGORIA`, `DESC_ADICIONAL`, `CONTENIDO`, `ID_UNIDAD_MEDIDA`, `FECHA_ALTA`, `FECHA_ULTIMA_MOD`, `FECHA_BAJA`. Rename `NOMBRE` → `DESC_PRODUCTO`. Constructor: new params, calls `SetFechas()`. | `CambiarNombre()` → `CambiarDescripcion()`. Each behavior method calls `FECHA_ULTIMA_MOD = DateTime.UtcNow`. |
| **Sucursal** | Remove `NUMERO`. Rename `CODIGO` → `COD_SUCURSAL`, `NOMBRE` → `DESC_SUCURSAL`. Add `ID_EMPRESA`. | Constructor drops `numero` param, adds `idEmpresa`. |
| **StockSucursal** | Full rewrite: `Id` → `ID_PRODUCTO` + `ID_SUCURSAL` composite PK. `IdProducto` → `ID_PRODUCTO`, `IdSucursal` → `ID_SUCURSAL`. `Stock` int → decimal, property → `STOCK`. Nav props `Producto`, `Sucursal` kept. | `DescontarStock()`/`AumentarStock()` accept decimal. Same guards. |
| **Usuario** | Remove `EMPRESA_REPRESENTA`, `SetEmpresaRepresenta()`. Add `SUSCRIPCION_ACTIVA` (bool, default true). Constructor drops `empresaRepresenta`. | None beyond property removal. |
| **Cliente** | Remove `IVA_CONDICION`, `CambiarIvaCondicion()`. Add `COD_CLIENTE`, `MAIL`. Rename `NUMERO_DOCUMENTO` → `NRO_DOCUMENTO`. | Constructor adds `codCliente`, `mail`. `CambiarTipoDocumento()` drops IVA validation, uses `NRO_DOCUMENTO`. |
| **Venta** | Remove `ID_CAJA`, `AsignarCaja()`. Rename `FECHA` → `FECHA_VENTA`. | `AgregarRenglon()` `cantidad` int → decimal. |
| **RenglonVenta** | `CANTIDAD` int → decimal. Constructor param `cantidad` int → decimal. | `SetCantidad()` validates decimal > 0. |
| **MedioPago** | Rename `NOMBRE` → `DESC_MEDIO_PAGO`. Add `COD_MEDIO_PAGO`. | Constructor: `(string codMedioPago, string descMedioPago, bool pagaVuelto)`. Existing `(int id, string nombre, bool pagaVuelto)` updated. |
| **Gasto** | Rename `FECHA` → `FECHA_GASTO`. | Constructor sets `FECHA_GASTO = DateTime.Now`. |

### PagoVenta → Pago (rename+restructure)

**Action**: Create `PosWeb.Domain\Pago.cs` with new schema. Delete `PosWeb.Domain\PagoVenta.cs`.

```csharp
public class Pago
{
    [Key]
    public int ID_PAGO { get; private set; }  // Was ID_PAGO_VENTA
    public int ID_VENTA { get; private set; }
    public int ID_MEDIO_PAGO { get; private set; }
    public int ID_CAJA { get; private set; }  // NEW
    public decimal MONTO { get; private set; }
    public decimal CAMBIO { get; private set; }
    public int ID_USUARIO_REGISTRA { get; private set; }

    // CON_CAMBIO removed — current logic computed CAMBIO from CON_CAMBIO - MONTO
    // ID_CAJA is now required (moved from Venta)

    public Pago(int idVenta, int idMedioPago, int idCaja, decimal monto,
                int idUsuarioRegistra, decimal? conCambio = null)
    {
        // Same validation as PagoVenta, but:
        // - idCaja required (guard: idCaja <= 0)
        // - conCambio optional, computes CAMBIO = conCambio - monto (or 0)
        // - No CON_CAMBIO stored
    }

    protected Pago() { }
}
```

### Exceptions needed

| Exception | File | Cause |
|-----------|------|-------|
| `CodigoInvalidoException` | `PosWeb.Domain\Exceptions\CodigoInvalidoException.cs` | Invalid COD_ values (reused by multiple entities) |
| `MontoInvalidoException` | `PosWeb.Domain\Exceptions\MontoInvalidoException.cs` | Invalid monetary values |

New shared exceptions. Existing `CodigoBarraInvalidoException`, `CantidadInvalidaException`, etc. remain.

## DbContext Fluent API Design

### Complete OnModelCreating structure

```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    // --- Helper for decimal precision ---
    // Applies to ALL decimal properties: .HasColumnType("decimal(18,2)")

    ConfigureProducto(modelBuilder);
    ConfigureSucursal(modelBuilder);
    ConfigureStockSucursal(modelBuilder);
    ConfigureUsuario(modelBuilder);
    ConfigureCliente(modelBuilder);
    ConfigureVenta(modelBuilder);
    ConfigureRenglonVenta(modelBuilder);
    ConfigureMedioPago(modelBuilder);
    ConfigurePago(modelBuilder);
    ConfigureGasto(modelBuilder);
    ConfigureCaja(modelBuilder);           // Kept as-is
    ConfigureSuscripcion(modelBuilder);   // NEW
    ConfigureEmpresa(modelBuilder);       // NEW
    ConfigureCategoria(modelBuilder);     // NEW
    ConfigureUnidadMedida(modelBuilder);  // NEW
    ConfigureProveedor(modelBuilder);     // NEW
    ConfigureCompra(modelBuilder);        // NEW
    ConfigureRenglonCompra(modelBuilder); // NEW
    ConfigureDeuda(modelBuilder);         // NEW

    // Seed data
    SeedMedioPago(modelBuilder);
    SeedUnidadMedida(modelBuilder);
    SeedUsuario(modelBuilder);
}
```

### Key configurations per entity

| Entity | PK | Table | Unique Indexes | FK / Delete Behavior |
|--------|----|-------|----------------|----------------------|
| Suscripcion | `ID_SUSCRIPCION` | `SUSCRIPCIONES` | `COD_SUSCRIPCION` + `ACTIVO = 1` | None |
| Empresa | `ID_EMPRESA` | `EMPRESAS` | `COD_EMPRESA` + `ACTIVO = 1` | `ID_SUSCRIPCION` → Suscripciones (SetNull) |
| Categoria | `ID_CATEGORIA` | `CATEGORIAS` | `COD_CATEGORIA` + `ACTIVO = 1` | Self: `ID_CATEGORIA_PADRE` (Restrict) |
| UnidadMedida | `ID_UNIDAD_MEDIDA` | `UNIDADES_MEDIDA` | `COD_UNIDAD_MEDIDA` + `ACTIVO = 1` | None |
| Proveedor | `ID_PROVEEDOR` | `PROVEEDORES` | `COD_PROVEEDOR` + `ACTIVO = 1` | None |
| Producto | `ID_PRODUCTO` | `PRODUCTOS` | `COD_PRODUCTO` + `ACTIVO = 1`; `CODIGO_BARRA` | `ID_CATEGORIA` → Categorias (SetNull); `ID_UNIDAD_MEDIDA` → UnidadesMedida (SetNull) |
| Sucursal | `ID_SUCURSAL` | `SUCURSALES` | `COD_SUCURSAL` + `ACTIVO = 1` | `ID_EMPRESA` → Empresas (Restrict) |
| StockSucursal | Composite: `ID_PRODUCTO` + `ID_SUCURSAL` | `STOCK_POR_SUCURSAL` | None (PK covers uniqueness) | `ID_PRODUCTO` → Productos (Cascade); `ID_SUCURSAL` → Sucursales (Cascade) |
| Usuario | `ID_USUARIO` | `USUARIOS` | `NOMBRE_USUARIO` (unique, no filter) | `ID_USUARIO_RESPONSABLE` → Usuarios (SetNull) |
| Cliente | `ID_CLIENTE` | `CLIENTES` | `COD_CLIENTE` + `ACTIVO = 1`; `TIPO_DOCUMENTO` + `NRO_DOCUMENTO` (unique) | None |
| Venta | `ID_VENTA` | `VENTAS` | None | `ID_SUCURSAL` → Sucursales (Restrict); `ID_USUARIO` → Usuarios (SetNull); `ID_CLIENTE` → Clientes (SetNull). **No `ID_CAJA`**. |
| RenglonVenta | `ID_RENGLON_VENTA` | `RENGLONES_VENTA` | None | `ID_VENTA` → Venta (Cascade); `ID_PRODUCTO` → Productos (Restrict) |
| Compra | `ID_COMPRA` | `COMPRAS` | None | `ID_PROVEEDOR` → Proveedores (SetNull); `ID_SUCURSAL` → Sucursales (Restrict); `ID_USUARIO_REGISTRA` → Usuarios (Restrict) |
| RenglonCompra | `ID_RENGLON_COMPRA` | `RENGLONES_COMPRA` | None | `ID_COMPRA` → Compra (Cascade); `ID_PRODUCTO` → Productos (Restrict) |
| MedioPago | `ID_MEDIO_PAGO` | `MEDIOS_PAGO` | `COD_MEDIO_PAGO` + `ACTIVO = 1` | None |
| Pago | `ID_PAGO` | `PAGOS` | None | `ID_VENTA` → Venta (Cascade); `ID_MEDIO_PAGO` → MedioPago (Restrict); `ID_CAJA` → Caja (Restrict); `ID_USUARIO_REGISTRA` → Usuarios (NoAction) |
| Gasto | `ID_GASTO` | `GASTOS` | None | `ID_CAJA` → Caja (Cascade) |
| Caja | `ID_CAJA` | `CAJAS` | None | `ID_SUCURSAL` → Sucursales; `ID_USUARIO_APERTURA`/`ID_USUARIO_CIERRE` → Usuarios (NoAction) |
| Deuda | `ID_DEUDA` | `DEUDAS` | None | `ID_COMPRA` → Compra (SetNull); `ID_PROVEEDOR` → Proveedores (Restrict) |

### Seed data

```csharp
// MediosPago — kept from existing, add COD_MEDIO_PAGO + rename NOMBRE → DESC_MEDIO_PAGO
modelBuilder.Entity<MedioPago>().HasData(
    new MedioPago(1, "EF", "Efectivo", true),
    new MedioPago(2, "TD", "Tarjeta Débito", false),
    new MedioPago(3, "TC", "Tarjeta Crédito", false),
    new MedioPago(4, "TR", "Transferencia", false),
    new MedioPago(5, "CC", "Cuenta Corriente", false)
);

// UnidadesMedida — new seed
modelBuilder.Entity<UnidadMedida>().HasData(
    new UnidadMedida(1, "UN", "unidad"),
    new UnidadMedida(2, "KG", "kilogramo"),
    new UnidadMedida(3, "L", "litro"),
    new UnidadMedida(4, "GR", "gramo"),
    new UnidadMedida(5, "ML", "mililitro")
);

// admin user kept as-is, with SUSCRIPCION_ACTIVA = true
```

## Migration Strategy

### Migration name

`dotnet ef migrations add SchemaFoundation`

### Up() execution order

1. **CREATE TABLE** for 8 new entities (Suscripcion, Empresa, Categoria, UnidadMedida, Proveedor, Compra, RenglonCompra, Deuda) — standard `migrationBuilder.CreateTable()`
2. **Table rebuilds** via raw SQL for each modified entity:
   - `Producto` → new table with all columns, INSERT ... SELECT mapping NOMBRE→DESC_PRODUCTO, drop STOCK
   - `Sucursal` → new table mapping CODIGO→COD_SUCURSAL, NOMBRE→DESC_SUCURSAL, drop NUMERO
   - `StockSucursal` → new table with composite PK, CAST(Stock AS REAL) for decimal
   - `Cliente` → new table mapping NUMERO_DOCUMENTO→NRO_DOCUMENTO, drop IVA_CONDICION
   - `Venta` → new table mapping FECHA→FECHA_VENTA, drop ID_CAJA
   - `RenglonVenta` → new table with CANTIDAD as TEXT (EF Core decimal), CAST from int
   - `MedioPago` → new table mapping NOMBRE→DESC_MEDIO_PAGO, add COD_MEDIO_PAGO
   - `Gasto` → new table mapping FECHA→FECHA_GASTO
   - `Usuario` → new table add SUSCRIPCION_ACTIVA default 1, drop EMPRESA_REPRESENTA
   - `Pago` (was PAGOS_VENTA) → new table mapping ID_PAGO_VENTA→ID_PAGO, drop CON_CAMBIO, add ID_CAJA (default 0 for existing)
3. **Add FK constraints** for new relationships
4. **Add indexes** (unique COD_ indexes with HasFilter)

### Down() — reverse order

Rebuild original table schemas, reverse column mappings, restore PAGOS_VENTA table name. Drop all new tables.

### Data preservation note

- `Producto.STOCK` is lost (moved to StockSucursal per-product/sucursal). Old global STOCK value per product cannot be mapped 1:1 to a specific sucursal — existing STOCK values are discarded in the migration (set to 0 for StockSucursal; manual reconcile needed).
- All other columns preserve existing values via INSERT ... SELECT with column mapping.
- `Pago.ID_CAJA`: existing PagoVenta records get a default `ID_CAJA = 0` (sentinel). Must be manually reconciled post-migration.

### SQLite version note

SQLite 3.35.0+ (bundled with .NET 8's Microsoft.Data.Sqlite) supports `DROP COLUMN` and `RENAME COLUMN`, but EF Core's `migrationBuilder` does not generate them — raw SQL still needed.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `PosWeb.Domain/Suscripcion.cs` | Create | New entity |
| `PosWeb.Domain/Empresa.cs` | Create | New entity |
| `PosWeb.Domain/Categoria.cs` | Create | New entity |
| `PosWeb.Domain/UnidadMedida.cs` | Create | New entity |
| `PosWeb.Domain/Proveedor.cs` | Create | New entity |
| `PosWeb.Domain/Compra.cs` | Create | New entity |
| `PosWeb.Domain/RenglonCompra.cs` | Create | New entity |
| `PosWeb.Domain/Deuda.cs` | Create | New entity |
| `PosWeb.Domain/Pago.cs` | Create | Replaces PagoVenta — new schema |
| `PosWeb.Domain/Producto.cs` | Modify | Remove STOCK, add new props, rename NOMBRE |
| `PosWeb.Domain/Sucursal.cs` | Modify | Remove NUMERO, rename CODIGO/NOMBRE, add ID_EMPRESA |
| `PosWeb.Domain/StockSucursal.cs` | Modify | composite PK, SCREAMING_SNAKE_CASE, decimal STOCK |
| `PosWeb.Domain/Usuario.cs` | Modify | Remove EMPRESA_REPRESENTA, add SUSCRIPCION_ACTIVA |
| `PosWeb.Domain/Cliente.cs` | Modify | Remove IVA_CONDICION, add COD_CLIENTE/MAIL, rename NUMERO_DOCUMENTO |
| `PosWeb.Domain/Venta.cs` | Modify | Remove ID_CAJA, rename FECHA, decimal CANTIDAD in AgregarRenglon |
| `PosWeb.Domain/RenglonVenta.cs` | Modify | CANTIDAD int → decimal |
| `PosWeb.Domain/MedioPago.cs` | Modify | Add COD_MEDIO_PAGO, rename NOMBRE |
| `PosWeb.Domain/Gasto.cs` | Modify | Rename FECHA → FECHA_GASTO |
| `PosWeb.Domain/Exceptions/CodigoInvalidoException.cs` | Create | Shared COD_ validation |
| `PosWeb.Domain/Exceptions/MontoInvalidoException.cs` | Create | Shared monetary validation |
| `PosWeb.Domain/PagoVenta.cs` | Delete | Replaced by Pago.cs |
| `PosWeb/Data/PosDbContext.cs` | Modify | 12 new/modified DbSets → 21 total, full Fluent API |
| `PosWeb/Migrations/20260604_SchemaFoundation.cs` | Create | Migration with raw SQL rebuilds |
| `PosWeb/Migrations/PosDbContextModelSnapshot.cs` | Auto | Updated by `dotnet ef migrations add` |
| `PosWeb.Contracts/PagoVentaDto.cs` | Modify | Rename to PagoDto — or leave for PR 2 |
| `PosWeb.Contracts/PagoVentaResultDto.cs` | Modify | Rename to PagoResultDto — or leave for PR 2 |
| `PosWeb.Contracts/StockSucursalDto.cs` | Modify | Stock int → decimal (PR 2 scope) |
| `PosWeb.Application/Ventas/VentaService.cs` | Modify | PagoVenta → Pago references. STOCK removal impact |
| `PosWeb.Application/StockSucursales/StockSucursalService.cs` | Modify | Stock int → decimal, property renames |
| `PosWeb.Application/Productos/ProductoService.cs` | Modify | STOCK property removal impact |
| `PosWeb.Application/Compras/CompraService.cs` | Modify | STOCK property removal impact |
| `PosWeb.Domain.Test/StockSucursalTest.cs` | Modify | Constructor params, property renames |
| `PosWeb.Application.Test/VentaServiceTest.cs` | Modify | PagoVenta → Pago, StockSucursal changes |
| `PosWeb.Application.Test/StockSucursalServiceTest.cs` | Modify | Property renames |

### Out of scope for PR 1 (marked as compilation fix only)

- Contract DTOs (`PagoVentaDto`, `PagoVentaResultDto`, `StockSucursalDto`) get **minimal fixes** to compile — full schema alignment is PR 2 work
- Service logic (VentaService, ProductoService, CompraService, StockSucursalService) gets **type-only fixes** — property renames, constructor changes. Business logic changes deferred to PR 2.

### PagoVenta references cross-codebase

| Location | Files | Fix |
|----------|-------|-----|
| Domain | `PagoVenta.cs` | Delete, replaced by `Pago.cs` |
| Data | `PosDbContext.cs` lines 20, 267 | `PagoVenta` → `Pago`, `PagosVenta` → `Pagos`, `PAGOS_VENTA` → `PAGOS` |
| Application | `VentaService.cs` line 182-205 | `PagoVenta` → `Pago`, `PagoVentaResultDto` kept as stub |
| Contracts | `PagoVentaDto.cs`, `PagoVentaResultDto.cs`, `VentaDto.cs`, `VentaResultadoDto.cs` | Class renames to `PagoDto`/`PagoResultDto` — minimal fix to compile |
| Tests | `VentaServiceTest.cs` line 125-294 | `PagoVentaDto` → `PagoDto` |
| Migrations | 10 `.Designer.cs` files + snapshot | **Leave untouched** — they belong to past migrations. Only `SchemaFoundation` migration is new. |

## Testing Strategy

| Layer | What to test | Approach |
|-------|-------------|----------|
| Entity unit tests | All new entity constructors + guard clauses | Follow existing `StockSucursalTest.cs` pattern — verify validation exceptions |
| Entity unit tests (modified) | Updated constructors, removed properties don't compile | Update existing tests to match new signatures |
| DbContext integration | All 21 tables exist, FKs work, composite PK | Migration smoke test: `EnsureCreated()` + query each table |
| Compilation | `dotnet build` zero errors | All 109 StockSucursal + 37 PagoVenta references updated |

## Risks

- **STOCK data loss**: Producto.STOCK values (int, global) cannot be mapped into StockSucursal (decimal, per-sucursal). Manual reconciliation needed post-migration.
- **Pago.ID_CAJA default**: Existing PagoVenta rows get `ID_CAJA = 0` sentinel — downstream code must handle this or reconcile.
- **Migration designer files**: 10 existing `.Designer.cs` files reference old entity shapes. The new `SchemaFoundation` migration snapshot supersedes them for the snapshot, but old `.Designer.cs` files remain untouched. Only `PosDbContextModelSnapshot.cs` is auto-updated.
- **Contract DTOs**: `PagoVentaDto.ConCambio` still exists in contracts but is removed from domain. PR 2 aligns these.
