namespace PosWeb.Contracts;

public class AgregarItemComandaRequest
{
    public int? ProductoId { get; set; }
    public int? ComboId { get; set; }
    public decimal Cantidad { get; set; } = 1;
    public string? Nota { get; set; }
}