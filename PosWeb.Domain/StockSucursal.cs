using PosWeb.Domain.Exceptions;

namespace PosWeb.Domain;

public class StockSucursal
{
    public int Id { get; private set; }
    public int IdProducto { get; private set; }
    public int IdSucursal { get; private set; }
    public int Stock { get; private set; }

    // Navigation
    public Producto Producto { get; private set; } = null!;
    public Sucursal Sucursal { get; private set; } = null!;

    protected StockSucursal() { } // EF Core

    public StockSucursal(int idProducto, int idSucursal, int stockInicial)
    {
        if (stockInicial < 0)
            throw new ArgumentException("Stock inicial no puede ser negativo", nameof(stockInicial));

        IdProducto = idProducto;
        IdSucursal = idSucursal;
        Stock = stockInicial;
    }

    public void DescontarStock(int cantidad)
    {
        if (cantidad <= 0)
            throw new CantidadInvalidaException(cantidad);
        if (Stock < cantidad)
            throw new StockInsuficienteException("", Stock, cantidad, IdSucursal);

        Stock -= cantidad;
    }

    public void AumentarStock(int cantidad)
    {
        if (cantidad <= 0)
            throw new CantidadInvalidaException(cantidad);

        Stock += cantidad;
    }

    public void AjustarStock(int nuevoStock)
    {
        if (nuevoStock < 0)
            throw new StockInvalidoException(nuevoStock);

        Stock = nuevoStock;
    }
}
