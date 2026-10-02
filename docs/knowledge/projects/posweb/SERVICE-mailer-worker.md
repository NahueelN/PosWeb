# SERVICE-mailer-worker

> Worker de email transaccional de PosWeb. Único punto de salida de emails: el backend local genera el contenido, el worker lo entrega vía ZeptoMail.

---

## Metadata

```yaml
ID: SERVICE-mailer-worker
Type: Service
Name: MailerWorker — transactional email via ZeptoMail
Status: Active
Priority: High
Level: Project
Sources:
  - mailer-worker/src/index.ts
  - mailer-worker/wrangler.jsonc
  - PosWeb/Application/Auth/MailerService.cs
  - PosWeb/Controllers/AuthController.cs
  - PosWeb/appsettings.json
Created: 2026-10-02
Updated: 2026-10-02
Template Version: 1.0
Tags:
  - Auth
  - Suscripcion
```

---

## Descripción

`mailer-worker` es un Cloudflare Worker (Hono, sin D1) que envía emails transaccionales usando la REST API de Zoho ZeptoMail (`POST https://cpaas.zoho.com/v1.1/email`). El backend .NET local (`MailerService`) es su único cliente, autenticado con `Bearer MAILER_INTERNAL_KEY`. Es el mismo patrón de los otros workers (auth interna + HTTP), pero sin estado: no almacena nada, solo entrega.

## Problema que resuelve

PosWeb no tenía ningún canal de email. La recuperación de contraseña (y a futuro cualquier email transaccional, incluido el copy sin implementar de la landing "Recibirás tu clave de licencia en este correo") necesita llegar al mailbox del usuario. Un Worker es el lugar natural: concentra el secret de ZeptoMail fuera de la máquina del cliente y evita SMTP frágil desde el sidecar local.

## Por qué ZeptoMail y no otro canal

- **ZeptoMail** (servicio transaccional de Zoho): REST API por HTTPS → funciona nativamente en Workers con `fetch()`. Primer crédito gratis (10.000 emails), luego paga-por-uso (~US$2,50 / 10.000 emails, válido 6 meses). Mismo ecosistema que el Zoho Mail corporativo del cliente.
- **SMTP directo desde el Worker** (`smtp.zoho.com:465`): técnicamente posible vía `connect()` de Workers (solo el puerto 25 está bloqueado), pero es código no estándar y frágil.
- **Cloudflare Email Service**: binding nativo sin API keys, pero requiere onboarding del dominio en el ecosistema Cloudflare; el cliente ya opera Zoho.

## Estructura

### Endpoints

| Endpoint | Propósito |
|----------|-----------|
| `POST /send` | Envía un email transaccional. Requiere `Bearer MAILER_INTERNAL_KEY`. Body: `{ to, subject, htmlBody?, textBody? }` (acepta también snake_case `html_body`/`text_body`). Valida email, largo de subject y presencia de cuerpo. Devuelve `{ ok }`. |
| `POST /contact` | Formulario de contacto público del sitio vendeto.com.ar. CORS restringido a `vendeto.com.ar` / `vendeto.vercel.app`. Body: `{ nombre, email, consulta }`. Envía a `CONTACT_TO` (`soporte@vendeto.com.ar`) con `reply_to` = email del cliente. Rate-limit por IP (5/hora) vía Cache API. |
| `GET /health` | Healthcheck simple. |

### Configuración

- `wrangler.jsonc`: vars `FROM_EMAIL` (`hola@vendeto.com.ar`), `FROM_NAME` (`Vendeto`) y `CONTACT_TO` (`soporte@vendeto.com.ar`).
- Secrets (no versionados): `MAILER_INTERNAL_KEY`, `ZEPTOMAIL_API_KEY`.

### Cliente backend (`MailerService`)

- `PosWeb/Application/Auth/MailerService.cs`: `HttpClient` con timeout 10s, URL + InternalKey desde config `Mailer:*`, auth Bearer, body snake_case.
- `Enviar(to, subject, htmlBody, textBody)` → `bool`. Devuelve `false` si no hay config o falla la red (nunca lanza): el flujo de recuperación degrada sin romper.

---

## Cuándo usar

- Para enviar cualquier email transaccional de PosWeb (hoy: código de recuperación de contraseña y formulario de contacto del sitio).
- Cuando el destinatario es el usuario/titular y el contenido lo genera el backend local (`/send`).
- Cuando un formulario público del sitio necesita llegar a la casilla de soporte (`/contact`).

## Cuándo NO usar

- No usar para marketing/newsletters (ZeptoMail es solo transaccional).
- No usar para recibir emails (eso es otra infraestructura).
- No llamar `/send` desde el frontend: es endpoint interno, solo el backend local tiene la clave.
- No usar `/contact` para otros fines: es público, con rate-limit y body fijo del formulario.

---

## Consideraciones técnicas

- **Auth interna**: `checkInternalAuth` replica el patrón de `licensing-worker` (`Authorization: Bearer ${MAILER_INTERNAL_KEY}`). Sin clave configurada → 401 siempre.
- **Validación de cuerpo**: email con regex simple, subject máx 200 chars, al menos `htmlBody` o `textBody`.
- **ZeptoMail**: header `Authorization: Zoho-enczapikey <token>`; `from` como objeto `{ address, name }`; `to` como array de `{ email_address: { address } }`; `reply_to` opcional con misma forma. Endpoint CPaaS `cpaas.zoho.com/v1.1/email` (la cuenta de Vendeto usa la ruta CPaaS; otras cuentas pueden usar `api.zeptomail.com`).
- **Rate-limit `/contact`**: clave por IP construida sobre el hostname real del worker (la Cache API rechaza hosts sintéticos, p.ej. `mailer.local`), `Cache-Control: max-age` define la ventana. Suficiente para frenar spam; no es una garantía de consistencia.
- **`reply_to`**: en `/contact` se setea al email del cliente para que soporte responda directo a la casilla del cliente sin copiar el email a mano.
- **Escape HTML**: el contenido de `/contact` se escapa (`escapeHtml`) antes de insertarse en el cuerpo del email (prevención de HTML injection).
- **Sin D1**: el worker no persiste nada. Los códigos de recuperación viven solo en la SQLite local (ver `BUS-recuperacion-contrasena`).
- **Fire-and-forget en backend**: el fallo de envío no rompe la solicitud de recuperación (marca el token como usado y devuelve el mensaje genérico).

---

## Relaciones

```yaml
RELATIONS:
  - type: USED_BY
    target: MailerService.cs
  - type: RESPECTS
    target: ADR-mailer-worker-dedicado
  - type: RESPECTS
    target: BUS-recuperacion-contrasena
  - type: USES
    target: FLOW-recuperacion-contrasena
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-10-02 | Creación |
| 2026-10-02 | Endpoint `/contact` (formulario público del sitio) + CORS + rate-limit por IP + `reply_to` |