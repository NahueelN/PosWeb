using PosWeb.Domain;
using Xunit;

namespace PosWeb.Domain.Test;

public class ProductoTest
{
    [Fact]
    public void DescontarStock_RestaLaCantidadCorrectamente()
    {
        // Arrange
        Producto producto = new Producto(
            "123456",
            "Producto Test",
            100,
            80,
            10
        );

        // Act
        producto.DescontarStock(3);

        // Assert
        Assert.Equal(7, producto.Stock);
    }

    [Fact]
    public void DescontarStock_SiNoHayStock_LanzaExcepcion()
    {
        // Arrange
        Producto producto = new Producto(
            "123456",
            "Producto Test",
            100,
            80,
            2
        );

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() =>
        {
            producto.DescontarStock(5);
        });
    }

    [Fact]
    public void DescontarStock_CantidadInvalida_LanzaExcepcion()
    {
        // Arrange
        Producto producto = new Producto(
            "123456",
            "Producto Test",
            100,
            80,
            10
        );

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
        {
            producto.DescontarStock(0);
        });
    }
}