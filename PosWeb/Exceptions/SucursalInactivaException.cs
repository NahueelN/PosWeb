namespace PosWeb.Application.Exceptions;

public class SucursalInactivaException : ServiceException
{
    public int SucursalId { get; }

    public SucursalInactivaException(int sucursalId)
        : base($"La sucursal con ID {sucursalId} está inactiva")
    {
        SucursalId = sucursalId;
    }
}
