# SERVICE-catalogo

> Proxy HTTP hacia el catálogo cloud de productos. Parte del sistema de resolución de códigos de barras en cascada.

---

## Metadata

```yaml
ID: SERVICE-catalogo
Type: Service
Name: CatalogoService — Shared Product Catalog Proxy
Status: Active
Priority: High
Level: Project
Sources:
  - PosWeb/Application/Catalogo/CatalogoService.cs
  - PosWeb/Controllers/ProductosController.cs
  - catalogo-worker/src/index.ts
  - PosWeb/appsettings.json
Created: 2026-07-22
Updated: 2026-07-22
Template Version: 1.0
Tags:
  - networking
  - Productos
  - Scanner
```

---

## Descripción

`CatalogoService` es un proxy HTTP que comunica el backend .NET con el `catalogo-worker` (Cloudflare Worker + D1). Proporciona dos operaciones: consulta por código de barras (`ConsultarAsync`) y alta/actualización de producto (`SubirProductoAsync`). Ambas están diseñadas para fallar silenciosamente: si el worker no responde, el sistema continúa sin errores.

---

## Problema que resuelve

Sin este servicio, el catálogo compartido de productos no existiría. Cada instalación de PosWeb tendría su propia base de productos aislada. El servicio habilita la resolución de códigos de barras en cascada (local → catálogo cloud → OpenFoodFacts) y la carga colaborativa de productos nuevos.

---

## Estructura

### 1. `ConsultarAsync(string codigoBarras) → OpenFoodFactsResultDto?`

Llama a `GET /productos/{barcode}` en el worker. Si el producto existe, el worker incrementa `contador_usos` y devuelve los datos. El resultado se mapea a `OpenFoodFactsResultDto` para que el controller y el frontend lo traten de forma idéntica a un resultado de OpenFoodFacts.

**Manejo de errores**: `HttpRequestException`, `TaskCanceledException` y `JsonException` son capturados. En todos los casos se retorna `null` y el controller avanza al siguiente nivel de la cascada.

### 2. `SubirProductoAsync(string codigoBarras, string descripcion, string? marca, decimal? contenido, string? unidad)`

Llama a `POST /productos` en el worker. Realiza un upsert: si el código de barras existe, actualiza los campos; si no, lo crea con `contador_usos = 1`.

**Diseño fire-and-forget**: el controller lo invoca con `Task.Run(() => ...)` para no bloquear la respuesta HTTP al cliente. Si el worker está caído, el producto se guarda localmente de todas formas.

### 3. Configuración

```json
"Catalogo": {
    "WorkerUrl": "https://posweb-catalogo.chiacchio-eze01.workers.dev",
    "Habilitado": true
}
```

- `WorkerUrl`: URL base del worker. Se inyecta vía `builder.Configuration` en el `HttpClient` registrado en `Program.cs`.
- `Habilitado`: flag para desactivar el catálogo sin tocar código. Cuando es `false`, `ConsultarAsync` retorna `null` inmediatamente y `SubirProductoAsync` no hace nada.

---

## Cuándo usar

- Toda consulta de código de barras debe pasar por `CatalogoService` antes de caer en OpenFoodFacts.
- Todo `POST /api/productos` con código de barras debe disparar `SubirProductoAsync`.

## Cuándo NO usar

- No usar para búsquedas por texto en el catálogo. Eso no está implementado en el backend (el worker sí tiene el endpoint `GET /productos?q=`).
- No usar para productos sin código de barras. El catálogo usa `codigo_barras` como clave primaria.
- No usar `SubirProductoAsync` de forma síncrona. La respuesta al cliente no debe depender del worker.

---

## Flujo de resolución en cascada

```
ProductosController.LookupOpenFoodFacts(barcode)
  │
  ├─ 1. ProductoService.ObtenerPorCodigoBarra()     → DB local (SQLite)
  │     Si existe: retorna inmediatamente
  │
  ├─ 2. CatalogoService.ConsultarAsync()            → Catálogo cloud (Worker + D1)
  │     Si existe: retorna { encontrado:true, datos:{...} }
  │
  ├─ 3. OpenFoodFactsService.ConsultarAsync()       → Open Food Facts (API pública)
  │     Si existe: retorna { encontrado:true, datos:{...} }
  │
  └─ 4. { encontrado: false }                       → No encontrado
```

---

## Consideraciones técnicas

- **Mismo HttpClient pattern que `OpenFoodFactsService` y `LicenciaService`**: timeout 10s, User-Agent `PosWeb/1.0`, sin autenticación en el worker.
- **DTO reutilizado**: `ConsultarAsync` retorna `OpenFoodFactsResultDto` en lugar de un DTO propio. Esto permite que el frontend reciba datos del catálogo y de OFF con la misma estructura.
- **El worker responde con snake_case**. El `CatalogoService` usa `JsonSerializerOptions` con `PropertyNamingPolicy = CamelCase` y `PropertyNameCaseInsensitive = true` para deserializar.
- **El flag `Habilitado` persiste aunque el worker no esté desplegado**. Un `false` aquí evita timeouts en entornos sin internet.

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: ADR-catalogo-productos
  - type: USED_BY
    target: "ProductosController.cs (LookupOpenFoodFacts, Post)"
  - type: INSPIRED_BY
    target: "OpenFoodFactsService, LicenciaService (proxy pattern)"
  - type: DEPENDS_ON
    target: "catalogo-worker (external)"
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-07-22 | Creación |
