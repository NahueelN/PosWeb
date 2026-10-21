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
