using PosWeb.Domain.Exceptions;

namespace PosWeb.Domain;

public class StockSucursal
{
    public int ID_PRODUCTO { get; private set; }
    public int ID_SUCURSAL { get; private set; }
    public decimal STOCK { get; private set; }

    // Navigation
    public Producto Producto { get; private set; } = null!;
    public Sucursal Sucursal { get; private set; } = null!;

    protected StockSucursal() { } // EF Core

    public StockSucursal(int idProducto, int idSucursal, decimal stockInicial)
    {
        if (stockInicial < 0)
            throw new ArgumentException("Stock inicial no puede ser negativo", nameof(stockInicial));

        ID_PRODUCTO = idProducto;
        ID_SUCURSAL = idSucursal;
        STOCK = stockInicial;
    }

    public void DescontarStock(decimal cantidad)
    {
        if (cantidad <= 0)
            throw new CantidadInvalidaException(cantidad);
        if (STOCK < cantidad)
            throw new StockInsuficienteException("", STOCK, cantidad, ID_SUCURSAL);

        STOCK -= cantidad;
    }

    public void AumentarStock(decimal cantidad)
    {
        if (cantidad <= 0)
            throw new CantidadInvalidaException(cantidad);

        STOCK += cantidad;
    }

    public void AjustarStock(decimal nuevoStock)
    {
        if (nuevoStock < 0)
            throw new StockInvalidoException(nuevoStock);

        STOCK = nuevoStock;
    }
}
