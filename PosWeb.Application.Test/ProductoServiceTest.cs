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
    private static PosDbContextLocal CrearContexto(string dbName)
    {
        DbContextOptions<PosDbContextLocal> options =
            new DbContextOptionsBuilder<PosDbContextLocal>()
                .UseInMemoryDatabase(dbName)
                .Options;

        return new PosDbContextLocal(options);
    }

    private static ProductoService CrearService(PosDbContextLocal context)
    {
        return new ProductoService(context);
    }

    private static Producto CrearProducto(
        PosDbContextLocal context,
        int id,
        string codigo,
        string nombre,
        bool activo = true)
    {
        Producto producto = new Producto(
            codigo,
            codigo,
            nombre,
            100m,
            80m
        );

        TestHelpers.SetId(producto, id, "ID_PRODUCTO");

        if (!activo)
        {
            producto.Desactivar();
        }

        context.Producto.Add(producto);
        context.SaveChanges();

        return producto;
    }

    [Fact]
    public void ObtenerActivos_SoloDevuelveProductosActivos()
    {
        PosDbContextLocal context = CrearContexto(nameof(ObtenerActivos_SoloDevuelveProductosActivos));
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
        PosDbContextLocal context = CrearContexto(nameof(ObtenerActivos_OrdenaPorNombre));
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
        PosDbContextLocal context = CrearContexto(nameof(Crear_ProductoValido_SeCreaCorrectamente));
        ProductoService service = CrearService(context);

        ProductoUpsertDto dto = new ProductoUpsertDto
        {
            CodigoBarra = "123",
            Nombre = "Producto Test",
            Precio = 100m,
            Costo = 80m
        };

        ProductoDto resultado = service.Crear(dto);

        Assert.Equal("0000000000123", resultado.CodigoBarra);
        Assert.Equal("Producto Test", resultado.Nombre);
        Assert.True(resultado.Activo);
        Assert.Equal(0, resultado.Stock);
        Assert.Equal(1, context.Producto.Count());
    }

    [Fact]
    public void Crear_ConControlVencimientos_ConservaLaPreferencia()
    {
        PosDbContextLocal context = CrearContexto(nameof(Crear_ConControlVencimientos_ConservaLaPreferencia));
        ProductoService service = CrearService(context);

        ProductoDto resultado = service.Crear(new ProductoUpsertDto
        {
            CodigoBarra = "123",
            Nombre = "Producto Test",
            Precio = 100m,
            Costo = 80m,
            SeguirVencimientos = true
        });

        Assert.True(resultado.SeguirVencimientos);
    }

    [Fact]
    public void Modificar_ConControlVencimientos_ActualizaLaPreferencia()
    {
        PosDbContextLocal context = CrearContexto(nameof(Modificar_ConControlVencimientos_ActualizaLaPreferencia));
        Producto producto = CrearProducto(context, 1, "123", "Producto Test");
        ProductoService service = CrearService(context);

        ProductoDto resultado = service.Modificar(producto.ID_PRODUCTO, new ProductoUpsertDto
        {
            CodigoBarra = "123",
            Nombre = "Producto Test",
            Precio = 100m,
            Costo = 80m,
            SeguirVencimientos = true
        });

        Assert.True(resultado.SeguirVencimientos);
        Assert.True(context.Producto.Single().SEGUIR_VENCIMIENTOS);
    }

    [Fact]
    public void ActualizarVencimientos_GuardaFechasYControl()
    {
        PosDbContextLocal context = CrearContexto(nameof(ActualizarVencimientos_GuardaFechasYControl));
        Producto producto = CrearProducto(context, 1, "123", "Producto");
        ProductoService service = CrearService(context);

        ProductoDto resultado = service.ActualizarVencimientos(producto.ID_PRODUCTO, true, new[]
        {
            new DateTime(2027, 3, 1), new DateTime(2027, 1, 1)
        });

        Assert.True(resultado.SeguirVencimientos);
        Assert.Equal(new[] { new DateTime(2027, 1, 1), new DateTime(2027, 3, 1) }, resultado.FechasVencimiento);
    }

    [Fact]
    public void ActualizarVencimientos_MasDeTresFechas_LanzaExcepcion()
    {
        PosDbContextLocal context = CrearContexto(nameof(ActualizarVencimientos_MasDeTresFechas_LanzaExcepcion));
        Producto producto = CrearProducto(context, 1, "123", "Producto");
        ProductoService service = CrearService(context);

        Assert.Throws<ArgumentException>(() => service.ActualizarVencimientos(producto.ID_PRODUCTO, true, new[]
        {
            new DateTime(2027, 1, 1), new DateTime(2027, 2, 1),
            new DateTime(2027, 3, 1), new DateTime(2027, 4, 1)
        }));
    }

    [Fact]
    public void ActualizarVencimientos_ProductoInexistente_LanzaExcepcion()
    {
        PosDbContextLocal context = CrearContexto(nameof(ActualizarVencimientos_ProductoInexistente_LanzaExcepcion));
        ProductoService service = CrearService(context);

        Assert.Throws<ProductoNoEncontradoException>(() =>
            service.ActualizarVencimientos(999, true, Array.Empty<DateTime>()));
    }

    [Fact]
    public void Crear_CodigoDuplicado_LanzaExcepcion()
    {
        PosDbContextLocal context = CrearContexto(nameof(Crear_CodigoDuplicado_LanzaExcepcion));
        CrearProducto(context, 1, "123", "Producto Existente");

        ProductoService service = CrearService(context);

        ProductoUpsertDto dto = new ProductoUpsertDto
        {
            CodigoBarra = "123",
            Nombre = "Nuevo",
            Precio = 100m,
            Costo = 80m
        };

        Assert.Throws<ProductoCodigoDuplicadoException>(() =>
        {
            service.Crear(dto);
        });
    }

    [Fact]
    public void ObtenerPorCodigoBarra_Existente_DevuelveProducto()
    {
        PosDbContextLocal context = CrearContexto(nameof(ObtenerPorCodigoBarra_Existente_DevuelveProducto));
        CrearProducto(context, 1, "ABC", "Producto ABC");

        ProductoService service = CrearService(context);

        ProductoDto resultado = service.ObtenerPorCodigoBarra("ABC");

        Assert.Equal("Producto ABC", resultado.Nombre);
    }

    [Fact]
    public void ObtenerSiguienteCodigo_ReusaCodigoDeProductoInactivo()
    {
        PosDbContextLocal context = CrearContexto(nameof(ObtenerSiguienteCodigo_ReusaCodigoDeProductoInactivo));
        CrearProducto(context, 1, "PROD1", "Activo");
        CrearProducto(context, 2, "PROD2", "Inactivo", false);

        ProductoService service = CrearService(context);

        Assert.Equal("PROD2", service.ObtenerSiguienteCodigo());
    }

    [Fact]
    public void Crear_ReusaCodigoDeProductoInactivo_NoLanzaExcepcion()
    {
        PosDbContextLocal context = CrearContexto(nameof(Crear_ReusaCodigoDeProductoInactivo_NoLanzaExcepcion));
        CrearProducto(context, 1, "PROD1", "Inactivo", false);

        ProductoService service = CrearService(context);

        ProductoUpsertDto dto = new ProductoUpsertDto
        {
            CodigoProducto = "PROD1",
            CodigoBarra = "999",
            Nombre = "Nuevo",
            Precio = 100m,
            Costo = 80m
        };

        ProductoDto resultado = service.Crear(dto);

        Assert.Equal("PROD1", resultado.CodigoProducto);
        Assert.True(resultado.Activo);
    }

    [Fact]
    public void ObtenerPorCodigoBarra_Vacio_LanzaExcepcion()
    {
        PosDbContextLocal context = CrearContexto(nameof(ObtenerPorCodigoBarra_Vacio_LanzaExcepcion));
        ProductoService service = CrearService(context);

        Assert.Throws<CodigoBarraRequeridoException>(() =>
        {
            service.ObtenerPorCodigoBarra("");
        });
    }

    [Fact]
    public void ObtenerPorCodigoBarra_NoExiste_LanzaExcepcion()
    {
        PosDbContextLocal context = CrearContexto(nameof(ObtenerPorCodigoBarra_NoExiste_LanzaExcepcion));
        ProductoService service = CrearService(context);

        Assert.Throws<ProductoNoEncontradoException>(() =>
        {
            service.ObtenerPorCodigoBarra("NO_EXISTE");
        });
    }

    [Fact]
    public void Eliminar_ProductoExistente_DesactivaProducto()
    {
        PosDbContextLocal context = CrearContexto(nameof(Eliminar_ProductoExistente_DesactivaProducto));
        Producto producto = CrearProducto(context, 1, "123", "Producto");

        ProductoService service = CrearService(context);

        service.Eliminar(producto.ID_PRODUCTO);

        Producto resultado = context.Producto.First();

        Assert.False(resultado.ACTIVO);
    }

    [Fact]
    public void Eliminar_ProductoInexistente_LanzaExcepcion()
    {
        PosDbContextLocal context = CrearContexto(nameof(Eliminar_ProductoInexistente_LanzaExcepcion));
        ProductoService service = CrearService(context);

        Assert.Throws<ProductoNoEncontradoException>(() =>
        {
            service.Eliminar(999);
        });
    }

    [Fact]
    public void Crear_OrdenaYEliminaFechasVencimientoRepetidas()
    {
        PosDbContextLocal context = CrearContexto(nameof(Crear_OrdenaYEliminaFechasVencimientoRepetidas));
        ProductoService service = CrearService(context);

        ProductoDto resultado = service.Crear(new ProductoUpsertDto
        {
            CodigoBarra = "123",
            Nombre = "Producto",
            Precio = 100m,
            Costo = 80m,
            FechasVencimiento = new List<DateTime>
            {
                new DateTime(2027, 3, 1), new DateTime(2027, 1, 1),
                new DateTime(2027, 1, 1), new DateTime(2027, 2, 1)
            }
        });

        Assert.Equal(new[]
        {
            new DateTime(2027, 1, 1),
            new DateTime(2027, 2, 1),
            new DateTime(2027, 3, 1)
        }, resultado.FechasVencimiento);
    }

    [Fact]
    public void Crear_MasDeTresFechasVencimiento_LanzaExcepcion()
    {
        PosDbContextLocal context = CrearContexto(nameof(Crear_MasDeTresFechasVencimiento_LanzaExcepcion));
        ProductoService service = CrearService(context);

        Assert.Throws<ArgumentException>(() => service.Crear(new ProductoUpsertDto
        {
            CodigoBarra = "123",
            Nombre = "Producto",
            Precio = 100m,
            Costo = 80m,
            FechasVencimiento = new List<DateTime>
            {
                new DateTime(2027, 1, 1), new DateTime(2027, 2, 1),
                new DateTime(2027, 3, 1), new DateTime(2027, 4, 1)
            }
        }));
    }

    [Fact]
    public void BuscarPorNombre_DevuelveStockTotalDeTodasLasSucursales()
    {
        PosDbContextLocal context = CrearContexto(nameof(BuscarPorNombre_DevuelveStockTotalDeTodasLasSucursales));
        ProductoService service = CrearService(context);

        Producto producto = CrearProducto(context, 1, "7791234567890", "Coca Cola");
        Sucursal sucursal1 = new Sucursal("COD1", "Sucursal 1", 1);
        Sucursal sucursal2 = new Sucursal("COD2", "Sucursal 2", 2);
        TestHelpers.SetId(sucursal1, 1, "ID_SUCURSAL");
        TestHelpers.SetId(sucursal2, 2, "ID_SUCURSAL");
        context.Sucursal.AddRange(sucursal1, sucursal2);
        context.SaveChanges();

        context.StockSucursal.Add(new StockSucursal(producto.ID_PRODUCTO, sucursal1.ID_SUCURSAL, 48m));
        context.StockSucursal.Add(new StockSucursal(producto.ID_PRODUCTO, sucursal2.ID_SUCURSAL, 12m));
        context.SaveChanges();

        List<ProductoDto> resultado = service.BuscarPorNombre("Coca");

        ProductoDto? encontrado = Assert.Single(resultado);
        Assert.Equal(60m, encontrado.Stock);
    }
}
