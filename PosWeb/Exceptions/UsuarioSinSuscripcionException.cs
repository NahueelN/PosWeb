namespace PosWeb.Application.Exceptions;

public class UsuarioSinSuscripcionException : AuthException
{
    public UsuarioSinSuscripcionException(string usuario)
        : base($"Acceso suspendido por suscripción vencida: {usuario}")
    {
    }
}
