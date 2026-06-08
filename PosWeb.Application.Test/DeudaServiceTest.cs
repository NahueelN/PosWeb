using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Deudas;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;
using Xunit;

namespace PosWeb.Application.Test;

public class DeudaServiceTest
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

    private static DeudaService CrearService(PosDbContext context)
    {
        return new DeudaService(context);
    }

    [Fact]
    public async Task Listar_SinFiltro_RetornaTodas()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Listar_SinFiltro_RetornaTodas));
        DeudaService service = CrearService(context);

        Proveedor prov = new Proveedor("P001", "Proveedor Uno");
        context.Proveedor.Add(prov);
        context.SaveChanges();

        context.Deuda.Add(new Deuda(1000, idProveedor: prov.ID_PROVEEDOR));
        context.Deuda.Add(new Deuda(2000, idProveedor: prov.ID_PROVEEDOR));
        context.SaveChanges();

        // Act
        var result = await service.ListarAsync();

        // Assert
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task Listar_ConProveedorId_RetornaSoloDeEseProveedor()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Listar_ConProveedorId_RetornaSoloDeEseProveedor));
        DeudaService service = CrearService(context);

        Proveedor p1 = new Proveedor("P001", "Proveedor Uno");
        Proveedor p2 = new Proveedor("P002", "Proveedor Dos");
        context.Proveedor.Add(p1);
        context.Proveedor.Add(p2);
        context.SaveChanges();

        context.Deuda.Add(new Deuda(1000, idProveedor: p1.ID_PROVEEDOR));
        context.Deuda.Add(new Deuda(2000, idProveedor: p2.ID_PROVEEDOR));
        context.SaveChanges();

        // Act
        var result = await service.ListarAsync(proveedorId: p1.ID_PROVEEDOR);

        // Assert
        Assert.Single(result);
        Assert.Equal(1000, result[0].Monto);
        Assert.Equal("Proveedor Uno", result[0].ProveedorNombre);
    }

    [Fact]
    public async Task Listar_SoloPendientes_RetornaSoloNoPagadas()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Listar_SoloPendientes_RetornaSoloNoPagadas));
        DeudaService service = CrearService(context);

        Proveedor prov = new Proveedor("P001", "Proveedor Uno");
        context.Proveedor.Add(prov);
        context.SaveChanges();

        Deuda d1 = new Deuda(1000, idProveedor: prov.ID_PROVEEDOR);
        Deuda d2 = new Deuda(2000, idProveedor: prov.ID_PROVEEDOR);
        d2.RegistrarPago();
        context.Deuda.Add(d1);
        context.Deuda.Add(d2);
        context.SaveChanges();

        // Act
        var result = await service.ListarAsync(soloPendientes: true);

        // Assert
        Assert.Single(result);
        Assert.False(result[0].Pago);
    }

    [Fact]
    public async Task ObtenerPorId_Existente_RetornaDeuda()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(ObtenerPorId_Existente_RetornaDeuda));
        DeudaService service = CrearService(context);

        Proveedor prov = new Proveedor("P001", "Proveedor Uno");
        context.Proveedor.Add(prov);
        context.SaveChanges();

        Deuda deuda = new Deuda(1500, idProveedor: prov.ID_PROVEEDOR);
        context.Deuda.Add(deuda);
        context.SaveChanges();

        // Act
        var result = await service.ObtenerPorIdAsync(deuda.ID_DEUDA);

        // Assert
        Assert.Equal(1500, result.Monto);
        Assert.Equal("Proveedor Uno", result.ProveedorNombre);
    }

    [Fact]
    public async Task ObtenerPorId_NoExistente_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(ObtenerPorId_NoExistente_LanzaExcepcion));
        DeudaService service = CrearService(context);

        // Act & Assert
        await Assert.ThrowsAsync<DeudaNoEncontradaException>(
            () => service.ObtenerPorIdAsync(999));
    }

    [Fact]
    public async Task RegistrarPago_DeudaPendiente_MarcaComoPagada()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(RegistrarPago_DeudaPendiente_MarcaComoPagada));
        DeudaService service = CrearService(context);

        Proveedor prov = new Proveedor("P001", "Proveedor Uno");
        context.Proveedor.Add(prov);
        context.SaveChanges();

        Deuda deuda = new Deuda(1000, idProveedor: prov.ID_PROVEEDOR);
        context.Deuda.Add(deuda);
        context.SaveChanges();

        // Act
        var result = await service.RegistrarPagoAsync(deuda.ID_DEUDA);

        // Assert
        Assert.True(result.Pago);
        Assert.NotNull(result.FechaPago);

        // Verify persisted
        Deuda? persisted = await context.Deuda.FindAsync(deuda.ID_DEUDA);
        Assert.True(persisted!.PAGO);
        Assert.NotNull(persisted.FECHA_PAGO);
    }

    [Fact]
    public async Task RegistrarPago_DeudaYaPagada_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(RegistrarPago_DeudaYaPagada_LanzaExcepcion));
        DeudaService service = CrearService(context);

        Proveedor prov = new Proveedor("P001", "Proveedor Uno");
        context.Proveedor.Add(prov);
        context.SaveChanges();

        Deuda deuda = new Deuda(1000, idProveedor: prov.ID_PROVEEDOR);
        deuda.RegistrarPago();
        context.Deuda.Add(deuda);
        context.SaveChanges();

        // Act & Assert
        await Assert.ThrowsAsync<DeudaYaPagadaException>(
            () => service.RegistrarPagoAsync(deuda.ID_DEUDA));
    }

    [Fact]
    public async Task RegistrarPago_NoExistente_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(RegistrarPago_NoExistente_LanzaExcepcion));
        DeudaService service = CrearService(context);

        // Act & Assert
        await Assert.ThrowsAsync<DeudaNoEncontradaException>(
            () => service.RegistrarPagoAsync(999));
    }

    [Fact]
    public void CrearDeuda_CreaConValoresCorrectos()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearDeuda_CreaConValoresCorrectos));
        DeudaService service = CrearService(context);

        Proveedor prov = new Proveedor("P001", "Proveedor Uno");
        context.Proveedor.Add(prov);
        context.SaveChanges();

        // Act
        service.CrearDeuda(prov.ID_PROVEEDOR, 42, 5000);
        context.SaveChanges();

        // Assert
        Deuda? deuda = context.Deuda.FirstOrDefault();
        Assert.NotNull(deuda);
        Assert.Equal(prov.ID_PROVEEDOR, deuda!.ID_PROVEEDOR);
        Assert.Equal(42, deuda.ID_COMPRA);
        Assert.Equal(5000, deuda.MONTO_DEUDA);
        Assert.False(deuda.PAGO);
    }
}
