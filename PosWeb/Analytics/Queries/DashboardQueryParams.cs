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
}
