namespace PosWeb.Application.Exceptions;

public class ProductoNoEncontradoException : ServiceException
{
    public string? CodigoBarra { get; }
    public int? ProductoId { get; }

    public ProductoNoEncontradoException(string codigoBarra)
        : base($"No se encontró un producto con el código de barras '{codigoBarra}'")
    {
        CodigoBarra = codigoBarra;
    }

    public ProductoNoEncontradoException(int productoId)
        : base($"No se encontró un producto con ID {productoId}")
    {
        ProductoId = productoId;
    }
}
