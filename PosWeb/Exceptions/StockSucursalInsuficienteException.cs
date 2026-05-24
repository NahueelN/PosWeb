namespace PosWeb.Application.Exceptions;

public class StockSucursalInsuficienteException : ServiceException
{
    public StockSucursalInsuficienteException(
        string productoNombre,
        int sucursalId,
        int disponible,
        int solicitado)
        : base($"Stock insuficiente para '{productoNombre}' en sucursal {sucursalId}. Disponible: {disponible}, solicitado: {solicitado}")
    {
    }
}
