namespace PosWeb.Contracts;

public class PagoVentaDto
{
    public int MedioPagoId { get; set; }
    public decimal Monto { get; set; }
    public decimal? ConCambio { get; set; }
}
