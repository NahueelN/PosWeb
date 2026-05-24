namespace PosWeb.Contracts;

public class VentaResultadoDto
{
    public int VentaId { get; set; }

    public DateTime Fecha { get; set; }

    public decimal Total { get; set; }

    public List<PagoVentaResultDto> Pagos { get; set; } = new();

    public decimal Cambio { get; set; }
}
