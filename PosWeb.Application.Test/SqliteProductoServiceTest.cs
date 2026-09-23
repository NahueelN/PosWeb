using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Text;
using PosWeb.Application.Licensing;
using PosWeb.Application.Productos;
using PosWeb.Data;
using PosWeb.Testing;
using Xunit;

namespace PosWeb.Application.Test;

public class SqliteProductoServiceTest
{
    [Fact]
    public void BuscarPorNombre_SumStock_SqliteReal()
    {
        var conn = new SqliteConnection("Data Source=:memory:");
        conn.Open();
        var options = new DbContextOptionsBuilder<PosDbContextLocal>()
            .UseSqlite(conn)
            .Options;

        using (var ctx = new PosDbContextLocal(options))
        {
            ctx.Database.Migrate();

            // Deshabilitar FK checks: el test solo valida la traducción de la query,
            // no la integridad del grafo de entidades completo.
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "PRAGMA foreign_keys = OFF;";
                cmd.ExecuteNonQuery();
            }

            var empresa = new PosWeb.Domain.Empresa("Mi Empresa", "20111111111", 1);
            ctx.Empresa.Add(empresa);
            ctx.SaveChanges();

            var producto = new PosWeb.Domain.Producto("7791234567890", "7791234567890", "Coca Cola", 100m, 80m);
            TestHelpers.SetId(producto, 1, "ID_PRODUCTO");
            ctx.Producto.Add(producto);

            var s1 = new PosWeb.Domain.Sucursal("COD1", "Sucursal 1", empresa.ID_EMPRESA);
            TestHelpers.SetId(s1, 1, "ID_SUCURSAL");
            var s2 = new PosWeb.Domain.Sucursal("COD2", "Sucursal 2", empresa.ID_EMPRESA);
            TestHelpers.SetId(s2, 2, "ID_SUCURSAL");
            ctx.Sucursal.AddRange(s1, s2);

            ctx.StockSucursal.Add(new PosWeb.Domain.StockSucursal(1, 1, 48m));
            ctx.StockSucursal.Add(new PosWeb.Domain.StockSucursal(1, 2, 12m));
            ctx.SaveChanges();
        }

        using (var ctx = new PosDbContextLocal(options))
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>())
                .Build();
            var base64Key = Convert.ToBase64String(Encoding.UTF8.GetBytes("PosWeb_TestEncryptionKey_1234567890!"));
            var encryption = new EncryptionService(base64Key);
            var licenciaService = new LicenciaService(ctx, configuration, encryption);

            var service = new ProductoService(ctx, licenciaService);
            var resultado = service.BuscarPorNombre("Coca");
            var dto = Assert.Single(resultado);
            Assert.Equal(60m, dto.Stock);
        }

        conn.Dispose();
    }
}