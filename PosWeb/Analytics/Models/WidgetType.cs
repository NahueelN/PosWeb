using System.Text.Json.Serialization;

namespace PosWeb.Analytics.Models;

/// <summary>
/// Tipos de visualización soportados por el Widget Platform.
/// Cada tipo define una forma de renderizar un Dataset genérico.
/// </summary>
[JsonConverter(typeof(JsonStringEnumConverter))]
public enum WidgetType
{
    KPI,
    BAR_CHART,
    LINE_CHART,
    PIE_CHART,
    TABLE,
    LIST,
    ALERTS,
    PROGRESS,
    GAUGE,
    HEATMAP     // Preparado, no implementado aún
}
