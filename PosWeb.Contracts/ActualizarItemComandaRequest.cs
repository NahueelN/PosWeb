namespace PosWeb.Contracts;

public class ActualizarItemComandaRequest
{
    public decimal Cantidad { get; set; } = 1;
    public string? Nota { get; set; }
}