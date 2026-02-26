using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Productos;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;
using Xunit;

namespace PosWeb.Application.Test;

public class ProductoServiceTest
{
    private static PosDbContext CrearContexto(string dbName)
    {
        DbContextOptions<PosDbContext> options =
            new DbContextOptionsBuilder<PosDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

        return new PosDbContext(options);
    }

    private static ProductoService CrearService(PosDbContext context)
    {
        return new ProductoService(context);
    }

    private static Producto CrearProducto(
        PosDbContext context,
        int id,
        string codigo,
        string nombre,
        bool activo = true)
    {
        Producto producto = new Producto(
            codigo,
            nombre,
            100,
            80,
            10
        );

        TestHelpers.SetId(producto, id, "ID_PRODUCTO");

        if (!activo)
        {
            producto.Desactivar();
        }

        context.Productos.Add(producto);
        context.SaveChanges();

        return producto;
    }

    [Fact]
    public void ObtenerActivos_SoloDevuelveProductosActivos()
    {
        PosDbContext context = CrearContexto(nameof(ObtenerActivos_SoloDevuelveProductosActivos));
        CrearProducto(context, 1, "111", "Activo");
        CrearProducto(context, 2, "222", "Inactivo", false);

        ProductoService service = CrearService(context);

        List<ProductoDto> resultado = service.ObtenerActivos();

        Assert.Single(resultado);
        Assert.Equal("Activo", resultado[0].Nombre);
    }

    [Fact]
    public void ObtenerActivos_OrdenaPorNombre()
    {
        PosDbContext context = CrearContexto(nameof(ObtenerActivos_OrdenaPorNombre));
        CrearProducto(context, 1, "111", "Zeta");
        CrearProducto(context, 2, "222", "Alfa");

        ProductoService service = CrearService(context);

        List<ProductoDto> resultado = service.ObtenerActivos();

        Assert.Equal("Alfa", resultado[0].Nombre);
        Assert.Equal("Zeta", resultado[1].Nombre);
    }

    [Fact]
    public void Crear_ProductoValido_SeCreaCorrectamente()
    {
        PosDbContext context = CrearContexto(nameof(Crear_ProductoValido_SeCreaCorrectamente));
        ProductoService service = CrearService(context);

        ProductoDto dto = new ProductoDto
        {
            CodigoBarra = "123",
            Nombre = "Producto Test",
            Precio = 100,
            Costo = 80,
            Stock = 10
        };

        ProductoDto resultado = service.Crear(dto);

        Assert.Equal("123", resultado.CodigoBarra);
        Assert.Equal("Producto Test", resultado.Nombre);
        Assert.True(resultado.Activo);
        Assert.Equal(1, context.Productos.Count());
    }

    [Fact]
    public void Crear_CodigoDuplicado_LanzaExcepcion()
    {
        PosDbContext context = CrearContexto(nameof(Crear_CodigoDuplicado_LanzaExcepcion));
        CrearProducto(context, 1, "123", "Producto Existente");

        ProductoService service = CrearService(context);

        ProductoDto dto = new ProductoDto
        {
            CodigoBarra = "123",
            Nombre = "Nuevo",
            Precio = 100,
            Costo = 80,
            Stock = 5
        };

        Assert.Throws<ProductoCodigoDuplicadoException>(() =>
        {
            service.Crear(dto);
        });
    }

    [Fact]
    public void ObtenerPorCodigoBarra_Existente_DevuelveProducto()
    {
        PosDbContext context = CrearContexto(nameof(ObtenerPorCodigoBarra_Existente_DevuelveProducto));
        CrearProducto(context, 1, "ABC", "Producto ABC");

        ProductoService service = CrearService(context);

        ProductoDto resultado = service.ObtenerPorCodigoBarra("ABC");

        Assert.Equal("Producto ABC", resultado.Nombre);
    }

    [Fact]
    public void ObtenerPorCodigoBarra_Vacio_LanzaExcepcion()
    {
        PosDbContext context = CrearContexto(nameof(ObtenerPorCodigoBarra_Vacio_LanzaExcepcion));
        ProductoService service = CrearService(context);

        Assert.Throws<CodigoBarraRequeridoException>(() =>
        {
            service.ObtenerPorCodigoBarra("");
        });
    }

    [Fact]
    public void ObtenerPorCodigoBarra_NoExiste_LanzaExcepcion()
    {
        PosDbContext context = CrearContexto(nameof(ObtenerPorCodigoBarra_NoExiste_LanzaExcepcion));
        ProductoService service = CrearService(context);

        Assert.Throws<ProductoNoEncontradoException>(() =>
        {
            service.ObtenerPorCodigoBarra("NO_EXISTE");
        });
    }

    [Fact]
    public void Eliminar_ProductoExistente_DesactivaProducto()
    {
        PosDbContext context = CrearContexto(nameof(Eliminar_ProductoExistente_DesactivaProducto));
        Producto producto = CrearProducto(context, 1, "123", "Producto");

        ProductoService service = CrearService(context);

        service.Eliminar(producto.ID_PRODUCTO);

        Producto resultado = context.Productos.First();

        Assert.False(resultado.Activo);
    }

    [Fact]
    public void Eliminar_ProductoInexistente_LanzaExcepcion()
    {
        PosDbContext context = CrearContexto(nameof(Eliminar_ProductoInexistente_LanzaExcepcion));
        ProductoService service = CrearService(context);

        Assert.Throws<ProductoNoEncontradoException>(() =>
        {
            service.Eliminar(999);
        });
    }
}