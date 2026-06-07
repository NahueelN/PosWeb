# Proposal: Open Food Facts Integration

## Intent

Integrar Open Food Facts para alta automática de productos por código de barras: si el producto no existe en la DB local, consultar la API externa, mapear los datos disponibles y precargar el formulario de alta. El usuario completa lo que falte y confirma.

## Scope

### Incluído
- Nuevo endpoint `GET /api/productos/openfoodfacts/{codigo}` que consulta Open Food Facts
- Nuevo `OpenFoodFactsService` con `IHttpClientFactory` para llamadas HTTP
- Migración: nuevas columnas en `Producto`: `MARCA`, `IMAGEN_URL`, `INGREDIENTES`
- Ampliar `ProductoUpsertDto` con todos los campos opcionales del catálogo
- `ProductoService.Crear()` pasa los campos opcionales al constructor de `Producto`
- `MapToDto()` devuelve los nuevos campos en `ProductoDto`
- Frontend: componente de lookup + formulario de alta enriquecido

### No incluído
- Escáner de código de barras por hardware (queda para otra iteración)
- Cache de respuestas de Open Food Facts (la API es gratuita, rate limit bajo no esperado para POS local)
- Búsqueda de productos por imagen o ingredientes
- Sincronización bidireccional

## Approach

**Arquitectura**: Servicio de aplicación nuevo (`OpenFoodFactsService`) que encapsula la llamada HTTP. El controller de productos lo inyecta. El flujo es:

1. `GET /api/productos/openfoodfacts/{codigo}` → controller
2. Controller llama a `ProductoService.ObtenerPorCodigoBarra()` → si existe, devuelve el producto local
3. Si no existe → llama a `OpenFoodFactsService.Consultar(codigo)` → si falla o no hay datos, devuelve 200 con `{ local: false, encontrado: false }`
4. Si la API devuelve datos → mapea a un `OpenFoodFactsResultDto` con los campos disponibles
5. Frontend recibe el DTO y precarga el formulario de alta
6. Usuario completa precio, costo, categoría, unidad → `POST /api/productos` crea el producto

**Por qué service separado**: Testeable con mock de `HttpClient`, no acopla la lógica de producto a llamadas HTTP, fácil de deshabilitar.

## Database Changes

### Migración: agregar columnas a `Producto`

```sql
ALTER TABLE PRODUCTOS ADD COLUMN MARCA VARCHAR(200) NULL;
ALTER TABLE PRODUCTOS ADD COLUMN IMAGEN_URL VARCHAR(500) NULL;
ALTER TABLE PRODUCTOS ADD COLUMN INGREDIENTES TEXT NULL;
```

**Entity `Producto`**: Nuevas propiedades y constructor/mutators:

| Campo | Tipo | Nullable |
|-------|------|----------|
| MARCA | string? | Sí |
| IMAGEN_URL | string? | Sí |
| INGREDIENTES | string? | Sí |

## API Changes

### Nuevo endpoint

```
GET /api/productos/openfoodfacts/{codigo}
```

**Response** (200 OK):

```json
{
  "local": true,
  "producto": { ... ProductoDto ... }
}
```

O si no existe localmente:

```json
{
  "local": false,
  "encontrado": true,
  "datos": {
    "codigoBarras": "7790290101602",
    "descripcion": "Fernet Branca",
    "marca": "Branca",
    "categoria": "Bebidas alcohólicas",
    "presentacion": "750 ml",
    "contenido": 750,
    "unidad": "ml",
    "ingredientes": "...",
    "imagen": "https://images.openfoodfacts.org/..."
  }
}
```

O si la API no encuentra el producto:

```json
{
  "local": false,
  "encontrado": false
}
```

### DTOs nuevos/modificados

**`OpenFoodFactsResultDto`** (nuevo, en `PosWeb.Contracts`):
```csharp
public class OpenFoodFactsResultDto
{
    public string CodigoBarras { get; set; }
    public string? Descripcion { get; set; }
    public string? Marca { get; set; }
    public string? Categoria { get; set; }
    public string? Presentacion { get; set; }
    public decimal? Contenido { get; set; }
    public string? Unidad { get; set; }
    public string? Ingredientes { get; set; }
    public string? Imagen { get; set; }
}
```

**`ProductoLookupResponseDto`** (nuevo, en `PosWeb.Contracts`):
```csharp
public class ProductoLookupResponseDto
{
    public bool Local { get; set; }
    public ProductoDto? Producto { get; set; }
    public bool Encontrado { get; set; }
    public OpenFoodFactsResultDto? Datos { get; set; }
}
```

**`ProductoUpsertDto`** — ampliar con campos opcionales:
```csharp
public class ProductoUpsertDto
{
    public string CodigoBarras { get; set; }
    public string Nombre { get; set; }
    public decimal Precio { get; set; }
    public decimal Costo { get; set; }
    public string? Marca { get; set; }
    public string? ImagenUrl { get; set; }
    public string? Ingredientes { get; set; }
    public decimal? Contenido { get; set; }
    public int? CategoriaId { get; set; }
    public int? UnidadMedidaId { get; set; }
    public string? DescAdicional { get; set; }
}
```

**`ProductoDto`** — ampliar con campos nuevos:
```csharp
public class ProductoDto
{
    // existentes...
    public string? Marca { get; set; }
    public string? ImagenUrl { get; set; }
    public string? Ingredientes { get; set; }
    public decimal? Contenido { get; set; }
    public int? CategoriaId { get; set; }
    public string? CategoriaNombre { get; set; }
    public int? UnidadMedidaId { get; set; }
    public string? UnidadMedidaNombre { get; set; }
    public string? DescAdicional { get; set; }
}
```

### Programa.cs — Registrar HttpClient

```csharp
builder.Services.AddHttpClient<OpenFoodFactsService>(client =>
{
    client.BaseAddress = new Uri("https://world.openfoodfacts.org/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd("PosWeb/1.0");
    client.Timeout = TimeSpan.FromSeconds(10);
});
```

## Open Food Facts Field Mapping

| API field | Entity field | Notas |
|-----------|-------------|-------|
| `product.code` | `CODIGO_BARRAS` | Validar que no sea null |
| `product.product_name` | `DESC_PRODUCTO` | Si es null → producto no encontrado |
| `product.brands` | `MARCA` | Puede ser null |
| `product.categories` | sugerencia de `ID_CATEGORIA` | No mapear directo, mostrar como sugerencia |
| `product.quantity` | `DESC_ADICIONAL` (presentación) | ej: "1,75 L" |
| `product.product_quantity` | `CONTENIDO` | ej: 1750 |
| `product.product_quantity_unit` | sugerencia de `ID_UNIDAD_MEDIDA` | Buscar por código: "ml" → buscar o crear |
| `product.image_url` | `IMAGEN_URL` | Puede ser null |
| `product.ingredients_text` | `INGREDIENTES` | Puede ser null, texto largo |

**Regla**: si `product_name` es null o vacío → producto no encontrado en Open Food Facts.

## Frontend Changes

### Componentes nuevos
- `frontend/src/components/BarcodeLookup.tsx` — input de código de barras con botón "Buscar"
- `frontend/src/components/ProductFormEnriched.tsx` — formulario de alta con todos los campos

### Flujo UX
1. Usuario escanea/escribe código de barras en el lookup
2. Se llama a `GET /api/productos/openfoodfacts/{codigo}`
3. Si `local: true` → mostrar producto existente (navegar o mostrar)
4. Si `encontrado: true` → precargar formulario con datos de Open Food Facts
5. Si `encontrado: false` → formulario vacío (alta manual)
6. Usuario completa precio, costo, selecciona categoría y unidad de dropdowns
7. Guardar con `POST /api/productos` usando el `ProductoUpsertDto` ampliado

### API client
- Nuevo método: `api.productos.lookupOpenFoodFacts(codigo)` → `GET /productos/openfoodfacts/{codigo}`

### Types
- `OpenFoodFactsResultDto` interface
- `ProductoLookupResponseDto` interface
- Ampliar `ProductoUpsertDto` con los nuevos campos opcionales

## Risks

| Riesgo | Mitigación |
|--------|-----------|
| API de Open Food Facts caída o lenta | Timeout de 10s. Si falla → `encontrado: false`, el usuario hace alta manual |
| Datos inconsistentes (ej: algunos productos no tienen `product_quantity`) | Cada campo se mapea condicionalmente. Si `product_name` es null → no encontrado |
| Rate limiting de la API | Llamada solo cuando el producto no existe localmente. POS local tiene pocos productos nuevos por día |
| Producto con código de barras pero sin `product_name` | Tratar como no encontrado, permitir alta manual |
| Espacio en `DESC_ADICIONAL` vs `INGREDIENTES` | `DESC_ADICIONAL`: presentación corta. `INGREDIENTES`: texto largo |
| Categorías de Open Food Facts no coinciden con las locales | Mostrar como sugerencia de texto, no mapear automáticamente. El usuario elige de las categorías existentes |

## Affected Files

### Backend — nuevos
- `PosWeb/Application/OpenFoodFacts/OpenFoodFactsService.cs`
- `PosWeb.Contracts/OpenFoodFactsResultDto.cs`
- `PosWeb.Contracts/ProductoLookupResponseDto.cs`

### Backend — modificados
- `PosWeb.Domain/Producto.cs` — agregar MARCA, IMAGEN_URL, INGREDIENTES
- `PosWeb.Contracts/ProductoDto.cs` — ampliar campos
- `PosWeb.Contracts/ProductoUpsertDto.cs` — ampliar campos
- `PosWeb/Application/Productos/ProductoService.cs` — Crear() acepta campos opcionales, MapToDto() los devuelve
- `PosWeb/Controllers/ProductosController.cs` — nuevo endpoint
- `PosWeb/Program.cs` — registrar HttpClient + OpenFoodFactsService
- `PosWeb/Data/PosDbContext.cs` — nueva configuración Fluent API para los 3 campos
- `PosWeb/Migrations/` — nueva migración

### Frontend — nuevos
- `frontend/src/components/BarcodeLookup.tsx`
- `frontend/src/components/ProductFormEnriched.tsx`

### Frontend — modificados
- `frontend/src/types/index.ts` — nuevas interfaces, ampliar existentes
- `frontend/src/api/client.ts` — nuevo método lookup
- `frontend/src/pages/ProductosPage.tsx` — integrar BarcodeLookup

## Test Strategy

### Unit tests (backend)
- `OpenFoodFactsService.Consultar()` — mockear HttpClient, verificar mapeo de respuesta completa, respuesta vacía, timeout
- `OpenFoodFactsService.Mapear()` — verificar que campos null no rompen
- `ProductoService.Crear()` — verificar que acepta los nuevos campos opcionales
- `ProductosController.OpenFoodFacts()` — verificar 3 casos: local, remoto encontrado, remoto no encontrado

### Integration tests
- Test con `Microsoft.AspNetCore.TestHost` + mock de `HttpMessageHandler`
- Verificar el endpoint completo devuelve JSON correcto

### Frontend (type-check)
- `npx tsc -b` pasa sin errores

## Alternatives Considered

| Alternativa | Por qué no |
|-------------|-----------|
| Usar `DESC_ADICIONAL` para guardar Marca, Imagen e Ingredientes como JSON | Difícil de consultar, no tipado, feo. Columnas propias es más limpio |
| Hacer el lookup en el frontend directamente | Expone la API key (si la tuviera), rompe la arquitectura backend-first, no testeable |
| Endpoint único que hace lookup + create en un paso | Acopla dos operaciones distintas, hace el endpoint confuso. Mejor separar lookup → create |
| No crear tabla/columnas nuevas, usar `DESC_ADICIONAL` para todo | `DESC_ADICIONAL` ya existe para presentación. Marca e ingredientes merecen columnas propias por semántica |
