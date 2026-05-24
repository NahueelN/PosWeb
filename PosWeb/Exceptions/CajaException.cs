namespace PosWeb.Application.Exceptions;

public class CajaException : ServiceException
{
    public CajaException(string message)
        : base(message)
    {
    }
}
