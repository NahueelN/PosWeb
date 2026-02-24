namespace PosWeb.Domain.Exceptions;

public class ProductoInvalidoException : DomainException
{
    public int ProductoId { get; }

    public ProductoInvalidoException(int productoId)
        : base($"Producto inválido (ID: {productoId})")
    {
        ProductoId = productoId;
    }
}
