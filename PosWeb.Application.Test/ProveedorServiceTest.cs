using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Proveedores;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;
using Xunit;

namespace PosWeb.Application.Test;

public class ProveedorServiceTest
{
    private static PosDbContext CrearContexto(string dbName)
    {
        DbContextOptions<PosDbContext> options =
            new DbContextOptionsBuilder<PosDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

        var context = new PosDbContext(options);
        context.SaveChanges();
        return context;
    }

    private static ProveedorService CrearService(PosDbContext context)
    {
        return new ProveedorService(context);
    }

    [Fact]
    public void Listar_SinFiltro_RetornaTodos()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Listar_SinFiltro_RetornaTodos));
        ProveedorService service = CrearService(context);

        context.Proveedores.Add(new Proveedor("ALPHA", "Distribuidora Alpha", telefono: "111"));
        context.Proveedores.Add(new Proveedor("BETA", "Distribuidora Beta", telefono: "222"));
        context.SaveChanges();

        // Act
        var result = service.Listar();

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public void Listar_ConFiltro_RetornaCoincidentes()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Listar_ConFiltro_RetornaCoincidentes));
        ProveedorService service = CrearService(context);

        context.Proveedores.Add(new Proveedor("ALPHA", "Distribuidora Alpha"));
        context.Proveedores.Add(new Proveedor("BETA", "Distribuidora Beta"));
        context.SaveChanges();

        // Act
        var result = service.Listar("Alpha");

        // Assert
        Assert.Single(result);
        Assert.Equal("Distribuidora Alpha", result[0].Nombre);
    }

    [Fact]
    public void Listar_ConFiltroCodigo_RetornaCoincidentes()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Listar_ConFiltroCodigo_RetornaCoincidentes));
        ProveedorService service = CrearService(context);

        context.Proveedores.Add(new Proveedor("ALPHA", "Distribuidora Alpha"));
        context.Proveedores.Add(new Proveedor("BETA", "Distribuidora Beta"));
        context.SaveChanges();

        // Act
        var result = service.Listar("BETA");

        // Assert
        Assert.Single(result);
        Assert.Equal("Distribuidora Beta", result[0].Nombre);
    }

    [Fact]
    public void Crear_ConNombreValido_CreaConCodigoAutogenerado()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Crear_ConNombreValido_CreaConCodigoAutogenerado));
        ProveedorService service = CrearService(context);

        var dto = new CrearProveedorRequestDto
        {
            Nombre = "Distribuidora Alpha",
            Telefono = "123456789"
        };

        // Act
        var result = service.Crear(dto);

        // Assert
        Assert.NotEqual(0, result.Id);
        Assert.Equal("Distribuidora Alpha", result.Nombre);
        Assert.Equal("DISTRIBUIDORA ALPHA", result.Codigo); // auto-generated uppercase
        Assert.Equal("123456789", result.Telefono);
        Assert.True(result.Activo);
    }

    [Fact]
    public void Crear_SinNombre_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Crear_SinNombre_LanzaExcepcion));
        ProveedorService service = CrearService(context);

        var dto = new CrearProveedorRequestDto
        {
            Nombre = "",
            Telefono = "123"
        };

        // Act & Assert
        Assert.Throws<ArgumentException>(() => service.Crear(dto));
    }

    [Fact]
    public void Crear_CodigoDuplicado_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Crear_CodigoDuplicado_LanzaExcepcion));
        ProveedorService service = CrearService(context);

        // Seed a proveedor
        context.Proveedores.Add(new Proveedor("DUP", "Proveedor Original"));
        context.SaveChanges();

        // Try to create another with same auto-generated code ("DUP" ← "Dup...")
        var dto = new CrearProveedorRequestDto { Nombre = "Dup" };

        // Act & Assert
        Assert.Throws<ProveedorCodigoDuplicadoException>(() => service.Crear(dto));
    }

    [Fact]
    public void ObtenerPorId_Existente_RetornaProveedor()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(ObtenerPorId_Existente_RetornaProveedor));
        ProveedorService service = CrearService(context);

        var proveedor = new Proveedor("ALPHA", "Distribuidora Alpha");
        context.Proveedores.Add(proveedor);
        context.SaveChanges();

        // Act
        var result = service.ObtenerPorId(proveedor.ID_PROVEEDOR);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Distribuidora Alpha", result.Nombre);
    }

    [Fact]
    public void ObtenerPorId_Inexistente_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(ObtenerPorId_Inexistente_LanzaExcepcion));
        ProveedorService service = CrearService(context);

        // Act & Assert
        Assert.Throws<ProveedorNoEncontradoException>(() => service.ObtenerPorId(999));
    }
}
