namespace PosWeb.Contracts;

public class VentaResultadoDto
{
    public int VentaId { get; set; }

    public DateTime Fecha { get; set; }

    public decimal Total { get; set; }

    public List<PagoVentaResultDto> Pagos { get; set; } = new();

    public decimal Cambio { get; set; }

    public int? ClienteId { get; set; }

    public string? ClienteNombre { get; set; }

    /// <summary>Monto registrado como deuda del cliente (cuando paga menos del total).</summary>
    public decimal? DeudaMonto { get; set; }

    public int? DeudaId { get; set; }

    public int? CajaId { get; set; }

    public string? EmpresaNombre { get; set; }
}
