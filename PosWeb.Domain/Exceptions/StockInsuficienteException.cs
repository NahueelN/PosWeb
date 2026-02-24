namespace PosWeb.Domain.Exceptions;

public class StockInsuficienteException : DomainException
{
    public string NombreProducto { get; }
    public int StockDisponible { get; }
    public int CantidadSolicitada { get; }

    public StockInsuficienteException(
        string nombreProducto,
        int stockDisponible,
        int cantidadSolicitada)
        : base($"El producto '{nombreProducto}' no tiene stock suficiente")
    {
        NombreProducto = nombreProducto;
        StockDisponible = stockDisponible;
        CantidadSolicitada = cantidadSolicitada;
    }
}
