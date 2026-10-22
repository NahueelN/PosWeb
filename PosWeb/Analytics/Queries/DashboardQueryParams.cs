namespace PosWeb.Analytics.Queries;

/// <summary>
/// Parámetros configurables que el frontend envía al dashboard.
/// Cada query usa solo los que le interesan.
/// </summary>
public class DashboardQueryParams
{
    /// <summary>Cantidad de productos en el ranking (TopProductos).</summary>
    public int ProductLimit { get; set; } = 5;

    /// <summary>Cantidad de movimientos en Actividad Reciente.</summary>
    public int ActivityLimit { get; set; } = 15;

    /// <summary>Cantidad de últimas ventas a mostrar.</summary>
    public int SalesLimit { get; set; } = 8;

    /// <summary>Período del gráfico de ventas en días (7, 14, 30).</summary>
    public int ChartPeriodDays { get; set; } = 7;

    /// <summary>Métrica de la distribución horaria: "monto" (facturación) o "cantidad" (transacciones).</summary>
    public string Metric { get; set; } = "monto";

    /// <summary>Meta diaria de ventas configurada por el usuario (Meta del día).</summary>
    public decimal? MetaMax { get; set; }

    /// <summary>Período en días para Top Productos (0 = hoy, 7 = semana, 30 = mes).</summary>
    public int TopProductosPeriodDays { get; set; } = 0;

    /// <summary>Cantidad de productos para el ranking de margen por producto.</summary>
    public int MarginLimit { get; set; } = 10;

    /// <summary>Cantidad de vendedores en el ranking de rendimiento.</summary>
    public int SellerLimit { get; set; } = 10;

    /// <summary>Antigüedad en días para considerar un producto sin movimiento (30/60/90).</summary>
    public int InmovilizadoDays { get; set; } = 60;

    /// <summary>Cantidad de productos en la lista de stock inmovilizado.</summary>
    public int InmovilizadoLimit { get; set; } = 10;
}
