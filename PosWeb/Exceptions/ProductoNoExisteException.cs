namespace PosWeb.Application.Exceptions;

public class ProductoNoExisteException : ServiceException
{
    public int ProductoId { get; }

    public ProductoNoExisteException(int productoId)
        : base($"El producto con ID {productoId} no existe")
    {
        ProductoId = productoId;
    }
}
