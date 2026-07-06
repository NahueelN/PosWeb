namespace PosWeb.Application.Exceptions;

public class StockSucursalInsuficienteException : ServiceException
{
    public string ProductoNombre { get; }
    public decimal Disponible { get; }
    public decimal Solicitado { get; }

    public StockSucursalInsuficienteException(
        string productoNombre,
        int sucursalId,
        decimal disponible,
        decimal solicitado)
        : base($"Stock insuficiente de \"{productoNombre}\". Disponible: {disponible:F2}, pedido: {solicitado:F2}")
    {
        ProductoNombre = productoNombre;
        Disponible = disponible;
        Solicitado = solicitado;
    }
}
