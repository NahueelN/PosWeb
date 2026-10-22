using System.Text;
using Microsoft.Extensions.Logging;
using PosWeb.Application.Auth;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Soporte;

/// <summary>
/// Reportes de problema desde la app: resuelve el email del titular, adjunta los logs
/// recientes de la aplicación y los envía a soporte vía el mailer-worker.
/// </summary>
public class SoporteService
{
    private const int MaxArchivosLog = 2;
    private const int MaxBytesPorArchivo = 256 * 1024;

    private readonly PosDbContextLocal _context;
    private readonly MailerService _mailer;
    private readonly ILogger<SoporteService> _logger;

    public SoporteService(PosDbContextLocal context, MailerService mailer, ILogger<SoporteService> logger)
    {
        _context = context;
        _mailer = mailer;
        _logger = logger;
    }

    public async Task<bool> ReportarProblema(string descripcion, int? idUsuarioReporta, string? version)
    {
        var titularEmail = ObtenerEmailTitular();
        if (string.IsNullOrWhiteSpace(titularEmail))
            _logger.LogWarning("SoporteService: no se pudo resolver el email del titular para el reporte");

        var reportadoPor = ObtenerDescripcionUsuario(idUsuarioReporta);
        var (logContenido, logNombre) = LeerLogsRecientes();

        if (logContenido == null)
            _logger.LogWarning("SoporteService: no se encontraron logs para adjuntar al reporte");

        return await _mailer.EnviarReporte(titularEmail, reportadoPor, descripcion, version, logNombre, logContenido);
    }

    /// <summary>
    /// Email del usuario titular (ES_TITULAR, o el admin de menor ID como dato legado).
    /// Fallback: el email con el que se activó la licencia.
    /// </summary>
    private string? ObtenerEmailTitular()
    {
        var titular = _context.Usuario.FirstOrDefault(u => u.ROL == Roles.Admin && u.ES_TITULAR)
            ?? _context.Usuario.Where(u => u.ROL == Roles.Admin).OrderBy(u => u.ID_USUARIO).FirstOrDefault();

        return titular?.MAIL ?? _context.Set<LicenciaConfig>().FirstOrDefault()?.Email;
    }

    private string ObtenerDescripcionUsuario(int? idUsuario)
    {
        if (idUsuario == null)
            return "desconocido";

        var usuario = _context.Usuario.Find(idUsuario.Value);
        if (usuario == null)
            return "desconocido";

        return string.IsNullOrWhiteSpace(usuario.MAIL)
            ? usuario.NOMBRE_USUARIO
            : $"{usuario.NOMBRE_USUARIO} ({usuario.MAIL})";
    }

    /// <summary>
    /// Junta la cola de los logs más recientes (hasta 2 archivos diarios, 256 KB cada uno).
    /// Serilog mantiene el archivo abierto: se lee con FileShare.ReadWrite.
    /// </summary>
    internal (byte[]? contenido, string? nombre) LeerLogsRecientes()
    {
        try
        {
            var dir = Path.Combine(AppContext.BaseDirectory, "logs");
            if (!Directory.Exists(dir))
                return (null, null);

            var archivos = new DirectoryInfo(dir)
                .GetFiles("posweb-*.txt")
                .OrderByDescending(f => f.Name)
                .Take(MaxArchivosLog)
                .ToList();
            if (archivos.Count == 0)
                return (null, null);

            var sb = new StringBuilder();
            foreach (var archivo in archivos)
            {
                sb.AppendLine($"=== {archivo.Name} (últimos {MaxBytesPorArchivo / 1024} KB) ===");
                sb.AppendLine(LeerCola(archivo.FullName, MaxBytesPorArchivo));
                sb.AppendLine();
            }

            var nombre = $"posweb-logs-{DateTime.Now:yyyyMMdd-HHmm}.txt";
            return (Encoding.UTF8.GetBytes(sb.ToString()), nombre);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SoporteService: no se pudieron leer los logs para el reporte");
            return (null, null);
        }
    }

    private static string LeerCola(string path, int maxBytes)
    {
        using var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
        var start = Math.Max(0, fs.Length - maxBytes);
        fs.Seek(start, SeekOrigin.Begin);
        using var reader = new StreamReader(fs, Encoding.UTF8);
        var contenido = reader.ReadToEnd();

        if (start > 0)
        {
            // La cola puede arrancar a mitad de línea: se descarta esa línea parcial.
            var idx = contenido.IndexOf('\n');
            if (idx >= 0)
                contenido = contenido[(idx + 1)..];
        }

        return contenido;
    }
}
