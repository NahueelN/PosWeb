# FLOW-confirmacion-email

> Flujo de confirmación de email: del registro al acceso desbloqueado.

---

## Metadata

```yaml
ID: FLOW-confirmacion-email
Type: Flow
Name: Email confirmation flow
Status: Active
Priority: High
Level: Project
Sources:
  - frontend/src/pages/LoginPage.tsx
  - frontend/src/api/client.ts
  - PosWeb/Controllers/AuthController.cs
  - PosWeb/Application/Auth/AuthService.cs
  - PosWeb.Domain/Usuario.cs
  - PosWeb.Domain/PasswordResetToken.cs
  - PosWeb/Application/Auth/MailerService.cs
Created: 2026-10-02
Updated: 2026-10-02
Template Version: 1.0
Tags:
  - Auth
```

---

## Descripción

Cuando un usuario se registra, su cuenta queda pendiente de confirmación: no puede iniciar sesión hasta validar un código de 6 dígitos enviado a su email. El código se puede reenviar. Una vez confirmado, el login (y el PIN) quedan habilitados.

---

## Diagrama de estados

```
Register
    │ (emailConfirmado: false)
    ▼
[Cuenta sin confirmar] ── login/PIN → 401 "Confirmá tu email"
    │
    │  código enviado (fire-and-forget al registrarse)
    │  o reenvío desde /reenviar-codigo
    ▼
[Pantalla confirmación] → POST /confirmar-cuenta { email, codigo }
    │
    ├─ código correcto → EMAIL_CONFIRMADO = true → login OK
    └─ código erróneo/vencido/usado → "Código inválido o expirado"
```

---

## Pasos del flujo

1. **Registro**: `AuthService.Register` crea el usuario con `emailConfirmado: false`. El controlador, fire-and-forget, llama `EnviarCodigoConfirmacionAlRegistrar` → `SolicitarConfirmacionEmail` (crea token `PROPOSITO=confirmacion`, throttle 1/min) → `MailerService` envía el código.

2. **Login bloqueado**: el usuario intenta entrar. `Login` valida la contraseña y, si `!EsEmailConfirmado()`, lanza `EmailNoConfirmadoException`. El frontend detecta el mensaje y muestra la pantalla de confirmación.

3. **Pantalla de confirmación**: campos email + código, botón "Confirmar email" y "Reenviar código". Si el usuario se registró, el email viene precargado.

4. **Reenvío**: `POST /reenviar-codigo` (respuesta genérica anti-enumeración). Aplica throttle 1/min.

5. **Confirmación**: `POST /confirmar-cuenta` valida el token de propósito `confirmacion` (no expirado, no usado, ≤5 intentos, código con BCrypt) y marca `EMAIL_CONFIRMADO = true`, invalidando tokens de confirmación restantes.

6. **Acceso**: el usuario vuelve al login y entra con normalidad (contraseña o PIN).

---

## Páginas involucradas

- `frontend/src/pages/LoginPage.tsx` (pantalla de confirmación; detección de bloqueo en login y post-registro).
- `frontend/src/api/client.ts` (`api.auth.reenviarCodigo` / `api.auth.confirmarCuenta`).

---

## Reglas de negocio aplicables

- `BUS-confirmacion-email` (todas sus invariantes).
- `BUS-recuperacion-contrasena` (mecanismo de código compartido: hash, expiración, intentos, anti-enumeración).

---

## Flujo de teclado

- Pantalla de confirmación: foco inicial en email (o código si el email vino precargado).
- Código: solo dígitos, máx 6.
- "Volver al inicio de sesión" siempre disponible.

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: BUS-confirmacion-email
  - type: RELATED
    target: FLOW-recuperacion-contrasena
  - type: USES
    target: SERVICE-mailer-worker
  - type: RESPECTS
    target: ADR-mailer-worker-dedicado
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-10-02 | Creación |