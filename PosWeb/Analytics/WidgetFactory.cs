using PosWeb.Analytics.Models;

namespace PosWeb.Analytics;

/// <summary>
/// Factory genérico para crear Widgets.
/// Cada método crea un Widget con su tipo y configuración visual por defecto.
/// El Dataset proviene de cualquier AnalyticsQuery — el factory no conoce las queries.
/// </summary>
public class WidgetFactory
{
    public Widget CreateKpi(string id, string title, Dataset dataset, string? icon = null, string? color = null)
    {
        return new Widget
        {
            Id = id,
            Title = title,
            Type = WidgetType.KPI,
            Dataset = dataset,
            Config = new WidgetConfig { Icon = icon, Color = color }
        };
    }

    public Widget CreateBarChart(string id, string title, Dataset dataset, string? period = null)
    {
        return new Widget
        {
            Id = id,
            Title = title,
            Type = WidgetType.BAR_CHART,
            Dataset = dataset,
            Config = new WidgetConfig { Period = period, ShowLabels = true }
        };
    }

    public Widget CreateLineChart(string id, string title, Dataset dataset)
    {
        return new Widget
        {
            Id = id,
            Title = title,
            Type = WidgetType.LINE_CHART,
            Dataset = dataset,
            Config = new WidgetConfig { ShowDots = true, ShowLabels = true, ShowLegend = false }
        };
    }

    public Widget CreatePieChart(string id, string title, Dataset dataset, bool? donut = null)
    {
        return new Widget
        {
            Id = id,
            Title = title,
            Type = WidgetType.PIE_CHART,
            Dataset = dataset,
            Config = new WidgetConfig
            {
                Donut = donut ?? true,
                ShowPercentages = true,
                ShowLegend = true
            }
        };
    }

    public Widget CreateTable(string id, string title, Dataset dataset)
    {
        return new Widget
        {
            Id = id,
            Title = title,
            Type = WidgetType.TABLE,
            Dataset = dataset,
            Config = new WidgetConfig { PageSize = 5 }
        };
    }

    public Widget CreateList(string id, string title, Dataset dataset)
    {
        return new Widget
        {
            Id = id,
            Title = title,
            Type = WidgetType.LIST,
            Dataset = dataset
        };
    }

    public Widget CreateAlerts(string id, string title, Dataset dataset)
    {
        return new Widget
        {
            Id = id,
            Title = title,
            Type = WidgetType.ALERTS,
            Dataset = dataset
        };
    }

    public Widget CreateProgress(string id, string title, Dataset dataset, decimal? max = null)
    {
        return new Widget
        {
            Id = id,
            Title = title,
            Type = WidgetType.PROGRESS,
            Dataset = dataset,
            Config = new WidgetConfig
            {
                Max = max,
                ShowLabel = true,
                ValueFormat = "percentage"
            }
        };
    }

    public Widget CreateGauge(string id, string title, Dataset dataset, decimal? min = null, decimal? max = null)
    {
        return new Widget
        {
            Id = id,
            Title = title,
            Type = WidgetType.GAUGE,
            Dataset = dataset,
            Config = new WidgetConfig
            {
                Min = min ?? 0,
                Max = max ?? 100,
                ShowLabel = true,
                ValueFormat = "percentage"
            }
        };
    }
}
