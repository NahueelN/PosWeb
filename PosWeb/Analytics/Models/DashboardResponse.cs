namespace PosWeb.Analytics.Models;

/// <summary>
/// Respuesta del Dashboard Builder.
/// Contiene las definiciones disponibles (catálogo) + los widgets renderizados.
/// El frontend usa las definiciones para el picker y los widgets para el grid.
/// </summary>
public class DashboardResponse
{
    /// <summary>Fuentes de datos disponibles para agregar al dashboard.</summary>
    public List<WidgetDefinition> Definitions { get; set; } = new();

    /// <summary>Widgets renderizados (instancias ejecutadas).</summary>
    public List<Widget> Widgets { get; set; } = new();
}
