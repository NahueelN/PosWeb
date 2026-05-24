namespace PosWeb.Application.Exceptions;

public class CajaNoEncontradaException : ServiceException
{
    public CajaNoEncontradaException(int sucursalId)
        : base($"No hay caja abierta para cerrar en la sucursal (ID: {sucursalId})")
    {
    }
}
