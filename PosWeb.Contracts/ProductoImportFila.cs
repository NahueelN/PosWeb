namespace PosWeb.Contracts;

/// <summary>
/// Fila de producto parseada desde el Excel de importación.
/// Compartida entre Contracts (DTOs de error/request) y Application (service + controller).
/// </summary>
public class ProductoImportFila
{
    public string CodigoBarras { get; set; } = "";
    public string Descripcion { get; set; } = "";
    public string? Marca { get; set; }
    public string? Rubro { get; set; }
    public decimal? Stock { get; set; }
    public decimal? Costo { get; set; }
    public decimal? Precio { get; set; }

    /// <summary>
    /// Si viene seteado, define si el producto controla stock (SEGUIR_STOCK).
    /// Null = mantener el default del sistema (true).
    /// </summary>
    public bool? SeguirStock { get; set; }
}
