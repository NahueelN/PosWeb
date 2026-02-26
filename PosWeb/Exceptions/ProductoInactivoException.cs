namespace PosWeb.Application.Exceptions;

public class ProductoInactivoException : ServiceException
{
    public int ProductoId { get; }

    public ProductoInactivoException(int productoId)
        : base($"El producto con ID {productoId} está inactivo")
    {
        ProductoId = productoId;
    }
}
