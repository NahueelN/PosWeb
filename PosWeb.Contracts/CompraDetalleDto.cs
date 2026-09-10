namespace PosWeb.Contracts;

public class CompraDetalleDto
{
    public int CompraId { get; set; }
    public int NumeroComprobante { get; set; }
    public DateTime Fecha { get; set; }
    public int SucursalId { get; set; }
    public string? SucursalNombre { get; set; }
    public string? ProveedorNombre { get; set; }
    public string? EmpresaNombre { get; set; }
    public decimal Total { get; set; }
    public List<RenglonHistorialDto> Items { get; set; } = [];
}
