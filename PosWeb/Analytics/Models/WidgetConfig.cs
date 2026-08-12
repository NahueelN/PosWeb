namespace PosWeb.Analytics.Models;

/// <summary>
/// Configuración visual de un Widget.
/// Propiedades comunes + opciones específicas por tipo.
/// </summary>
public class WidgetConfig
{
    // ── Comunes a todos los tipos ──
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public string? Period { get; set; }
    public string? Subtitle { get; set; }
    public int? RefreshInterval { get; set; }   // Auto-refresh en segundos

    // ── Charts (Bar, Line, Pie) ──
    public string? XAxis { get; set; }          // Campo del eje X
    public string? YAxis { get; set; }          // Campo del eje Y
    public bool? ShowLegend { get; set; }
    public bool? ShowLabels { get; set; }
    public bool? ShowDots { get; set; }         // Solo LINE_CHART

    // ── PieChart ──
    public bool? Donut { get; set; }            // true = donut, false = pie completo
    public bool? ShowPercentages { get; set; }

    // ── Table ──
    public string[]? VisibleColumns { get; set; }
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; }      // "asc" | "desc"
    public int? PageSize { get; set; }

    // ── Progress / Gauge ──
    public decimal? Max { get; set; }           // Valor máximo de la barra/rango
    public decimal? Min { get; set; }           // Valor mínimo (solo Gauge)
    public bool? ShowLabel { get; set; }
    public string? ValueFormat { get; set; }    // "number" | "currency" | "percentage"
}
