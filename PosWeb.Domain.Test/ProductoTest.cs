using PosWeb.Domain;
using PosWeb.Domain.Exceptions;
using Xunit;

namespace PosWeb.Domain.Test;

public class ProductoTest
{
    [Fact]
    public void DescontarStock_RestaCantidadCorrectamente()
    {
        Producto producto = new Producto(
            "123456",
            "Producto Test",
            100,
            80,
            10
        );

        producto.DescontarStock(3);

        Assert.Equal(7, producto.STOCK);
    }

    [Fact]
    public void DescontarStock_StockInsuficiente_LanzaExcepcion()
    {
        Producto producto = new Producto(
            "123456",
            "Producto Test",
            100,
            80,
            2
        );

        Assert.Throws<StockInsuficienteException>(() =>
        {
            producto.DescontarStock(5);
        });
    }

    [Fact]
    public void DescontarStock_CantidadCero_LanzaExcepcion()
    {
        Producto producto = new Producto(
            "123456",
            "Producto Test",
            100,
            80,
            10
        );

        Assert.Throws<CantidadInvalidaException>(() =>
        {
            producto.DescontarStock(0);
        });
    }

    [Fact]
    public void DescontarStock_CantidadNegativa_LanzaExcepcion()
    {
        Producto producto = new Producto(
            "123456",
            "Producto Test",
            100,
            80,
            10
        );

        Assert.Throws<CantidadInvalidaException>(() =>
        {
            producto.DescontarStock(-1);
        });
    }

    [Fact]
    public void CambiarPrecio_PrecioInvalido_LanzaExcepcion()
    {
        Producto producto = new Producto(
            "123456",
            "Producto Test",
            100,
            80,
            10
        );

        Assert.Throws<PrecioInvalidoException>(() =>
        {
            producto.CambiarPrecio(0);
        });
    }

    [Fact]
    public void CambiarCosto_CostoInvalido_LanzaExcepcion()
    {
        Producto producto = new Producto(
            "123456",
            "Producto Test",
            100,
            80,
            10
        );

        Assert.Throws<CostoInvalidoException>(() =>
        {
            producto.CambiarCosto(-1);
        });
    }

    [Fact]
    public void CambiarStock_StockInvalido_LanzaExcepcion()
    {
        Producto producto = new Producto(
            "123456",
            "Producto Test",
            100,
            80,
            10
        );

        Assert.Throws<StockInvalidoException>(() =>
        {
            producto.CambiarStock(-5);
        });
    }

    [Fact]
    public void CambiarCodigoBarra_CodigoInvalido_LanzaExcepcion()
    {
        Assert.Throws<CodigoBarraInvalidoException>(() =>
        {
            new Producto(
                "",
                "Producto Test",
                100,
                80,
                10
            );
        });
    }

    [Fact]
    public void CambiarNombre_NombreInvalido_LanzaExcepcion()
    {
        Assert.Throws<NombreInvalidoException>(() =>
        {
            new Producto(
                "123456",
                "",
                100,
                80,
                10
            );
        });
    }
}