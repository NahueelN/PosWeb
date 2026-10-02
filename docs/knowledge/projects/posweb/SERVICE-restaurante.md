# SERVICE-restaurante — API del segmento restaurante

## Metadata

```yaml
ID: SERVICE-restaurante
Type: Service
Name: RestauranteService / RestauranteController
Status: Active
Priority: High
Level: Project
Sources:
  - PosWeb/Application/Restaurante/RestauranteService.cs
  - PosWeb/Controllers/RestauranteController.cs
  - PosWeb.Domain/Mesa.cs
  - PosWeb.Domain/SesionMesa.cs
  - PosWeb.Domain/ItemComanda.cs
  - frontend/src/pages/MesasPage.tsx
Template Version: 1.0
Created: 2026-10-01
Updated: 2026-10-01
Tags:
  - POS
  - Ventas
```

---

## Descripción

`RestauranteService` es el servicio de aplicación del segmento mesas. Expone la configuración del módulo (habilitado / tipo de negocio), el CRUD de mesas, el ciclo de vida de las sesiones (cuentas), la comanda con grupos y estados, la unificación de cuentas y el cobro (que reutiliza `VentaService` con `SinStock = true`).

Todo el segmento está restringido a `SuperAdmin` y `Admin` (`[Authorize(Roles = "SuperAdmin,Admin")]` en el controller); los `UsuarioComun` no operan mesas.

---

## Problema que resuelve

Centraliza el segmento restaurante sobre la misma base single-tenant. Separa el dominio (Mesa, SesionMesa, ItemComanda) del cobro: la venta generada por el cobro de una mesa reusa el flujo de mostrador sin descontar stock. El módulo se habilita por **tipo de negocio** (`EmpresaConfiguracion.TIPO_NEGOCIO = Restaurante`), que reemplazó al toggle de mesas.

---

## Endpoints (`/api/restaurante`)

| Método | Ruta | Acción |
|--------|------|--------|
| GET | `/config` | Estado del módulo (`habilitado`, `tipoNegocio`) |
| PUT | `/config` | Cambiar tipo de negocio / habilitar mesas |
| GET | `/mesas?sucursalId=` | Mesas activas de la sucursal (con flag `ocupada`) |
| POST | `/mesas` | Crear mesa (`UpsertMesaRequest`) |
| PUT | `/mesas/{id}` | Editar mesa (número, título, salón, posición) |
| DELETE | `/mesas/{id}` | Eliminar mesa (borrado lógico) |
| POST | `/mesas/{mesaId}/abrir` | Abrir sesión (cuenta) |
| GET | `/sesiones/abiertas?sucursalId=` | Sesiones abiertas con items |
| GET | `/sesiones/{id}` | Detalle de una sesión |
| POST | `/sesiones/{id}/items` | Agregar items a la comanda |
| PUT | `/items/{id}` | Editar item (solo Pendiente) |
| PUT | `/items/{id}/estado` | Cambiar estado (Pendiente→EnCocina→Servido/Devuelto/Cancelado) |
| PUT | `/items/estado-batch` | Cambiar estado de varios items en una sola transacción (ej. enviar toda la comanda a cocina) |
| POST | `/sesiones/{desde}/unificar/{hacia}` | Unificar cuenta (cierra la sesión origen) |
| POST | `/sesiones/{id}/cobrar` | Cobrar cuenta (genera la venta; soporta QR/transferencia pendiente) |
| POST | `/sesiones/{id}/cancelar` | Cancelar sesión |

---

## Reglas de negocio aplicables

- `BUS-mesa-cobro` — cap del monto, SinStock, sesión hasta pago confirmado, unificar cierra origen, deuda parcial.
- `BUS-mesa-numero-titulo` — número numérico obligatorio + título opcional; validación solo al cambiar.

---

## Relaciones

```yaml
RELATIONS:
  - type: USES
    target: VentaService
  - type: RESPECTS
    target: BUS-mesa-cobro
  - type: RESPECTS
    target: BUS-mesa-numero-titulo
  - type: RELATED
    target: PAT-mapa-responsive-popup
```