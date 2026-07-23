using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using PosWeb.Contracts;

namespace PosWeb.Application.Catalogo;

public class CatalogoService
{
    private readonly HttpClient _http;
    private readonly ILogger<CatalogoService> _logger;
    private readonly bool _habilitado;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public CatalogoService(HttpClient http, ILogger<CatalogoService> logger, IConfiguration configuration)
    {
        _http = http;
        _logger = logger;
        _habilitado = configuration.GetValue<bool>("Catalogo:Habilitado");
    }

    public async Task<OpenFoodFactsResultDto?> ConsultarAsync(string codigoBarras)
    {
        if (!_habilitado || string.IsNullOrWhiteSpace(codigoBarras))
            return null;

        try
        {
            var response = await _http.GetAsync($"/productos/{codigoBarras.Trim().ToUpperInvariant()}");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Catálogo worker returned {StatusCode} for barcode {Barcode}",
                    (int)response.StatusCode, codigoBarras);
                return null;
            }

            var result = await response.Content.ReadFromJsonAsync<CatalogoLookupResponse>(JsonOptions);
            if (result == null || !result.Encontrado || result.Datos == null)
                return null;

            return new OpenFoodFactsResultDto
            {
                CodigoBarras = result.Datos.CodigoBarras,
                Descripcion = result.Datos.Descripcion,
                Marca = result.Datos.Marca,
                Contenido = result.Datos.Contenido,
                Unidad = result.Datos.Unidad,
            };
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "HTTP error calling catálogo worker for barcode {Barcode}", codigoBarras);
            return null;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "Timeout calling catálogo worker for barcode {Barcode}", codigoBarras);
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "JSON parse error from catálogo worker for barcode {Barcode}", codigoBarras);
            return null;
        }
    }

    public async Task SubirProductoAsync(string codigoBarras, string descripcion, string? marca, decimal? contenido, string? unidad)
    {
        if (!_habilitado || string.IsNullOrWhiteSpace(codigoBarras) || string.IsNullOrWhiteSpace(descripcion))
            return;

        try
        {
            var response = await _http.PostAsJsonAsync("/productos", new
            {
                codigo_barras = codigoBarras.Trim().ToUpperInvariant(),
                descripcion = descripcion.Trim(),
                marca = string.IsNullOrWhiteSpace(marca) ? null : marca.Trim(),
                contenido,
                unidad = string.IsNullOrWhiteSpace(unidad) ? null : unidad.Trim()
            }, JsonOptions);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Catálogo worker returned {StatusCode} uploading product {Barcode}",
                    (int)response.StatusCode, codigoBarras);
            }
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "HTTP error uploading product {Barcode} to catálogo worker", codigoBarras);
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "Timeout uploading product {Barcode} to catálogo worker", codigoBarras);
        }
    }

    private class CatalogoLookupResponse
    {
        [JsonPropertyName("encontrado")]
        public bool Encontrado { get; set; }

        [JsonPropertyName("datos")]
        public CatalogoProductoData? Datos { get; set; }
    }

    private class CatalogoProductoData
    {
        [JsonPropertyName("codigoBarras")]
        public string CodigoBarras { get; set; } = string.Empty;

        [JsonPropertyName("descripcion")]
        public string Descripcion { get; set; } = string.Empty;

        [JsonPropertyName("marca")]
        public string? Marca { get; set; }

        [JsonPropertyName("contenido")]
        public decimal? Contenido { get; set; }

        [JsonPropertyName("unidad")]
        public string? Unidad { get; set; }
    }
}
