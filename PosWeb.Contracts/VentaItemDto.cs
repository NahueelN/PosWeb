namespace PosWeb.Contracts;

public class VentaItemDto
{
    public int ProductoId { get; set; }
    public decimal Cantidad { get; set; }
    public int? ComboId { get; set; }
    public int? OfertaId { get; set; }
    public string? DescripcionManual { get; set; }
    public decimal PrecioManual { get; set; }
}
