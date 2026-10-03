# SERVICE-mercadopago — Integración MercadoPago

## Metadata

```yaml
ID: SERVICE-mercadopago
Type: Service
Name: MercadoPagoService / MercadoPagoController
Status: Active
Priority: Critical
Level: Project
Sources:
  - PosWeb/Application/MercadoPago/MercadoPagoService.cs
  - PosWeb/Application/MercadoPago/TransferenciaPollingService.cs
  - PosWeb/Controllers/MercadoPagoController.cs
  - PosWeb.Domain/Suscripcion.cs
  - frontend/src/pages/VentasPage.tsx
  - frontend/src/pages/venta/TransferenciaEspera.tsx
  - frontend/src/pages/MesasPage.tsx
Template Version: 1.0
Created: 2026-10-02
Updated: 2026-10-02
Tags:
  - Ventas
  - Suscripcion
```

---

## Descripción

Servicio de aplicación que integra MercadoPago al cobro: vinculación OAuth de la cuenta del negocio, QR de mostrador, cobro QR y transferencia pendiente, y verificación de pagos. Guarda los tokens encriptados en la `Suscripcion` (campos `MP_*`), junto con el titular real y el alias de la cuenta (configurable a mano). La confirmación automática de pagos es un beneficio del plan Máxima (`PermiteMercadoPago`).

---

## Problema que resuelve

Permite cobrar por MercadoPago (QR y transferencia) sin banco propio, y verificar pagos en la venta de mostrador y de mesa. Centraliza OAuth, refresh de tokens, QR dinámico por venta y el polling de pagos. La vinculación es de una sola cuenta a la vez: **solo queda activa la última cuenta vinculada**.

---

## Endpoints (`/api/mercadopago`)

| Método | Ruta | Acción |
|--------|------|--------|
| GET | `/auth-url` | Genera la URL de autorización OAuth (state con expiración de 10 min) |
| GET | `/callback` | Intercambia el code por token y configura store/POS/QR |
| GET | `/estado` | Estado de la vinculación (titular, alias, requiereRevincular) — hace backfill del nombre |
| PUT | `/alias` | Configura el alias de la cuenta (manual) |
| POST | `/desvincular` | Desvincula la cuenta |
| POST | `/verificar-pago` | Verificación manual por monto (solo Máxima) |
| GET | `/qr` | QR fijo de mostrador |

---

## Tokens y cifrado

- Los tokens (`MP_ACCESS_TOKEN`, `MP_REFRESH_TOKEN`) se guardan **encriptados** con `EncryptionService` (AES-CBC, clave derivada por SHA-256 de una clave base).
- La clave base está en `appsettings.json` y viaja con la app de escritorio: la "encriptación" es **ofuscación** contra lectura casual de la DB local, no una defensa contra alguien con acceso al instalador.
- El `ClientSecret` del OAuth se lee de configuración (`MercadoPago:ClientSecret`, overridable por env `MercadoPago__ClientSecret`); no hay fallback en código.

---

## Reglas de negocio aplicables

- `BUS-mp-verificacion` — transferencias = confirmación manual; solo QR se auto-confirma (por `external_reference`).
- `BUS-vencimiento-licencia` — el plan Máxima habilita la verificación instantánea.

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: BUS-mp-verificacion
  - type: USES
    target: VentaService
  - type: RESPECTS
    target: BUS-vencimiento-licencia
```