namespace PosWeb.Application.Exceptions;

public class PinNoConfiguradoException : ServiceException
{
    public PinNoConfiguradoException()
        : base("PIN no configurado")
    {
    }
}
