namespace PosWeb.Contracts;

public class ProductoDto
{
    public int Id { get; set; }

    public string CodigoBarra { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;

    public decimal Precio { get; set; }
    public decimal Costo { get; set; }

    public int Stock { get; set; }

    public bool Activo { get; set; }
}