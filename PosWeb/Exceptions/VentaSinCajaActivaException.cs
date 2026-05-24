namespace PosWeb.Application.Exceptions;

public class VentaSinCajaActivaException : ServiceException
{
    public VentaSinCajaActivaException()
        : base($"No tenés una caja abierta. Abrí una caja antes de vender.")
    {
    }
}
