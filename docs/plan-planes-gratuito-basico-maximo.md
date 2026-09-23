# Plan: redefinir planes de suscripción → Gratuito / Basico / Maximo

> Documento de planificación para la rama `suscripciones`.
> **NO implementado todavía.** Se ejecuta sobre la rama ya mergeada con `origin/master`.

## Objetivo

Adaptar los planes para cumplir:

- **Gratuito — $0**: cuando vence la prueba gratuita, en vez de bloquear el acceso se pasa a nivel Gratuito.
  - Seguimiento de ventas, caja y stock.
  - Un solo usuario con acceso completo.
  - Hasta 500 productos.
- **Basico — $32.500/mes**: 3 usuarios, hasta 1000 productos, todos los módulos activados.
- **Maximo — $39.990/mes**: usuarios ilimitados, hasta 10000 productos, integración con MercadoPago para verificar compras al instante, soporte prioritario por email y WhatsApp.

## Decisiones cerradas con el cliente

1. **Gratuito** = 1 sucursal, 1 admin (el titular), 1 usuario total, 500 productos. Solo módulos **ventas, caja y stock**; todo lo demás deshabilitado (incluye Mesas/Restaurante, Clientes, Dashboard, Compras, Pedidos, Deudas, Gastos, Proveedores, Historial, Ofertas/Combos). Configuración accesible pero se **ocultan las solapas Compartir y Datos y Respaldo**.
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
   - `MarcarPruebaExpirada()`: pasa a `Estado=Activa`, `Plan=Gratuito` (sin bloqueo).
3. **`PosWeb/Application/Licensing/LicenciaService.cs`**
   - **`VerificarAcceso()`**: el bloque de trial expirado (hoy degrada + return false) pasa a **"degradar a Gratuito + return true"**. La prueba vence → el comercio sigue operando en Gratuito.
   - `DegradarSuscripcionABasica()` → `DegradarSuscripcionAGratuita()`: `CambiarNivel(Gratuito, 0, 1, 1, 1)` + recorte aleatorio de productos a 500 activos.
   - `ObtenerLimitesPlan()`: agregar `maxProductos` a la tupla (derivado de `PlanLimits.Get`).
   - `NormalizarPlan()`: soportar `"gratuito"`.
   - `PermiteMercadoPago()`: sin cambios (solo `Maxima` → Gratuito/Basica confirman manual).
4. **`PosWeb/Application/Auth/AuthService.cs`** (`Register`, titular)
   - Tras `ActivarPorEmailOPrueba`, llamar al worker `POST /register` con el mail para darlo de alta (fire-and-forget; si el worker falla, no rompe el registro).
5. **`PosWeb/Application/Productos/ProductoService.cs`**
   - `Crear` e `ImportarProductos`: contar productos `ACTIVOS` y rechazar si `count >= limite` del plan. Nueva excepción `LimiteProductosException` (mensaje con el tope).
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
- Nuevo endpoint interno **`POST /register`** (auth `POSWEB_INTERNAL_KEY`): upsert por email → `plan='gratuito'`, `status='active'`, `next_billing=NULL`. Así el `/checkout` posterior encuentra el registro y solo actualiza plan.
- `LANDING_HTML`: 3 cards — Gratuito $0, Basico $32.500/mes, Maximo $39.990/mes con los textos de cada plan.
- `success.html`: ajustar textos.
- D1: sin migración nueva (la tabla `licenses` no cambia).

### Frontend

- `types/index.ts`: `LicenciaEstado.maxProductos`.
- `ConfiguracionPage.tsx` / `AltaUsuarioTab.tsx`: mostrar tope de productos; etiqueta "1 cuenta" para Gratuito; ocultar solapas **Compartir** y **Datos y Respaldo** (RespaldoTab) en Gratuito.
- `Layout.tsx`: grisado de módulos en Gratuito — `hiddenForGratuito = ['/', '/historial', '/clientes', '/compras', '/gastos', '/proveedores', '/deudas', '/pedidos', '/combos', '/mesas']` aplicado cuando `licResumen?.plan === 'Gratuito'`.
- `App.tsx`: guard de rutas para redirigir a `/ventas` si se navega a una ruta deshabilitada en Gratuito.

### Tests

- `PosWeb.Application.Test/UsuariosSubscriptionTest.cs`: actualizar los de trial vencido (ahora **permite** acceso y degrada a Gratuito) y `PermiteMercadoPago` falso en Gratuito/Basica. Agregar tests de límite de productos (`Crear`/`Importar`), recorte a 500 al degradar, y `/register` upsert.
- `PosWeb.Application.Test/VentaServiceTest.cs`: revisar los de venta pendiente (no cambian).

## Dejar como está (a propósito)

- `MAX_SUCURSALES` no se enforcea al crear sucursales (hoy solo display). Con Gratuito=1 / Basica=1 / Maxima=ilimitado no empeora; queda documentado.
- Polling de transferencias (`TransferenciaPollingService`) sin gate en Basica/Gratuito: sin tokens/vínculo MP no hay ventas MP pendientes que procesar; en Maxima corre.

## Verificación al implementar

- `dotnet build` + `dotnet test` en la solución.
- `npx tsc -b` en `frontend`.
- Deploy de `licensing-worker` + `landing` (se coordina aparte).