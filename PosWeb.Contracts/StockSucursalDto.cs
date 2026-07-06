using System.Text.Json.Serialization;

namespace PosWeb.Contracts;

public class StockSucursalDto
{
    [JsonPropertyName("productoId")]
    public int ProductoId { get; set; }

    [JsonPropertyName("productoNombre")]
    public string ProductoNombre { get; set; } = string.Empty;

    [JsonPropertyName("codigoBarra")]
    public string CodigoBarra { get; set; } = string.Empty;

    [JsonPropertyName("sucursalId")]
    public int SucursalId { get; set; }

    [JsonPropertyName("stock")]
    public decimal Stock { get; set; }

    [JsonPropertyName("inicializado")]
    public bool Inicializado { get; set; }
}
