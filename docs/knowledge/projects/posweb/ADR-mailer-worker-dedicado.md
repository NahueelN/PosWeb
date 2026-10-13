# ADR-mailer-worker-dedicado

> Decisión: worker dedicado de email + validación local del código de recuperación.

---

## Metadata

```yaml
ID: ADR-mailer-worker-dedicado
Type: ADR
Name: Dedicated mailer worker + local password recovery validation
Status: Active
Priority: High
Level: Project
Sources:
  - mailer-worker/src/index.ts
  - PosWeb/Application/Auth/MailerService.cs
  - PosWeb/Application/Auth/AuthService.cs
  - PosWeb.Domain/PasswordResetToken.cs
  - docs/PKS_PROPOSALS.md
Created: 2026-10-02
Updated: 2026-10-02
Template Version: 1.0
Tags:
  - Auth
```

---

## Contexto

PosWeb no tenía infraestructura de email. Para la recuperación de contraseña (y cualquier email transaccional futuro) había que elegir: dónde enviar el email y dónde validar el código. Restricciones de la plataforma:

- **Workers de Cloudflare bloquean SMTP saliente en puerto 25** y hacer SMTP por `connect()` en 465/587 es código no estándar y frágil.
- **Las credenciales de PosWeb son 100% locales** (SQLite): la nube no guarda passwords. El login funciona offline. La identidad del usuario vive en el sidecar local.
- El email del usuario existe en `USUARIO.MAIL` (obligatorio al registrarse).

---

## Decisión

1. **Un worker dedicado (`mailer-worker`)** envía los emails vía **Zoho ZeptoMail** (REST API por HTTPS). El backend local lo llama con auth interna (`MAILER_INTERNAL_KEY`), replicando el patrón de `licensing-worker`/`catalogo-worker`.
2. **El código de recuperación se genera, guarda y valida en la SQLite local** (hasheado con BCrypt). El worker solo entrega el email; no conoce códigos ni passwords.
3. El mecanismo es un **código de 6 dígitos** con expiración, un solo uso y límite de intentos (no un link mágico).

---

## Alternativas consideradas

| Alternativa | Descarte |
|-------------|----------|
| **Extender `licensing-worker`** con `/send-reset-email` | Menos infraestructura, pero mezcla responsabilidades (licencias/pagos vs email transaccional). El mailer es reutilizable para otros casos (landing, facturas) sin tocar licensing. |
| **SMTP directo desde el Worker** (`smtp.zoho.com:465`) | Técnicamente posible con `connect()`, pero no idiomático, frágil y sin el respaldo de reputación de ZeptoMail. |
| **Email desde el sidecar .NET local** (SMTP o API) | Frágil: puertos SMTP suelen estar bloqueados en el local del comercio y los secretos quedarían en la máquina del cliente. Rompe el patrón "los secretos viven en la nube". |
| **Cloudflare Email Service** (binding nativo) | Sin API keys y muy simple, pero requiere onboard del dominio en Cloudflare; el cliente ya opera Zoho (ZeptoMail). |
| **Link mágico en el email** | Más piezas móviles (URL pública + callback) para una app de escritorio/PWA. Un código ingresado en la misma app es más simple y no depende de abrir un navegador. |
| **Validación del código en la nube** (worker/D1) | La identidad de PosWeb es local; validar en la nube habría sido inconsistente con el modelo offline-first y agregaría dependencia de red a un flujo que ya la tiene (el email), sin ganar seguridad real: la propiedad de seguridad es que el código llega al mailbox registrado, no dónde se verifica. |

---

## Consecuencias

### Qué habilita

- Un canal de email transaccional reutilizable (la landing promete "Recibirás tu clave de licencia en este correo" — hoy sin implementar; este worker lo resuelve).
- Flujo de recuperación completo con bajo costo de mantenimiento (el backend genera el contenido, el worker entrega).

### Qué limita

- La recuperación **requiere conectividad** (el mailer es remoto). El login normal sigue funcionando offline; solo la recuperación depende de red.
- Requiere onboard del dominio emisor en ZeptoMail (DNS SPF/DKIM) y secretos del worker (`ZEPTOMAIL_API_KEY`, `MAILER_INTERNAL_KEY`).

### Qué obliga

- Todo nuevo email transaccional debe pasar por `mailer-worker` (no abrir otros canales ni meter secrets de email en el cliente).
- Los códigos de recuperación deben cumplir `BUS-recuperacion-contrasena` (hash, expiración, un solo uso, anti-enumeración).

---

## Cuándo reconsiderar

- Si ZeptoMail deja de ser viable (costo, límites) → evaluar Cloudflare Email Service u otro REST transaccional; el contrato del worker (`POST /send`) no cambiaría.
- Si PosWeb evoluciona hacia identidad en la nube → la validación local del código podría migrar a la nube; hasta entonces es coherente con el modelo offline-first.
- Si el volumen de emails crece mucho → el worker sin estado escala igual (ZeptoMail maneja la cola).

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: SERVICE-licensing-worker
  - type: RELATED
    target: ADR-db-hybrid
  - type: EXTENDS
    target: SERVICE-mailer-worker
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-10-02 | Decisión tomada |