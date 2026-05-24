namespace PosWeb.Application.Exceptions;

public class ClienteNoEncontradoException : ServiceException
{
    public ClienteNoEncontradoException(int id)
        : base($"Cliente no encontrado (ID: {id})")
    {
    }
}
