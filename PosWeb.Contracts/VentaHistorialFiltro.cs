namespace PosWeb.Contracts;

public class VentaHistorialFiltro
{
    public DateTime? FechaDesde { get; set; }
    public DateTime? FechaHasta { get; set; }
    public int? SucursalId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
