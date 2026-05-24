namespace PosWeb.Application.Exceptions;

public class CajaYaAbiertaException : ServiceException
{
    public CajaYaAbiertaException(int userId)
        : base($"Ya tenés una caja abierta. Cerrala antes de abrir otra.")
    {
    }
}
