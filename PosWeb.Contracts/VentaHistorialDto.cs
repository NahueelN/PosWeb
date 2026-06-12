namespace PosWeb.Contracts;

public class VentaHistorialDto
{
    public int VentaId { get; set; }
    public DateTime Fecha { get; set; }
    public string? SucursalNombre { get; set; }
    public string? UsuarioNombre { get; set; }
    public decimal Total { get; set; }
    public int CantidadItems { get; set; }
    public bool Anulada { get; set; }
}

public class DeshacerVentaRequest
{
    public bool ConDevolucion { get; set; }
}
