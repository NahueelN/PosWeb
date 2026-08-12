namespace PosWeb.Analytics.Models;

public class Widget
{
    public string Id { get; set; } = "";
    public string Title { get; set; } = "";
    public WidgetType Type { get; set; }
    public Dataset Dataset { get; set; } = new();
    public WidgetConfig? Config { get; set; }
}
