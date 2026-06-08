using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Application.StockSucursales;
using PosWeb.Controllers;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;
using Xunit;

namespace PosWeb.Application.Test;

public class StockSucursalServiceTest
{
    private static PosDbContext CrearContexto(string dbName)
    {
        DbContextOptions<PosDbContext> options =
            new DbContextOptionsBuilder<PosDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

        return new PosDbContext(options);
    }

    private static StockSucursalService CrearService(PosDbContext context)
    {
        return new StockSucursalService(context);
    }

    private static Producto CrearProducto(PosDbContext context, int id, string codigo, string nombre, bool activo = true)
    {
        Producto producto = new Producto(codigo, codigo, nombre, 100m, 80m);
        TestHelpers.SetId(producto, id, "ID_PRODUCTO");

        if (!activo)
        {
            producto.Desactivar();
        }

        context.Producto.Add(producto);
        context.SaveChanges();
        return producto;
    }

    private static Sucursal CrearSucursal(PosDbContext context, int id, string codigo, string nombre, bool activo = true)
    {
        Sucursal sucursal = new Sucursal(codigo, nombre, 1);
        TestHelpers.SetId(sucursal, id, "ID_SUCURSAL");

        if (!activo)
        {
            sucursal.Desactivar();
        }

        context.Sucursal.Add(sucursal);
        context.SaveChanges();
        return sucursal;
    }

    private static void CrearStock(PosDbContext context, int productoId, int sucursalId, int stock)
    {
        StockSucursal stockSucursal = new StockSucursal(productoId, sucursalId, stock);
        context.StockSucursal.Add(stockSucursal);
        context.SaveChanges();
    }

    [Fact]
    public void ListarPorSucursal_IncluyeProductosSinFilaComoNoInicializados()
    {
        PosDbContext context = CrearContexto(nameof(ListarPorSucursal_IncluyeProductosSinFilaComoNoInicializados));
        CrearSucursal(context, 1, "SUC-1", "Sucursal Centro");
        Producto conStock = CrearProducto(context, 1, "111", "Alfajor");
        Producto sinStock = CrearProducto(context, 2, "222", "Yerba");
        CrearStock(context, conStock.ID_PRODUCTO, 1, 5);

        StockSucursalService service = CrearService(context);

        List<PosWeb.Contracts.StockSucursalDto> resultado = service.ListarPorSucursal(1);

        Assert.Equal(2, resultado.Count);

        PosWeb.Contracts.StockSucursalDto dtoConStock = Assert.Single(resultado.Where(x => x.ProductoId == conStock.ID_PRODUCTO));
        Assert.Equal(5, dtoConStock.Stock);
        Assert.True(dtoConStock.Inicializado);

        PosWeb.Contracts.StockSucursalDto dtoSinStock = Assert.Single(resultado.Where(x => x.ProductoId == sinStock.ID_PRODUCTO));
        Assert.Equal(0, dtoSinStock.Stock);
        Assert.False(dtoSinStock.Inicializado);
        Assert.Equal(1, dtoSinStock.SucursalId);
    }

    [Fact]
    public void ListarPorSucursal_SinStocksPrevios_RetornaCatalogoActivo()
    {
        PosDbContext context = CrearContexto(nameof(ListarPorSucursal_SinStocksPrevios_RetornaCatalogoActivo));
        CrearSucursal(context, 1, "SUC-1", "Sucursal Centro");
        CrearProducto(context, 1, "111", "Alfajor");
        CrearProducto(context, 2, "222", "Yerba");
        CrearProducto(context, 3, "333", "Inactivo", activo: false);

        StockSucursalService service = CrearService(context);

        List<PosWeb.Contracts.StockSucursalDto> resultado = service.ListarPorSucursal(1);

        Assert.Equal(2, resultado.Count);
        Assert.All(resultado, item =>
        {
            Assert.Equal(0, item.Stock);
            Assert.False(item.Inicializado);
        });
    }

    [Fact]
    public void AjustarStock_SinFilaPrevia_CreaStockSucursal()
    {
        PosDbContext context = CrearContexto(nameof(AjustarStock_SinFilaPrevia_CreaStockSucursal));
        Producto producto = CrearProducto(context, 1, "111", "Alfajor");
        CrearSucursal(context, 1, "SUC-1", "Sucursal Centro");
        StockSucursalService service = CrearService(context);

        service.AjustarStock(producto.ID_PRODUCTO, 1, 8);

        StockSucursal creado = Assert.Single(context.StockSucursal);
        Assert.Equal(producto.ID_PRODUCTO, creado.ID_PRODUCTO);
        Assert.Equal(1, creado.ID_SUCURSAL);
        Assert.Equal(8, creado.STOCK);
    }

    [Fact]
    public void AjustarStock_SucursalInexistente_LanzaExcepcion()
    {
        PosDbContext context = CrearContexto(nameof(AjustarStock_SucursalInexistente_LanzaExcepcion));
        Producto producto = CrearProducto(context, 1, "111", "Alfajor");
        StockSucursalService service = CrearService(context);

        Assert.Throws<SucursalNoExisteException>(() => service.AjustarStock(producto.ID_PRODUCTO, 999, 8));
    }

    [Fact]
    public void ControladorAjustar_SucursalInexistente_DevuelveNotFound()
    {
        PosDbContext context = CrearContexto(nameof(ControladorAjustar_SucursalInexistente_DevuelveNotFound));
        CrearProducto(context, 1, "111", "Alfajor");
        StockController controller = new StockController(CrearService(context));

        ActionResult resultado = controller.Ajustar(new AjustarStockRequest(1, 999, 8));

        NotFoundObjectResult notFound = Assert.IsType<NotFoundObjectResult>(resultado);
        Assert.Equal("La sucursal con ID 999 no existe", notFound.Value);
    }
}
