namespace PosWeb.Application.Exceptions;

public class SucursalNoExisteException : ServiceException
{
    public int SucursalId { get; }

    public SucursalNoExisteException(int sucursalId)
        : base($"La sucursal con ID {sucursalId} no existe")
    {
        SucursalId = sucursalId;
    }
}
