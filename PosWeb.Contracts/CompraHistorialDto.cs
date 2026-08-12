namespace PosWeb.Contracts;

public class CompraHistorialDto
{
    public int CompraId { get; set; }
    public int NumeroComprobante { get; set; }
    public DateTime Fecha { get; set; }
    public string? SucursalNombre { get; set; }
    public string? ProveedorNombre { get; set; }
    public string? UsuarioNombre { get; set; }
    public decimal Total { get; set; }
    public int CantidadItems { get; set; }
}
