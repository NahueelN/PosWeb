namespace PosWeb.Contracts;

public class AbrirCajaRequest
{
    public int SucursalId { get; set; }
    public decimal MontoInicial { get; set; }
    public string? Observaciones { get; set; }
}
