namespace PosWeb.Contracts;

public class EstadisticasDto
{
    public DateTime Desde { get; set; }
    public DateTime Hasta { get; set; }
    public int TotalVentas { get; set; }
    public decimal Facturacion { get; set; }
    public decimal CostoTotal { get; set; }
    public decimal ResultadoNeto { get; set; }
    public decimal TicketPromedio { get; set; }
    public DateTime? MejorDia { get; set; }
    public decimal MejorDiaFacturacion { get; set; }
    public List<ProductoEstadisticaDto> TopProductos { get; set; } = new();
}

public class ProductoEstadisticaDto
{
    public int ProductoId { get; set; }
    public string ProductoNombre { get; set; } = string.Empty;
    public string CodigoBarra { get; set; } = string.Empty;
    public decimal CantidadVendida { get; set; }
    public decimal Subtotal { get; set; }
}

public class EstadisticasRequestDto
{
    public DateTime Desde { get; set; }
    public DateTime Hasta { get; set; }
    public int? SucursalId { get; set; }
}
