namespace PosWeb.Contracts;

public class CerrarCajaRequest
{
    public decimal MontoContadoEfectivo { get; set; }
    public decimal MontoContadoTarjetas { get; set; }
    public decimal Gastos { get; set; }
    public string? Observaciones { get; set; }
}
