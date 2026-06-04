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
    public void CambiarCodigoBarra_CodigoInvalido_LanzaExcepcion()
    {
        Assert.Throws<CodigoBarraInvalidoException>(() =>
        {
            new Producto(
                "PROD001",
                "",
                "Producto Test",
                100m,
                80m
            );
        });
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
