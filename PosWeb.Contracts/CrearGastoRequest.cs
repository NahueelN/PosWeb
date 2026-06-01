namespace PosWeb.Contracts;

public class CrearGastoRequest
{
    public decimal Monto { get; set; }
    public string Detalle { get; set; } = string.Empty;
}
