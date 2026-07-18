namespace PosWeb.Analytics.Models;

/// <summary>
/// Describe una fuente de datos disponible para el Dashboard Builder.
/// Cada definición indica qué visualizaciones son compatibles con su Dataset.
/// El Dashboard nunca conoce "Ventas" o "Productos" — solo conoce WidgetDefinitions.
/// </summary>
public class WidgetDefinition
{
    /// <summary>Identificador único de la fuente de datos (e.g., "ventas-por-dia").</summary>
    public string Id { get; set; } = "";

    /// <summary>Nombre legible para el usuario (e.g., "Ventas por día").</summary>
    public string Name { get; set; } = "";

    /// <summary>Descripción corta de qué datos provee.</summary>
    public string Description { get; set; } = "";

    /// <summary>Categoría para agrupación en el picker (kpi, charts, rankings, alerts, lists).</summary>
    public string Category { get; set; } = "";

    /// <summary>Ícono Lucide para representar la fuente de datos.</summary>
    public string Icon { get; set; } = "";

    /// <summary>Visualizaciones compatibles con el Dataset que esta fuente produce.</summary>
    public List<WidgetVisualizationType> CompatibleTypes { get; set; } = new();
}

/// <summary>
/// Una visualización compatible con una WidgetDefinition.
/// Incluye los parámetros configurables que el usuario puede ajustar al crear la instancia.
/// </summary>
public class WidgetVisualizationType
{
    /// <summary>Tipo de widget (e.g., "PIE_CHART", "BAR_CHART", "TABLE").</summary>
    public string Type { get; set; } = "";

    /// <summary>Nombre legible de la visualización (e.g., "Gráfico circular").</summary>
    public string Label { get; set; } = "";

    /// <summary>Ícono Lucide para esta visualización.</summary>
    public string Icon { get; set; } = "";

    /// <summary>Parámetros configurables para esta visualización específica.</summary>
    public List<WidgetDefinitionParam> Params { get; set; } = new();
}

/// <summary>
/// Parámetro configurable que el usuario puede ajustar al crear/editar una instancia.
/// </summary>
public class WidgetDefinitionParam
{
    /// <summary>Clave del parámetro (e.g., "period", "limit", "showLegend").</summary>
    public string Key { get; set; } = "";

    /// <summary>Nombre legible (e.g., "Período", "Cantidad").</summary>
    public string Label { get; set; } = "";

    /// <summary>Tipo de input: "number", "select", "boolean", "text".</summary>
    public string Type { get; set; } = "text";

    /// <summary>Valor por defecto.</summary>
    public object? Default { get; set; }

    /// <summary>Opciones para tipo "select".</summary>
    public List<WidgetParamOption>? Options { get; set; }

    /// <summary>Valor mínimo (solo "number").</summary>
    public int? Min { get; set; }

    /// <summary>Valor máximo (solo "number").</summary>
    public int? Max { get; set; }
}

public class WidgetParamOption
{
    public string Value { get; set; } = "";
    public string Label { get; set; } = "";
}
