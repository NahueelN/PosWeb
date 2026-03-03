namespace PosWeb.Contracts;

public class ProductoDto
{
    public int ID_PRODUCTO { get; set; }

    public string CODIGO_BARRA { get; set; } = string.Empty;
    public string NOMBRE { get; set; } = string.Empty;

    public decimal PRECIO { get; set; }
    public decimal COSTO { get; set; }

    public int STOCK { get; set; }

    public bool ACTIVO { get; set; }
}