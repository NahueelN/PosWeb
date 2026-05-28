namespace PosWeb.Application.Exceptions;

public class CompraSinItemsException : ServiceException
{
    public CompraSinItemsException()
        : base("La compra debe tener al menos un producto")
    {
    }
}
