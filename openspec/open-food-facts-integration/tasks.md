# Tasks: Open Food Facts Integration

## Review Workload Forecast

| Métrica | Valor |
|---------|-------|
| Archivos nuevos | ~6 |
| Archivos modificados | ~10 |
| Líneas estimadas (backend) | ~250 |
| Líneas estimadas (frontend) | ~200 |
| **Total estimado** | **~450 líneas** |
| 800-line budget risk | **Bajo** (450 < 800) |
| Chained PRs recommended | **No** |
| Decision needed before apply | **No** |

---

## Task List

### T1 — Migración: nuevas columnas en Producto

**Archivos**:
- `PosWeb.Domain/Producto.cs` — agregar propiedades MARCA, IMAGEN_URL, INGREDIENTES, constructor ampliado, mutators
- `PosWeb/Data/PosDbContext.cs` — Fluent API config para las 3 columnas
- `PosWeb/Migrations/` — nueva migración generada

**Validación**: `dotnet ef migrations add AddOpenFoodFactsFields` sin errores, `dotnet ef database update` aplica sin errores

**Dependencias**: ninguna

---

### T2 — DTOs nuevos y modificados

**Archivos nuevos**:
- `PosWeb.Contracts/OpenFoodFactsResultDto.cs`
- `PosWeb.Contracts/ProductoLookupResponseDto.cs`

**Archivos modificados**:
- `PosWeb.Contracts/ProductoUpsertDto.cs` — agregar Marca, ImagenUrl, Ingredientes, Contenido, CategoriaId, UnidadMedidaId, DescAdicional (todos opcionales)
- `PosWeb.Contracts/ProductoDto.cs` — agregar Marca, ImagenUrl, Ingredientes, Contenido, CategoriaId, UnidadMedidaId, DescAdicional

**Validación**: compilación sin errores

**Dependencias**: T1

---

### T3 — OpenFoodFactsService

**Archivo nuevo**:
- `PosWeb/Application/OpenFoodFacts/OpenFoodFactsService.cs`

**Implementación**:
- Constructor recibe `HttpClient` + `ILogger<OpenFoodFactsService>`
- Método `ConsultarAsync(string codigoBarras)` → `Task<OpenFoodFactsResultDto?>`
- GET a `/api/v2/product/{codigo}.json`
- Parsing con `System.Text.Json.JsonDocument`
- Mapeo condicional: cada campo se lee con `TryGetProperty`
- Si `product_name` es null/vacío → return null
- Si HTTP falla → log warning, return null
- Timeout manejado por HttpClient (10s)

**Validación**: compila. Tests en T10.

**Dependencias**: T2

---

### T4 — Program.cs: registrar HttpClient y servicio

**Archivo modificado**:
- `PosWeb/Program.cs`

**Cambios**:
```csharp
builder.Services.AddHttpClient<OpenFoodFactsService>(client =>
{
    client.BaseAddress = new Uri("https://world.openfoodfacts.org/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd("PosWeb/1.0");
    client.Timeout = TimeSpan.FromSeconds(10);
});
builder.Services.AddScoped<OpenFoodFactsService>();
```

**Validación**: `dotnet run --project PosWeb` arranca sin errores de DI

**Dependencias**: T3

---

### T5 — ProductoService: Crear() y MapToDto() ampliados

**Archivo modificado**:
- `PosWeb/Application/Productos/ProductoService.cs`

**Cambios**:
- `Crear(ProductoUpsertDto dto)`: pasar `dto.CategoriaId, dto.DescAdicional, dto.Contenido, dto.UnidadMedidaId, dto.Marca, dto.ImagenUrl, dto.Ingredientes` al constructor de Producto
- `MapToDto(Producto producto)`: incluir Marca, ImagenUrl, Ingredientes, Contenido, CategoriaId, UnidadMedidaId, DescAdicional
- `Modificar(int id, ProductoUpsertDto dto)`: propagar también los nuevos campos (usar los mutators nuevos)

**Validación**: compila. Tests existentes no se rompen.

**Dependencias**: T1, T2

---

### T6 — ProductosController: nuevo endpoint lookup

**Archivo modificado**:
- `PosWeb/Controllers/ProductosController.cs`

**Cambios**:
- Inyectar `OpenFoodFactsService` en el constructor
- Nuevo endpoint: `[HttpGet("openfoodfacts/{codigo}")]`
- Lógica: buscar local → si no, consultar OF → devolver `ProductoLookupResponseDto`

**Validación**: `dotnet run`, probar con curl/Postman:
- `GET /api/productos/openfoodfacts/7790895007217` → `{ local: false, encontrado: true, datos: {...} }`
- `GET /api/productos/openfoodfacts/0000000000000` → `{ local: false, encontrado: false }`

**Dependencias**: T3, T5

---

### T7 — Frontend: types y API client

**Archivos modificados**:
- `frontend/src/types/index.ts` — nuevas interfaces: `OpenFoodFactsResultDto`, `ProductoLookupResponseDto`; ampliar `ProductoDto` y `ProductoUpsertDto`
- `frontend/src/api/client.ts` — nuevo método `productos.lookupOpenFoodFacts(codigo)`

**Validación**: `npx tsc -b` sin errores

**Dependencias**: T6

---

### T8 — Frontend: BarcodeLookup component

**Archivo nuevo**:
- `frontend/src/components/BarcodeLookup.tsx`

**Implementación**:
- Input de texto para código de barras
- Botón "Buscar" (o Enter)
- Estado: idle, loading, foundLocal, foundRemote, notFound, error
- Llama a `api.productos.lookupOpenFoodFacts(codigo)`
- Props: `onProductFound(producto)`, `onPrefillForm(datos)`, `onNotFound(codigo)`
- Loading: muestra spinner
- Found local: muestra tarjeta resumen del producto
- Found remote: dispara `onPrefillForm`
- Not found: mensaje + botón "Crear manualmente"
- Error: mensaje + botón "Crear manualmente"

**Validación**: compila con `npx tsc -b`

**Dependencias**: T7

---

### T9 — Frontend: ProductFormEnriched component

**Archivo nuevo**:
- `frontend/src/components/ProductFormEnriched.tsx`

**Implementación**:
- Formulario con todos los campos (ver design.md)
- Carga dropdowns de categorías y unidades (`api.categorias.listar()`, `api.unidadesMedida.listar()`)
- Precarga campos si recibe `prefillData?: OpenFoodFactsResultDto`
- Validación: precio y costo obligatorios, positivos
- Submit: llama a `api.productos.crear(dto)`
- Props: `prefillData?`, `onCreated(producto)`, `onCancel()`

**Validación**: compila con `npx tsc -b`

**Dependencias**: T7

---

### T10 — Frontend: integrar en ProductosPage

**Archivo modificado**:
- `frontend/src/pages/ProductosPage.tsx`

**Cambios**:
- Agregar `BarcodeLookup` arriba del formulario
- Agregar estado para manejar el flujo de lookup
- `onPrefillForm` → abrir `ProductFormEnriched` con datos precargados
- `onNotFound` → abrir `ProductFormEnriched` vacío con el código de barras ya puesto
- `onCreated` → cerrar formulario, refrescar lista
- Mantener el formulario inline simple como fallback (o reemplazar completamente)

**Validación**: `npm run dev`, flujo completo funciona

**Dependencias**: T8, T9

---

### T11 — Tests: OpenFoodFactsService

**Archivo nuevo** (opcional, según strategy de test):
- `PosWeb.Application.Test/OpenFoodFacts/OpenFoodFactsServiceTests.cs`

**Casos**:
- Respuesta completa → todos los campos mapeados
- Respuesta con product_name null → null
- Respuesta 404 → null
- Timeout → null
- Campos opcionales faltantes → null en el DTO
- product_quantity no numérico → contenido null

**Validación**: `dotnet test` pasa

**Dependencias**: T3

---

### T12 — Tests: ProductoService ampliado

**Archivo modificado**:
- `PosWeb.Application.Test/Productos/ProductoServiceTests.cs` (si existe)

**Casos**:
- Crear con todos los campos nuevos → producto guardado con esos valores
- Crear sin campos nuevos (solo los 4 básicos) → sin errores
- MapToDto incluye los nuevos campos

**Validación**: `dotnet test` pasa

**Dependencias**: T5

---

## Orden de ejecución

```
T1 (migration) ──┬── T2 (DTOs) ──┬── T3 (service) ── T4 (DI reg) ──┬── T6 (controller)
                 │               │                                   │
                 └── T5 (ProductoService) ───────────────────────────┘
                                                                     │
                                                                     ▼
                                                              T7 (frontend types)
                                                                     │
                                                              ┌──────┴──────┐
                                                              ▼              ▼
                                                       T8 (lookup)    T9 (form)
                                                              │              │
                                                              └──────┬───────┘
                                                                     ▼
                                                              T10 (integration)
                                                                     │
                                                              ┌──────┴──────┐
                                                              ▼              ▼
                                                       T11 (OF tests)  T12 (svc tests)
```

**Fase 1** (backend core): T1 → T2 → T5 → T3 → T4 → T6  
**Fase 2** (frontend): T7 → T8 → T9 → T10  
**Fase 3** (tests): T11 → T12  

---

## Delivery Strategy

- **PR único**: 450 líneas estimadas, dentro del budget de 800. No se requiere chained PRs.
- **Commits**: un commit por task, conventional commits (`feat:`, `test:`, `chore:`)
- **Rollback**: cada fase es independiente. Si frontend falla, backend ya funciona.
