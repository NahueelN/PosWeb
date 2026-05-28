namespace PosWeb.Contracts;

public class ProductoDto
{
    public int Id { get; set; }

    public string CodigoBarra { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;

    public decimal Precio { get; set; }
    public decimal Costo { get; set; }

    // Compatibility-only while the app finishes moving stock behavior to branch-level flows.
    public int Stock { get; set; }

    public string? Tamano { get; set; }

    public bool Activo { get; set; }
}
