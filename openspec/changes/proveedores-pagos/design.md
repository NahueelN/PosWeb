# Design: Proveedores y Pagos

## Technical Approach

Extender `Deuda` con `MONTO_PAGADO` para tracking de pagos parciales. Agregar `PUT /api/proveedores/{id}` y campo `DeudaPendiente` al DTO. Modificar `CompraService` para aceptar `montoPagado` opcional. Nueva `ProveedoresPage` full CRUD + deuda. Página `DeudaPage` mejorada con pagos parciales.

## Architecture Decisions

### Partial Payment: MONTO_PAGADO field vs. PagoProveedor entity

| Option | Tradeoff | Decision |
|--------|----------|----------|
| MONTO_PAGADO en Deuda | Simple, mínimo cambio. Solo tracking de monto acumulado, sin historial individual de pagos | ✅ **Chosen** — simple, alinea con el alcance |
| PagoProveedor entity | Historial completo de cada pago (fecha, monto, usuario) | ❌ Rejected — scope extra, out of scope |

### DeudaPendiente: Computed vs. Stored

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Computado en query | Siempre actualizado, sin redundancia | ✅ **Chosen** — `SUM(MONTO_DEUDA - MONTO_PAGADO) WHERE PAGO=false` |
| Campo en Proveedor | Requiere sync | ❌ Rejected |

## Data Flow

```
POST /api/compras/crear (con montoPagado opcional)
  └─ CompraService.CrearCompra(...)
      ├─ Crea Compra + Renglones + Stock + Gasto (como antes)
      ├─ Si montoPagado > 0:
      │   └─ Deuda(MONTO_DEUDA=total, MONTO_PAGADO=montoPagado)
      │   └─ Si montoPagado >= total: PAGO=true
      └─ Si montoPagado = 0 o null:
          └─ Deuda(MONTO_DEUDA=total, MONTO_PAGADO=0, PAGO=false)

POST /api/deudas/{id}/pagar { monto }
  └─ DeudaService.RegistrarPagoAsync(id, monto)
      ├─ MONTO_PAGADO += monto
      └─ Si MONTO_PAGADO >= MONTO_DEUDA: PAGO=true
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `PosWeb.Domain/Deuda.cs` | Modify | Agregar MONTO_PAGADO, cambiar RegistrarPago(monto) |
| `PosWeb.Contracts/DeudaDto.cs` | Modify | Agregar MontoPagado, SaldoPendiente |
| `PosWeb.Contracts/ProveedorDto.cs` | Modify | Agregar DeudaPendiente |
| `PosWeb.Contracts/CompraRequestDto.cs` | Modify | Agregar MontoPagado opcional |
| `PosWeb.Application/Proveedores/ProveedorService.cs` | Modify | Agregar Actualizar() |
| `PosWeb.Application/Deudas/DeudaService.cs` | Modify | RegistrarPagoAsync(id, monto), actualizar ListarAsync incluye MONTO_PAGADO |
| `PosWeb.Application/Compras/CompraService.cs` | Modify | Aceptar montoPagado, pasarlo a CrearDeuda |
| `PosWeb.Controllers/ProveedoresController.cs` | Modify | Agregar PUT /{id}, GET incluye deudaPendiente |
| `PosWeb.Controllers/DeudaController.cs` | Modify | POST /pagar acepta body con monto |
| Migration | New | Add MONTO_PAGADO to DEUDAS |
| `frontend/src/pages/ProveedoresPage.tsx` | New | CRUD proveedores + columna deuda |
| `frontend/src/pages/CompraPage.tsx` | Modify | Sección pago en panel derecho |
| `frontend/src/pages/DeudaPage.tsx` | Modify | Input monto para pagos parciales |
| `frontend/src/types/index.ts` | Modify | Tipos actualizados (DeudaDto, ProveedorDto, CompraRequestDto) |
| `frontend/src/api/client.ts` | Modify | Agregar actualizarProveedor, pagarDeuda con monto |
| `frontend/src/App.tsx` | Modify | Rutas /proveedores, /deudas |
| `frontend/src/components/Layout.tsx` | Modify | Links Proveedores, Deudas |

## API Contracts

```csharp
// Updated DeudaDto
public record DeudaDto(
    int Id, string ProveedorNombre, decimal Monto,
    DateTime Fecha, DateTime? FechaPago, bool Pago,
    int? CompraId, decimal MontoPagado, decimal SaldoPendiente
);

// Updated ProveedorDto — add DeudaPendiente
public class ProveedorDto {
    // existing fields...
    public decimal DeudaPendiente { get; set; }
}

// Updated CompraRequestDto — add MontoPagado
public class CompraRequestDto {
    public int SucursalId { get; set; }
    public int ProveedorId { get; set; }
    public int? UserId { get; set; }
    public List<CompraItemDto> Items { get; set; } = new();
    public decimal? MontoPagado { get; set; }  // NEW
}

// Pay debt request
public class PagarDeudaRequestDto {
    public decimal? Monto { get; set; }
}
```

## Deuda Entity Changes

```csharp
public class Deuda {
    // existing fields...
    public decimal MONTO_PAGADO { get; private set; }

    // Updated constructor
    public Deuda(decimal montoDeuda, decimal? montoPagado = null, ...) {
        MONTO_PAGADO = montoPagado ?? 0;
        // Si MONTO_PAGADO >= MONTO_DEUDA, PAGO = true
    }

    // Updated RegistrarPago
    public void RegistrarPago(decimal monto) {
        MONTO_PAGADO += monto;
        if (MONTO_PAGADO >= MONTO_DEUDA) {
            PAGO = true;
            FECHA_PAGO = DateTime.UtcNow;
        }
    }
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (Domain) | Deuda pagos parciales — constructor con montoPagado, RegistrarPago con monto < total, RegistarPago con monto >= total | xUnit, direct instantiation |
| Integration (Application) | CompraService con montoPagado — crea deuda parcial | xUnit + EF Core InMemory |
| Integration | DeudaService pagos parciales — ListarAsync/PagarAsync | Same |
| Integration | ProveedorService Actualizar | Same |
| Frontend | None (no test framework) | Manual + `npm run lint && npx tsc -b` |

## Migration

```sql
ALTER TABLE DEUDAS ADD COLUMN MONTO_PAGADO decimal(18,2) NOT NULL DEFAULT 0;
```

## Open Questions

None.
