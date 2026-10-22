using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using PosWeb.Application.Auth;
using PosWeb.Application.Soporte;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Test;

public class SoporteServiceTest
{
    private const string ArchivoLog = "posweb-99991231.txt";

    [Fact]
    public async Task ReportarProblema_IncluyeEmailTitularYAdjuntaLogs()
    {
        var handler = new CapturingHandler();
        var context = CrearContexto(nameof(ReportarProblema_IncluyeEmailTitularYAdjuntaLogs));
        var titular = new Usuario("titular", BCrypt.Net.BCrypt.HashPassword("123456"), Roles.Admin, "titular@example.com", esTitular: true);
        context.Usuario.Add(titular);
        var vendedor = new Usuario("vendedor", BCrypt.Net.BCrypt.HashPassword("123456"), Roles.UsuarioComun, "vendedor@example.com");
        context.Usuario.Add(vendedor);
        context.SaveChanges();

        var service = new SoporteService(context, CrearMailer(handler), NullLogger<SoporteService>.Instance);

        var logPath = Path.Combine(AppContext.BaseDirectory, "logs", ArchivoLog);
        Directory.CreateDirectory(Path.GetDirectoryName(logPath)!);
        await File.WriteAllTextAsync(logPath, "linea-vieja\nlinea-reciente-marcador\n");

        try
        {
            var enviado = await service.ReportarProblema("El QR de MercadoPago no se genera", vendedor.ID_USUARIO, "1.1.26");

            Assert.True(enviado);
            Assert.Equal("https://mailer.example.test/send-report", handler.Request!.RequestUri!.ToString());

            var body = JsonDocument.Parse(await handler.Request.Content!.ReadAsStringAsync()).RootElement;
            Assert.Equal("titular@example.com", body.GetProperty("titular_email").GetString());
            Assert.Contains("vendedor", body.GetProperty("reportado_por").GetString());
            Assert.Equal("El QR de MercadoPago no se genera", body.GetProperty("descripcion").GetString());
            Assert.Equal("1.1.26", body.GetProperty("version").GetString());

            var attachment = body.GetProperty("attachment");
            Assert.StartsWith("posweb-logs-", attachment.GetProperty("name").GetString());
            var contenido = Encoding.UTF8.GetString(Convert.FromBase64String(attachment.GetProperty("content").GetString()!));
            Assert.Contains("linea-reciente-marcador", contenido);
        }
        finally
        {
            File.Delete(logPath);
        }
    }

    [Fact]
    public async Task ReportarProblema_SinUsuarioTitular_UsaEmailDeLaLicencia()
    {
        var handler = new CapturingHandler();
        var context = CrearContexto(nameof(ReportarProblema_SinUsuarioTitular_UsaEmailDeLaLicencia));
        context.Set<LicenciaConfig>().Add(new LicenciaConfig { LicenseKey = "test-key", Email = "licencia@example.com" });
        context.SaveChanges();

        var service = new SoporteService(context, CrearMailer(handler), NullLogger<SoporteService>.Instance);

        var enviado = await service.ReportarProblema("La impresora no imprime los tickets", null, null);

        Assert.True(enviado);
        var body = JsonDocument.Parse(await handler.Request!.Content!.ReadAsStringAsync()).RootElement;
        Assert.Equal("licencia@example.com", body.GetProperty("titular_email").GetString());
        Assert.Equal("desconocido", body.GetProperty("reportado_por").GetString());
    }

    private static PosDbContextLocal CrearContexto(string dbName)
    {
        var options = new DbContextOptionsBuilder<PosDbContextLocal>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new PosDbContextLocal(options);
    }

    private static MailerService CrearMailer(HttpMessageHandler handler)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Mailer:WorkerUrl"] = "https://mailer.example.test",
                ["Mailer:InternalKey"] = "test-key"
            })
            .Build();

        return new MailerService(configuration, NullLogger<MailerService>.Instance, new HttpClient(handler));
    }

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Request = request;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }
    }
}
