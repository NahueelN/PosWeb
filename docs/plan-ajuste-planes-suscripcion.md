# Plan: redefinir planes de suscripción → Basica / Maxima (sin Media)

> Documento de planificación guardado en la rama `Suscripciones`.
> **NO implementado todavía.** Retomar cuando se apruebe.

## Objetivo

Ajustar los planes para que cumplan estas limitaciones:

- **Maxima**: sin límite de usuarios. Tiene **validación de compras por MercadoPago** (cobrar/verificar pagos MP).
- **Basica**: solo **3 usuarios total** (3 cuentas en total).
- **Prueba**: nivel **máximo** por **1 semana**. Al vencer, si no se paga (Basica o Maxima), se **bloquea el acceso**.

## Decisiones cerradas con el cliente

1. **Se elimina el plan Media** del sistema. No hay datos reales en Media (se limpia solo código).
2. **Basica** = 1 sucursal + **3 cuentas totales** (admins bajo el titular + usuarios comunes, cualquier mezcla) + **sin MercadoPago**.
3. **Maxima** = sucursales ilimitadas + usuarios ilimitados + **MercadoPago habilitado** (vincular, QR, cobrar/verificar pagos).
4. **Prueba**: ya inicia como nivel Maxima por 7 días (`LicenciaConfig.IniciarPruebaGratuita`). Conserva todo, incluido MP. Al vencer sin pago el acceso queda bloqueado (comportamiento actual ya devuelve `false`). Si luego paga Basica o Maxima, la reactivación resincroniza la `Suscripcion`.

## Semántica nueva de campos de `Suscripcion`

- `MAX_USUARIOS` pasa a significar **tope de cuentas totales bajo el titular** (antes solo contaba `UsuarioComun`).
  - Basica = `3` · Maxima = `null` (ilimitado).
- `MAX_ADMIN` deja de ser un tope separado → se setea `null` (los admins cuentan dentro del tope total).
- `MAX_SUCURSALES` sin cambios: Basica `1`, Maxima `null`.

## Cambios por archivo

### Backend / Dominio

1. **`PosWeb.Domain/Suscripcion.cs`**
   - `NivelesSuscripcion`: sacar `Media`; `Todos = { Basica, Maxima }`.
   - Borrar `CrearMedia`. `CrearBasica` → `(1, null, 3)`.
   - Agregar helper `AplicarLimitesPorNivel()` que setea los MAX según plan (centraliza sync/degradación/normalización).
2. **`PosWeb.Domain/LicenciaConfig.cs`**
   - `PlanLimits.Get`: sacar caso Media; `Basica => (1, int.MaxValue, 3)`, `Maxima => (int.MaxValue, int.MaxValue, int.MaxValue)`.
3. **`PosWeb/Application/Auth/AuthService.cs`** (`ValidarCupoSuscripcion`)
   - Reescribir el conteo a **tope total**: cap = `MAX_USUARIOS` (si `null` → sin límite). Cuenta `Admin` activos bajo titular (incluye el titular) + `UsuarioComun` activos cuyo responsable está en ese set de admins. Si `count >= cap` → `SuscripcionSinCupoException`.
   - Eliminar la rama separada de `MAX_ADMIN`.
4. **`PosWeb/Application/Licensing/LicenciaService.cs`**
   - `ObtenerLimitesPlan`: sacar caso Media; default/desconocido → Basica.
   - `NormalizarPlan`: sacar `"media"`.
   - `DegradarSuscripcionABasica` y `SincronizarSuscripcionConLicencia`: usar límites nuevos (vía `AplicarLimitesPorNivel`).
   - Agregar método `PermiteMercadoPago()` / exponer nivel actual del titular (para gatear MP).
5. **`PosWeb/Program.cs`** (seed): normalizar filas `Suscripcion` existentes Basica/Maxima a los límites nuevos al iniciar (idempotente), para instalaciones ya creadas.

### Gating de MercadoPago (solo Maxima / prueba)

6. **`PosWeb/Controllers/MercadoPagoController.cs`**: en `auth-url`, `estado`, `desvincular`, `qr`, `verificar-pago` → si el plan del titular no es Maxima, responder 403 con motivo "disponible solo en plan Máximo".
7. **`PosWeb/Application/Ventas/VentaService.cs`** (rama MP/QR y venta pendiente QR/transferencia): rechazar si `!PermiteMercadoPago()`.
8. **Frontend**: `Layout.tsx` (botones "Vincular MP"/"Ver QR"), `VentasPage.tsx` (oferta de medios QR/transferencia): ocultar MP cuando la licencia no sea Maxima (trial o paga = `plan === 'Maxima'`).

> **Verificado (estado actual):** hoy los botones "Vincular MP" y "Ver QR" se muestran solo según el rol (`canCreateUsers` = Admin/SuperAdmin, `Layout.tsx`), **sin mirar el plan**. Un usuario con suscripción **Basica** puede vincular MP y operar el QR. Requisito: además del rol, ocultar esos botones (y los medios QR/transferencia en ventas) cuando la licencia no sea **Maxima** (o prueba = Maxima), y rechazar con 403 los 5 endpoints de `MercadoPagoController` para planes que no sean Maxima.
>
> **Política con MP ya vinculado:** si un cliente ya tenía MercadoPago vinculado y su plan no es Maxima (p. ej. bajó de plan o venció la prueba), **solo se bloquea la operación** (no se puede cobrar/verificar QR ni ver el QR). **No se desvincula** su cuenta MP ni se borran sus tokens; si vuelve a Maxima, queda operativo de nuevo.

### Eliminación de Media (storefront + worker + landing)

9. **`licensing-worker/src/index.ts`**: `PLAN_PRICES` (sacar media), `VALID_PLANS`, `LANDING_HTML` (quitar card Media; textos Basica "3 usuarios", Maxima "ilimitados + MercadoPago"; badge a Maxima).
10. **`landing/`**: `index.html` planes/textos ídem worker.

### Frontend (limpieza + texto)

11. Quitar referencias a "Media/Plan Medio" en `frontend/src`. Ajustar etiquetas de límites en `AltaUsuarioPage.tsx` / `ConfiguracionPage.tsx` para reflejar "3 en total".

### Tests

12. **`PosWeb.Application.Test/UsuariosSubscriptionTest.cs`**: actualizar los que asumen Basica `(1,1,1)` o Media:
    - `Register_ConPlanBasico_NoPermiteMasUsuariosComunes` → con titular (1) admite 2 comunes y el 3º lanza.
    - `Register_ConPlanMedia_NoPermiteMasAdmins` → reemplazar por caso de tope total (mezcla admin+cajeros suma ≤ 3) y por Maxima sin tope.
    - Tests con `Plan=Media` → usar Basica/Maxima.
    - Tests de prueba/degradación → ajustar expectativa del degrade (Basica nueva).

## Dejar como está (a propósito)

- `MAX_SUCURSALES` no se enforcea al crear sucursales (hoy solo display). Con Basica=1 / Maxima=ilimitado no empeora; queda documentado.
- Polling de transferencias (`TransferenciaPollingService`) sin gate: sin tokens/vínculo MP en Basica no hay ventas MP pendientes que procesar.

## Verificación al implementar

- `dotnet build` + `dotnet test` en la solución.
- `npx tsc -b` en `frontend`.
- Si corresponde, deploy de `licensing-worker` + `landing` (se coordina aparte).
