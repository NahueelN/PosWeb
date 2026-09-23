# Plan: redefinir planes de suscripción → Basica / Maxima (sin Media)

> Documento de planificación guardado en la rama `Suscripciones`.
> **IMPLEMENTADO.** Verificado contra el código al 2026-09-22. Commits:
> `7436a50` (plan), `56f9755` (planes), `3336ce6` (gate MP), `6582cc1` (fix espera QR/transferencia).
> Queda como pendiente conocido solo el deploy de `licensing-worker` + `landing` (ver "Verificación al implementar").

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

### MercadoPago: uso libre para todos; verificación instantánea solo Maxima

> **Decisión final (revisada):** **no** se bloquea el uso de QR/transferencia en ningún plan. El beneficio exclusivo de **Maxima** (y la prueba, que opera como Maxima) es la **verificación instantánea del pago** (el sistema chequea MercadoPago y confirma la venta solo/a). Sin Maxima, QR/transferencia funcionan igual pero se confirman **manualmente** por el cajero.

- **`MercadoPagoController`**: `verificar-pago` responde 403 si `!PermiteMercadoPago()` (verificación instantánea). `auth-url`, `estado`, `desvincular` y `qr` quedan disponibles para todos.
- **`TransferenciaPollingService`**: la confirmación automática (polling a MercadoPago) solo corre si `PermiteMercadoPago()`; sin Maxima las ventas pendientes quedan esperando confirmación manual.
- **`VentaService.CrearVenta`**: **sin** rechazo por plan; la venta pendiente QR/transferencia se puede crear en cualquier plan.
- **Frontend**: medios QR/transferencia siempre visibles en ventas. `TransferenciaEspera` oculta el botón "Verificar pago" (y ajusta el texto) cuando no hay verificación instantánea; el botón "Confirmar" (manual) queda siempre. Botones "Vincular MP"/"Ver QR" del menú disponibles para Admin/SuperAdmin en todos los planes.
- `PermiteMercadoPago()` (LicenciaService): true solo si el titular es Maxima (o prueba = Maxima). **No desvincula** MP ni borra tokens si no es Maxima; al volver a Maxima, la verificación instantánea queda operativa.

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

- [x] `dotnet build` + `dotnet test` en la solución (tests actualizados: `UsuariosSubscriptionTest.cs`, `VentaServiceTest.cs`).
- [x] `npx tsc -b` en `frontend`.
- [x] Limpieza de "Media" en `frontend/src` (sin referencias), worker y landing.
- [ ] **Pendiente:** deploy de `licensing-worker` + `landing` (se coordina aparte).

### Checklist de verificación de código (2026-09-22)

- [x] `Suscripcion.cs`: sin `Media`, `CrearBasica(1, null, 3)`, `CrearMaxima(null, null, null)`, helper `AplicarLimitesPorNivel()`.
- [x] `LicenciaConfig.cs` / `LicenciaService.cs`: límites Basica/Maxima, `NormalizarPlan` sin "media", `PermiteMercadoPago()`, `DegradarSuscripcionABasica`.
- [x] `AuthService.ValidarCupoSuscripcion`: tope total de cuentas por `MAX_USUARIOS` (null = ilimitado).
- [x] `Program.cs`: normalización idempotente de suscripciones existentes al arrancar.
- [x] `MercadoPagoController.verificar-pago` → 403 si `!PermiteMercadoPago()`; `auth-url`, `estado`, `desvincular`, `qr` libres para todos.
- [x] `TransferenciaPollingService`: confirmación automática solo con `PermiteMercadoPago()`.
- [x] `VentaService.CrearVenta`: sin rechazo por plan.
- [x] Frontend: QR/transferencia siempre visibles; `TransferenciaEspera` oculta "Verificar pago" sin verificación instantánea.
- [x] `licensing-worker` + `landing`: planes Basica/Maxima, textos "3 cuentas en total" / "ilimitados + MercadoPago".
