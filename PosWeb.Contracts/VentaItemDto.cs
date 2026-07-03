namespace PosWeb.Contracts;

public class VentaItemDto
{
    public int ProductoId { get; set; }
    public int Cantidad { get; set; }
    public int? ComboId { get; set; }
    public int? OfertaId { get; set; }
}
