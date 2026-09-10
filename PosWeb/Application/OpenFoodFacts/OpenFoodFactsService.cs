using System.Text.Json;
using System.Text.RegularExpressions;
using PosWeb.Application.Categorias;
using PosWeb.Application.UnidadesMedida;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.OpenFoodFacts;

public class OpenFoodFactsService
{
    private readonly HttpClient _http;
    private readonly ILogger<OpenFoodFactsService> _logger;
    private readonly PosDbContextLocal _context;
    private readonly CategoriaSugeridaService _categoriaSugeridaService;
    private readonly UnidadSugeridaService _unidadSugeridaService;

    /// <summary>
    /// Tags de Open Food Facts que indican que un producto es una bebida.
    /// Si alguna de estas aparece en categories_tags, se asigna la categoría "Bebidas".
    /// </summary>
    private static readonly HashSet<string> BeverageTags = new(StringComparer.OrdinalIgnoreCase)
    {
        "en:beverages",
        "en:carbonated-drinks",
        "en:non-alcoholic-beverages",
        "en:sodas",
        "en:colas",
        "en:sweetened-beverages",
        "en:waters",
        "en:sparkling-waters",
        "en:juices",
        "en:fruit-juices",
        "en:nectars",
        "en:energy-drinks",
        "en:sports-drinks",
        "en:iced-teas",
        "en:tea-based-beverages",
        "en:coffee-drinks",
    };

    /// <summary>
    /// Mapea unidades de Open Food Facts a códigos de UnidadMedida locales.
    /// Las claves son lo que devuelve product_quantity_unit en minúscula.
    /// </summary>
    private static readonly Dictionary<string, string> UnidadMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["ml"] = "ML",
        ["milliliter"] = "ML",
        ["millilitre"] = "ML",
        ["cl"] = "ML",
        ["l"] = "L",
        ["liter"] = "L",
        ["litre"] = "L",
        ["g"] = "GR",
        ["gram"] = "GR",
        ["gramme"] = "GR",
        ["kg"] = "KILO",
        ["kilogram"] = "KILO",
        ["kilogramme"] = "KILO",
        ["mg"] = "GR",
        ["un"] = "UNIDAD",
        ["unit"] = "UNIDAD",
        ["unidad"] = "UNIDAD",
        ["ud"] = "UNIDAD",
        ["pack"] = "PACK",
    };

    public OpenFoodFactsService(HttpClient http, ILogger<OpenFoodFactsService> logger, PosDbContextLocal context, CategoriaSugeridaService categoriaSugeridaService, UnidadSugeridaService unidadSugeridaService)
    {
        _http = http;
        _logger = logger;
        _context = context;
        _categoriaSugeridaService = categoriaSugeridaService;
        _unidadSugeridaService = unidadSugeridaService;
    }

    /// <summary>
    /// Consulta Open Food Facts para un código de barras.
    /// Devuelve null si no se encuentra el producto o si falla la llamada HTTP.
    /// </summary>
    public async Task<OpenFoodFactsResultDto?> ConsultarAsync(string codigoBarras)
    {
        if (string.IsNullOrWhiteSpace(codigoBarras))
        {
            return null;
        }

        try
        {
            var response = await _http.GetAsync($"/api/v2/product/{codigoBarras}.json");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Open Food Facts returned {StatusCode} for barcode {Barcode}",
                    (int)response.StatusCode, codigoBarras);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var root = doc.RootElement;
            if (!root.TryGetProperty("product", out var product) || product.ValueKind != JsonValueKind.Object)
            {
                _logger.LogInformation("Open Food Facts: no product data for barcode {Barcode}", codigoBarras);
                return null;
            }

            if (!product.TryGetProperty("product_name", out var productName) ||
                productName.ValueKind != JsonValueKind.String ||
                string.IsNullOrWhiteSpace(productName.GetString()))
            {
                _logger.LogInformation("Open Food Facts: product_name is empty for barcode {Barcode}", codigoBarras);
                return null;
            }

            return Mapear(product, codigoBarras);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "HTTP error calling Open Food Facts for barcode {Barcode}", codigoBarras);
            return null;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "Timeout calling Open Food Facts for barcode {Barcode}", codigoBarras);
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "JSON parse error from Open Food Facts for barcode {Barcode}", codigoBarras);
            return null;
        }
    }

    private OpenFoodFactsResultDto Mapear(JsonElement product, string codigoBarras)
    {
        var unidad = TryGetString(product, "product_quantity_unit");
        var unidadCod = unidad != null ? ResolverUnidad(unidad) : null;

        var dto = new OpenFoodFactsResultDto
        {
            CodigoBarras = codigoBarras,
            Descripcion = product.GetProperty("product_name").GetString() ?? string.Empty,
            Marca = TryGetString(product, "brands"),
            Categoria = TryGetString(product, "categories"),
            Contenido = TryGetDecimal(product, "product_quantity")
                ?? TryParseQuantity(product),
            Unidad = unidadCod,
        };

        // Resolver categoría sugerida desde categories_tags
        dto.CategoriaIdSugerido = ResolverCategoriaSugerida(product);

        // Auto-convertir ML → L cuando el contenido supera 1000
        // ej: 2250 ml → 2.250 L
        if (unidadCod == "ML" && dto.Contenido.HasValue && dto.Contenido.Value > 1000)
        {
            dto.Contenido = Math.Round(dto.Contenido.Value / 1000m, 3);
            dto.Unidad = "L";
        }

        // Resolver o crear la unidad de medida local a partir del código final
        dto.UnidadIdSugerido = _unidadSugeridaService.ResolverOCrear(dto.Unidad);

        return dto;
    }

    /// <summary>
    /// Resuelve la categoría sugerida por Open Food Facts si ya existe en la base.
    /// Deriva el nombre desde categories_tags (tag en:) o el campo categories
    /// y delega la búsqueda case-insensitive en CategoriaSugeridaService. No crea categorías.
    /// </summary>
    private int? ResolverCategoriaSugerida(JsonElement product)
    {
        return _categoriaSugeridaService.Resolver(ObtenerNombreCategoria(product));
    }

    /// <summary>
    /// Determina el nombre de la categoría a partir del producto de Open Food Facts.
    /// Prioriza el tag en: de categories_tags; las bebidas mantienen su nombre en español;
    /// si no hay tag en:, usa el primer segmento del campo categories.
    /// </summary>
    private static string? ObtenerNombreCategoria(JsonElement product)
    {
        if (product.TryGetProperty("categories_tags", out var tags) && tags.ValueKind == JsonValueKind.Array)
        {
            foreach (var tag in tags.EnumerateArray())
            {
                if (tag.ValueKind != JsonValueKind.String)
                    continue;

                var tagStr = tag.GetString();
                if (string.IsNullOrWhiteSpace(tagStr))
                    continue;

                if (BeverageTags.Contains(tagStr))
                    return "Bebidas";

                if (tagStr.StartsWith("en:", StringComparison.OrdinalIgnoreCase) && tagStr.Length > 3)
                    return FormatearNombre(tagStr[3..]);
            }
        }

        var categoriesText = TryGetString(product, "categories");
        if (!string.IsNullOrWhiteSpace(categoriesText))
        {
            var primero = categoriesText
                .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries)
                .FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(primero))
                return primero.Length > 200 ? primero[..200] : primero;
        }

        return null;
    }

    /// <summary>
    /// Convierte un slug (ej: "salty-snacks") a un nombre legible (ej: "Salty Snacks").
    /// </summary>
    private static string FormatearNombre(string slug)
    {
        var palabras = slug.Split('-', StringSplitOptions.RemoveEmptyEntries);
        return string.Join(' ', palabras.Select(p =>
            p.Length > 0 ? char.ToUpperInvariant(p[0]) + p[1..] : p));
    }

    /// <summary>
    /// Convierte la unidad de OF (ej: "ml", "g", "kilogram") a nuestro COD_UNIDAD_MEDIDA (ej: "ML", "GR", "KG").
    /// </summary>
    private static string? ResolverUnidad(string ofUnit)
    {
        if (UnidadMap.TryGetValue(ofUnit.Trim(), out var cod))
            return cod;

        return null;
    }

    private static string? TryGetString(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var prop) &&
            prop.ValueKind == JsonValueKind.String)
        {
            var value = prop.GetString();
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }
        return null;
    }

    private static decimal? TryGetDecimal(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var prop))
        {
            if (prop.ValueKind == JsonValueKind.String)
            {
                var str = prop.GetString();
                if (decimal.TryParse(str, System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var val))
                {
                    return val;
                }
            }
            else if (prop.ValueKind == JsonValueKind.Number)
            {
                if (prop.TryGetDecimal(out var val))
                {
                    return val;
                }
            }
        }
        return null;
    }

    /// <summary>
    /// Si product_quantity no viene, intenta extraer el número de quantity (ej: "500 ml" → 500).
    /// </summary>
    private static decimal? TryParseQuantity(JsonElement product)
    {
        if (!product.TryGetProperty("quantity", out var q) || q.ValueKind != JsonValueKind.String)
            return null;

        var str = q.GetString();
        if (string.IsNullOrWhiteSpace(str))
            return null;

        var match = Regex.Match(str, @"[\d]+(\.[\d]+)?");
        if (match.Success && decimal.TryParse(match.Value,
            System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var val))
        {
            return val;
        }

        return null;
    }
}
