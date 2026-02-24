using PosWeb.Domain;
using PosWeb.Domain.Exceptions;
using Xunit;

namespace PosWeb.Domain.Test;

public class VentaTest
{
    private static Venta CrearVenta(int id = 1, int sucursalId = 1)
    {
        Venta venta = new Venta(sucursalId);
        TestHelpers.SetId(venta, id, "ID_VENTA");
        return venta;
    }

    private static Producto CrearProducto(
        int id,
        decimal precio,
        int stock,
        string codigoBarra = "TEST",
        string nombre = "Producto Test",
        decimal costo = 80)
    {
        Producto producto = new Producto(
            codigoBarra,
            nombre,
            precio,
            costo,
            stock
        );

        TestHelpers.SetId(producto, id, "ID_PRODUCTO");
        return producto;
    }

    [Fact]
    public void CrearVenta_SinRenglones_TotalEsCero()
    {
        Venta venta = CrearVenta();

        Assert.Equal(0, venta.TOTAL);
    }

    [Fact]
    public void AgregarRenglon_CalculaTotalCorrectamente()
    {
        Producto producto = CrearProducto(id: 1, precio: 100, stock: 10);
        Venta venta = CrearVenta();

        venta.AgregarRenglon(producto, 2);

        Assert.Equal(200, venta.TOTAL);
    }

    [Fact]
    public void AgregarMultiplesRenglones_SumaTotales()
    {
        Producto producto1 = CrearProducto(id: 1, precio: 100, stock: 10);
        Producto producto2 = CrearProducto(id: 2, precio: 50, stock: 10);
        Venta venta = CrearVenta();

        venta.AgregarRenglon(producto1, 2);
        venta.AgregarRenglon(producto2, 4);

        Assert.Equal(400, venta.TOTAL);
    }

    [Fact]
    public void AgregarRenglon_DescuentaStock()
    {
        Producto producto = CrearProducto(id: 1, precio: 100, stock: 10);
        Venta venta = CrearVenta();

        venta.AgregarRenglon(producto, 3);

        Assert.Equal(7, producto.STOCK);
    }

    [Fact]
    public void CrearVenta_SucursalInvalida_LanzaExcepcion()
    {
        Assert.Throws<SucursalInvalidaException>(() =>
        {
            CrearVenta(id: 1, sucursalId: 0);
        });
    }

    [Fact]
    public void AgregarRenglon_ProductoNull_LanzaExcepcion()
    {
        Venta venta = CrearVenta();

        Assert.Throws<ProductoInvalidoException>(() =>
        {
            venta.AgregarRenglon(null!, 1);
        });
    }

    [Fact]
    public void AgregarRenglon_CantidadCero_LanzaExcepcion()
    {
        Producto producto = CrearProducto(id: 1, precio: 100, stock: 10);
        Venta venta = CrearVenta();

        Assert.Throws<CantidadInvalidaException>(() =>
        {
            venta.AgregarRenglon(producto, 0);
        });
    }

    [Fact]
    public void AgregarRenglon_CantidadNegativa_LanzaExcepcion()
    {
        Producto producto = CrearProducto(id: 1, precio: 100, stock: 10);
        Venta venta = CrearVenta();

        Assert.Throws<CantidadInvalidaException>(() =>
        {
            venta.AgregarRenglon(producto, -1);
        });
    }

    [Fact]
    public void AgregarRenglon_StockInsuficiente_LanzaExcepcion()
    {
        Producto producto = CrearProducto(id: 1, precio: 100, stock: 2);
        Venta venta = CrearVenta();

        Assert.Throws<StockInsuficienteException>(() =>
        {
            venta.AgregarRenglon(producto, 5);
        });
    }
}