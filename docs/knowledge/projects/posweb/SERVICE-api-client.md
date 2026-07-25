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
Updated: 2026-07-22
Template Version: 1.0
Tags:
  - api
  - networking
  - auth
  - error-handling
```

---

## Descripción

El API client (`export const api` en `client.ts`) centraliza todas las llamadas HTTP al backend .NET. Cada página lo consume a través de `api.{modulo}.{metodo}()`.

---

## Problema que resuelve

Sin este archivo cada página implementaría su propia lógica de fetch, headers de auth, manejo de errores 401 y URL base.

---

## Estructura

### 1. URL base (`BASE`)
Auto-detectada:
- `localhost` / `127.0.0.1` → `/api` (Vite proxy → `localhost:5196`)
- Cualquier IP en `http:` → `/api` (acceso desde LAN, mismo proxy)
- Tauri WebView (`tauri://` u otro protocolo) → `http://localhost:5196/api` (directo al sidecar)

### 2. `esperarBackend()`
Polling (30 intentos, 500ms) contra `/sucursales`. Bloquea el arranque hasta que el backend responda.

### 3. `request<T>()`
Wrapper de `fetch` con:
- Headers `Authorization: Bearer {jwt_token}`
- Side effect en 401: limpia localStorage + `dispatchEvent('auth:expired')`
- Parseo de errores: extrae `error`, `title` o `message` del body JSON
- 204 → `undefined`

### 4. `api` object

| Módulo | Métodos clave |
|--------|--------------|
| `auth` | `login`, `pinLogin`, `register`, `me` |
| `productos` | `listar`, `buscar`, `detalle`, `crear`, `marcas`, `seguirStock*` |
| `sucursales` | `listar` |
| `ventas` | `crear`, `historial`, `detalle`, `deshacer` |
| `cajas` | `activa`, `abrir`, `cerrar`, `previewCierre`, `ultimoCierre`, `historial` |
| `compras` | `crear` |
| `deudas` | `listar`, `listarClientes`, `crearDeudaCliente`, `pagarMultipleCliente`, `pagos`, `cuentaCorriente`, `deshacerPago` |
| `combos` | `listar`, `crear`, `actualizar`, `eliminar`, `reactivar`, `eliminarDefinitivo` |
| `ofertas` | `listar`, `crear`, `actualizar`, `eliminar`, `reactivar`, `eliminarDefinitivo` |

---

## Cuándo usar

Toda llamada HTTP al backend debe pasar por `api.{modulo}.{metodo}()`. No usar `fetch` directo.

## Cuándo NO usar

No usar `fetch` directo en componentes, no hardcodear URLs.

---

## Dónde se usa actualmente

Todas las páginas en `frontend/src/pages/`, `AuthContext.tsx`, `App.tsx` (`esperarBackend`).

---

## Errores y manejo

- **401**: limpia sesión + `auth:expired` event → AuthContext redirige al login
- **Red/backend caído**: `esperarBackend` reintenta; si falla muestra pantalla de error
- **Negocio**: `request()` extrae el mensaje del body; cada página decide cómo mostrarlo vía `notifyError`

---

## Consideraciones técnicas

- Cada método está tipado con los DTOs de `types/index.ts`
- No hay interceptor global (excepto 401). Cada página maneja sus errores
- Logging de cada request en consola
- **Merge risk**: archivo propenso a conflictos por concentrar todos los endpoints. Se perdieron endpoints PKS en merge `30faecd` (2026-07-03). Restaurados manualmente.

---

## Relaciones

```yaml
RELATIONS:
  - type: CONSUMES
    target: "types/index.ts"
  - type: USED_BY
    target: "Todas las páginas"
  - type: TRIGGERS
    target: "AuthContext.tsx (auth:expired)"
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-07-22 | Agregado soporte para acceso desde red local (LAN). `BASE = '/api'` ahora aplica también cuando el hostname NO es localhost pero el protocolo es `http:`. |
| 2026-07-04 | Creación |
| 2026-07-03 | Restauración de endpoints PKS perdidos en merge |
