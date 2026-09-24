# SERVICE-licensing-worker

> Worker de licencias y cobro de suscripciones. Fuente de verdad de "quién pagó" y emisor del estado de licencia que el backend local replica para el cumplimiento offline.

---

## Metadata

```yaml
ID: SERVICE-licensing-worker
Type: Service
Name: LicensingWorker — License subscription & payment service
Status: Active
Priority: Critical
Level: Project
Sources:
  - licensing-worker/src/index.ts
  - licensing-worker/migrations/0001_create_licenses.sql
  - licensing-worker/wrangler.jsonc
  - PosWeb/Application/Licensing/LicenciaService.cs
  - PosWeb/Controllers/LicenciaController.cs
  - PosWeb/appsettings.json
Created: 2026-08-19
Updated: 2026-09-23
Template Version: 1.0
Tags:
  - Suscripcion
  - Auth
```

---

## Descripción

`licensing-worker` es un Cloudflare Worker con D1 (`posweb-licenses`) que vende licencias mediante Checkout Preferences de MercadoPago, recibe webhooks de pago y expone el estado de licencia al backend .NET. El backend (`LicenciaService`) lo consulta para activar y verificar licencias, y guarda localmente la copia de vencimiento.

Es el análogo de `SERVICE-catalogo` (mismo patrón Worker + D1 + proxy en backend), pero con autoridad de **derechos de uso** en lugar de datos compartidos.

---

## Problema que resuelve

Sin un servicio cloud, no habría forma confiable de cobrar y de determinar si una instalación tiene derecho a operar. La base local es editable y el backend local no puede custodiar secretos de MercadoPago. El Worker concentra el pago y el estado canónico de la licencia.

---

## Estructura

### 1. Endpoints públicos

| Endpoint | Propósito |
|----------|-----------|
| `POST /checkout` | Crea (o reutiliza) la licencia y genera una Checkout Preference; devuelve `checkout_url`. Rechaza `plan=gratuito` (el plan Gratuito no se contrata). |
| `POST /webhook` | Recibe notificaciones de MercadoPago (pagos y, a futuro, preapproval). |
| `POST /activate` | Vincula la licencia a un `machine_id` (una máquina por licencia). |
| `POST /status` | Devuelve estado efectivo de la licencia (validez, `next_billing`, `grace_until`, días restantes). |
| `GET /`, `/success.html`, `/error.html` | Landing de planes y páginas de resultado. |

### 2. Endpoints internos (requieren `POSWEB_INTERNAL_KEY`)

| Endpoint | Propósito |
|----------|-----------|
| `POST /register` | Alta del email como **plan gratuito placeholder** (`status=pending`, `next_billing=NULL`). Lo llama el backend al registrarse un titular. No se activa (no pisa la prueba gratuita local) y **no degrada** una licencia paga existente. |
| `POST /license-by-email` | Busca la licencia por email (normalizado a minúsculas). |
| `POST /grant-license` | Otorga una licencia manualmente (operación de backoffice). |

### 3. Estado de licencia

`pending → active → grace (48h) → expired`, más `paused` y `cancelled`. La evaluación de vigencia (`evaluarVigencia`) computa `active`/`grace`/`expired` a partir de `next_billing` en cada lectura y lo persiste (`persistirVigencia`), de modo que no depende de un cron.

### 4. Precios y planes

| Plan | Precio mensual (ARS) | Notas |
|------|----------------------|-------|
| `gratuito` | 0 | No se contrata: es el nivel que se obtiene al vencer la prueba. `/checkout` lo rechaza. |
| `basica` | 32500 | |
| `maxima` | 39990 | |

`VALID_PLANS = ['gratuito', 'basica', 'maxima']`.

### 5. Webhook

Verifica firma `x-signature` (HMAC-SHA256 con `MP_WEBHOOK_SECRET`, opcional). Para `payment.created`/`payment.updated`, busca la licencia por `external_reference` (`plan:{plan}:{email}:{license_key}`) y, si el pago es `approved`, setea `active` y extiende `next_billing` (+30 días). Estados terminales (`refunded`, `cancelled`, `rejected`, `charged_back`) → `cancelled`.

---

## Cuándo usar

- Para crear el checkout de una licencia nueva o renovación.
- Para consultar el estado de una licencia desde el backend (`/status`, `/license-by-email`).
- Para activar una licencia en una máquina (`/activate`).
- Para dar de alta un email al registrarse (`/register`), de modo que el checkout posterior reutilice el registro.

## Cuándo NO usar

- No usar para cobrar las ventas del comercio (eso es el flujo QR/POS de `MercadoPagoService`, distinto).
- No usar `grant-license` desde el cliente; es operación de backoffice.
- No asumir auto-renovación: no hay preapproval creado hoy; la renovación es manual.
- No activar una licencia placeholder gratuito: el backend ignora el plan `gratuito` al activar por email para no pisar la prueba gratuita local.

---

## Consideraciones técnicas

- **D1 `preapproval_id`**: la columna existe en el schema pero hoy no se usa para preapproval real (los handlers `subscription_preapproval` / `subscription_authorized_payment` están cableados para el futuro).
- **Email**: se normaliza a minúsculas en checkout y en todos los lookups.
- **Firma de webhook**: `if (!secret || !signature) return true` — sin secreto configurado, se acepta todo (deuda de hardening).
- **`/register`**: crea la fila con `status=pending` y `plan=gratuito`; si el email ya tiene una licencia paga, no la degrada. El backend llama a este endpoint con `Bearer POSWEB_INTERNAL_KEY` y fire-and-forget.

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: ADR-suscripciones
  - type: RESPECTS
    target: BUS-vencimiento-licencia
  - type: RESPECTS
    target: BUS-limites-planes
  - type: USED_BY
    target: LicenciaService.cs
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-08-19 | Creación |
| 2026-09-23 | Planes Gratuito/Básico/Máximo, precios actualizados, endpoint `/register` |