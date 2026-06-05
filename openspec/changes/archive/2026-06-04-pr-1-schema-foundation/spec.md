# Spec Refresh: Schema Foundation (PR 1)

> Refresh generated after conversation-driven schema changes. This supersedes the earlier stale spec artifact and was verified against the current domain entities and `PosDbContext` before rewrite.

## Verified Source of Truth

- `PosWeb.Domain/*.cs`
- `PosDbContext.cs`
- Final approved schema from this conversation

## Naming Conventions

- DB tables: SCREAMING_SNAKE_CASE plural
- DB columns: SCREAMING_SNAKE_CASE
- C# entities: PascalCase singular
- Business codes: `COD_`
- Descriptions: `DESC_`
- PK/FK: `ID_...`

## Final Schema to Implement and Preserve

### Core Catalog

| Entity | Table | Columns |
|---|---|---|
| Categoria | `CATEGORIAS` | `ID_CATEGORIA` PK, `COD_CATEGORIA` unique, `DESC_CATEGORIA` |
| UnidadMedida | `UNIDADES_MEDIDA` | `ID_UNIDAD_MEDIDA` PK, `COD_UNIDAD_MEDIDA` unique, `DESC_UNIDAD_MEDIDA` |
| Producto | `PRODUCTOS` | `ID_PRODUCTO` PK, `COD_PRODUCTO` unique, `ID_CATEGORIA` FK, `CODIGO_BARRAS`, `DESC_PRODUCTO`, `DESC_ADICIONAL?`, `PRECIO`, `COSTO`, `CONTENIDO decimal?`, `ID_UNIDAD_MEDIDA?` FK, `FECHA_ALTA`, `FECHA_ULTIMA_MOD`, `FECHA_BAJA?`, `ACTIVO` |

### Organization and Access

| Entity | Table | Columns |
|---|---|---|
| Suscripcion | `SUSCRIPCIONES` | `ID_SUSCRIPCION` PK, `ID_USUARIO_TITULAR` FK, `NIVEL`, `ESTADO`, `COSTO_MENSUAL`, `MAX_SUCURSALES`, `MAX_ADMIN`, `MAX_USUARIOS`, `FECHA_INICIO`, `FECHA_FIN?`, `PROXIMO_COBRO?`, `MERCADOPAGO_PREAPPROVAL_ID?` |
| Empresa | `EMPRESAS` | `ID_EMPRESA` PK, `NOMBRE`, `DOCUMENTO`, `ID_SUSCRIPCION` FK |
| Sucursal | `SUCURSALES` | `ID_SUCURSAL` PK, `COD_SUCURSAL` unique, `ID_EMPRESA` FK, `DESC_SUCURSAL`, `ACTIVO` |
| Usuario | `USUARIOS` | `ID_USUARIO` PK, `NOMBRE_USUARIO` unique, `PASSWORD_HASH`, `PIN_HASH?`, `MAIL?`, `ROL`, `ACTIVO`, `SUSCRIPCION_ACTIVA`, `ID_SUCURSAL_DEFAULT?`, `ID_USUARIO_RESP?` self FK |
| Caja | `CAJAS` | `ID_CAJA` PK, `ID_SUCURSAL`, `ESTADO`, `FECHA_APERTURA`, `FECHA_CIERRE?`, `MONTO_INICIAL`, `MONTO_CONTADO_EFECTIVO?`, `MONTO_CONTADO_TARJETAS?`, `DIFERENCIA?`, `MONTO_GASTOS`, `ID_USUARIO_APERTURA`, `ID_USUARIO_CIERRE?` |

### Sales and Payments

| Entity | Table | Columns |
|---|---|---|
| Cliente | `CLIENTES` | `ID_CLIENTE` PK, `COD_CLIENTE` unique, `NOMBRE`, `TIPO_DOCUMENTO`, `NRO_DOCUMENTO`, `MAIL?`, `TELEFONO?`, `DOMICILIO?`, `ACTIVO` |
| Venta | `VENTAS` | `ID_VENTA` PK, `ID_SUCURSAL`, `FECHA_VENTA`, `TOTAL`, `ID_USUARIO?`, `ID_CLIENTE?` |
| RenglonVenta | `RENGLONES_VENTA` | `ID_RENGLON_VENTA` PK, `ID_VENTA`, `ID_PRODUCTO`, `CANTIDAD decimal`, `PRECIO_UNITARIO`, `SUBTOTAL` |
| MedioPago | `MEDIOS_PAGO` | `ID_MEDIO_PAGO` PK, `COD_MEDIO_PAGO` unique, `DESC_MEDIO_PAGO`, `PAGA_VUELTO`, `ACTIVO` |
| Pago | `PAGOS` | `ID_PAGO` PK, `ID_VENTA`, `ID_MEDIO_PAGO`, `MONTO`, `CAMBIO`, `ID_USUARIO_REGISTRA`, `ID_CAJA` |
| StockSucursal | `STOCK_POR_SUCURSAL` | composite PK `ID_PRODUCTO + ID_SUCURSAL`, `STOCK decimal` |

### Purchases and Debt

| Entity | Table | Columns |
|---|---|---|
| Proveedor | `PROVEEDORES` | `ID_PROVEEDOR` PK, `COD_PROVEEDOR` unique, `NOMBRE`, `TIPO_DOCUMENTO`, `NRO_DOCUMENTO`, `MAIL?`, `TELEFONO?`, `DOMICILIO?`, `ACTIVO` |
| Compra | `COMPRAS` | `ID_COMPRA` PK, `NUMERO_COMPROBANTE`, `ID_SUCURSAL`, `ID_PROVEEDOR`, `ID_USUARIO`, `ID_GASTO?`, `FECHA_COMPRA`, `TOTAL` |
| RenglonCompra | `RENGLONES_COMPRA` | `ID_RENGLON_COMPRA` PK, `ID_COMPRA`, `ID_PRODUCTO`, `CANTIDAD decimal`, `PRECIO_UNITARIO`, `SUBTOTAL` |
| Gasto | `GASTOS` | `ID_GASTO` PK, `ID_CAJA`, `MONTO`, `FECHA_GASTO`, `DETALLE` |
| Deuda | `DEUDAS` | `ID_DEUDA` PK, `ID_CLIENTE?`, `ID_PROVEEDOR?`, `MONTO_DEUDA`, `FECHA_DEUDA`, `FECHA_PAGO?`, `PAGO`, `ID_VENTA?`, `ID_COMPRA?` |

## Required Relationships

- `Producto.ID_CATEGORIA -> Categoria.ID_CATEGORIA`
- `Producto.ID_UNIDAD_MEDIDA -> UnidadMedida.ID_UNIDAD_MEDIDA`
- `Sucursal.ID_EMPRESA -> Empresa.ID_EMPRESA`
- `Usuario.ID_USUARIO_RESP -> Usuario.ID_USUARIO`
- `Suscripcion.ID_USUARIO_TITULAR -> Usuario.ID_USUARIO`
- `Empresa.ID_SUSCRIPCION -> Suscripcion.ID_SUSCRIPCION`
- `StockSucursal.ID_PRODUCTO -> Producto.ID_PRODUCTO`
- `StockSucursal.ID_SUCURSAL -> Sucursal.ID_SUCURSAL`
- `Venta.ID_SUCURSAL -> Sucursal.ID_SUCURSAL`
- `Venta.ID_USUARIO -> Usuario.ID_USUARIO`
- `Venta.ID_CLIENTE -> Cliente.ID_CLIENTE`
- `RenglonVenta.ID_VENTA -> Venta.ID_VENTA`
- `RenglonVenta.ID_PRODUCTO -> Producto.ID_PRODUCTO`
- `Pago.ID_VENTA -> Venta.ID_VENTA`
- `Pago.ID_MEDIO_PAGO -> MedioPago.ID_MEDIO_PAGO`
- `Pago.ID_USUARIO_REGISTRA -> Usuario.ID_USUARIO`
- `Pago.ID_CAJA -> Caja.ID_CAJA`
- `Compra.ID_SUCURSAL -> Sucursal.ID_SUCURSAL`
- `Compra.ID_PROVEEDOR -> Proveedor.ID_PROVEEDOR`
- `Compra.ID_USUARIO -> Usuario.ID_USUARIO`
- `Compra.ID_GASTO -> Gasto.ID_GASTO`
- `RenglonCompra.ID_COMPRA -> Compra.ID_COMPRA`
- `RenglonCompra.ID_PRODUCTO -> Producto.ID_PRODUCTO`
- `Gasto.ID_CAJA -> Caja.ID_CAJA`
- `Deuda.ID_CLIENTE -> Cliente.ID_CLIENTE`
- `Deuda.ID_PROVEEDOR -> Proveedor.ID_PROVEEDOR`
- `Deuda.ID_VENTA -> Venta.ID_VENTA`
- `Deuda.ID_COMPRA -> Compra.ID_COMPRA`

## Cross-Cutting Rules

- All `COD_` fields MUST be unique.
- `NOMBRE_USUARIO` MUST be unique.
- `StockSucursal` MUST use composite PK `(ID_PRODUCTO, ID_SUCURSAL)`.
- `CANTIDAD`, `STOCK`, `PRECIO`, `COSTO`, `MONTO`, `SUBTOTAL`, `TOTAL`, `CAMBIO`, `COSTO_MENSUAL` MUST use `decimal(18,2)`.
- Soft delete pattern remains required where the entity has `ACTIVO`.
- `Producto.FECHA_ALTA` MUST be set on create.
- `Producto.FECHA_ULTIMA_MOD` MUST update on each mutation.
- `Producto.FECHA_BAJA` MUST be nullable and set on deactivation.
- `Venta` MUST NOT keep `ID_CAJA`; caja linkage lives in `Pago`.
- `Producto` MUST NOT keep legacy `STOCK`; stock truth lives in `STOCK_POR_SUCURSAL`.

## DbContext Refresh Requirements

`PosDbContext` MUST expose and map these DbSets:

- `Cajas`
- `Productos`
- `Sucursales`
- `StockPorSucursal`
- `Usuarios`
- `Clientes`
- `Ventas`
- `RenglonesVenta`
- `MediosPago`
- `Pagos`
- `Gastos`
- `Suscripciones`
- `Empresas`
- `Categorias`
- `UnidadesMedida`
- `Proveedores`
- `Compras`
- `RenglonesCompra`
- `Deudas`

`OnModelCreating` MUST configure:

- table names exactly as listed above
- all unique indexes for `COD_` fields and `NOMBRE_USUARIO`
- `HasColumnType("decimal(18,2)")` for all decimal domain columns
- `HasKey(e => new { e.ID_PRODUCTO, e.ID_SUCURSAL })` for `StockSucursal`
- FK delete behaviors explicitly (no implicit defaults)

## Migration Strategy Refresh

SQLite still limits `ALTER COLUMN`, `DROP COLUMN`, and complex PK reshaping. The migration for this change MUST use table rebuilds for:

- legacy `Producto` shape -> final catalog shape
- legacy `Sucursal` shape -> final empresa-linked shape
- legacy `StockSucursal` surrogate PK -> composite PK
- `Venta` dropping `ID_CAJA`
- `PagoVenta` -> `Pago`
- renames to `FECHA_VENTA`, `FECHA_GASTO`, `NRO_DOCUMENTO`, `DESC_MEDIO_PAGO`, `COD_SUCURSAL`, `DESC_SUCURSAL`, `DESC_PRODUCTO`

Recommended sequence:

1. Create all new tables first.
2. Copy legacy data into temporary final-shape tables.
3. Replace old tables with rebuilt final tables.
4. Recreate indexes and FKs explicitly.
5. Seed `MEDIOS_PAGO`, `UNIDADES_MEDIDA`, and admin `USUARIO` after final tables exist.

## Verification Notes

The final verification pass for PR 1 confirmed the previously identified drift is now resolved in the codebase and latest migration:

- `Proveedor` uses `NOMBRE`.
- `UnidadMedida` does not include `ACTIVO`.
- `Compra.ID_PROVEEDOR` is non-nullable in entity mapping and migration.

This spec remains the durable schema contract for the backend foundation established in PR 1.
