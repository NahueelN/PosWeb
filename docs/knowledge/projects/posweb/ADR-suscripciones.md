# ADR-suscripciones

> Modelo de suscripciones y licencias de PosWeb: checkout manual mensual resuelto en un Worker cloud, con cumplimiento local offline.

---

## Metadata

```yaml
ID: ADR-suscripciones
Type: ADR
Name: Suscripciones y licencias — checkout manual mensual con cumplimiento local
Status: Active
Priority: Critical
Level: Project
Sources:
  - licensing-worker/src/index.ts
  - licensing-worker/migrations/0001_create_licenses.sql
  - licensing-worker/wrangler.jsonc
  - PosWeb/Application/Licensing/LicenciaService.cs
  - PosWeb/Domain/LicenciaConfig.cs
  - PosWeb/Program.cs
  - PosWeb/appsettings.json
Created: 2026-08-19
Updated: 2026-08-19
Template Version: 1.0
Tags:
  - Suscripcion
  - Auth
  - Offline
```

---

## Contexto

PosWeb es una app de escritorio offline-first: cada instalación opera contra una base local (SQLite) y debe seguir funcionando sin conexión. A la vez necesita cobrar por uso mediante planes mensuales (Básica, Media, Máxima). Esto plantea una tensión: la fuente de verdad de "quién pagó" no puede vivir en la base local (editable por el usuario), pero el cumplimiento del vencimiento sí debe ejecutarse localmente para no depender de internet.

A diferencia de `ADR-catalogo-productos` (que resuelve un catálogo compartido), acá el Worker es autoridad de **derechos de uso** (entitlement), no de datos de producto.

---

## Decisión

Las licencias se venden, renuevan y validan en un Cloudflare Worker (`licensing-worker`) con D1 como fuente de verdad, y el backend local (`LicenciaService` + `LicenciaConfig`) mantiene una copia local de los datos de vencimiento para **hacer cumplir el bloqueo offline**. El cobro es un **checkout manual mensual** (Checkout Preference), no una suscripción automática (preapproval).

---

## Alternativas consideradas

| Alternativa | Descarte |
|-------------|----------|
| Suscripción automática (MercadoPago `preapproval` + `subscription_authorized_payment`) | Se difiere a futuro. Implica cron de expiración, reintentos, webhooks de preapproval y conciliación. El checkout manual alcanza para el MVP. |
| Cumplimiento 100% server-side (validar cada request contra el Worker) | Rompe el requisito offline-first. Requeriría conexión permanente. |
| Token offline firmado (ECDSA) para blindar el vencimiento local | Se posterga como hardening. El público objetivo (comerciantes) no justifica el costo hoy; se cubre con anti-rollback de reloj. |
| Vender la licencia desde el backend .NET | El backend local es distribuible e inspeccionable; no puede custodiar secretos de MercadoPago ni ser autoridad confiable. El Worker sí. |

---

## Consecuencias

### Qué habilita

- Cobro real por planes sin exponer secretos de MercadoPago en el cliente.
- Cumplimiento offline del vencimiento (gracia + bloqueo) sin conexión.
- Una instalación = una máquina (`machine_id`), con renovación que reutiliza la licencia existente.
- Trial de 7 días para captar sin fricción de pago inicial.

### Qué limita

- La base local sigue siendo editable por el usuario; el anti-rollback solo frena el atraso del reloj, no la edición directa de la DB. Blindaje real requiere el token firmado.
- `licensing-worker` aún no firma el estado de licencia (los datos viajan en texto plano del Worker al cliente).
- El `Licensing:InternalKey` es un secreto compartido que se envía a cada cliente: no autentica de forma robusta los endpoints internos (`/license-by-email`, `/grant-license`).

### Qué obliga

- Renovación manual cada mes por parte del comerciante (UX de "Buscar licencia" / landing).
- Mantener sincronizado el vencimiento entre Worker y copia local (`next_billing`, `grace_until`, estado).
- Duplicar la regla de gracia/vencimiento en dos lugares (Worker TS y backend C#), lo que exige disciplina para no divergir.

---

## Cuándo reconsiderar

- Cuando se quiera auto-renovación: incorporar preapproval y activar los handlers `subscription_preapproval` / `subscription_authorized_payment` que hoy están cableados pero sin preapproval real.
- Cuando aparezcan intentos reales de burlar el vencimiento editando la DB: promover el token firmado (ECDSA).
- Cuando `InternalKey` se vuelva un riesgo: reemplazar por un mecanismo de autenticación que no se shipee al cliente (o mover `grant-license` fuera del cliente).

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: ADR-catalogo-productos
  - type: RELATED
    target: ADR-db-hybrid
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-08-19 | Decisión documentada |
