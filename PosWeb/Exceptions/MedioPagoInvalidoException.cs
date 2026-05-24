namespace PosWeb.Application.Exceptions;

public class MedioPagoInvalidoException : ServiceException
{
    public MedioPagoInvalidoException(int medioPagoId)
        : base($"Medio de pago no válido (ID: {medioPagoId})")
    {
    }

    public MedioPagoInvalidoException(string mensaje)
        : base(mensaje)
    {
    }
}
