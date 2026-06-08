using System.Text.Json.Serialization;

namespace PosWeb.Contracts;

public class ProductoDto
{
    public int Id { get; set; }

    [JsonPropertyName("codigoBarra")]
    public string CodigoBarras { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;

    public decimal Precio { get; set; }
    public decimal Costo { get; set; }

    public int Stock { get; set; }

    public bool Activo { get; set; }

    public string? Marca { get; set; }
    public decimal? Contenido { get; set; }
    public int? CategoriaId { get; set; }
    public int? UnidadMedidaId { get; set; }
    public string? DescAdicional { get; set; }

    /// <summary>
    /// Código interno del producto.
    /// </summary>
    public string? CodigoProducto { get; set; }
}
