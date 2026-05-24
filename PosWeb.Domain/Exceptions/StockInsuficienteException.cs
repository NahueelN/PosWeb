namespace PosWeb.Domain.Exceptions;

public class StockInsuficienteException : DomainException
{
    public string NombreProducto { get; }
    public int StockDisponible { get; }
    public int CantidadSolicitada { get; }
    public int? IdSucursal { get; }

    public StockInsuficienteException(
        string nombreProducto,
        int stockDisponible,
        int cantidadSolicitada,
        int? idSucursal = null)
        : base(idSucursal.HasValue
            ? $"El producto '{nombreProducto}' no tiene stock suficiente en sucursal {idSucursal}"
            : $"El producto '{nombreProducto}' no tiene stock suficiente")
    {
        NombreProducto = nombreProducto;
        StockDisponible = stockDisponible;
        CantidadSolicitada = cantidadSolicitada;
        IdSucursal = idSucursal;
    }
}
