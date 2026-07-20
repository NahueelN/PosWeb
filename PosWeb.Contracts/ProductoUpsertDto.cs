using System.Text.Json.Serialization;

namespace PosWeb.Contracts;

public class ProductoUpsertDto
{
    public string CodigoBarra { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public decimal Costo { get; set; }
    public string? Marca { get; set; }
    public decimal? Contenido { get; set; }
    public int? CategoriaId { get; set; }
    public int? UnidadMedidaId { get; set; }
    public string? DescAdicional { get; set; }

    public decimal? MargenGanancia { get; set; }

    public bool? SeguirStock { get; set; }

    /// <summary>
    /// Código interno del producto (opcional). Si no se envía, se auto-genera.
    /// </summary>
    public string? CodigoProducto { get; set; }

    public bool EsPesable { get; set; }

    public bool EsBulto { get; set; }

    /// <summary>
    /// ID del producto que representa la unidad del bulto (solo cuando EsBulto = true).
    /// </summary>
    public int? ProductoBultoId { get; set; }
}
