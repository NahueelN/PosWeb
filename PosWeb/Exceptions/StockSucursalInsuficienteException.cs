namespace PosWeb.Application.Exceptions;

public class StockSucursalInsuficienteException : ServiceException
{
    public string ProductoNombre { get; }
    public int Disponible { get; }
    public int Solicitado { get; }

    public StockSucursalInsuficienteException(
        string productoNombre,
        int sucursalId,
        int disponible,
        int solicitado)
        : base($"Stock insuficiente de \"{productoNombre}\". Disponible: {disponible}, pedido: {solicitado}")
    {
        ProductoNombre = productoNombre;
        Disponible = disponible;
        Solicitado = solicitado;
    }
}
