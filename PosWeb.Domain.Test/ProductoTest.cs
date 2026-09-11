using PosWeb.Domain;
using PosWeb.Domain.Exceptions;
using Xunit;

namespace PosWeb.Domain.Test;

public class ProductoTest
{
    private static Producto CrearProductoValido()
    {
        return new Producto(
            "PROD001",
            "123456",
            "Producto Test",
            100m,
            80m
        );
    }

    [Fact]
    public void CambiarPrecio_PrecioInvalido_LanzaExcepcion()
    {
        Producto producto = CrearProductoValido();

        Assert.Throws<PrecioInvalidoException>(() =>
        {
            producto.CambiarPrecio(0);
        });
    }

    [Fact]
    public void CambiarCosto_CostoInvalido_LanzaExcepcion()
    {
        Producto producto = CrearProductoValido();

        Assert.Throws<CostoInvalidoException>(() =>
        {
            producto.CambiarCosto(-1);
        });
    }

    [Fact]
    public void CambiarCodigoBarra_NumeroSeNormalizaA13Digitos()
    {
        Producto producto = CrearProductoValido();

        producto.CambiarCodigoBarras("123");

        Assert.Equal("0000000000123", producto.CODIGO_BARRAS);
    }

    [Fact]
    public void CambiarCodigoBarra_VacioSePermite()
    {
        Producto producto = CrearProductoValido();

        producto.CambiarCodigoBarras("");

        Assert.Equal("", producto.CODIGO_BARRAS);
    }

    [Fact]
    public void CambiarDescripcion_DescripcionVacia_LanzaExcepcion()
    {
        Assert.Throws<NombreInvalidoException>(() =>
        {
            new Producto(
                "PROD001",
                "123456",
                "",
                100m,
                80m
            );
        });
    }
}
