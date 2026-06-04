using PosWeb.Domain;
using PosWeb.Domain.Exceptions;
using Xunit;

namespace PosWeb.Domain.Test;

public class StockSucursalTest
{
    [Fact]
    public void Constructor_AsignaStockInicial()
    {
        var stock = new StockSucursal(1, 2, 10m);

        Assert.Equal(1, stock.ID_PRODUCTO);
        Assert.Equal(2, stock.ID_SUCURSAL);
        Assert.Equal(10m, stock.STOCK);
    }

    [Fact]
    public void Constructor_StockNegativo_LanzaExcepcion()
    {
        var ex = Assert.Throws<ArgumentException>(() => new StockSucursal(1, 2, -1m));
        Assert.Contains("negativo", ex.Message);
    }

    [Fact]
    public void Constructor_StockCero_EsValido()
    {
        var stock = new StockSucursal(1, 2, 0m);
        Assert.Equal(0m, stock.STOCK);
    }

    [Fact]
    public void DescontarStock_RestaCantidadCorrectamente()
    {
        var stock = new StockSucursal(1, 2, 10m);

        stock.DescontarStock(3m);

        Assert.Equal(7m, stock.STOCK);
    }

    [Fact]
    public void DescontarStock_StockInsuficiente_LanzaExcepcion()
    {
        var stock = new StockSucursal(1, 2, 2m);

        var ex = Assert.Throws<StockInsuficienteException>(() => stock.DescontarStock(5m));

        Assert.Equal(2m, ex.StockDisponible);
        Assert.Equal(5m, ex.CantidadSolicitada);
        Assert.Equal(2, ex.IdSucursal);
    }

    [Fact]
    public void DescontarStock_CantidadCero_LanzaExcepcion()
    {
        var stock = new StockSucursal(1, 2, 10m);

        Assert.Throws<CantidadInvalidaException>(() => stock.DescontarStock(0m));
    }

    [Fact]
    public void DescontarStock_CantidadNegativa_LanzaExcepcion()
    {
        var stock = new StockSucursal(1, 2, 10m);

        Assert.Throws<CantidadInvalidaException>(() => stock.DescontarStock(-1m));
    }

    [Fact]
    public void DescontarStock_StockExacto_Permite()
    {
        var stock = new StockSucursal(1, 2, 5m);

        stock.DescontarStock(5m);

        Assert.Equal(0m, stock.STOCK);
    }

    [Fact]
    public void AumentarStock_SumaCantidadCorrectamente()
    {
        var stock = new StockSucursal(1, 2, 5m);

        stock.AumentarStock(10m);

        Assert.Equal(15m, stock.STOCK);
    }

    [Fact]
    public void AumentarStock_CantidadCero_LanzaExcepcion()
    {
        var stock = new StockSucursal(1, 2, 5m);

        Assert.Throws<CantidadInvalidaException>(() => stock.AumentarStock(0m));
    }

    [Fact]
    public void AumentarStock_CantidadNegativa_LanzaExcepcion()
    {
        var stock = new StockSucursal(1, 2, 5m);

        Assert.Throws<CantidadInvalidaException>(() => stock.AumentarStock(-1m));
    }

    [Fact]
    public void AumentarStock_DesdeCero_SumaCorrectamente()
    {
        var stock = new StockSucursal(1, 2, 0m);

        stock.AumentarStock(1m);

        Assert.Equal(1m, stock.STOCK);
    }

    [Fact]
    public void AjustarStock_CambiaStock()
    {
        var stock = new StockSucursal(1, 2, 5m);

        stock.AjustarStock(20m);

        Assert.Equal(20m, stock.STOCK);
    }

    [Fact]
    public void AjustarStock_ACero_EsValido()
    {
        var stock = new StockSucursal(1, 2, 5m);

        stock.AjustarStock(0m);

        Assert.Equal(0m, stock.STOCK);
    }

    [Fact]
    public void AjustarStock_Negativo_LanzaExcepcion()
    {
        var stock = new StockSucursal(1, 2, 5m);

        Assert.Throws<StockInvalidoException>(() => stock.AjustarStock(-1m));
    }
}
