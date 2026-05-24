namespace PosWeb.Application.Exceptions;

public class ClienteDuplicadoException : ServiceException
{
    public ClienteDuplicadoException(string tipoDocumento, string numeroDocumento)
        : base($"Ya existe un cliente con {tipoDocumento} {numeroDocumento}")
    {
    }
}
