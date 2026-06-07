# Proposal: Proveedores y Pagos

## Intent

Agregar gestión de proveedores (alta, modificación, ver deuda) y pagos parciales en compras con seguimiento de deuda por proveedor.

## Scope

### In Scope
- Nueva página Proveedores con listado, búsqueda, alta y modificación
- Nuevo endpoint `PUT /api/proveedores/{id}` para modificar proveedor
- Opción de pago (total, parcial o ninguno) al crear una compra
- Modelo de deuda extendido para pagos parciales (nueva entidad PagoProveedor o modificación de Deuda)
- Página de Deudas linkeada en navegación con soporte de pagos parciales
- Resumen de deuda por proveedor en página de Proveedores

### Out of Scope
- Pagos programados o recurrentes
- Notificaciones de deuda vencida
- Reportes avanzados de deuda
- Historial de cambios de proveedor

## Capabilities

### New Capabilities
- `proveedores-crud`: CRUD de proveedores con listado, búsqueda, alta, modificación y visualización de deuda
- `pago-proveedor`: Pagos parciales a proveedores sobre deuda de compras

### Modified Capabilities
- `compras`: Agregar opción de pago (total/parcial/sin pago) al confirmar compra, registrando deuda por el saldo

## Approach

Extender entidad `Deuda` con campo `MONTO_PAGADO` para tracking parcial. Al crear compra, si el usuario paga (total o parcial), se registra el pago. Nueva página Proveedores (listado + modal alta/edición + columna deuda). Página Deudas existente se mejora con input de monto para pagos parciales y se linkea en el nav.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `PosWeb.Domain/Deuda.cs` | Modify | Agregar MONTO_PAGADO, permitir pagos parciales |
| `PosWeb.Contracts/DeudaDto.cs` | Modify | Agregar MontoPagado, SaldoPendiente |
| `PosWeb.Contracts/ProveedorDto.cs` | Modify | Agregar DeudaPendiente |
| `PosWeb.Contracts/CrearProveedorRequestDto.cs` | Unchanged | |
| `PosWeb.Application/Proveedores/ProveedorService.cs` | Modify | Agregar Actualizar() |
| `PosWeb.Application/Deudas/DeudaService.cs` | Modify | Pagos parciales con monto parametrizable |
| `PosWeb.Application/Compras/CompraService.cs` | Modify | Aceptar montoPagado opcional |
| `PosWeb.Controllers/ProveedoresController.cs` | Modify | Agregar PUT /{id} endpoint |
| `PosWeb.Controllers/DeudaController.cs` | Modify | POST /pagar acepta monto |
| `PosWeb/Data/PosDbContext.cs` | Unchanged | (ya tiene DbSet de Deuda) |
| Migration | New | Alter DEUDAS table (MONTO_PAGADO) |
| `frontend/src/pages/ProveedoresPage.tsx` | New | CRUD de proveedores + deuda |
| `frontend/src/pages/CompraPage.tsx` | Modify | Agregar sección de pago |
| `frontend/src/pages/DeudaPage.tsx` | Modify | Pagos parciales con input monto |
| `frontend/src/types/index.ts` | Modify | Tipos actualizados |
| `frontend/src/api/client.ts` | Modify | Nuevos métodos |
| `frontend/src/App.tsx` | Modify | Rutas /proveedores, /deudas |
| `frontend/src/components/Layout.tsx` | Modify | Links Proveedores, Deudas |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migración de DEUDAS existentes sin MONTO_PAGADO | Med | Default MONTO_PAGADO = 0, existing rows treat as unpaid |
| Transacción compra + pago parcial inconsistente | Low | Un solo SaveChanges en CompraService |

## Rollback Plan

1. Revert ProveedoresPage, CompraPage, DeudaPage changes
2. Remove PUT /api/proveedores/{id} endpoint
3. Revert Deuda entity changes
4. `dotnet ef migrations remove`
5. Remove /proveedores and /deudas routes and nav links

## Success Criteria

- [ ] `PUT /api/proveedores/{id}` actualiza proveedor y devuelve 200
- [ ] CompraPage permite pagar total, parcial o no pagar al confirmar
- [ ] Deuda soporta pagos parciales desde DeudaPage
- [ ] ProveedoresPage muestra deuda pendiente por proveedor
- [ ] `dotnet test` pasa; `npm run lint && npx tsc -b` pasa
