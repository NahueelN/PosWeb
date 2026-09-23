# Plan: redefinir planes de suscripción → Gratuito / Basico / Maximo

> Documento de planificación para la rama `suscripciones`.
> **NO implementado todavía.** Se ejecuta sobre la rama ya mergeada con `origin/master`
> (merge `d633567`, v1.1.19: incluye Mesas/Restaurante, Vencimientos, Respaldos y Ayuda).
> Ajustado post-merge 2026-09-22: Vencimientos deshabilitado en Gratuito, Ayuda activa,
> Márgenes/Stock activas, toggle restaurante oculto en Gratuito.

## Objetivo

Adaptar los planes para cumplir:

- **Gratuito — $0**: cuando vence la prueba gratuita, en vez de bloquear el acceso se pasa a nivel Gratuito.
  - Seguimiento de ventas, caja y stock.
  - Un solo usuario con acceso completo.
  - Hasta 500 productos.
- **Basico — $32.500/mes**: 3 usuarios, hasta 1000 productos, todos los módulos activados.
- **Maximo — $39.990/mes**: usuarios ilimitados, hasta 10000 productos, integración con MercadoPago para verificar compras al instante, soporte prioritario por email y WhatsApp.

## Decisiones cerradas con el cliente

1. **Gratuito** = 1 sucursal, 1 admin (el titular), 1 usuario total, 500 productos. Solo módulos **ventas, caja y stock**; todo lo demás deshabilitado (incluye Mesas/Restaurante, Vencimientos, Clientes, Dashboard, Compras, Pedidos, Deudas, Gastos, Proveedores, Historial, Ofertas/Combos). Configuración accesible: **quedan Perfil, Usuarios, Márgenes y Stock**; se **ocultan Compartir, Datos y Respaldo** y el **toggle "Módulo restaurante (mesas)"**. La página de **Ayuda queda activa en todos los planes** (es documentación, no módulo de negocio).
2. **Basico** = 1 sucursal, 3 cuentas totales, 1000 productos, todos los módulos activados.
3. **Maximo** = sucursales ilimitadas, usuarios ilimitados, 10000 productos, MercadoPago con **verificación instantánea**.
4. **Precios mensuales** (igual que el modelo actual de pago recurrente del worker).
5. **MercadoPago**: QR/transferencia disponibles en todos los planes con **confirmación manual**; la verificación instantánea (polling automático) es solo Maximo. En Gratuito igual que hoy en Basica (manual).
6. **Conteo de productos**: solo productos **ACTIVOS** cuentan contra el tope.
7. **Recorte al degradar a Gratuito**: si hay >500 productos activos al vencer la prueba, se **desactivan aleatoriamente** (borrado lógico, sin borrar filas) hasta dejar 500 activos. Se hace una sola vez en el degradado.
8. **Alta en la API de licensing al registrarse**: cuando alguien se registra se da de alta su email en el worker (plan gratuito), de modo que al actualizar el plan ya existe el registro.

## Tabla canónica de límites (`PlanLimits`)

| Plan | Sucursales | Admins | Usuarios | Productos |
|------|-----------|--------|----------|-----------|
| Gratuito | 1 | 1 | 1 | 500 |
| Basica | 1 | ∞ | 3 | 1000 |
| Maxima | ∞ | ∞ | ∞ | 10000 |

`maxProductos` se deriva de `PlanLimits.Get(nivel)`; no se agrega columna nueva a la entidad (se evita tocar el esquema).

## Cambios por archivo

### Backend / Dominio

1. **`PosWeb.Domain/Suscripcion.cs`**
   - `NivelesSuscripcion`: agregar `Gratuito`; `Todos = { Gratuito, Basica, Maxima }`.
   - Agregar factory `CrearGratuita(id, costo=0)` → `(1, 1, 1)`.
   - `AplicarLimitesPorNivel()`: nivel desconocido degrada a `Gratuito` (hoy degrada a Basica).
2. **`PosWeb.Domain/LicenciaConfig.cs`**
   - `PlanLimits.Get` devuelve `(maxSucursales, maxAdmins, maxUsuarios, maxProductos)`:
     - `Gratuito => (1, 1, 1, 500)`
     - `Basica => (1, int.MaxValue, 3, 1000)`
     - `Maxima => (int.MaxValue, int.MaxValue, int.MaxValue, 10000)`
   - `MarcarPruebaExpirada()`: pasa a `Estado=Activa`, `Plan=Gratuito` **y limpia `NextBilling`/`GraceUntil`** (sin bloqueo; el Gratuito no tiene vencimiento).
3. **`PosWeb/Application/Licensing/LicenciaService.cs`**
   - **`VerificarAcceso()`**: 
     - Agregar rama temprana **`if (licencia.Plan == Gratuito) return (true, null)`** (antes del bloque de vencimiento): el plan Gratuito es estado local siempre activo, sin verificación remota ni vencimiento.
     - El bloque de trial expirado (hoy degrada + return false) pasa a **"degradar a Gratuito + return true"**. La prueba vence → el comercio sigue operando en Gratuito.
   - `DegradarSuscripcionABasica()` → `DegradarSuscripcionAGratuita()`: `CambiarNivel(Gratuito, 0, 1, 1, 1)` + recorte aleatorio de productos a 500 activos.
   - `ObtenerLimitesPlan()`: agregar `maxProductos` a la tupla (derivado de `PlanLimits.Get`).
   - `NormalizarPlan()`: soportar `"gratuito"`.
   - `PermiteMercadoPago()`: sin cambios (solo `Maxima` → Gratuito/Basica confirman manual).
   - **`BuscarYActivarPorEmail()`**: **NO activar licencias con `plan='gratuito'`** (solo basica/maxima); si el worker devuelve un plan gratuito, se ignora como "sin licencia" para no pisar la prueba gratuita local.
4. **`PosWeb/Application/Auth/AuthService.cs`** (`Register`, titular)
   - Tras `ActivarPorEmailOPrueba`, llamar al worker `POST /register` con el mail para darlo de alta (fire-and-forget; si el worker falla, no rompe el registro).
5. **`PosWeb/Application/Productos/ProductoService.cs`**
   - `Crear` e `ImportarProductos`: contar productos `ACTIVOS` y rechazar si `count >= limite` del plan. Nueva excepción `LimiteProductosException` (mensaje con el tope).
   - **Inyectar `LicenciaService`** en el constructor (ambos Scoped) para consultar `maxProductos`.
6. **`PosWeb/Program.cs`** (seed)
   - Normalización de suscripciones existentes con `AplicarLimitesPorNivel()` → ahora degrada a Gratuito.

### MercadoPago: confirmación manual para todos, verificación instantánea solo Maximo

- `MercadoPagoController.verificar-pago` → 403 si `!PermiteMercadoPago()` (solo Maxima). `auth-url`, `estado`, `desvincular`, `qr` disponibles para todos.
- `TransferenciaPollingService`: confirmación automática solo si `PermiteMercadoPago()`.
- `VentaService.CrearVenta`: sin rechazo por plan (venta pendiente QR/transferencia en cualquier plan).
- Frontend: QR/transferencia siempre visibles; `TransferenciaEspera` oculta el botón "Verificar pago" sin verificación instantánea; "Confirmar" manual siempre.

### Worker de licensing (`licensing-worker/src/index.ts`)

- `PLAN_PRICES = { gratuito: 0, basica: 32500, maxima: 39990 }`.
- `VALID_PLANS = ['gratuito', 'basica', 'maxima']`; `normalizePlan` maneja gratuito.
- Nuevo endpoint interno **`POST /register`** (auth `POSWEB_INTERNAL_KEY`): upsert por email con **`plan='gratuito'`, `status='pending'`, `next_billing=NULL`**. 
  - **`status='pending'`** (NO active): evita que `BuscarYActivarPorEmail`/`activate` lo active y pise la prueba gratuita local. Es solo un "placeholder" para que el `/checkout` posterior encuentre el email y actualice el plan.
  - No debe **pisar una licencia paga existente**: si el email ya tiene basica/maxima, no se degrada a gratuito (upsert solo si no existe o si ya es gratuito/pending).
- `LANDING_HTML` **y carpeta `landing/`** (index.html, success.html): 3 cards — Gratuito $0 (sin botón de pago, es solo referencia), Basico $32.500/mes, Maximo $39.990/mes con los textos de cada plan.
- `success.html`: ajustar textos.
- D1: sin migración nueva (la tabla `licenses` no cambia).

### Frontend

- `types/index.ts`: `LicenciaEstado.maxProductos`.
- `ConfiguracionPage.tsx` / `AltaUsuarioTab.tsx`: mostrar tope de productos; etiqueta "1 cuenta" para Gratuito.
  - En Gratuito: ocultar solapas **Compartir** y **Datos y Respaldo** (RespaldoTab); dejar Perfil, Usuarios, Márgenes y Stock.
  - En Gratuito: ocultar el **toggle "Módulo restaurante (mesas)"** de la solapa Perfil (mesas no disponible).
- `Layout.tsx`: grisado de módulos en Gratuito — `hiddenForGratuito = ['/', '/historial', '/clientes', '/compras', '/gastos', '/proveedores', '/deudas', '/pedidos', '/combos', '/mesas', '/vencimientos']` aplicado cuando `licResumen?.plan === 'Gratuito'`. `/ayuda` **no** se incluye (queda activa).
- `App.tsx`: guard de rutas para redirigir a `/ventas` si se navega a una ruta deshabilitada en Gratuito. `/ayuda` y `/configuracion` quedan accesibles por URL.

### Tests

- `PosWeb.Application.Test/UsuariosSubscriptionTest.cs`: actualizar los de trial vencido (ahora **permite** acceso y degrada a Gratuito) y `PermiteMercadoPago` falso en Gratuito/Basica. Agregar tests de límite de productos (`Crear`/`Importar`), recorte a 500 al degradar, y `/register` upsert.
- `PosWeb.Application.Test/VentaServiceTest.cs`: revisar los de venta pendiente (no cambian).

## Conflictos identificados al revisar el código (2026-09-22)

1. **Gratuito + bloque de vencimiento**: `VerificarAcceso` tiene un bloque `if (licencia.NextBilling.HasValue)` que marca `Expirada` y bloquea. Si al degradar a Gratuito no se limpia `NextBilling`/`GraceUntil`, el usuario gratuito quedaría bloqueado. → Resuelto con `MarcarPruebaExpirada` limpiando vencimiento + rama temprana `Plan == Gratuito`.
2. **`/register` rompería la prueba gratuita**: si crea `status='active'`, el siguiente `BuscarYActivarPorEmail` lo activaría y el usuario arrancaría en Gratuito sin los 7 días de prueba. → Resuelto con `status='pending'` + backend que ignora plan gratuito al activar.
3. **Landing duplicada**: hay `LANDING_HTML` embebido en el worker **y** carpeta `landing/` con precios viejos ($999/$3.999, sin Gratuito). → Actualizar ambas.
4. **`ProductoService` no conoce el plan**: hay que inyectar `LicenciaService` para validar `maxProductos` en `Crear`/`ImportarProductos`.
5. **`/register` vs licencia paga**: no degradar a gratuito un email que ya contrató basica/maxima (upsert condicional).
6. **Prueba gratuita = Maxima**: la prueba sigue operando como Maxima (MP instantáneo) por 7 días; al vencer → Gratuito. Mantener `IniciarPruebaGratuita` como hoy.

## Notas de revisión de código (2026-09-22, segunda pasada)

7. **`ObtenerLimitesPlan()`**: el switch por `licencia.Plan` (cuando no hay Suscripcion) también necesita el caso `Gratuito` → `(1, 1, 1, 500)`; no solo `PlanLimits.Get`.
8. **`/checkout` del worker con `plan='gratuito'`**: `PLAN_PRICES.gratuito = 0` haría una preferencia de $0. La landing no ofrece botón de pago para Gratuito, pero por robustez conviene que `/checkout` rechace `gratuito` (o devuelva 400).
9. **Middleware `Program.cs` (`UsuarioTieneAccesoPorSuscripcion`)**: usa `suscripcion.EstaActiva()`; al degradar a Gratuito la suscripcion debe seguir `Activa` (no se suspende). `CambiarNivel` no toca el estado → OK, verificar en el test del degradado.
10. **`LicenciaResumenDto.Plan` / `VentasPage`**: `mpPermitido = r.plan === 'Maxima'`. Durante la prueba `Plan=Maxima` (instantáneo OK); al vencer `Plan=Gratuito` → confirmación manual. Coherente, sin cambios.

## Dejar como está (a propósito)

- `MAX_SUCURSALES` no se enforcea al crear sucursales (hoy solo display). Con Gratuito=1 / Basica=1 / Maxima=ilimitado no empeora; queda documentado.
- Polling de transferencias (`TransferenciaPollingService`) sin gate en Basica/Gratuito: sin tokens/vínculo MP no hay ventas MP pendientes que procesar; en Maxima corre.

## Verificación al implementar

- `dotnet build` + `dotnet test` en la solución.
- `npx tsc -b` en `frontend`.
- Deploy de `licensing-worker` + `landing` (se coordina aparte).