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
  - frontend/src/api/client.ts
  - PosWeb/Application/Auth/AuthService.cs
  - PosWeb/Controllers/LicenciaController.cs
  - PosWeb/Controllers/AuthController.cs
  - licensing-worker/src/index.ts
  - landing/index.html
Created: 2026-08-19
Updated: 2026-08-19
Template Version: 1.0
Tags:
  - Suscripcion
  - Offline
```

---

## Descripción

Describe el ciclo de vida de una licencia de PosWeb, desde la compra en la landing hasta el bloqueo por vencimiento, pasando por el trial de 7 días y la renovación manual mensual.

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
                          │                   ┌─────────────────┐
                          └─────────────────► │     expired     │ → acceso revocado
                                              └─────────────────┘
```

Sin licencia paga al registrarse → `trial` (7 días, plan Máxima) → `trial-expired` → degrada a Básica y bloquea.

---

## Pasos del flujo

1. **Compra**: en la landing el comerciante elige plan y email → `POST /checkout` (reutiliza licencia existente si la hay) → redirige a Checkout de MercadoPago.

2. **Pago aprobado**: webhook `payment.created` → licencia pasa a `active` y `next_billing` se extiende +30 días (desde vencimiento vigente o desde hoy).

3. **Registro / trial**: al crear el primer admin, `AuthService.Register` intenta `ActivarPorEmailOPrueba`. Si no hay licencia paga para ese email, inicia trial de 7 días (plan Máxima).

4. **Activación por email** ("Buscar licencia"): `POST /licencia/activar-por-email` → `license-by-email` + `activate` vinculan la licencia al `machine_id` local y sincronizan la `Suscripcion` (límites por plan).

5. **Verificación continua**: el middleware de `Program.cs` y `Login` llaman `VerificarAcceso` en cada request. Con cache offline de 72h, más evaluación local de gracia/vencimiento y anti-rollback de reloj.

6. **Renovación manual**: el comerciante vuelve a la landing y paga el mismo plan → se extiende la licencia existente, no se crea una nueva.

7. **Vencimiento y bloqueo**: pasada la gracia, `VerificarAcceso` devuelve falso (incluso offline) y el frontend redirige al login; el badge del header avisa el tiempo restante.

---

## Páginas involucradas

- `landing/index.html` + `licensing-worker` (landing servida por el Worker).
- `frontend/src/pages/LoginPage.tsx` (registro + "Buscar licencia").
- `frontend/src/pages/ConfiguracionPage.tsx` (estado de licencia + "Buscar licencia").
- `frontend/src/components/Layout.tsx` (badge de vencimiento/renovación).

---

## Reglas de negocio aplicables

- `BUS-vencimiento-licencia` (gracia, renovación, trial, email case-insensitive, anti-rollback).

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: BUS-vencimiento-licencia
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
