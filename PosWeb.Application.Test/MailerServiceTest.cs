using System.Net;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using PosWeb.Application.Auth;

namespace PosWeb.Application.Test;

public class MailerServiceTest
{
    [Fact]
    public async Task EnviarCodigo_UsaContratoSinHtml()
    {
        var handler = new CapturingHandler();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Mailer:WorkerUrl"] = "https://mailer.example.test",
                ["Mailer:InternalKey"] = "test-key"
            })
            .Build();
        var service = new MailerService(configuration, NullLogger<MailerService>.Instance, new HttpClient(handler));

        var enviado = await service.EnviarCodigo("customer@example.com", "confirm", "123456");

        Assert.True(enviado);
        Assert.Equal("https://mailer.example.test/send-code", handler.Request!.RequestUri!.ToString());
        var body = await handler.Request.Content!.ReadAsStringAsync();
        Assert.Contains("\"to\":\"customer@example.com\"", body);
        Assert.Contains("\"kind\":\"confirm\"", body);
        Assert.Contains("\"code\":\"123456\"", body);
        Assert.DoesNotContain("html", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task EnviarReporte_UsaContratoConAdjunto()
    {
        var handler = new CapturingHandler();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Mailer:WorkerUrl"] = "https://mailer.example.test",
                ["Mailer:InternalKey"] = "test-key"
            })
            .Build();
        var service = new MailerService(configuration, NullLogger<MailerService>.Instance, new HttpClient(handler));

        var logs = Encoding.UTF8.GetBytes("linea de log reciente");
        var enviado = await service.EnviarReporte(
            "titular@example.com",
            "vendedor (vendedor@example.com)",
            "El QR de MercadoPago no se genera",
            "1.1.26",
            "posweb-logs-20261021-1200.txt",
            logs);

        Assert.True(enviado);
        Assert.Equal("https://mailer.example.test/send-report", handler.Request!.RequestUri!.ToString());
        var body = await handler.Request.Content!.ReadAsStringAsync();
        Assert.Contains("\"titular_email\":\"titular@example.com\"", body);
        Assert.Contains("\"reportado_por\":\"vendedor (vendedor@example.com)\"", body);
        Assert.Contains("\"descripcion\":\"El QR de MercadoPago no se genera\"", body);
        Assert.Contains("\"version\":\"1.1.26\"", body);
        Assert.Contains("\"attachment\":{", body);
        Assert.Contains("\"name\":\"posweb-logs-20261021-1200.txt\"", body);
        Assert.Contains(Convert.ToBase64String(logs), body);
    }

    [Fact]
    public async Task EnviarReporte_SinWorkerConfigurado_DevuelveFalse()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        var service = new MailerService(configuration, NullLogger<MailerService>.Instance, new HttpClient());

        var enviado = await service.EnviarReporte("titular@example.com", "vendedor", "descripcion larga", null, null, null);

        Assert.False(enviado);
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
