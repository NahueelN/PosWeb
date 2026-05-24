namespace PosWeb.Contracts;

public class PagoPorMedioDto
{
    public int IdMedioPago { get; set; }
    public string MedioPago { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public bool PagaVuelto { get; set; }
}
