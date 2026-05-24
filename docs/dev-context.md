# Dev Context — PosWeb

> Archivo vivo de decisiones, bugs, gotchas y contexto técnico.
> Actualizalo cuando aprendas algo nuevo.

---

## Stack

- Backend: .NET 8 + EF Core + SQLite
- Frontend: React + TypeScript + Vite
- DB local: `PosWeb/pos.db` (no trackeado en git, cada entorno lo crea con `dotnet ef database update`)

---

## Decisiones de arquitectura

### SQLite > SQL Server para este proyecto
**Motivo**: PCs viejas, sin recursos para SQL Server Express (~1GB instalado, 500MB RAM). SQLite es archivo, cero config, cero servicio extra.
**Riesgo**: No escala a múltiples sucursales compartiendo DB. Si eso se necesita, migrar a PostgreSQL (con EF Core es cambiar provider).
**Tradeoff**: SQLite no soporta `Sum()` en `decimal` — hay que materializar primero (ver bugs).

### Cajas: una por usuario, no por sucursal
**Motivo**: Soporte para múltiples cajas en un mismo local. Cada cajero abre su caja, las ventas van a su caja.
**Fórmula de diferencia**: `esperado = montoInicial + totalVentas - gastos` → `diferencia = esperado - contado`
**Validación**: un usuario no puede tener dos cajas abiertas, pero varios usuarios sí pueden tener cajas en la misma sucursal.

### Catálogo de productos separado del stock por sucursal
**SDD**: `separate-catalog-from-stock` (ver `openspec/`)
**Enfoque**: Producto es solo catálogo. Stock por sucursal se maneja en `StockSucursal`. 3 PRs encadenados (stacked-to-main).
**¿Por qué?**: Opción 2: separar completamente catálogo de stock en lugar de inicializar por sucursal al crear producto.

---

## Bugs & gotchas

### SQLite + EF Core: `Sum(decimal)` no soportado
- **Síntoma**: 500 Internal Server Error al cerrar caja
- **Stack**: `System.NotSupportedException: SQLite cannot apply aggregate operator 'Sum' on expressions of type 'decimal'`
- **Fix**: Materializar valores primero con `.Select().ToList()`, sumar en memoria
- **Lección**: Cuidado con cualquier agregado en `decimal` — `Average()`, `Sum()`. `int` y `double` sí funcionan.

### EF Core Include en propiedad escalar crashea
- **Síntoma**: Botón "Confirmar venta" nunca se habilita
- **Causa**: `.Include(c => c.ID_USUARIO_APERTURA)` en `CajaService.ObtenerActiva()` sobre un `int`. Include es para navegación, no para propiedades escalares. EF Core crasheaba y la promesa quedaba colgada.
- **Fix**: Sacar el `.Include()`

### Excepciones de dominio sin mapeo en middleware
- **Síntoma**: `InvalidOperationException` de `Caja.Cerrar()` o `Caja.SetDiferencia()` → 500
- **Causa**: El middleware solo mapea `AuthException`→401, `DomainException`→400, `ServiceException`→409, `Exception`→500. Las excepciones standard de .NET caen en el catch-all de 500.
- **Fix**: Crear `CajaException : ServiceException` y wrappear los calls en try-catch
- **Alternativa mejor**: Atrapar las excepciones standard en el middleware. Queda pendiente para un refactor.

### Producto creado sin stock → 409 al vender
- **Síntoma**: Creás un producto, querés venderlo y te da 409
- **Causa**: `StockSucursal` no tiene fila para ese producto + sucursal. `StockSucursalService.DescontarStock` devuelve insuficiente.
- **Fix**: La venta valida stock por sucursal. El producto nuevo necesita que se inicie stock antes de vender.

---

## Endpoints API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/cajas/activa?sucursalId=X` | Caja activa del usuario logueado |
| POST | `/api/cajas/abrir` | Abrir caja (request: sucursalId, montoInicial) |
| POST | `/api/cajas/cerrar?cajaId=X` | Cerrar caja (request: montoContadoEfectivo, montoContadoTarjetas, gastos) |
| GET | `/api/cajas/{id}/preview-cierre` | Previsualización: totalVentas, desglosePagos |
| GET | `/api/productos/buscar-venta?term=X&sucursalId=Y` | Buscar productos para venta (nombre o código de barra) + stock real de sucursal |
| GET | `/api/stock?sucursalId=X` | Stock por sucursal con catálogo completo |

---

## Payloads clave

### CerrarCajaRequest
```json
{
  "montoContadoEfectivo": 15000.00,
  "montoContadoTarjetas": 5000.00,
  "gastos": 500.00,
  "observaciones": null
}
```

### CajaDto (después de cerrar)
```json
{
  "id": 1,
  "montoInicial": 10000.00,
  "totalVentas": 8500.00,
  "gastos": 500.00,
  "esperado": 18000.00,
  "montoContadoEfectivo": 15000.00,
  "montoContadoTarjetas": 5000.00,
  "diferencia": -2000.00,
  "desglosePagos": [
    { "idMedioPago": 1, "medioPago": "Efectivo", "monto": 7000.00 },
    { "idMedioPago": 3, "medioPago": "Tarjeta Crédito", "monto": 1500.00 }
  ]
}
```

---

## Lo que falta / pendiente

- [ ] Migrar a PostgreSQL cuando haya múltiples sucursales
- [ ] Implementar gastos reales (hoy es solo un campo en el cierre)
- [ ] Archivar SDD `separate-catalog-from-stock` y mergear PRs
- [ ] Tests de frontend (no hay setup de testing)
- [ ] Agregar más seed data para demos
