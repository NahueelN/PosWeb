namespace PosWeb.Contracts;

public class VentaHistorialDto
{
    public int VentaId { get; set; }
    public DateTime Fecha { get; set; }
    public string? SucursalNombre { get; set; }
    public decimal Total { get; set; }
    public int CantidadItems { get; set; }
}
