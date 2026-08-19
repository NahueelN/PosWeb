# BUS-vencimiento-licencia

> Reglas de vencimiento, gracia, renovación y bloqueo de licencias de PosWeb. Toda la lógica de "cuándo una licencia deja de ser válida" debe respetar estas invariantes, tanto en el Worker como en el backend local.

---

## Metadata

```yaml
ID: BUS-vencimiento-licencia
Type: Business Rule
Name: Reglas de vencimiento, gracia y renovación de licencias
Status: Active
Priority: Critical
Level: Project
Sources:
  - licensing-worker/src/index.ts
  - PosWeb/Application/Licensing/LicenciaService.cs
  - PosWeb/Domain/LicenciaConfig.cs
Created: 2026-08-19
Updated: 2026-08-19
Template Version: 1.0
Tags:
  - Suscripcion
  - Offline
```

---

## Descripción

Define cómo vence una licencia, qué período de gracia se concede, cómo se extiende al renovar y cómo se bloquea el acceso (incluso offline). Es la regla de negocio central del modelo de suscripciones.

---

## Reglas

1. **Renovación extiende 30 días**: al aprobarse un pago, `next_billing` se recalcula sumando 30 días. La base es el `next_billing` vigente si todavía está en el futuro (se respeta el vencimiento original), o el día de hoy si la licencia ya venció. Implementación: `calcularNuevoVencimiento()` / `fechaBaseParaRenovacion()` en el worker.

2. **Gracia de 48 horas**: al pasar `next_billing`, la licencia entra en `grace` (sigue permitiendo operar) durante 48 horas. `grace_until = next_billing + 48h`. El valor efectivo es 48h (`LicenciaConfig.GraceHoras`).

3. **Vencimiento revoca el acceso**: pasada la gracia, el estado pasa a `expired` y el acceso se deniega. El bloqueo se evalúa **localmente** (sin depender del Worker ni del cache de 72h) comparando contra `next_billing + 48h`.

4. **Trial de 7 días**: una instalación sin licencia paga inicia una prueba gratuita de 7 días con plan Máxima. Al vencer degrada a plan Básica (`DegradarSuscripcionABasica`) y se marca `trial-expired`, bloqueando el acceso.

5. **Email case-insensitive**: el email es la clave de búsqueda de la licencia. Debe normalizarse a minúsculas (y trim) tanto al guardar como al buscar, para evitar que `Foo@Bar.com` y `foo@bar.com` sean tratados como cuentas distintas.

6. **Renovación reutiliza la licencia existente**: si ya existe una licencia para el email, el checkout reutiliza su `license_key` y `machine_id` (no crea una fila nueva). El pago extiende el vencimiento de la misma licencia.

7. **Una licencia, una máquina**: la activación vincula la licencia a un `machine_id`. Intentar activarla en otra máquina devuelve conflicto (409).

8. **Anti-rollback de reloj**: el backend mantiene una marca de reloj máxima vista (`LastSeenUtc`) que solo avanza. Si la hora del sistema retrocede más de 5 minutos respecto de esa marca, el acceso se bloquea con "Se detectó un cambio de hora. Verificar fecha y hora." (tolerancia 5 min; persistencia cada 1 min).

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: ADR-suscripciones
  - type: RESPECTED_BY
    target: FLOW-suscripcion
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-08-19 | Creación |
