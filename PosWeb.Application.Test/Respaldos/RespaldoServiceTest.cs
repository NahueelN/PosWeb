using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;
using PosWeb.Application.Respaldos;
using PosWeb.Data;

namespace PosWeb.Application.Test.Respaldos;

public class RespaldoServiceTest : IDisposable
{
    private readonly string _directory = Path.Combine(Path.GetTempPath(), $"posweb-tests-{Guid.NewGuid():N}");

    [Fact]
    public async Task ExportarYRestaurar_ReemplazaLaBaseCompleta()
    {
        Directory.CreateDirectory(_directory);
        var sourcePath = Path.Combine(_directory, "source.db");
        var targetPath = Path.Combine(_directory, "target.db");

        using (var source = CrearContexto(sourcePath))
        {
            PrepararBase(source, "Empresa respaldada");
            var backup = await new RespaldoService(source).ExportarAsync();

            using var target = CrearContexto(targetPath);
            PrepararBase(target, "Empresa anterior");
            var inspection = await new RespaldoService(target).InspeccionarAsync(
                new MemoryStream(backup), backup.Length);
            var restoredCompany = await new RespaldoService(target).RestaurarAsync(
                new MemoryStream(backup), backup.Length);

            Assert.Equal("Empresa respaldada", inspection.Nombre);
            Assert.Equal("Empresa respaldada", restoredCompany.Nombre);
        }

        using var restored = CrearContexto(targetPath, migrate: false);
        Assert.Equal("Empresa respaldada", restored.Empresa.Single().NOMBRE);
    }

    [Fact]
    public async Task Restaurar_ArchivoCorrupto_NoModificaLaBaseActual()
    {
        Directory.CreateDirectory(_directory);
        var sourcePath = Path.Combine(_directory, "source.db");
        var targetPath = Path.Combine(_directory, "target.db");
        using (var source = CrearContexto(sourcePath))
        {
            PrepararBase(source, "Empresa respaldada");
        }

        using (var target = CrearContexto(targetPath))
        {
            PrepararBase(target, "Empresa actual");
            var corrupt = new byte[] { 1, 2, 3, 4 };
            await Assert.ThrowsAsync<InvalidOperationException>(() => new RespaldoService(target).RestaurarAsync(
                new MemoryStream(corrupt), corrupt.Length));
        }

        using var unchanged = CrearContexto(targetPath, migrate: false);
        Assert.Equal("Empresa actual", unchanged.Empresa.Single().NOMBRE);
    }

    private static PosDbContextLocal CrearContexto(string databasePath, bool migrate = true)
    {
        var options = new DbContextOptionsBuilder<PosDbContextLocal>()
            .UseSqlite($"Data Source={databasePath}")
            .Options;
        var context = new PosDbContextLocal(options);
        if (migrate) context.Database.Migrate();
        return context;
    }

    private static void PrepararBase(PosDbContextLocal context, string empresaNombre)
    {
        context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = OFF;");
        context.Database.ExecuteSqlRaw("DELETE FROM EMPRESA;");
        context.Database.ExecuteSqlRaw(
            "INSERT INTO EMPRESA (NOMBRE, DOCUMENTO, DIRECCION, TELEFONO, MOSTRAR_TELEFONO_TICKET, ID_SUSCRIPCION) VALUES ({0}, '00000000000', '', '', 0, 1);",
            empresaNombre);
        context.Database.ExecuteSqlRaw("PRAGMA foreign_keys = ON;");
        context.Database.CloseConnection();
    }

    public void Dispose()
    {
        SqliteConnection.ClearAllPools();
        if (Directory.Exists(_directory)) Directory.Delete(_directory, recursive: true);
    }
}
