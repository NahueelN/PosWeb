using PosWeb.Analytics.Models;
using PosWeb.Analytics.Queries;
using PosWeb.Data;

namespace PosWeb.Analytics;

public class AnalyticsDashboardService
{
    private readonly PosDbContextLocal _db;
    private readonly WidgetFactory _factory = new();

    public AnalyticsDashboardService(PosDbContextLocal db)
    {
        _db = db;
    }

    public async Task<DashboardResponse> GetDashboardAsync(int sucursalId, DashboardQueryParams? p = null)
    {
        // Ejecutar queries en paralelo
        var ventasHoyTask = new VentasHoyQuery().ExecuteAsync(sucursalId, _db, p);
        var cajaTask = new CajaActualQuery().ExecuteAsync(sucursalId, _db, p);
        var ventasSemanaTask = new VentasSemanaQuery().ExecuteAsync(sucursalId, _db, p);
        var topProductosTask = new TopProductosQuery().ExecuteAsync(sucursalId, _db, p);
        var alertasTask = new AlertasQuery().ExecuteAsync(sucursalId, _db, p);
        var resumenTask = new ResumenOperativoQuery().ExecuteAsync(sucursalId, _db, p);
        var actividadTask = new ActividadRecienteQuery().ExecuteAsync(sucursalId, _db, p);
        var metaTask = new MetaQuery().ExecuteAsync(sucursalId, _db, p);
        var ultimasVentasTask = new UltimasVentasQuery().ExecuteAsync(sucursalId, _db, p);

        await Task.WhenAll(
            ventasHoyTask, cajaTask, ventasSemanaTask,
            topProductosTask, alertasTask, resumenTask,
            actividadTask, metaTask, ultimasVentasTask
        );

        // Construir widgets
        var widgets = new List<Widget>
        {
            _factory.CreateKpi("ventas-hoy", "Ventas Hoy", ventasHoyTask.Result, "dollar", "indigo"),
            _factory.CreateKpi("caja", "Caja", cajaTask.Result, "wallet", "emerald"),
            _factory.CreateBarChart("ventas-semana", "Ventas de la Semana", ventasSemanaTask.Result, "semanal"),
            _factory.CreateTable("top-productos", "Top Productos", topProductosTask.Result),
            _factory.CreateAlerts("alertas", "Alertas", alertasTask.Result),
            _factory.CreateList("resumen", "Resumen del día", resumenTask.Result),
            _factory.CreateList("actividad", "Actividad Reciente", actividadTask.Result),
            _factory.CreateKpi("meta", "Meta del Día", metaTask.Result, "target", "purple"),
            _factory.CreateList("ultimas-ventas", "Últimas Ventas", ultimasVentasTask.Result),
        };

        return new DashboardResponse { Widgets = widgets };
    }
}
