namespace PosWeb.Contracts;

public class UpsertMesaRequest
{
    public int SucursalId { get; set; }
    public string Numero { get; set; } = "";
    public string? Descripcion { get; set; }
    /// <summary>Salón/área del local (ej: Principal, Terraza). Vacío → "Principal".</summary>
    public string? Salon { get; set; }
    public decimal PosX { get; set; }
    public decimal PosY { get; set; }
}