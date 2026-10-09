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
                        new WidgetDefinitionParam { Key = "max", Label = "Meta del día", Type = "number", Default = 100000, Min = 1 },
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
                    Type = "PROGRESS", Label = "Barra de progreso", Icon = "Target",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "max", Label = "Meta del día", Type = "number", Default = 100000, Min = 1 },
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
                        new WidgetDefinitionParam { Key = "period", Label = "Período", Type = "select", Default = "0",
                            Options = new()
                            {
                                new() { Value = "0", Label = "Hoy" },
                                new() { Value = "7", Label = "Última semana" },
                                new() { Value = "30", Label = "Último mes" },
                            }
                        },
                        new WidgetDefinitionParam { Key = "limit", Label = "Cantidad", Type = "number", Default = 5, Min = 3, Max = 15 },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "BAR_CHART", Label = "Barras", Icon = "BarChart3",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "period", Label = "Período", Type = "select", Default = "0",
                            Options = new()
                            {
                                new() { Value = "0", Label = "Hoy" },
                                new() { Value = "7", Label = "Última semana" },
                                new() { Value = "30", Label = "Último mes" },
                            }
                        },
                        new WidgetDefinitionParam { Key = "limit", Label = "Cantidad", Type = "number", Default = 5, Min = 3, Max = 15 },
                    }
                },
                new WidgetVisualizationType
                {
                    Type = "PIE_CHART", Label = "Gráfico circular", Icon = "PieChart",
                    Params = new()
                    {
                        new WidgetDefinitionParam { Key = "period", Label = "Período", Type = "select", Default = "0",
                            Options = new()
                            {
                                new() { Value = "0", Label = "Hoy" },
                                new() { Value = "7", Label = "Última semana" },
                                new() { Value = "30", Label = "Último mes" },
                            }
                        },
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

        // ── Finanzas: Rentabilidad y Margen ──────────────────────
        new WidgetDefinition
        {
            Id = "rentabilidad",
            Name = "Rentabilidad",
            Description = "Ganancia bruta, margen promedio, facturación y costo del período",
            Category = "finanzas",
            Icon = "TrendingUp",
            SupportedSizes = new() { S(3,1), S(6,1), S(6,2), S(3,2) },
            DefaultSize = S(3, 1),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "KPI", Label = "Indicador", Icon = "TrendingUp",
                    Params = new() { PeriodoParam("0") }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new() { PeriodoParam("0") }
                },
            }
        },

        new WidgetDefinition
        {
            Id = "margen-por-categoria",
            Name = "Margen por categoría",
            Description = "Rentabilidad aportada por cada categoría de producto",
            Category = "finanzas",
            Icon = "PieChart",
            SupportedSizes = new() { S(6,3), S(3,3) },
            DefaultSize = S(6, 3),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "PIE_CHART", Label = "Gráfico circular", Icon = "PieChart",
                    Params = new() { PeriodoParam("30"), DonutParam() }
                },
                new WidgetVisualizationType
                {
                    Type = "BAR_CHART", Label = "Barras", Icon = "BarChart3",
                    Params = new() { PeriodoParam("30") }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new() { PeriodoParam("30") }
                },
            }
        },

        new WidgetDefinition
        {
            Id = "margen-por-producto",
            Name = "Margen por producto",
            Description = "Productos que aportan mayor rentabilidad (no solo volumen)",
            Category = "finanzas",
            Icon = "Percent",
            SupportedSizes = new() { S(6,3), S(3,3) },
            DefaultSize = S(6, 3),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "BAR_CHART", Label = "Barras", Icon = "BarChart3",
                    Params = new() { PeriodoParam("30"), LimitParam(10) }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new() { PeriodoParam("30"), LimitParam(10) }
                },
            }
        },

        new WidgetDefinition
        {
            Id = "deudas-clientes",
            Name = "Deudas de clientes",
            Description = "Total pendiente de cobro (fiados), cantidad de deudores y antigüedad",
            Category = "finanzas",
            Icon = "Wallet",
            SupportedSizes = new() { S(3,1), S(6,1) },
            DefaultSize = S(3, 1),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType { Type = "KPI", Label = "Indicador", Icon = "Wallet", Params = new() { } },
                new WidgetVisualizationType { Type = "TABLE", Label = "Tabla", Icon = "Table", Params = new() { } },
            }
        },

        new WidgetDefinition
        {
            Id = "deudas-proveedores",
            Name = "Deudas con proveedores",
            Description = "Total acumulado a pagar, cantidad de proveedores y antigüedad",
            Category = "finanzas",
            Icon = "Landmark",
            SupportedSizes = new() { S(3,1), S(6,1) },
            DefaultSize = S(3, 1),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType { Type = "KPI", Label = "Indicador", Icon = "Landmark", Params = new() { } },
                new WidgetVisualizationType { Type = "TABLE", Label = "Tabla", Icon = "Table", Params = new() { } },
            }
        },

        new WidgetDefinition
        {
            Id = "deudas-resumen",
            Name = "Deudas (clientes vs proveedores)",
            Description = "A cobrar de clientes vs a pagar a proveedores",
            Category = "finanzas",
            Icon = "Scale",
            SupportedSizes = new() { S(3,1), S(6,1) },
            DefaultSize = S(3, 1),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType { Type = "KPI", Label = "Indicador", Icon = "Scale", Params = new() { } },
                new WidgetVisualizationType { Type = "TABLE", Label = "Tabla", Icon = "Table", Params = new() { } },
            }
        },

        new WidgetDefinition
        {
            Id = "flujo-caja",
            Name = "Flujo de caja",
            Description = "Ingresos (ventas + cobros) menos egresos (compras + gastos)",
            Category = "finanzas",
            Icon = "ArrowLeftRight",
            SupportedSizes = new() { S(3,1), S(6,1), S(6,2), S(3,2) },
            DefaultSize = S(3, 1),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "KPI", Label = "Indicador", Icon = "ArrowLeftRight",
                    Params = new() { PeriodoParam("0") }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new() { PeriodoParam("0") }
                },
            }
        },

        // ── Ventas: Comportamiento ───────────────────────────────
        new WidgetDefinition
        {
            Id = "horas-pico",
            Name = "Horarios de venta",
            Description = "Distribución de ventas por rango horario",
            Category = "ventas",
            Icon = "Clock",
            SupportedSizes = new() { S(6,3), S(3,3) },
            DefaultSize = S(6, 3),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "BAR_CHART", Label = "Barras", Icon = "BarChart3",
                    Params = new() { PeriodoParam("7", includeToday: false) }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new() { PeriodoParam("7", includeToday: false) }
                },
            }
        },

        new WidgetDefinition
        {
            Id = "metodos-pago",
            Name = "Métodos de pago",
            Description = "Porcentaje y monto cobrado por cada medio de pago",
            Category = "ventas",
            Icon = "CreditCard",
            SupportedSizes = new() { S(6,3), S(3,3) },
            DefaultSize = S(6, 3),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "PIE_CHART", Label = "Gráfico circular", Icon = "PieChart",
                    Params = new() { PeriodoParam("0"), DonutParam() }
                },
                new WidgetVisualizationType
                {
                    Type = "BAR_CHART", Label = "Barras", Icon = "BarChart3",
                    Params = new() { PeriodoParam("0") }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new() { PeriodoParam("0") }
                },
            }
        },

        new WidgetDefinition
        {
            Id = "retencion-clientes",
            Name = "Clientes registrados vs finales",
            Description = "Ventas a clientes identificados vs consumidor final",
            Category = "ventas",
            Icon = "Users",
            SupportedSizes = new() { S(6,3), S(3,3) },
            DefaultSize = S(3, 3),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "PIE_CHART", Label = "Gráfico circular", Icon = "PieChart",
                    Params = new() { PeriodoParam("0"), DonutParam() }
                },
                new WidgetVisualizationType
                {
                    Type = "BAR_CHART", Label = "Barras", Icon = "BarChart3",
                    Params = new() { PeriodoParam("0") }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new() { PeriodoParam("0") }
                },
            }
        },

        // ── Stock / Operaciones ──────────────────────────────────
        new WidgetDefinition
        {
            Id = "valor-inventario",
            Name = "Valor de inventario",
            Description = "Valor del stock a costo y a precio de venta",
            Category = "stock",
            Icon = "Boxes",
            SupportedSizes = new() { S(3,1), S(6,1), S(6,2), S(3,2) },
            DefaultSize = S(3, 1),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType { Type = "KPI", Label = "Indicador", Icon = "Boxes", Params = new() { } },
                new WidgetVisualizationType { Type = "TABLE", Label = "Tabla", Icon = "Table", Params = new() { } },
            }
        },

        new WidgetDefinition
        {
            Id = "stock-inmovilizado",
            Name = "Productos sin movimiento",
            Description = "Productos con stock sin ventas en los últimos 30/60/90 días",
            Category = "stock",
            Icon = "PackageSearch",
            SupportedSizes = new() { S(6,3), S(3,3) },
            DefaultSize = S(6, 3),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new() { InmovilizadoParam(), LimitParam(10) }
                },
            }
        },

        // ── Equipo ───────────────────────────────────────────────
        new WidgetDefinition
        {
            Id = "ventas-por-vendedor",
            Name = "Rendimiento por vendedor",
            Description = "Total vendido y transacciones desglosadas por usuario",
            Category = "rankings",
            Icon = "UserCheck",
            SupportedSizes = new() { S(6,3), S(3,3) },
            DefaultSize = S(6, 3),
            CompatibleTypes = new()
            {
                new WidgetVisualizationType
                {
                    Type = "BAR_CHART", Label = "Barras", Icon = "BarChart3",
                    Params = new() { PeriodoParam("0"), LimitParam(10) }
                },
                new WidgetVisualizationType
                {
                    Type = "PIE_CHART", Label = "Gráfico circular", Icon = "PieChart",
                    Params = new() { PeriodoParam("0"), LimitParam(10), DonutParam() }
                },
                new WidgetVisualizationType
                {
                    Type = "TABLE", Label = "Tabla", Icon = "Table",
                    Params = new() { PeriodoParam("0"), LimitParam(10) }
                },
            }
        },
    };

    // ── Helpers de parámetros reutilizables ──────────────────────
    private static WidgetDefinitionParam PeriodoParam(string @default, bool includeToday = true)
    {
        var options = new List<WidgetParamOption>();
        if (includeToday)
            options.Add(new() { Value = "0", Label = "Hoy" });
        options.Add(new() { Value = "7", Label = "Últimos 7 días" });
        options.Add(new() { Value = "30", Label = "Últimos 30 días" });

        return new WidgetDefinitionParam
        {
            Key = "period",
            Label = "Período",
            Type = "select",
            Default = @default,
            Options = options
        };
    }

    private static WidgetDefinitionParam LimitParam(int @default) => new()
    {
        Key = "limit",
        Label = "Cantidad",
        Type = "number",
        Default = @default,
        Min = 3,
        Max = 15
    };

    private static WidgetDefinitionParam DonutParam() => new()
    {
        Key = "donut",
        Label = "Tipo donut",
        Type = "boolean",
        Default = true
    };

    private static WidgetDefinitionParam InmovilizadoParam() => new()
    {
        Key = "days",
        Label = "Sin ventas (días)",
        Type = "select",
        Default = "60",
        Options = new()
        {
            new() { Value = "30", Label = "Últimos 30 días" },
            new() { Value = "60", Label = "Últimos 60 días" },
            new() { Value = "90", Label = "Últimos 90 días" },
        }
    };

    public static WidgetDefinition? GetById(string id) =>
        GetAll().FirstOrDefault(d => d.Id == id);
}
