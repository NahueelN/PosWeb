namespace PosWeb.Domain.Exceptions;

public class StockInsuficienteException : DomainException
{
    public string NombreProducto { get; }
    public decimal StockDisponible { get; }
    public decimal CantidadSolicitada { get; }
    public int? IdSucursal { get; }

    public StockInsuficienteException(
        string nombreProducto,
        decimal stockDisponible,
        decimal cantidadSolicitada,
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
