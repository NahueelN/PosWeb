namespace PosWeb.Contracts;

public class CompraRequestDto
{
    public int SucursalId { get; set; }
    public int ProveedorId { get; set; }
    public int? UserId { get; set; }
    public List<CompraItemDto> Items { get; set; } = new();
    public decimal? MontoPagado { get; set; }
    public decimal? MontoPagadoCaja { get; set; } // used when FuentePago == "dividir"
    public string? FuentePago { get; set; } // "caja" (default), "ahorro", or "dividir"
}

public class CompraItemDto
{
    public int ProductoId { get; set; }          // 0 → create new product inline
    public int Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }

    // Inline creation fields (required when ProductoId == 0)
    public string? CodigoBarra { get; set; }
    public string? Nombre { get; set; }
    public decimal Precio { get; set; }
    public decimal? Costo { get; set; }
    public int? CategoriaId { get; set; }
    public string? DescAdicional { get; set; }
    public decimal? Contenido { get; set; }
    public int? UnidadMedidaId { get; set; }
    public string? Tamano { get; set; }
}

public class NuevoProductoDto
{
    public string CodigoBarra { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public decimal Precio { get; set; }
    public decimal Costo { get; set; }
    public int? CategoriaId { get; set; }
    public string? DescAdicional { get; set; }
    public decimal? Contenido { get; set; }
    public int? UnidadMedidaId { get; set; }
    public string? Tamano { get; set; }
}
