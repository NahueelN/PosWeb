namespace PosWeb.Contracts;

public class UpsertMesaRequest
{
    public int SucursalId { get; set; }
    public string Numero { get; set; } = "";
    public string? Descripcion { get; set; }
    public decimal PosX { get; set; }
    public decimal PosY { get; set; }
}