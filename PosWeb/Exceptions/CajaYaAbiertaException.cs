namespace PosWeb.Application.Exceptions;

public class CajaYaAbiertaException : ServiceException
{
    public CajaYaAbiertaException(int sucursalId)
        : base($"Ya hay una caja abierta en la sucursal (ID: {sucursalId})")
    {
    }
}
