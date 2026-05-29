namespace PosWeb.Contracts;

public class CompraRequestDto
{
    public int SucursalId { get; set; }
    public string Proveedor { get; set; } = string.Empty;
    public List<CompraItemDto> Items { get; set; } = new();
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
    public decimal? Costo { get; set; }          // Optional — defaults to 0 if null
    public string? Tamano { get; set; }
}

public class NuevoProductoDto
{
    public string CodigoBarra { get; set; } = null!;
    public string Nombre { get; set; } = null!;
    public decimal Precio { get; set; }
    public decimal Costo { get; set; }
    public string? Tamano { get; set; }
}
