# Tasks: Gestión de Deuda

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350-450 |
| 400-line budget risk | Low-Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr-default |
| Chain strategy | N/A |

Decision needed before apply: No

---

## Task Dependencies

```
T1 ──→ T2 ──→ T3 ──→ T4
         │
         └──→ T5 (parallel, frontend)
```

---

## Task 1: DeudaService + DTOs

**Depends on:** Nothing  
**Estimate:** ~30 min  
**Testing:** DeudaServiceTest (InMemory EF Core)

### What to do

1. Create `PosWeb.Contracts/DeudaDto.cs`:
```csharp
public record DeudaDto(
    int Id,
    string ProveedorNombre,
    decimal Monto,
    DateTime Fecha,
    DateTime? FechaPago,
    bool Pago,
    int? CompraId
);
```

2. Create `PosWeb/Exceptions/DeudaNoEncontradaException.cs` and `DeudaYaPagadaException.cs`

3. Create `PosWeb/Application/Deudas/IDeudaService.cs` interface:
   - `Task<List<DeudaDto>> ListarAsync(int? proveedorId, bool soloPendientes)`
   - `Task<DeudaDto> ObtenerPorIdAsync(int id)`
   - `Task<DeudaDto> RegistrarPagoAsync(int id)`
   - `Task CrearDeudaAsync(int proveedorId, int compraId, decimal monto)` (internal)

4. Create `PosWeb/Application/Deudas/DeudaService.cs`:
   - `ListarAsync`: query Deudas with `.Include(d => d.Proveedor)`, filter by proveedorId and PAGO status
   - `ObtenerPorIdAsync`: find with Include, throw DeudaNoEncontradaException if null
   - `RegistrarPagoAsync`: load, check if already paid → throw DeudaYaPagadaException, call `RegistrarPago()`, save
   - `CrearDeudaAsync`: create new Deuda(monto, idProveedor: proveedorId, idCompra: compraId), add to context, return (save happens in caller's transaction)

5. Write `PosWeb.Application.Test/DeudaServiceTest.cs`:
   - Listar: returns all debts when no filter, filters by proveedorId, filters by soloPendientes
   - ObtenerPorId: returns debt, throws on not found
   - RegistrarPago: marks as paid, throws when already paid
   - CrearDeuda: creates with correct values

### Verification
- `dotnet test PosWeb.sln` — all new tests pass
- `dotnet build PosWeb.sln` — 0 errors

---

## Task 2: DeudaController

**Depends on:** Task 1  
**Estimate:** ~15 min  
**Testing:** Manual via Swagger or integration test

### What to do

1. Create `PosWeb/Controllers/DeudaController.cs`:
   - `GET /api/deudas?proveedorId=&soloPendientes=` → `ListarAsync`
   - `GET /api/deudas/{id}` → `ObtenerPorIdAsync`
   - `POST /api/deudas/{id}/pagar` → `RegistrarPagoAsync`

2. Map exceptions to HTTP status codes via existing exception filter:
   - `DeudaNoEncontradaException` → 404
   - `DeudaYaPagadaException` → 409

3. Register `IDeudaService` in `PosWeb/Program.cs` DI container

### Verification
- Build passes
- Endpoints respond correctly (tested via Swagger or curl)

---

## Task 3: Automatic Debt Creation in CompraService

**Depends on:** Task 1  
**Estimate:** ~15 min  
**Testing:** Update CompraServiceTest

### What to do

1. Inject `IDeudaService` into `CompraService` constructor
2. In `CrearCompra`, after creating Gasto entity, before `SaveChangesAsync`:
```csharp
if (proveedorId > 0)
{
    await _deudaService.CrearDeudaAsync(proveedorId, compra.ID_COMPRA, totalGasto);
}
```
3. Note: Deuda is added to the same DbContext, so it's saved in the same transaction
4. Update `CompraServiceTest`:
   - Test: compra with proveedorId > 0 → Deuda is created
   - Test: compra with proveedorId = 0 → no Deuda created

### Verification
- `dotnet test PosWeb.sln` — updated CompraServiceTest passes
- Verify Deuda record appears in DB after purchase with proveedor

---

## Task 4: Frontend DeudaPage

**Depends on:** Task 2  
**Estimate:** ~30 min  
**Testing:** `npx tsc --noEmit`

### What to do

1. Add `DeudaDto` to `frontend/src/types/index.ts`
2. Add `deudas` API methods to `frontend/src/api/client.ts`:
   - `listar(proveedorId?, soloPendientes?)`
   - `obtenerPorId(id)`
   - `pagar(id)`
3. Create `frontend/src/pages/DeudaPage.tsx`:
   - Proveedor filter dropdown (reuse ProveedorSelector pattern or simple select)
   - Toggle: "Solo pendientes" / "Todas"
   - Table: Proveedor, Monto, Fecha, Estado (Pendiente/Pagado), Acción (Pagar)
   - "Pagar" button on unpaid rows → confirm dialog → POST pagar → refresh
   - Loading and error states
   - Empty state when no debts

### Verification
- `npx tsc --noEmit` passes
- Page renders, lists debts, filters work
- Payment marks debt as paid and refreshes list

---

## Task 5: Integration Verification

**Depends on:** Tasks 1-4  
**Estimate:** ~10 min  
**Testing:** Full build + test suite

### What to do

1. Run `dotnet build PosWeb.sln` — 0 errors, 0 warnings
2. Run `dotnet test PosWeb.sln` — all tests pass
3. Run `npx tsc --noEmit` — 0 errors
4. Run `npm run lint` — no new issues
5. Manual smoke test: create a compra with proveedor → verify deuda appears

### Verification
- All checks pass

---

## Implementation Order

```
1. DeudaService + DTOs + Tests   (30 min)
2. DeudaController                (15 min)
3. CompraService integration      (15 min)
4. Frontend DeudaPage             (30 min)
5. Integration verification       (10 min)
```

## Success Criteria

- [ ] DeudaServiceTest: all cases pass
- [ ] CompraServiceTest: debt creation verified
- [ ] `dotnet test PosWeb.sln` passes with new tests
- [ ] `dotnet build PosWeb.sln` — 0 errors
- [ ] DeudaController endpoints respond correctly
- [ ] Compra with proveedor creates Deuda automatically
- [ ] DeudaPage lists, filters, and pays debts
- [ ] `npx tsc --noEmit` — 0 errors
