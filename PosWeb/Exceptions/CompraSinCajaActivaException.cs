namespace PosWeb.Application.Exceptions;

public class CompraSinCajaActivaException : ServiceException
{
    public CompraSinCajaActivaException()
        : base("No hay caja abierta en esta sucursal")
    {
    }
}
