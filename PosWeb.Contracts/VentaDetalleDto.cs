namespace PosWeb.Contracts;

public class VentaDetalleDto
{
    public int VentaId { get; set; }
    public DateTime Fecha { get; set; }
    public int SucursalId { get; set; }
    public string? SucursalNombre { get; set; }
    public decimal Total { get; set; }
    public List<RenglonHistorialDto> Items { get; set; } = [];
    public string? EmpresaNombre { get; set; }
    public string? EmpresaDireccion { get; set; }
    public string? EmpresaDocumento { get; set; }
    public string? EmpresaTelefono { get; set; }
    public bool MostrarTelefonoTicket { get; set; }
    public string? Vendedor { get; set; }
    /// <summary>Número de mesa (restaurante) si la venta proviene de una cuenta de mesa.</summary>
    public string? Mesa { get; set; }
    public List<PagoVentaResultDto> Pagos { get; set; } = [];
    public decimal Cambio { get; set; }
}
