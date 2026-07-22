namespace PosWeb.Application.Exceptions;

public class LicenciaInvalidaException : ServiceException
{
    public LicenciaInvalidaException(string message)
        : base(message)
    {
    }
}
