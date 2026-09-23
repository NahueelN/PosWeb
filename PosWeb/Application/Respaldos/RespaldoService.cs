using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using PosWeb.Data;

namespace PosWeb.Application.Respaldos;

public sealed record RespaldoEmpresaInfo(string Nombre, string Documento, string Direccion);

public sealed class RespaldoService
{
    private const int MaxBackupBytes = 200 * 1024 * 1024;
    private readonly PosDbContextLocal _context;

    public RespaldoService(PosDbContextLocal context) => _context = context;

    public async Task<byte[]> ExportarAsync(CancellationToken cancellationToken = default)
    {
        var snapshotPath = Path.Combine(Path.GetTempPath(), $"posweb-export-{Guid.NewGuid():N}.db");

        try
        {
            CrearSnapshot(snapshotPath);
            SqliteConnection.ClearAllPools();
            var database = await File.ReadAllBytesAsync(snapshotPath, cancellationToken);
            if (database.Length > MaxBackupBytes)
                throw new InvalidOperationException("La base supera el tamaño máximo permitido para un respaldo.");

            return database;
        }
        finally
        {
            EliminarSiExiste(snapshotPath);
        }
    }

    public async Task<RespaldoEmpresaInfo> InspeccionarAsync(Stream archivo, long tamanio, CancellationToken cancellationToken = default)
    {
        var stagedPath = await GuardarYValidarAsync(archivo, tamanio, cancellationToken);
        try
        {
            return ValidarBaseSegura(stagedPath);
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            EliminarSiExiste(stagedPath);
        }
    }

    public async Task<RespaldoEmpresaInfo> RestaurarAsync(Stream archivo, long tamanio, CancellationToken cancellationToken = default)
    {
        var stagedPath = await GuardarYValidarAsync(archivo, tamanio, cancellationToken);
        var rollbackPath = $"{ObtenerRutaBase()}.restore-backup";

        try
        {
            var empresa = ValidarBaseSegura(stagedPath);
            _context.Database.CloseConnection();
            SqliteConnection.ClearAllPools();

            ReemplazarBase(stagedPath, ObtenerRutaBase(), rollbackPath);
            EliminarSiExiste(rollbackPath);
            return empresa;
        }
        finally
        {
            SqliteConnection.ClearAllPools();
            EliminarSiExiste(stagedPath);
        }
    }

    private void CrearSnapshot(string destinationPath)
    {
        using var source = new SqliteConnection($"Data Source={ObtenerRutaBase()};Mode=ReadOnly");
        using var destination = new SqliteConnection($"Data Source={destinationPath}");
        source.Open();
        destination.Open();
        source.BackupDatabase(destination);
    }

    private async Task<string> GuardarYValidarAsync(Stream archivo, long tamanio, CancellationToken cancellationToken)
    {
        if (tamanio <= 0 || tamanio > MaxBackupBytes)
            throw new InvalidOperationException("El archivo de respaldo tiene un tamaño inválido.");

        var stagedPath = Path.Combine(Path.GetDirectoryName(ObtenerRutaBase())!, $"posweb-restore-{Guid.NewGuid():N}.db");
        try
        {
            await using var output = File.Create(stagedPath);
            await archivo.CopyToAsync(output, cancellationToken);
            return stagedPath;
        }
        catch
        {
            EliminarSiExiste(stagedPath);
            throw;
        }
    }

    private RespaldoEmpresaInfo ValidarBase(string databasePath)
    {
        using var connection = new SqliteConnection($"Data Source={databasePath};Mode=ReadOnly");
        connection.Open();

        using var integrity = connection.CreateCommand();
        integrity.CommandText = "PRAGMA integrity_check";
        if (!string.Equals(integrity.ExecuteScalar()?.ToString(), "ok", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("El respaldo contiene una base de datos corrupta.");

        using var tables = connection.CreateCommand();
        tables.CommandText = "SELECT name FROM sqlite_master WHERE type = 'table'";
        using var reader = tables.ExecuteReader();
        var names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        while (reader.Read()) names.Add(reader.GetString(0));
        reader.Close();

        string[] requiredTables = ["EMPRESA", "USUARIO", "SUCURSAL", "PRODUCTO", "VENTA"];
        if (requiredTables.Any(table => !names.Contains(table)))
            throw new InvalidOperationException("El archivo no es un respaldo compatible de PosWeb.");

        using var empresa = connection.CreateCommand();
        empresa.CommandText = "SELECT NOMBRE, DOCUMENTO, DIRECCION FROM EMPRESA LIMIT 1";
        using var empresaReader = empresa.ExecuteReader();
        if (!empresaReader.Read() || string.IsNullOrWhiteSpace(empresaReader.GetString(0)))
            throw new InvalidOperationException("El respaldo no contiene una empresa válida.");

        return new RespaldoEmpresaInfo(
            empresaReader.GetString(0),
            empresaReader.IsDBNull(1) ? string.Empty : empresaReader.GetString(1),
            empresaReader.IsDBNull(2) ? string.Empty : empresaReader.GetString(2));
    }

    private RespaldoEmpresaInfo ValidarBaseSegura(string databasePath)
    {
        try
        {
            return ValidarBase(databasePath);
        }
        catch (SqliteException)
        {
            throw new InvalidOperationException("El archivo no es un respaldo válido de PosWeb.");
        }
    }

    private string ObtenerRutaBase()
    {
        var connection = (SqliteConnection)_context.Database.GetDbConnection();
        return Path.GetFullPath(connection.DataSource);
    }

    private static void ReemplazarBase(string stagedPath, string databasePath, string rollbackPath)
    {
        const int maxAttempts = 10;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                // Both files live on the same volume, so replace is atomic and keeps a rollback copy until it succeeds.
                File.Replace(stagedPath, databasePath, rollbackPath, ignoreMetadataErrors: true);
                return;
            }
            catch (IOException) when (attempt < maxAttempts)
            {
                SqliteConnection.ClearAllPools();
                Thread.Sleep(250);
            }
            catch (IOException)
            {
                throw new InvalidOperationException("La base está ocupada. Esperá unos segundos y volvé a restaurar; no es necesario recompilar.");
            }
        }

        throw new InvalidOperationException("No se pudo reemplazar la base de datos.");
    }

    private static void EliminarSiExiste(string path)
    {
        if (File.Exists(path)) File.Delete(path);
    }
}
