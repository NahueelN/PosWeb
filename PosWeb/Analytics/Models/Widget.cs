namespace PosWeb.Analytics.Models;

public class Widget
{
    public string Id { get; set; } = "";

    /// <summary>Id de la WidgetDefinition que originó el widget (fuente de datos).</summary>
    public string DefinitionId { get; set; } = "";

    public string Title { get; set; } = "";
    public WidgetType Type { get; set; }
    public Dataset Dataset { get; set; } = new();
    public WidgetConfig? Config { get; set; }
}
