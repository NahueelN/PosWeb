# FLOW-suscripcion

> Flujo completo de suscripción: compra, activación, trial, renovación y bloqueo por vencimiento.

---

## Metadata

```yaml
ID: FLOW-suscripcion
Type: Flow
Name: Flujo de suscripción y activación de licencia
Status: Active
Priority: Critical
Level: Project
Sources:
  - frontend/src/pages/LoginPage.tsx
  - frontend/src/pages/ConfiguracionPage.tsx
  - frontend/src/components/Layout.tsx
  - frontend/src/App.tsx
  - frontend/src/api/client.ts
  - PosWeb/Application/Auth/AuthService.cs
  - PosWeb/Controllers/LicenciaController.cs
  - PosWeb/Controllers/AuthController.cs
  - licensing-worker/src/index.ts
  - landing/index.html
Created: 2026-08-19
Updated: 2026-09-23
Template Version: 1.0
Tags:
  - Suscripcion
  - Offline
```

---

## Descripción

Describe el ciclo de vida de una licencia de PosWeb, desde la compra en la landing hasta el bloqueo por vencimiento, pasando por el trial de 7 días, la renovación manual mensual y la degradación a plan Gratuito (que no bloquea).

---

## Diagrama de estados

```
                    compra (checkout)
                          │
                          ▼
                 ┌─────────────────┐
                 │     pending     │
                 └────────┬────────┘
            pago approved   │  (webhook payment.created)
                          ▼
                 ┌─────────────────┐   next_billing pasado
                 │     active      │ ────────────────────┐
                 └────────┬────────┘                     ▼
            renovación     │                   ┌─────────────────┐
            (+30 días)     │                   │      grace      │ (48h)
                          │                   └────────┬────────┘
                          │               pasada la gracia
                          │                            ▼
                          └─────────────────► │     expired     │ → acceso revocado
                                              └─────────────────┘
```

Sin licencia paga al registrarse → `trial` (7 días, plan Máxima) → vence → **degrade a Gratuito sin bloqueo** (ventas, caja y stock; hasta 500 productos; módulos grisados).

---

## Pasos del flujo

1. **Compra**: en la landing el comerciante elige plan y email → `POST /checkout` (reutiliza licencia existente si la hay, incluido el placeholder gratuito creado por `/register`) → redirige a Checkout de MercadoPago. El plan Gratuito no se ofrece a la venta.

2. **Pago aprobado**: webhook `payment.created` → licencia pasa a `active` y `next_billing` se extiende +30 días (desde vencimiento vigente o desde hoy).

3. **Registro / trial**: al crear el primer admin, `AuthService.Register` intenta `ActivarPorEmailOPrueba`. Si no hay licencia paga para ese email, inicia trial de 7 días (plan Máxima). Además da de alta el email en el worker (`POST /register`, placeholder gratuito `pending`) para que el checkout posterior encuentre el registro. Fire-and-forget: si el worker falla no se rompe el registro.

4. **Vencimiento de la prueba**: la prueba vence y **NO bloquea**: el comercio pasa a plan Gratuito (recorte de productos activos a 500) y sigue operando. `VerificarAcceso` devuelve `true`.

5. **Activación por email** ("Buscar licencia"): `POST /licencia/activar-por-email` → `license-by-email` + `activate` vinculan la licencia al `machine_id` local y sincronizan la `Suscripcion` (límites por plan). Un plan gratuito placeholder **no** se activa (se ignora para no pisar la prueba local).

6. **Verificación continua**: el middleware de `Program.cs` y `Login` llaman `VerificarAcceso` en cada request. Con cache offline de 72h, más evaluación local de gracia/vencimiento y anti-rollback de reloj. La rama Gratuito retorna siempre `true` (sin verificación remota ni vencimiento), con recorte defensivo de productos a 500.

7. **Renovación manual**: el comerciante vuelve a la landing y paga el mismo plan → se extiende la licencia existente, no se crea una nueva.

8. **Vencimiento y bloqueo (planes pagos)**: pasada la gracia, `VerificarAcceso` devuelve falso (incluso offline) y el frontend redirige al login; el badge del header avisa el tiempo restante. Solo aplica a Básica/Máxima: editar la DB local a Gratuito no escapa del bloqueo (la rama evalúa el nivel efectivo de la Suscripcion).

---

## Páginas involucradas

- `landing/index.html` + `licensing-worker` (landing servida por el Worker).
- `frontend/src/pages/LoginPage.tsx` (registro + "Buscar licencia").
- `frontend/src/pages/ConfiguracionPage.tsx` (estado de licencia + "Buscar licencia"; solapas ocultas en Gratuito).
- `frontend/src/components/Layout.tsx` (badge de vencimiento/renovación + grisado de módulos en Gratuito).
- `frontend/src/App.tsx` (`GratuitoGuard`: redirige rutas bloqueadas a `/ventas`).

---

## Reglas de negocio aplicables

- `BUS-vencimiento-licencia` (gracia, renovación, trial→Gratuito, email case-insensitive, anti-rollback, nivel efectivo).
- `BUS-limites-planes` (tabla canónica, tope de productos, recorte, grisado de módulos).

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: BUS-vencimiento-licencia
  - type: RESPECTS
    target: BUS-limites-planes
  - type: USES
    target: SERVICE-licensing-worker
  - type: RESPECTS
    target: ADR-suscripciones
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-08-19 | Creación |
| 2026-09-23 | Prueba vence a Gratuito sin bloqueo; `/register` al registrarse; grisado de módulos; nivel efectivo |