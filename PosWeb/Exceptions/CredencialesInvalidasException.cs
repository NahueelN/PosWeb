namespace PosWeb.Application.Exceptions;

public class CredencialesInvalidasException : AuthException
{
    public CredencialesInvalidasException()
        : base("Credenciales inválidas")
    {
    }
}
