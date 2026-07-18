namespace PosWeb.Analytics.Models;

/// <summary>
/// Representa un Widget colocado dentro del Dashboard.
/// El Dashboard solo conoce WidgetInstances — nunca sabe qué datos hay detrás.
/// Cada instancia referencia una WidgetDefinition (fuente de datos) y un WidgetType (visualización).
/// </summary>
public class WidgetInstance
{
    /// <summary>Identificador único de esta instancia (GUID o slug único).</summary>
    public string Id { get; set; } = "";

    /// <summary>Referencia a la WidgetDefinition que produce los datos.</summary>
    public string DefinitionId { get; set; } = "";

    /// <summary>Tipo de visualización elegida (e.g., "PIE_CHART", "BAR_CHART", "TABLE").</summary>
    public string WidgetType { get; set; } = "";

    /// <summary>Título personalizado del widget. Si está vacío, usa el de la definición.</summary>
    public string? Title { get; set; }

    /// <summary>Configuración visual del usuario (período, límite, mostrar leyenda, etc.).</summary>
    public Dictionary<string, object?> Config { get; set; } = new();

    /// <summary>Posición en el grid (columna, 0-indexed).</summary>
    public int Col { get; set; }

    /// <summary>Posición en el grid (fila, 0-indexed).</summary>
    public int Row { get; set; }

    /// <summary>Ancho en unidades de grid (default 1).</summary>
    public int Width { get; set; } = 1;

    /// <summary>Alto en unidades de grid (default 1).</summary>
    public int Height { get; set; } = 1;

    /// <summary>Orden de visualización (menor = primero).</summary>
    public int Order { get; set; }
}
