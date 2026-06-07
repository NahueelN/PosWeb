namespace PosWeb.Contracts;

/// <summary>
/// Datos mapeados desde Open Food Facts para precargar el formulario de alta.
/// Todos los campos son opcionales excepto CodigoBarras y Descripcion.
/// </summary>
public class OpenFoodFactsResultDto
{
    public string CodigoBarras { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public string? Categoria { get; set; }
    public decimal? Contenido { get; set; }
    public string? Unidad { get; set; }
}
