# Proposal: Schema Foundation (PR 1)

## Intent

Foundation for a multi-PR migration: 7 new entities, 8 modified, 1 renamed (PagoVenta → Pago), 1 kept (CAJA). Update DbContext, produce EF Core migration for 21-table schema. Zero services, controllers, APIs, or frontend. Project compiles; features gated until PR 2.

## Scope

**In**: New (SUSCRIPCION, EMPRESA, CATEGORIA, UNIDAD_MEDIDA, PROVEEDOR, COMPRA, RENGLON_COMPRA, DEUDA). Modified (PRODUCTO, SUCURSAL, STOCK_POR_SUCURSAL, USUARIO, CLIENTE, VENTA, RENGLON_VENTA, MEDIO_PAGO, GASTO). DbContext — 21 DbSets + Fluent API. EF Core migration.

**Out**: Services, controllers, APIs, DTOs, mappers, frontend, repository layer, business logic beyond entity constructors.

## Capabilities

**New**: compra, proveedor, deuda, suscripcion, categoria-producto.

**Modified**: producto-catalogo (gains COD_PRODUCTO, ID_CATEGORIA, timestamps; loses STOCK; NOMBRE → DESC_PRODUCTO), stock-sucursal (PK surrogate → composite; Stock int → decimal), venta (loses ID_CAJA; FECHA → FECHA_VENTA; CANTIDAD int → decimal).

## Approach

1. Domain entities: update per schema. Keep SCREAMING_SNAKE_CASE, private setters, behavior methods.
2. StockSucursal: `HasKey(ID_PRODUCTO, ID_SUCURSAL)` replaces surrogate `Id`.
3. PagoVenta → Pago: rename file, `ID_PAGO` PK, add `ID_CAJA`, drop `CON_CAMBIO`.
4. DbContext: all 21 DbSets + `HasColumnType("decimal(18,2)")` + unique indexes.
5. Migration: `dotnet ef migrations add SchemaFoundation`. Custom SQL for SQLite-unsupported column changes.
6. Fix all test + controller + contract compilation.

## Affected Areas

`PosWeb.Domain/` (8 modified + 8 new + 1 renamed), `PosDbContext.cs`, `PosWeb.Domain.Tests/`, `PosWeb.Domain.Test/`, `PosWeb.Application.Test/`, `PosWeb/`, `PosWeb.Contracts/`.

## Risks & Mitigation

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing data loss | Medium | SQLite backup before migration; reversible Up/Down |
| Hidden `STOCK` refs | Medium | Exhaustive grep across all `.cs`/`.ts` before removing |
| PagoVenta widespread | High | Grep all refs; keep old class as compat shim if needed |
| SQLite DDL limits | Medium | Custom SQL for unsupported type changes |

## Rollback Plan

Migration Up/Down. Backup `.db` first. Failure → `dotnet ef migrations remove`, `git checkout --` all changed files. PagoVenta compat shim if needed.

## Dependencies

EF Core 8.0.2, BCrypt.Net (already present). `dotnet-ef` CLI tool.

## Success Criteria

- [ ] `dotnet build PosWeb.sln` zero errors
- [ ] 21 tables with correct columns, types, constraints
- [ ] Existing tests compile and pass
- [ ] StockSucursal: composite PK, no `Id` column
- [ ] Producto: no `STOCK` property
- [ ] Venta: no `ID_CAJA`
- [ ] PagoVenta → Pago: `ID_PAGO` PK + `ID_CAJA`