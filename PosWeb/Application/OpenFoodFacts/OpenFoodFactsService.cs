using System.Text.Json;
using System.Text.RegularExpressions;
using PosWeb.Contracts;

namespace PosWeb.Application.OpenFoodFacts;

public class OpenFoodFactsService
{
    private readonly HttpClient _http;
    private readonly ILogger<OpenFoodFactsService> _logger;

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
        ["l"] = "LT",
        ["liter"] = "LT",
        ["litre"] = "LT",
        ["g"] = "GR",
        ["gram"] = "GR",
        ["gramme"] = "GR",
        ["kg"] = "KG",
        ["kilogram"] = "KG",
        ["kilogramme"] = "KG",
        ["mg"] = "GR",
        ["un"] = "UN",
        ["unit"] = "UN",
        ["unidad"] = "UN",
        ["ud"] = "UN",
        ["pack"] = "PACK",
    };

    public OpenFoodFactsService(HttpClient http, ILogger<OpenFoodFactsService> logger)
    {
        _http = http;
        _logger = logger;
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

    private static OpenFoodFactsResultDto Mapear(JsonElement product, string codigoBarras)
    {
        var unidad = TryGetString(product, "product_quantity_unit");
        var unidadCod = unidad != null ? ResolverUnidad(unidad) : null;

        return new OpenFoodFactsResultDto
        {
            CodigoBarras = codigoBarras,
            Descripcion = product.GetProperty("product_name").GetString() ?? string.Empty,
            Marca = TryGetString(product, "brands"),
            Categoria = TryGetString(product, "categories"),
            Contenido = TryGetDecimal(product, "product_quantity")
                ?? TryParseQuantity(product),
            Unidad = unidadCod,
        };
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
