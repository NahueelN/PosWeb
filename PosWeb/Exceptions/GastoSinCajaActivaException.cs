namespace PosWeb.Application.Exceptions;

public class GastoSinCajaActivaException : ServiceException
{
    public GastoSinCajaActivaException()
        : base("No hay caja abierta")
    {
    }
}
