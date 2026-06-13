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
