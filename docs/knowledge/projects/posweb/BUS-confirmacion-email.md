# BUS-confirmacion-email

> Reglas de negocio de la confirmación de email de cuenta en PosWeb.

---

## Metadata

```yaml
ID: BUS-confirmacion-email
Type: Business Rule
Name: Email confirmation rules
Status: Active
Priority: High
Level: Project
Sources:
  - PosWeb.Domain/Usuario.cs
  - PosWeb.Domain/PasswordResetToken.cs
  - PosWeb/Application/Auth/AuthService.cs
  - PosWeb/Controllers/AuthController.cs
  - PosWeb/Migrations/Local/20261002174838_AddEmailConfirmadoAndProposito.cs
  - frontend/src/pages/LoginPage.tsx
Created: 2026-10-02
Updated: 2026-10-02
Template Version: 1.0
Tags:
  - Auth
```

---

## Descripción

Reglas invariantes de la confirmación de email. Una cuenta recién registrada inicia con `EMAIL_CONFIRMADO = false` y **no puede iniciar sesión** hasta validar un código de 6 dígitos enviado a su mailbox. Las cuentas pre-existentes quedan confirmadas (la migración aplica `defaultValue: true`).

---

## Reglas

1. **Bloqueo de login**: un usuario con `EMAIL_CONFIRMADO = false` no puede iniciar sesión ni por contraseña ni por PIN. El login lanza `EmailNoConfirmadoException` (401, mensaje "Confirmá tu email...") después de validar la contraseña. El frontend redirige a la pantalla de confirmación.

2. **Cuentas existentes confirmadas**: la migración agrega `EMAIL_CONFIRMADO` con `defaultValue: true`, de modo que toda cuenta creada antes de la feature queda confirmada sin acción del usuario.

3. **Registro nuevo sin confirmar**: `AuthService.Register` crea el usuario con `emailConfirmado: false` y, fire-and-forget, dispara el envío del código de confirmación. Si el envío falla, el usuario puede reenviarlo desde la pantalla de confirmación del login.

4. **Código de 6 dígitos con PROPOSITO**: la confirmación usa el mismo mecanismo que la recuperación de contraseña (tabla `PASSWORD_RESET_TOKEN`, hash BCrypt, expiración 15 min, 5 intentos, un solo uso, throttle 1/min), pero con `PROPOSITO = "confirmacion"`. Un token `reset` no confirma un email ni viceversa: las consultas siempre filtran por `PROPOSITO`.

5. **Anti-enumeración**: `POST /reenviar-codigo` responde siempre el mismo mensaje, exista o no el email y esté o no confirmado. `POST /confirmar-cuenta` usa "Código inválido o expirado" para cualquier causa.

6. **Idempotencia de confirmación**: confirmar un email ya confirmado es un no-op exitoso (no lanza error). Esto protege dobles envíos del formulario o clics repetidos.

7. **Reenvío con throttle**: a lo sumo 1 código por minuto por usuario (mismo `ReintentoMinimo` que la recuperación).

8. **El envío fallido descarta el token**: si el mailer no responde, el token se marca usado para que el reintento genere uno nuevo sin códigos huérfanos (misma regla que la recuperación).

9. **La validación es local**: el mailer solo entrega el código; la confirmación y el cambio de estado son locales (coherente con el modelo offline-first).

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: BUS-recuperacion-contrasena
  - type: USED_BY
    target: FLOW-confirmacion-email
  - type: RESPECTS
    target: ADR-mailer-worker-dedicado
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-10-02 | Creación |