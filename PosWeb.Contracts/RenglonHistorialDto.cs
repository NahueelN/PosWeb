namespace PosWeb.Contracts;

public class RenglonHistorialDto
{
    public int ProductoId { get; set; }
    public string? ProductoNombre { get; set; }
    public string? CodigoBarra { get; set; }
    public int Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
}
