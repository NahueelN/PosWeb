namespace PosWeb.Contracts;

public class ProductoUpsertDto
{
    public string CodigoBarras { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public decimal Costo { get; set; }
}
