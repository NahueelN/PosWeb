# Design: Gestión de Deuda

## Technical Approach

Add a `DeudaService` for debt querying and payment, wire automatic debt creation into `CompraService.CrearCompra`, expose REST endpoints via `DeudaController`, and build a `DeudaPage` frontend.

## Architecture Decisions

### Debt Creation: Inline vs Event

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Inline in CompraService | Simple, atomic within the same transaction, no extra infrastructure | ✅ **Chosen** — debt creation happens inside the existing IDbContextTransaction |
| Domain event / message bus | Decoupled, but adds complexity and async concerns | ❌ Rejected — overkill for current scale |

### DeudaService Injection into CompraService

`CompraService` will receive `IDeudaService` via constructor injection. The `CrearCompra` method calls `deudaService.CrearDeudaAsync(...)` within the same transaction scope before `SaveChangesAsync`.

### Payment: State Mutation on Entity

The `Deuda` entity already has `RegistrarPago()`. The service loads the entity, calls the method, and saves — no separate "payment" entity needed.

## API Design

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deudas` | List debts. Query params: `proveedorId?`, `soloPendientes?` |
| GET | `/api/deudas/{id}` | Get debt by ID |
| POST | `/api/deudas/{id}/pagar` | Register payment on a debt |

## Data Flow

```
CompraPage                    CompraController
    │                               │
    │ POST /api/compras/crear       │
    ├──────────────────────────────►│
    │                               ├──► CompraService.CrearCompra()
    │                               │       │
    │                               │       ├── Create Compra entity
    │                               │       ├── Create RenglonCompra entities
    │                               │       ├── Create Gasto entity
    │                               │       ├── Update stock
    │                               │       ├── Create Deuda (if proveedorId > 0)  ◄── NEW
    │                               │       └── SaveChangesAsync()
    │                               │
    │ ◄── CompraResponseDto         │
    │                               │
```

## Entity Relationships

```
Proveedor ──┐
            │ 1:N
            ▼
          Deuda ◄── Compra (N:1, optional)
            │
            ▲ (future)
            │
Cliente ────┘
```

## DTOs

```csharp
// DeudaDto — response
public record DeudaDto(
    int Id,
    string ProveedorNombre,
    decimal Monto,
    DateTime Fecha,
    DateTime? FechaPago,
    bool Pago,
    int? CompraId
);

// RegistrarPagoRequestDto — (empty body, id in URL)
```

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `PosWeb/Application/Deudas/DeudaService.cs` | List, get by ID, pay, create |
| `PosWeb/Application/Deudas/IDeudaService.cs` | Interface |
| `PosWeb/Controllers/DeudaController.cs` | REST endpoints |
| `PosWeb.Contracts/DeudaDto.cs` | Response DTO |
| `PosWeb.Application.Test/DeudaServiceTest.cs` | Unit tests |
| `PosWeb/Exceptions/DeudaNoEncontradaException.cs` | 404 exception |
| `PosWeb/Exceptions/DeudaYaPagadaException.cs` | 409 exception |
| `frontend/src/pages/DeudaPage.tsx` | Debt management UI |

### Modified Files
| File | Change |
|------|--------|
| `PosWeb/Application/Compras/CompraService.cs` | Inject IDeudaService, create debt after compra |
| `PosWeb/Program.cs` | Register IDeudaService in DI |

## Testing Strategy

- `DeudaServiceTest`: InMemory EF Core tests for Listar (filtered, unfiltered), ObtenerPorId (found, not found), RegistrarPago (success, already paid)
- `CompraServiceTest`: Update existing tests to verify Deuda creation when proveedorId > 0, and no Deuda when proveedorId = 0
- No transaction tests needed (InMemory doesn't support transactions; verifiable through entity state assertions)
