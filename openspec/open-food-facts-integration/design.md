# Design: Open Food Facts Integration

## Architecture Overview

```
Frontend (React)
  BarcodeLookup → ProductFormEnriched
       │
       ▼ GET /api/productos/openfoodfacts/{codigo}
       ▼ POST /api/productos (ProductoUpsertDto ampliado)
       │
Backend (ASP.NET Core)
  ProductosController
       │
       ├── ProductoService.ObtenerPorCodigoBarra()
       │       └── PosDbContext.Producto (MySQL)
       │
       └── OpenFoodFactsService.ConsultarAsync()
               └── HttpClient → world.openfoodfacts.org
```

## Class Design

### OpenFoodFactsService

```csharp
namespace PosWeb.Application.OpenFoodFacts;

public class OpenFoodFactsService
{
    private readonly HttpClient _http;
    private readonly ILogger<OpenFoodFactsService> _logger;

    public OpenFoodFactsService(HttpClient http, ILogger<OpenFoodFactsService> logger)
    {
        _http = http;
        _logger = logger;
    }

    /// <summary>
    /// Consulta Open Food Facts para un código de barras.
    /// Devuelve null si no se encuentra o si falla la llamada.
    /// </summary>
    public async Task<OpenFoodFactsResultDto?> ConsultarAsync(string codigoBarras)
    {
        // GET /api/v2/product/{codigo}.json
        // Si status != 200 → log warning, return null
        // Deserializar response JSON
        // Si product == null o product_name vacío → return null
        // Mapear a OpenFoodFactsResultDto → return
    }

    private OpenFoodFactsResultDto Mapear(JsonElement product, string codigo)
    {
        // Mapeo condicional de cada campo
    }
}
```

**Decision**: Usar `System.Text.Json` directamente (no Newtonsoft) porque es el default de ASP.NET Core 8 y evita dependencias extra. Usar `JsonDocument` para parsing sin models intermedios.

**Decision**: El service devuelve `null` en caso de fallo, no lanza excepción. El controller decide cómo manejar el null.

### Producto Entity — campos nuevos

```csharp
public string? MARCA { get; private set; }
public string? IMAGEN_URL { get; private set; }
public string? INGREDIENTES { get; private set; }
```

**Constructor ampliado**:
```csharp
public Producto(
    string codProducto, string codigoBarras, string descProducto,
    decimal precio, decimal costo,
    int? idCategoria = null, string? descAdicional = null,
    decimal? contenido = null, int? idUnidadMedida = null,
    string? marca = null, string? imagenUrl = null, string? ingredientes = null)
```

**Nuevos mutators**:
```csharp
public void CambiarMarca(string? marca)
public void CambiarImagenUrl(string? imagenUrl)
public void CambiarIngredientes(string? ingredientes)
```

### ProductoService cambios

**`Crear(ProductoUpsertDto dto)`** → ahora pasa todos los campos opcionales al constructor:
```csharp
Producto producto = new Producto(
    dto.CodigoBarras, dto.CodigoBarras, dto.Nombre,
    dto.Precio, dto.Costo,
    dto.CategoriaId, dto.DescAdicional, dto.Contenido, dto.UnidadMedidaId,
    dto.Marca, dto.ImagenUrl, dto.Ingredientes
);
```

**`MapToDto(Producto producto)`** → incluye nuevos campos:
```csharp
private static ProductoDto MapToDto(Producto producto)
{
    return new ProductoDto
    {
        Id = producto.ID_PRODUCTO,
        CodigoBarras = producto.CODIGO_BARRAS,
        Nombre = producto.DESC_PRODUCTO,
        Precio = producto.PRECIO,
        Costo = producto.COSTO,
        Activo = producto.ACTIVO,
        Marca = producto.MARCA,
        ImagenUrl = producto.IMAGEN_URL,
        Ingredientes = producto.INGREDIENTES,
        Contenido = producto.CONTENIDO,
        CategoriaId = producto.ID_CATEGORIA,
        UnidadMedidaId = producto.ID_UNIDAD_MEDIDA,
        DescAdicional = producto.DESC_ADICIONAL
    };
}
```

**Decision**: No incluir navegación a Categoria/UnidadMedida en ProductoDto por ahora → mantener simple. Si se necesita el nombre, se puede agregar después con Include.

### ProductosController — nuevo endpoint

```csharp
[HttpGet("openfoodfacts/{codigo}")]
public async Task<IActionResult> LookupOpenFoodFacts(string codigo)
{
    // 1. Buscar local
    try {
        var local = _productoService.ObtenerPorCodigoBarra(codigo);
        return Ok(new ProductoLookupResponseDto { Local = true, Producto = local });
    } catch (ProductoNoEncontradoException) {
        // No encontrado localmente, continuar
    }

    // 2. Consultar Open Food Facts
    var datos = await _openFoodFactsService.ConsultarAsync(codigo);

    if (datos != null) {
        return Ok(new ProductoLookupResponseDto { Local = false, Encontrado = true, Datos = datos });
    }

    // 3. No encontrado en ningún lado
    return Ok(new ProductoLookupResponseDto { Local = false, Encontrado = false });
}
```

**Decision**: Capturar `ProductoNoEncontradoException` en vez de modificar `ObtenerPorCodigoBarra` → no romper contrato existente.

### Program.cs — registro

```csharp
builder.Services.AddHttpClient<OpenFoodFactsService>(client =>
{
    client.BaseAddress = new Uri("https://world.openfoodfacts.org/");
    client.DefaultRequestHeaders.UserAgent.ParseAdd("PosWeb/1.0 (POS system; contact@example.com)");
    client.Timeout = TimeSpan.FromSeconds(10);
});

builder.Services.AddScoped<OpenFoodFactsService>();
```

**Decision**: `AddHttpClient<T>` + `AddScoped<T>` → el HttpClient es manejado por `IHttpClientFactory` (dispose automático, pooling de conexiones). El service se resuelve como scoped.

### Fluent API — PosDbContext

```csharp
// En OnModelCreating:
builder.Entity<Producto>(entity =>
{
    // ... existente ...
    entity.Property(p => p.MARCA).HasMaxLength(200);
    entity.Property(p => p.IMAGEN_URL).HasMaxLength(500);
    entity.Property(p => p.INGREDIENTES).HasColumnType("TEXT");
});
```

## DTO Design

### OpenFoodFactsResultDto

```csharp
public class OpenFoodFactsResultDto
{
    public string CodigoBarras { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public string? Categoria { get; set; }
    public string? Presentacion { get; set; }
    public decimal? Contenido { get; set; }
    public string? Unidad { get; set; }
    public string? Ingredientes { get; set; }
    public string? Imagen { get; set; }
}
```

### ProductoLookupResponseDto

```csharp
public class ProductoLookupResponseDto
{
    public bool Local { get; set; }
    public ProductoDto? Producto { get; set; }
    public bool Encontrado { get; set; }
    public OpenFoodFactsResultDto? Datos { get; set; }
}
```

### ProductoUpsertDto (ampliado)

```csharp
public class ProductoUpsertDto
{
    public string CodigoBarras { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
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

### ProductoDto (ampliado)

```csharp
public class ProductoDto
{
    public int Id { get; set; }
    public string CodigoBarras { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public decimal Costo { get; set; }
    public int Stock { get; set; }
    public bool Activo { get; set; }
    // Nuevos:
    public string? Marca { get; set; }
    public string? ImagenUrl { get; set; }
    public string? Ingredientes { get; set; }
    public decimal? Contenido { get; set; }
    public int? CategoriaId { get; set; }
    public int? UnidadMedidaId { get; set; }
    public string? DescAdicional { get; set; }
}
```

## Frontend Component Design

### BarcodeLookup.tsx

```
┌──────────────────────────────────────┐
│  [Código de barras...] [🔍 Buscar]   │
│                                      │
│  Estado: buscando ⏳                  │
│  Estado: encontrado local → tarjeta  │
│  Estado: encontrado OF → prellenar   │
│  Estado: no encontrado → msg + botón │
│  Estado: error → msg + botón         │
└──────────────────────────────────────┘
```

**Props**:
```typescript
interface BarcodeLookupProps {
  onProductFound: (product: ProductoDto) => void
  onPrefillForm: (data: OpenFoodFactsResultDto) => void
  onNotFound: (codigo: string) => void
}
```

### ProductFormEnriched.tsx

Formulario que reemplaza el form inline actual de `ProductosPage.tsx`.

Campos:
```
Código de barras  [................] (readonly si viene de lookup)
Nombre            [................] *
Marca             [................]
Presentación      [................] (ej: "1,75L")
Contenido         [........] (numérico)
Unidad de medida  [▼ dropdown......]
Categoría         [▼ dropdown......]
Imagen            [preview o URL..]
Ingredientes      [................] (textarea, expandible)
Precio venta      [........] *
Costo             [........] *

[* = obligatorio]
```

### Tipos TypeScript nuevos
```typescript
export interface OpenFoodFactsResultDto {
  codigoBarras: string
  descripcion: string
  marca?: string | null
  categoria?: string | null
  presentacion?: string | null
  contenido?: number | null
  unidad?: string | null
  ingredientes?: string | null
  imagen?: string | null
}

export interface ProductoLookupResponseDto {
  local: boolean
  producto?: ProductoDto | null
  encontrado: boolean
  datos?: OpenFoodFactsResultDto | null
}

// ProductoUpsertDto ampliado
export interface ProductoUpsertDto {
  codigoBarra: string
  nombre: string
  precio: number
  costo: number
  marca?: string | null
  imagenUrl?: string | null
  ingredientes?: string | null
  contenido?: number | null
  categoriaId?: number | null
  unidadMedidaId?: number | null
  descAdicional?: string | null
}

// ProductoDto ampliado
export interface ProductoDto {
  id: number
  codigoBarra: string
  nombre: string
  precio: number
  costo: number
  stock: number
  activo: boolean
  marca?: string | null
  imagenUrl?: string | null
  ingredientes?: string | null
  contenido?: number | null
  categoriaId?: number | null
  categoriaNombre?: string | null
  unidadMedidaId?: number | null
  unidadMedidaNombre?: string | null
  descAdicional?: string | null
}
```

## Migration Strategy

### Orden de ejecución
1. Agregar propiedades a `Producto` entity
2. Agregar configuración Fluent API en `PosDbContext`
3. `dotnet ef migrations add AddOpenFoodFactsFields`
4. `dotnet ef database update`

### SQL generado esperado
```sql
ALTER TABLE `PRODUCTOS` ADD `MARCA` varchar(200) NULL;
ALTER TABLE `PRODUCTOS` ADD `IMAGEN_URL` varchar(500) NULL;
ALTER TABLE `PRODUCTOS` ADD `INGREDIENTES` longtext NULL;
```

Pomelo genera `longtext` para `HasColumnType("TEXT")`. Es correcto para MySQL.

## Error Handling Flow

```
Controller
  │
  ├── ProductoService.ObtenerPorCodigoBarra()
  │     └── ProductoNoEncontradoException → capturada en controller (ok, seguir)
  │     └── Otra excepción → capturada por ExceptionMiddleware (500)
  │
  └── OpenFoodFactsService.ConsultarAsync()
        └── HttpRequestException → log warning → return null
        └── TaskCanceledException (timeout) → log warning → return null
        └── JsonException → log warning → return null
        └── return null → controller devuelve { encontrado: false }
```

**El controller nunca lanza 500 por fallos de Open Food Facts**. El middleware de excepciones existente maneja el resto.

## Testing Approach

### OpenFoodFactsService tests
- Usar `MockHttpMessageHandler` (o similar) para simular respuestas HTTP
- Casos: respuesta completa, respuesta con campos null, respuesta 404, timeout, JSON malformado

### ProductoService tests
- Ampliar tests existentes de `Crear()` para verificar que acepta los nuevos campos
- Verificar `MapToDto()` incluye los nuevos campos

### Controller tests
- Test de integración con `WebApplicationFactory<Program>` y mock de `HttpMessageHandler`
- Caso: producto local → no llama a API
- Caso: producto remoto → mapea correctamente
- Caso: API falla → devuelve encontrado: false
