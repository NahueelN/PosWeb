using PosWeb.Analytics.Models;

namespace PosWeb.Analytics;

/// <summary>
/// Catálogo estático de todas las fuentes de datos disponibles para el Dashboard Builder.
/// Cada WidgetDefinition describe una AnalyticsQuery y sus visualizaciones compatibles.
/// Este registry es la "verdad" sobre qué datos existen — el Dashboard nunca lo hardcodea.
/// </summary>
public static class WidgetDefinitionRegistry
{
    // Helpers para crear GridSize de forma concisa
    private static GridSize S(int w, int h) => new() { W = w, H = h };

    public static List<WidgetDefinition> GetAll() => new()
    {
        // ── KPIs ──────────────────────────────────────────────────
        new WidgetDefinition
        {
            Id = "ventas-hoy",
            Name = "Ventas de hoy",
            Description = "Total recaudado, cantidad de ventas y ticket promedio del día",
            Category = "kpi",
            Icon = "DollarSign",
            SupportedSizes = new() { S(3,1), S(6,1) },
            DefaultSize = S(3, 1),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "KPI", Label = "Indicador", Icon = "DollarSign",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "color", Label = "Color", Type = "select", Default = "indigo",
                            Options = new()
                            {
                                new() { Value = "indigo", Label = "Índigo" },
                                new() { Value = "emerald", Label = "Verde" },
                                new() { Value = "blue", Label = "Azul" },
                                new() { Value = "purple", Label = "Morado" },
                                new() { Value = "amber", Label = "Ámbar" },
                            }
                        },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "PROGRESS", Label = "Barra de progreso", Icon = "Target",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "max", Label = "Meta", Type = "number", Default = 100000, Min = 1 },
                        new WidgetDefinitionParam { Key = "color", Label = "Color", Type = "select", Default = "emerald",
                            Options = new()
                            {
                                new() { Value = "emerald", Label = "Verde" },
                                new() { Value = "indigo", Label = "Índigo" },
                                new() { Value = "blue", Label = "Azul" },
                                new() { Value = "amber", Label = "Ámbar" },
                            }
                        },
                    }
                },
            }
        },

        new WidgetDefinition
        {
            Id = "caja",
            Name = "Caja actual",
            Description = "Estado y monto inicial de la caja del día",
            Category = "kpi",
            Icon = "Wallet",
            SupportedSizes = new() { S(3,1), S(6,1) },
            DefaultSize = S(3, 1),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "KPI", Label = "Indicador", Icon = "Wallet",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "color", Label = "Color", Type = "select", Default = "emerald",
                            Options = new()
                            {
                                new() { Value = "emerald", Label = "Verde" },
                                new() { Value = "indigo", Label = "Índigo" },
                                new() { Value = "blue", Label = "Azul" },
                            }
                        },
                    }
                },
            }
        },

        new WidgetDefinition
        {
            Id = "meta",
            Name = "Meta del día",
            Description = "Progreso hacia la meta diaria de ventas",
            Category = "kpi",
            Icon = "Target",
            SupportedSizes = new() { S(3,1), S(6,1) },
            DefaultSize = S(3, 1),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "KPI", Label = "Indicador", Icon = "Target",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "color", Label = "Color", Type = "select", Default = "purple",
                            Options = new()
                            {
                                new() { Value = "purple", Label = "Morado" },
                                new() { Value = "emerald", Label = "Verde" },
                                new() { Value = "indigo", Label = "Índigo" },
                            }
                        },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "GAUGE", Label = "Velocímetro", Icon = "Gauge",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "max", Label = "Meta", Type = "number", Default = 100000, Min = 1 },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "PROGRESS", Label = "Barra de progreso", Icon = "Target",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "max", Label = "Meta", Type = "number", Default = 100000, Min = 1 },
                        new WidgetDefinitionParam { Key = "color", Label = "Color", Type = "select", Default = "purple",
                            Options = new()
                            {
                                new() { Value = "purple", Label = "Morado" },
                                new() { Value = "emerald", Label = "Verde" },
                                new() { Value = "amber", Label = "Ámbar" },
                            }
                        },
                    }
                },
            }
        },

        // ── Charts ────────────────────────────────────────────────
        new WidgetDefinition
        {
            Id = "ventas-semana",
            Name = "Ventas por día",
            Description = "Evolución de ventas de los últimos días",
            Category = "charts",
            Icon = "BarChart3",
            SupportedSizes = new() { S(6,3), S(3,3) },
            DefaultSize = S(6, 3),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "BAR_CHART", Label = "Barras", Icon = "BarChart3",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "period", Label = "Período", Type = "select", Default = "7",
                            Options = new()
                            {
                                new() { Value = "7", Label = "Últimos 7 días" },
                                new() { Value = "14", Label = "Últimos 14 días" },
                                new() { Value = "30", Label = "Últimos 30 días" },
                            }
                        },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "LINE_CHART", Label = "Líneas", Icon = "TrendingUp",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "period", Label = "Período", Type = "select", Default = "7",
                            Options = new()
                            {
                                new() { Value = "7", Label = "Últimos 7 días" },
                                new() { Value = "14", Label = "Últimos 14 días" },
                                new() { Value = "30", Label = "Últimos 30 días" },
                            }
                        },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "period", Label = "Período", Type = "select", Default = "7",
                            Options = new()
                            {
                                new() { Value = "7", Label = "Últimos 7 días" },
                                new() { Value = "14", Label = "Últimos 14 días" },
                                new() { Value = "30", Label = "Últimos 30 días" },
                            }
                        },
                    }
                },
            }
        },

        new WidgetDefinition
        {
            Id = "ventas-por-categoria",
            Name = "Ventas por categoría",
            Description = "Distribución de ventas por categoría de producto",
            Category = "charts",
            Icon = "PieChart",
            SupportedSizes = new() { S(6,3), S(3,3) },
            DefaultSize = S(6, 3),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "PIE_CHART", Label = "Gráfico circular", Icon = "PieChart",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "donut", Label = "Tipo donut", Type = "boolean", Default = true },
                        new WidgetDefinitionParam { Key = "showPercentages", Label = "Mostrar porcentajes", Type = "boolean", Default = true },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "BAR_CHART", Label = "Barras", Icon = "BarChart3",
                    Params = new() { }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new() { }
                },
            }
        },

        // ── Rankings ──────────────────────────────────────────────
        new WidgetDefinition
        {
            Id = "top-productos",
            Name = "Productos más vendidos",
            Description = "Ranking de los productos más vendidos del día",
            Category = "rankings",
            Icon = "Package",
            SupportedSizes = new() { S(6,3), S(3,3) },
            DefaultSize = S(6, 3),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "limit", Label = "Cantidad", Type = "number", Default = 5, Min = 3, Max = 15 },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "BAR_CHART", Label = "Barras", Icon = "BarChart3",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "limit", Label = "Cantidad", Type = "number", Default = 5, Min = 3, Max = 15 },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "PIE_CHART", Label = "Gráfico circular", Icon = "PieChart",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "limit", Label = "Cantidad", Type = "number", Default = 5, Min = 3, Max = 15 },
                        new WidgetDefinitionParam { Key = "donut", Label = "Tipo donut", Type = "boolean", Default = true },
                    }
                },
            }
        },

        // ── Alerts ────────────────────────────────────────────────
        new WidgetDefinition
        {
            Id = "alertas",
            Name = "Alertas",
            Description = "Stock bajo, deudas, pedidos pendientes y estado de caja",
            Category = "alerts",
            Icon = "AlertTriangle",
            SupportedSizes = new() { S(6,2), S(3,2) },
            DefaultSize = S(3, 2),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "ALERTS", Label = "Alertas", Icon = "AlertTriangle",
                    Params = new() { }
                },
                new WidgetVisualizationType
                {
                    Type = "LIST", Label = "Lista", Icon = "List",
                    Params = new() { }
                },
            }
        },

        // ── Lists ─────────────────────────────────────────────────
        new WidgetDefinition
        {
            Id = "resumen",
            Name = "Resumen del día",
            Description = "Cantidad de ventas, productos y clientes atendidos",
            Category = "lists",
            Icon = "ClipboardList",
            SupportedSizes = new() { S(6,2), S(3,2) },
            DefaultSize = S(3, 2),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "LIST", Label = "Lista", Icon = "List",
                    Params = new() { }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new() { }
                },
            }
        },

        new WidgetDefinition
        {
            Id = "actividad",
            Name = "Actividad reciente",
            Description = "Últimos movimientos: ventas, compras, gastos y caja",
            Category = "lists",
            Icon = "Clock",
            SupportedSizes = new() { S(6,2), S(3,2) },
            DefaultSize = S(3, 2),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "LIST", Label = "Lista", Icon = "Clock",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "limit", Label = "Cantidad", Type = "number", Default = 15, Min = 5, Max = 30 },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "limit", Label = "Cantidad", Type = "number", Default = 15, Min = 5, Max = 30 },
                    }
                },
            }
        },

        new WidgetDefinition
        {
            Id = "ultimas-ventas",
            Name = "Últimas ventas",
            Description = "Detalle de las últimas ventas realizadas",
            Category = "lists",
            Icon = "Receipt",
            SupportedSizes = new() { S(6,2), S(3,2) },
            DefaultSize = S(3, 2),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "LIST", Label = "Lista", Icon = "Receipt",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "limit", Label = "Cantidad", Type = "number", Default = 8, Min = 3, Max = 15 },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "limit", Label = "Cantidad", Type = "number", Default = 8, Min = 3, Max = 15 },
                    }
                },
            }
        },
    };

    public static WidgetDefinition? GetById(string id) =>
        GetAll().FirstOrDefault(d => d.Id == id);
}
