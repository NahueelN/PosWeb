namespace PosWeb.Application.Exceptions;

public class VentaSinItemsException : ServiceException
{
    public VentaSinItemsException()
        : base("La venta debe tener al menos un producto")
    {
    }
}
