namespace PosWeb.Contracts;

public class ProductoUpsertDto
{
    public string CodigoBarras { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public decimal Costo { get; set; }
    public string? Marca { get; set; }
    public decimal? Contenido { get; set; }
    public int? CategoriaId { get; set; }
    public int? UnidadMedidaId { get; set; }
    public string? DescAdicional { get; set; }
}
