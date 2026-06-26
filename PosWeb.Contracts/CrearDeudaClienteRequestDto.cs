namespace PosWeb.Contracts;

public class CrearDeudaClienteRequestDto
{
    public int ClienteId { get; set; }
    public int VentaId { get; set; }
    public decimal Monto { get; set; }
    public decimal? MontoPagado { get; set; }
}
