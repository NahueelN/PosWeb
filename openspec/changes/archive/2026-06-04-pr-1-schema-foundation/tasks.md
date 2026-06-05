# Tasks: Schema Foundation (PR 1)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~2600–3000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | Single PR (size:exception) |
| Delivery strategy | single-pr |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All 21 entities + DbContext + migration + compile fixes | PR 1 | size:exception — migration + schema + generated code |

## Phase A: New Stand-Alone Entities (6)

- [x] A1. `PosWeb.Domain/Categoria.cs` — COD_CATEGORIA, DESC_CATEGORIA, ID_CATEGORIA_PADRE self-ref, ACTIVO
- [x] A2. `PosWeb.Domain/UnidadMedida.cs` — COD_UNIDAD_MEDIDA, DESC_UNIDAD_MEDIDA, ACTIVO
- [x] A3. `PosWeb.Domain/Suscripcion.cs` — COD_SUSCRIPCION, DESC_SUSCRIPCION, PRECIO, DIAS_VIGENCIA, ACTIVO
- [x] A4. `PosWeb.Domain/Empresa.cs` — COD_EMPRESA, DESC_EMPRESA, ID_SUSCRIPCION FK, FECHA_ALTA, FECHA_BAJA, ACTIVO
- [x] A5. `PosWeb.Domain/Proveedor.cs` — COD_PROVEEDOR, DESC_PROVEEDOR, NRO_DOCUMENTO, TELEFONO, DOMICILIO, MAIL, ACTIVO
- [x] A6. `PosWeb.Domain/Deuda.cs` — ID_COMPRA nullable FK, ID_PROVEEDOR FK, MONTO_ORIGINAL, MONTO_PENDIENTE, FECHA_DEUDA, FECHA_VENCIMIENTO, ESTADO, ACTIVO

## Phase B: Modified Domain Entities + Exceptions (12)

- [x] B1. `PosWeb.Domain/Producto.cs` — add 7 fields, rename NOMBRE→DESC_PRODUCTO, remove STOCK + stock behaviors
- [x] B2. `PosWeb.Domain/Sucursal.cs` — CODIGO→COD_SUCURSAL, NOMBRE→DESC_SUCURSAL, add ID_EMPRESA, remove NUMERO
- [x] B3. `PosWeb.Domain/StockSucursal.cs` — composite PK, SCREAMING_SNAKE, STOCK decimal, drop Id
- [x] B4. `PosWeb.Domain/Usuario.cs` — add SUSCRIPCION_ACTIVA, remove EMPRESA_REPRESENTA
- [x] B5. `PosWeb.Domain/Cliente.cs` — add COD_CLIENTE, MAIL; NUMERO_DOCUMENTO→NRO_DOCUMENTO; remove IVA_CONDICION
- [x] B6. `PosWeb.Domain/Venta.cs` — FECHA→FECHA_VENTA, remove ID_CAJA, AgregarRenglon cantidad decimal
- [x] B7. `PosWeb.Domain/RenglonVenta.cs` — CANTIDAD int→decimal
- [x] B8. `PosWeb.Domain/MedioPago.cs` — add COD_MEDIO_PAGO, NOMBRE→DESC_MEDIO_PAGO
- [x] B9. Delete `PagoVenta.cs`; create `Pago.cs` — ID_PAGO PK, ID_CAJA FK, remove CON_CAMBIO
- [x] B10. `PosWeb.Domain/Gasto.cs` — FECHA→FECHA_GASTO
- [x] B11. `PosWeb.Domain/Exceptions/CodigoInvalidoException.cs` — shared COD_ validation
- [x] B12. `PosWeb.Domain/Exceptions/MontoInvalidoException.cs` — shared monetary validation

## Phase C: New Compra Entities (2)

- [x] C1. `PosWeb.Domain/Compra.cs` — ID_PROVEEDOR FK, ID_SUCURSAL FK, FECHA_COMPRA, TOTAL, ID_USUARIO_REGISTRA FK, RENGLONES, ACTIVO
- [x] C2. `PosWeb.Domain/RenglonCompra.cs` — ID_COMPRA FK, ID_PRODUCTO FK, CANTIDAD decimal, PRECIO_UNITARIO, SUBTOTAL

## Phase D: DbContext + Migration + Compilation (3)

- [x] D1. `PosWeb/Data/PosDbContext.cs` — 21 DbSets + Fluent API per entity + seed data
- [x] D2. Delete old migrations; `dotnet ef migrations add SchemaFoundation`; custom SQL for table rebuilds; verify `dotnet build`
- [x] D3. Fix compilation in Application/Controllers/Contracts/Test projects — PagoVenta→Pago refs, property renames, STOCK removal (type-only, no logic changes)
