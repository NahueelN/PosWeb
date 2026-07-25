namespace PosWeb.Contracts;

public class DashboardDto
{
    // KPIs
    public decimal VentasHoy { get; set; }
    public int CantidadVentasHoy { get; set; }
    public decimal TicketPromedio { get; set; }
    public decimal CajaActual { get; set; }
    public decimal GananciaEstimada { get; set; }

    // Day comparison (% change vs yesterday, null if no data yesterday)
    public decimal? VariacionVentas { get; set; }
    public decimal? VariacionCantidad { get; set; }
    public decimal? VariacionTicket { get; set; }
    public decimal? VariacionGanancia { get; set; }

    // Caja detail
    public string CajaEstado { get; set; } = "cerrada";
    public decimal CajaMontoInicial { get; set; }
    public DateTime? CajaFechaApertura { get; set; }

    // Meta del día
    public decimal MetaDiaria { get; set; }
    public decimal MetaPorcentaje { get; set; }

    // Operational summary
    public int ProductosVendidosHoy { get; set; }
    public int ClientesAtendidosHoy { get; set; }

    // Chart: last 7 days
    public List<DiaVentaDto> VentasSemana { get; set; } = new();

    // Top 5 products today
    public List<TopProductoDto> TopProductos { get; set; } = new();

    // Alerts
    public AlertasDto Alertas { get; set; } = new();

    // Recent sales (enhanced)
    public List<UltimaVentaDto> UltimasVentas { get; set; } = new();

    // Activity feed
    public List<ActividadRecienteDto> ActividadReciente { get; set; } = new();

    // System info
    public string SucursalNombre { get; set; } = "";
    public string UsuarioNombre { get; set; } = "";
}

public class DiaVentaDto
{
    public string Fecha { get; set; } = "";
    public decimal Total { get; set; }
}

public class TopProductoDto
{
    public int ProductoId { get; set; }
    public string Nombre { get; set; } = "";
    public decimal Cantidad { get; set; }
    public decimal Subtotal { get; set; }
}

public class AlertasDto
{
    public int StockBajo { get; set; }
    public int DeudasProveedor { get; set; }
    public int DeudasCliente { get; set; }
    public int PedidosPendientes { get; set; }
    public int ComprasPendientes { get; set; }
    public bool CajaAbierta { get; set; }
}

public class UltimaVentaDto
{
    public int VentaId { get; set; }
    public DateTime Fecha { get; set; }
    public decimal Total { get; set; }
    public string? Usuario { get; set; }
    public string? ProductoPrincipal { get; set; }
    public int CantidadItems { get; set; }
}

public class ActividadRecienteDto
{
    public string Tipo { get; set; } = "";          // "venta", "compra", "caja", "gasto"
    public string Descripcion { get; set; } = "";
    public DateTime Fecha { get; set; }
    public string? Usuario { get; set; }
    public decimal? Monto { get; set; }
}
