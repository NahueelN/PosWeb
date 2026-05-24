namespace PosWeb.Application.Exceptions;

public class UsuarioInactivoException : AuthException
{
    public UsuarioInactivoException(string usuario)
        : base($"Usuario desactivado: {usuario}")
    {
    }
}
