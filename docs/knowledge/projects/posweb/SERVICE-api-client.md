# SERVICE-api-client

> API client del frontend. Único punto de comunicación con el backend .NET.

---

## Metadata

```yaml
ID: SERVICE-api-client
Type: Service
Name: API Client
Status: Active
Priority: Critical
Level: Project
Sources:
  - frontend/src/api/client.ts
Created: 2026-07-04
Updated: 2026-07-04
Tags:
  - api
  - networking
  - auth
  - error-handling
```

---

## Descripción

El API client es el `export const api` definido en `client.ts`. Centraliza todas las llamadas HTTP al backend .NET. Cada página del frontend lo consume a través de `api.{modulo}.{metodo}()`.

No es un servicio del backend. Es el contrato de comunicación desde el frontend.

---

## Problema que resuelve

Sin este archivo, cada página tendría que implementar su propia lógica de fetch, headers de auth, manejo de errores 401, detección de backend disponible, y URL base. Eso ya causó duplicación en versiones anteriores del proyecto.

---

## Ubicación

```
frontend/src/api/client.ts
```

---

## Estructura

### 1. Detección de URL base

```ts
let BASE: string;
if (typeof window !== 'undefined' && window.location) {
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    BASE = '/api';       // navegador: proxy relativo
  } else {
    BASE = 'http://localhost:5196/api';  // Tauri WebView
  }
}
```

### 2. `esperarBackend()`

Polling de hasta 30 intentos (500ms c/u) contra `/sucursales`. Bloquea el arranque de la app hasta que el backend responda. Usa `AbortController` con timeout de 2s por intento.

### 3. `request<T>()`

Función genérica que envuelve `fetch` con:
- Headers de auth (`Bearer` desde `localStorage.jwt_token`)
- Logging de duración y payload
- Parseo de errores: intenta extraer `error`, `title`, o `message` del body
- Side effect en 401: limpia `localStorage` (token, expires, user_info) y dispara `window.dispatchEvent(new CustomEvent('auth:expired'))`
- 204 → `undefined`

### 4. `api` object

Organizado por módulos de negocio:

| Módulo | Métodos |
|--------|---------|
| `auth` | `login`, `pinLogin`, `register`, `me` |
| `productos` | `listar`, `buscar`, `buscarParaVenta`, `obtenerPorBarra`, `detalle`, `crear`, `obtenerProximoCodigo`, `eliminar`, `marcas`, `marcasSimilares`, `ajusteMarca`, `seguirStockGlobal`, `seguirStockIndividual`, `actualizar`, `lookupOpenFoodFacts` |
| `sucursales` | `listar`, `obtenerPorId`, `crear`, `eliminar` |
| `ventas` | `crear`, `historial`, `detalle`, `deshacer` |
| `stock` | `listar`, `bajoStock`, `ajustar` |
| `clientes` | `listar`, `obtener`, `crear`, `actualizar` |
| `mediosPago` | `listar` |
| `usuarios` | `listar` |
| `cajas` | `activa`, `abrir`, `cerrar`, `previewCierre`, `ultimoCierre`, `historial` |
| `proveedores` | `listar`, `obtener`, `crear`, `actualizar` |
| `compras` | `crear` |
| `gastos` | `listar`, `historial`, `crear`, `anular` |
| `categoriasGasto` | `listar`, `crear` |
| `deudas` | `listar`, `listarClientes`, `crearDeudaCliente`, `obtener`, `pagar`, `pagarMultiple`, `pagarMultipleCliente`, `pagos`, `cuentaCorriente`, `deshacerPago` |
| `pedidos` | `listar`, `obtener`, `crear`, `recibir`, `cancelar` |
| `categorias` | `listar`, `actualizarMargen` |
| `unidadesMedida` | `listar` |
| `estadisticas` | `obtener` |
| `combos` | `listar`, `obtenerPorId`, `obtenerPorCodigo`, `crear`, `actualizar`, `eliminar`, `reactivar`, `eliminarDefinitivo` |
| `ofertas` | `listar`, `obtenerPorId`, `crear`, `actualizar`, `eliminar`, `reactivar`, `eliminarDefinitivo` |

---

## Cuándo usar

- Toda llamada HTTP al backend debe pasar por `api.{modulo}.{metodo}()`.
- Para nuevas features, agregar el endpoint dentro del módulo existente o crear uno nuevo dentro del objeto `api`.

## Cuándo NO usar

- No usar `fetch` directo en componentes o páginas.
- No usar `axios` u otras librerías HTTP.
- No hardcodear URLs. Siempre usar `BASE`.

---

## Dónde se usa actualmente

Todas las páginas en `frontend/src/pages/`, y algunos hooks y componentes:

- `VentasPage.tsx`, `CompraPage.tsx`, `ProductosPage.tsx`, `ClientesPage.tsx`
- `CajaPage.tsx`, `GastosPage.tsx`, `ProveedoresPage.tsx`
- `DeudaPage.tsx`, `PedidosPage.tsx`, `HistorialVentasPage.tsx`
- `CombosPage.tsx`, `ConfiguracionPage.tsx`, `StockPage.tsx`
- `EstadisticasPage.tsx`, `SucursalesPage.tsx`
- `AuthContext.tsx`
- `App.tsx` (`esperarBackend`)

---

## Errores y manejo

- **401**: limpia sesión local + `auth:expired` event. `AuthContext` escucha este evento para redirigir al login.
- **Errores de red / backend caído**: `esperarBackend` reintenta 30 veces. Si falla, muestra pantalla de error con botón "Reintentar".
- **Errores de negocio**: `request()` extrae el mensaje del body JSON (`error`, `title`, `message`). Si no hay JSON, usa el body crudo. La página que hizo la llamada recibe el `Error` y decide cómo mostrarlo (notificación, alerta, etc.).

---

## Consideraciones técnicas

- **Tipos**: cada método está tipado con los DTOs de `types/index.ts`. El genérico `request<T>` garantiza que el tipo de retorno sea conocido.
- **No hay interceptor global de errores**: cada página maneja sus errores individualmente con `.catch()` o try/catch. La única excepción es 401 que tiene side effects globales.
- **Logging**: cada request loguea método, URL, duración y status en consola. En éxito y en error.
- **Merge risk**: este archivo es propenso a conflictos en merges porque concentra todos los endpoints. Se perdieron endpoints de PKS en el merge `30faecd` (2026-07-03). Restaurados manualmente.

---

## Relaciones

```yaml
RELATIONS:
  - type: CONSUMES
    target: "types/index.ts (tipos DTO)"
  - type: USED_BY
    target: "Todas las páginas"
  - type: TRIGGERS
    target: "AuthContext.tsx (vía auth:expired)"
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-07-04 | Creación |
| 2026-07-03 | Restauración de endpoints perdidos en merge (PKS + ofertas) |
