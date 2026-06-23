using System.Text.Json.Serialization;

namespace PosWeb.Contracts;

public class ProductoDto
{
    public int Id { get; set; }

    public string CodigoBarra { get; set; } = string.Empty;
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

    public decimal? MargenGanancia { get; set; }

    /// <summary>
    /// Código interno del producto.
    /// </summary>
    public string? CodigoProducto { get; set; }
}

public class ProductoDetailDto
{
    public int Id { get; set; }
    public string CodigoBarra { get; set; } = string.Empty;
    public string CodProducto { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public decimal Costo { get; set; }
    public int Stock { get; set; }
    public string? Categoria { get; set; }
    public string? DescAdicional { get; set; }
    public decimal? Contenido { get; set; }
    public string? UnidadMedida { get; set; }
    public string? Tamano { get; set; }
    public DateTime FechaAlta { get; set; }
    public DateTime FechaUltimaMod { get; set; }
    public DateTime? FechaBaja { get; set; }
    public bool Activo { get; set; }
}
