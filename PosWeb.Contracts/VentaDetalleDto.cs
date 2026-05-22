namespace PosWeb.Contracts;

public class VentaDetalleDto
{
    public int VentaId { get; set; }
    public DateTime Fecha { get; set; }
    public int SucursalId { get; set; }
    public string? SucursalNombre { get; set; }
    public decimal Total { get; set; }
    public List<RenglonHistorialDto> Items { get; set; } = [];
}
