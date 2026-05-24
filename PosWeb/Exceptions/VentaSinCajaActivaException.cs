namespace PosWeb.Application.Exceptions;

public class VentaSinCajaActivaException : ServiceException
{
    public VentaSinCajaActivaException(int sucursalId)
        : base($"No hay una caja abierta en esta sucursal (ID: {sucursalId})")
    {
    }
}
