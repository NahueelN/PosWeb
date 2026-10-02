# FLOW-recuperacion-contrasena

> Flujo de recuperación de contraseña: del login al restablecimiento vía código de 6 dígitos por email.

---

## Metadata

```yaml
ID: FLOW-recuperacion-contrasena
Type: Flow
Name: Password recovery flow
Status: Active
Priority: High
Level: Project
Sources:
  - frontend/src/pages/LoginPage.tsx
  - frontend/src/api/client.ts
  - PosWeb/Controllers/AuthController.cs
  - PosWeb/Application/Auth/AuthService.cs
  - PosWeb.Domain/PasswordResetToken.cs
  - PosWeb/Application/Auth/MailerService.cs
  - mailer-worker/src/index.ts
Created: 2026-10-02
Updated: 2026-10-02
Template Version: 1.0
Tags:
  - Auth
```

---

## Descripción

Cuando un usuario olvida su contraseña, desde el login solicita un código por email, lo ingresa junto con una nueva contraseña, y el backend local (única autoridad de identidad) re-hashea la password con BCrypt.

---

## Diagrama de estados

```
Login ("¿Olvidaste tu contraseña?")
        │
        ▼
[Email] → POST /auth/forgot-password
        │   (respuesta genérica siempre)
        ▼
Token creado localmente (hash BCrypt, 15 min, un solo uso)
        │
        ▼
MailerWorker → ZeptoMail → email con código de 6 dígitos
        │
        ▼
[Código + nueva password] → POST /auth/reset-password
        │
        ├─ código correcto → PASSWORD_HASH = BCrypt(nueva) → token usado → login
        └─ código erróneo/vencido/usado → "Código inválido o expirado" (intento++)
```

---

## Pasos del flujo

1. **Acceso**: en `LoginPage`, el usuario toca "¿Olvidaste tu contraseña?". La página muestra el paso 1 (email).

2. **Solicitud**: `POST /api/auth/forgot-password` con `{ email }`. `AuthService.SolicitarRecuperacion`: valida formato, busca usuario por `MAIL` (case-insensitive), aplica throttle (1/min), invalida tokens previos, genera código de 6 dígitos, guarda hash + expiración, y llama a `MailerService.Enviar`. **La respuesta es siempre la misma** (anti-enumeración). Si el envío falla, el token se marca usado (el usuario reintenta).

3. **Entrega**: `MailerService` llama al `mailer-worker` (`POST /send`, auth interna) que envía vía ZeptoMail desde `hola@vendeto.com.ar` con el código destacado. El frontend avanza al paso 2 (código + nueva contraseña).

4. **Restablecimiento**: `POST /api/auth/reset-password` con `{ email, codigo, nuevaPassword }`. `AuthService.ResetearPassword`: valida nueva password (≥6), busca token vigente del usuario (no usado, no expirado, ≤5 intentos), verifica el código con BCrypt, re-hashea `PASSWORD_HASH`, marca el token usado e invalida los restantes.

5. **Confirmación**: mensaje "Contraseña actualizada. Ya podés iniciar sesión." y vuelta al login. El usuario inicia sesión con la nueva contraseña.

---

## Páginas involucradas

- `frontend/src/pages/LoginPage.tsx` (paso 1: email; paso 2: código + nueva password).
- `frontend/src/api/client.ts` (`api.auth.forgotPassword` / `api.auth.resetPassword`).
- `PosWeb/Controllers/AuthController.cs` (endpoints `AllowAnonymous`).

---

## Reglas de negocio aplicables

- `BUS-recuperacion-contrasena` (todas sus invariantes).

---

## Flujo de teclado

- Paso 1: foco inicial en el campo email (`autoFocus`).
- Paso 2: foco inicial en el campo código (solo dígitos, máx 6).
- `Volver al inicio de sesión` siempre disponible para cancelar.

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: BUS-recuperacion-contrasena
  - type: USES
    target: SERVICE-mailer-worker
  - type: RESPECTS
    target: ADR-mailer-worker-dedicado
  - type: RELATED
    target: FLOW-suscripcion
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-10-02 | Creación |