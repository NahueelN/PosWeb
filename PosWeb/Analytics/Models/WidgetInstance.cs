namespace PosWeb.Analytics.Models;

/// <summary>
/// Representa un Widget colocado dentro del Dashboard.
/// El Dashboard solo conoce WidgetInstances — nunca sabe qué datos hay detrás.
/// Cada instancia referencia una WidgetDefinition (fuente de datos) y un WidgetType (visualización).
/// El layout se persiste como: id, definitionId, x, y, w, h, config.
/// </summary>
public class WidgetInstance
{
    /// <summary>Identificador único de esta instancia.</summary>
    public string Id { get; set; } = "";

    /// <summary>Referencia a la WidgetDefinition que produce los datos.</summary>
    public string DefinitionId { get; set; } = "";

    /// <summary>Tipo de visualización elegida (e.g., "PIE_CHART", "BAR_CHART", "TABLE").</summary>
    public string WidgetType { get; set; } = "";

    /// <summary>Columna inicial en el grid 12-col (1-based).</summary>
    public int X { get; set; } = 1;

    /// <summary>Fila inicial en el grid (1-based).</summary>
    public int Y { get; set; } = 1;

    /// <summary>Ancho en unidades de grilla (1-12).</summary>
    public int W { get; set; } = 4;

    /// <summary>Alto en unidades de grilla (1-N).</summary>
    public int H { get; set; } = 1;

    /// <summary>Configuración visual del usuario (período, límite, mostrar leyenda, etc.).</summary>
    public Dictionary<string, object?> Config { get; set; } = new();
}
