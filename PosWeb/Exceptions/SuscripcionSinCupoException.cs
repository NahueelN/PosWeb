namespace PosWeb.Application.Exceptions;

public class SuscripcionSinCupoException : ServiceException
{
    public SuscripcionSinCupoException(string recurso, string nivel)
        : base($"La suscripción {nivel} no permite crear más {recurso}")
    {
    }
}
