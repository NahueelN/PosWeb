namespace PosWeb.Contracts;

public class PagoVentaResultDto
{
    public int MedioPagoId { get; set; }
    public string MedioPagoNombre { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public decimal? ConCambio { get; set; }
    public decimal Cambio { get; set; }
}
