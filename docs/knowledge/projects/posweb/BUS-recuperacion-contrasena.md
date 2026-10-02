# BUS-recuperacion-contrasena

> Reglas de negocio de la recuperación de contraseña de PosWeb.

---

## Metadata

```yaml
ID: BUS-recuperacion-contrasena
Type: Business Rule
Name: Password recovery rules
Status: Active
Priority: High
Level: Project
Sources:
  - PosWeb/Application/Auth/AuthService.cs
  - PosWeb/Controllers/AuthController.cs
  - PosWeb.Domain/PasswordResetToken.cs
  - frontend/src/pages/LoginPage.tsx
  - PosWeb/Application/Auth/MailerService.cs
Created: 2026-10-02
Updated: 2026-10-02
Template Version: 1.0
Tags:
  - Auth
```

---

## Descripción

Reglas invariantes que debe respetar toda implementación de recuperación de contraseña en PosWeb. La identidad de PosWeb es 100% local: el código se genera y valida en la SQLite local; la nube (mailer-worker) solo entrega el email.

---

## Reglas

1. **Código de 6 dígitos**: el código de recuperación es numérico, de exactamente 6 dígitos, generado con `RandomNumberGenerator` (sin sesgo de módulo).

2. **Hash en reposo**: el código nunca se guarda en claro. Se almacena con BCrypt (`TOKEN_HASH`), igual que `PASSWORD_HASH`.

3. **Expiración de 15 minutos**: el token vence a los 15 min de generarse (`EXPIRA_UTC`). Vencido → "Código inválido o expirado".

4. **Un solo uso**: al usarse correctamente (o al solicitarse uno nuevo), el token se marca `USADO`. Un código usado no puede reutilizarse.

5. **Máximo 5 intentos**: cada verificación fallida incrementa `INTENTOS`. Al alcanzar 5, el token deja de ser válido aunque el código sea correcto.

6. **Mensajes genéricos (anti-enumeración)**: `POST /forgot-password` responde siempre el mismo mensaje, exista o no el email. `POST /reset-password` usa "Código inválido o expirado" para cualquier causa (email inexistente, token vencido, usado o código incorrecto). Nunca revelar si un email está registrado.

7. **Throttle de reenvío**: a lo sumo 1 código por minuto por usuario (`CREATED_UTC` vs reintento mínimo). Previene spam de email.

8. **Invalida tokens previos del mismo propósito**: solicitar un nuevo código invalida (marca usado) los anteriores del mismo `PROPOSITO` del usuario. Solo hay un código vigente por tipo por usuario.

9. **Password mínima de 6 caracteres**: la nueva contraseña valida los mismos criterios que el registro (`Register`).

10. **El envío fallido descarta el token**: si el mailer no responde, el token se marca usado para que el reintento del usuario genere uno nuevo sin dejar códigos huérfanos. El mensaje al usuario es idéntico.

11. **La validación es local**: el mailer solo entrega; nunca valida ni guarda el código. La autoridad de la identidad sigue siendo la SQLite local (coherente con el modelo offline-first y con la confianza en los datos locales).

12. **PROPOSITO aísla los flujos**: la tabla `PASSWORD_RESET_TOKEN` es un mecanismo genérico de código por email. `PROPOSITO` (`reset` | `confirmacion`) separa los flujos: un token de recuperación no confirma un email ni viceversa. Toda consulta filtra por `PROPOSITO`. Ver `BUS-confirmacion-email` para las reglas del flujo de confirmación.

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: ADR-mailer-worker-dedicado
  - type: USED_BY
    target: FLOW-recuperacion-contrasena
  - type: USES
    target: SERVICE-mailer-worker
  - type: RELATED
    target: BUS-confirmacion-email
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-10-02 | Creación |
| 2026-10-02 | Token genérico con PROPOSITO; invalidación por propósito; relación con BUS-confirmacion-email |