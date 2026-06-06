# Tasks: Proveedores y Pagos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~550-650 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (within 800-line budget) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 1: Foundation (Backend — Domain & Data)

- [x] 1.1 Modify `PosWeb.Domain/Deuda.cs`: agregar MONTO_PAGADO, actualizar constructor (acepta montoPagado opcional), cambiar RegistrarPago(monto) para pagos parciales
- [x] 1.2 Modify `PosWeb.Contracts/DeudaDto.cs`: agregar MontoPagado, SaldoPendiente
- [x] 1.3 Modify `PosWeb.Contracts/ProveedorDto.cs`: agregar DeudaPendiente
- [x] 1.4 Modify `PosWeb.Contracts/CompraRequestDto.cs`: agregar MontoPagado opcional
- [x] 1.5 Create `PosWeb.Contracts/PagarDeudaRequestDto.cs`: DTO con Monto opcional
- [x] 1.6 Create EF migration `AddMontoPagadoToDeudas`

## Phase 2: Core Implementation (Backend — Services & Controllers)

- [x] 2.1 Modify `PosWeb.Application/Proveedores/ProveedorService.cs`: agregar Actualizar(id, dto), modificar ObtenerPorId para incluir DeudaPendiente
- [x] 2.2 Modify `PosWeb.Application/Deudas/DeudaService.cs`: RegistrarPagoAsync acepta monto opcional, ListarAsync incluye MONTO_PAGADO, CrearDeuda acepta montoPagado
- [x] 2.3 Modify `PosWeb.Application/Compras/CompraService.cs`: CrearCompra acepta montoPagado, lo pasa a CrearDeuda
- [x] 2.4 Modify `PosWeb.Controllers/ProveedoresController.cs`: agregar PUT /{id}, modificar GET /{id} para incluir deudaPendiente
- [x] 2.5 Modify `PosWeb.Controllers/DeudaController.cs`: POST /pagar acepta body PagarDeudaRequestDto

## Phase 3: Frontend Implementation

- [x] 3.1 Modify `frontend/src/types/index.ts`: actualizar DeudaDto (montoPagado, saldoPendiente), ProveedorDto (deudaPendiente), CompraRequestDto (montoPagado)
- [x] 3.2 Modify `frontend/src/api/client.ts`: agregar actualizarProveedor(id, dto), modificar pagar(id, monto?) y listar deudas
- [x] 3.3 Create `frontend/src/pages/ProveedoresPage.tsx`: listado con búsqueda, modal alta/edición, columna deuda pendiente
- [x] 3.4 Modify `frontend/src/pages/CompraPage.tsx`: agregar sección de pago (select: no pagar / pagar total / pagar parcial con input)
- [x] 3.5 Modify `frontend/src/pages/DeudaPage.tsx`: input de monto para pagos parciales, toggle mostrar pagadas
- [x] 3.6 Modify `frontend/src/App.tsx`: agregar rutas /proveedores y /deudas
- [x] 3.7 Modify `frontend/src/components/Layout.tsx`: agregar links Proveedores y Deudas al nav

## Phase 4: Testing

- [x] 4.1 Write Deuda tests: constructor con montoPagado, RegistrarPago parcial y total
- [x] 4.2 Write CompraService tests: montoPagado opcional, crea deuda parcial
- [x] 4.3 Write DeudaService tests: pagar con monto, pagar sin monto
- [x] 4.4 Write ProveedorService tests: Actualizar exitoso, 404
- [x] 4.5 Run full test suite: `dotnet test PosWeb.sln && npm run lint && npx tsc -b`
