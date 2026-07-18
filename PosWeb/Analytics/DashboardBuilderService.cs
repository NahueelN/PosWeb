using PosWeb.Analytics.Models;
using PosWeb.Analytics.Queries;
using PosWeb.Data;

namespace PosWeb.Analytics;

/// <summary>
/// Servicio principal del Dashboard Builder.
/// Ejecuta queries según las instancias solicitadas y construye la respuesta.
/// El Dashboard solo conoce WidgetInstances — nunca sabe qué datos hay detrás.
/// </summary>
public class DashboardBuilderService
{
    private readonly PosDbContextLocal _db;
    private readonly WidgetFactory _factory = new();

    public DashboardBuilderService(PosDbContextLocal db)
    {
        _db = db;
    }

    /// <summary>
    /// Construye el dashboard ejecutando las queries correspondientes a cada instancia.
    /// </summary>
    /// <param name="sucursalId">ID de la sucursal activa.</param>
    /// <param name="instances">Instancias de widgets que el usuario tiene en su dashboard.</param>
    public async Task<DashboardResponse> BuildDashboardAsync(int sucursalId, List<WidgetInstance>? instances = null)
    {
        var definitions = WidgetDefinitionRegistry.GetAll();
        var widgets = new List<Widget>();

        if (instances != null && instances.Count > 0)
        {
            // Ejecutar queries para cada instancia
            var tasks = instances.Select(i => ExecuteInstanceAsync(sucursalId, i)).ToList();
            var results = await Task.WhenAll(tasks);

            foreach (var (instance, widget) in instances.Zip(results))
            {
                if (widget != null)
                {
                    // Aplicar configuración del usuario al widget
                    ApplyUserConfig(widget, instance);
                    widget.Id = instance.Id; // Usar el ID de la instancia, no el de la query
                    widgets.Add(widget);
                }
            }
        }

        return new DashboardResponse
        {
            Definitions = definitions,
            Widgets = widgets,
        };
    }

    /// <summary>
    /// Ejecuta la query correspondiente a una instancia y devuelve el Widget renderizado.
    /// </summary>
    private async Task<Widget?> ExecuteInstanceAsync(int sucursalId, WidgetInstance instance)
    {
        var definition = WidgetDefinitionRegistry.GetById(instance.DefinitionId);
        if (definition == null) return null;

        // Mapear definitionId → query y ejecutar
        var dataset = await ExecuteQueryAsync(instance.DefinitionId, sucursalId, instance.Config);
        if (dataset == null) return null;

        // Crear widget según el tipo de visualización elegido
        var title = instance.Title ?? definition.Name;
        return CreateWidgetFromInstance(instance, title, dataset);
    }

    /// <summary>
    /// Ejecuta la AnalyticsQuery correspondiente al definitionId.
    /// </summary>
    private async Task<Dataset?> ExecuteQueryAsync(string definitionId, int sucursalId, Dictionary<string, object?> config)
    {
        // Mapear config del usuario a DashboardQueryParams
        var p = MapConfigToParams(definitionId, config);

        return definitionId switch
        {
            "ventas-hoy" => await new VentasHoyQuery().ExecuteAsync(sucursalId, _db, p),
            "caja" => await new CajaActualQuery().ExecuteAsync(sucursalId, _db, p),
            "meta" => await new MetaQuery().ExecuteAsync(sucursalId, _db, p),
            "ventas-semana" => await new VentasSemanaQuery().ExecuteAsync(sucursalId, _db, p),
            "ventas-por-categoria" => await new VentasPorCategoriaQuery().ExecuteAsync(sucursalId, _db, p),
            "top-productos" => await new TopProductosQuery().ExecuteAsync(sucursalId, _db, p),
            "alertas" => await new AlertasQuery().ExecuteAsync(sucursalId, _db, p),
            "resumen" => await new ResumenOperativoQuery().ExecuteAsync(sucursalId, _db, p),
            "actividad" => await new ActividadRecienteQuery().ExecuteAsync(sucursalId, _db, p),
            "ultimas-ventas" => await new UltimasVentasQuery().ExecuteAsync(sucursalId, _db, p),
            _ => null,
        };
    }

    /// <summary>
    /// Crea un Widget según el tipo de visualización elegido por el usuario.
    /// </summary>
    private Widget CreateWidgetFromInstance(WidgetInstance instance, string title, Dataset dataset)
    {
        return instance.WidgetType switch
        {
            "KPI" => _factory.CreateKpi(instance.Id, title, dataset),
            "BAR_CHART" => _factory.CreateBarChart(instance.Id, title, dataset),
            "LINE_CHART" => _factory.CreateLineChart(instance.Id, title, dataset),
            "PIE_CHART" => _factory.CreatePieChart(instance.Id, title, dataset),
            "TABLE" => _factory.CreateTable(instance.Id, title, dataset),
            "LIST" => _factory.CreateList(instance.Id, title, dataset),
            "ALERTS" => _factory.CreateAlerts(instance.Id, title, dataset),
            "PROGRESS" => _factory.CreateProgress(instance.Id, title, dataset),
            "GAUGE" => _factory.CreateGauge(instance.Id, title, dataset),
            _ => _factory.CreateKpi(instance.Id, title, dataset), // Fallback a KPI
        };
    }

    /// <summary>
    /// Mapea la configuración del usuario a DashboardQueryParams.
    /// </summary>
    private static DashboardQueryParams MapConfigToParams(string definitionId, Dictionary<string, object?> config)
    {
        var p = new DashboardQueryParams();

        if (config.TryGetValue("period", out var period) && period is string periodStr && int.TryParse(periodStr, out var periodDays))
            p.ChartPeriodDays = periodDays;

        if (config.TryGetValue("limit", out var limit) && limit is int limitVal)
        {
            switch (definitionId)
            {
                case "top-productos": p.ProductLimit = limitVal; break;
                case "actividad": p.ActivityLimit = limitVal; break;
                case "ultimas-ventas": p.SalesLimit = limitVal; break;
            }
        }

        return p;
    }

    /// <summary>
    /// Aplica la configuración del usuario al Widget creado.
    /// </summary>
    private static void ApplyUserConfig(Widget widget, WidgetInstance instance)
    {
        if (widget.Config == null)
            widget.Config = new WidgetConfig();

        // Mapear config del usuario a WidgetConfig
        if (instance.Config.TryGetValue("color", out var color) && color is string colorStr)
            widget.Config.Color = colorStr;

        if (instance.Config.TryGetValue("icon", out var icon) && icon is string iconStr)
            widget.Config.Icon = iconStr;

        if (instance.Config.TryGetValue("period", out var period))
            widget.Config.Period = period?.ToString();

        if (instance.Config.TryGetValue("showLegend", out var legend) && legend is bool legendVal)
            widget.Config.ShowLegend = legendVal;

        if (instance.Config.TryGetValue("showPercentages", out var pct) && pct is bool pctVal)
            widget.Config.ShowPercentages = pctVal;

        if (instance.Config.TryGetValue("donut", out var donut) && donut is bool donutVal)
            widget.Config.Donut = donutVal;

        if (instance.Config.TryGetValue("max", out var max) && max is int maxVal)
            widget.Config.Max = maxVal;

        if (instance.Config.TryGetValue("min", out var min) && min is int minVal)
            widget.Config.Min = minVal;

        if (instance.Config.TryGetValue("showLabel", out var showLabel) && showLabel is bool showLabelVal)
            widget.Config.ShowLabel = showLabelVal;

        if (instance.Config.TryGetValue("showDots", out var dots) && dots is bool dotsVal)
            widget.Config.ShowDots = dotsVal;
    }
}
