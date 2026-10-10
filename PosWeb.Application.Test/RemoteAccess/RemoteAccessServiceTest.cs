using System.Net;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PosWeb.Application.Licensing;
using PosWeb.Application.RemoteAccess;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Test.RemoteAccess;

public class RemoteAccessServiceTest
{
    [Fact]
    public void EmbeddedDefaults_AreOverriddenByPublishedSettings()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["RemoteAccess:WorkerUrl"] = "https://published.test"
            });
        EmbeddedConfigurationDefaults.AddJsonDefaults(configuration, "{\"RemoteAccess\":{\"WorkerUrl\":\"https://embedded.test\"}}");

        Assert.Equal("https://published.test", configuration.Build()["RemoteAccess:WorkerUrl"]);
    }

    [Fact]
    public void EmbeddedDefaults_AreOverriddenByEnvironmentVariables()
    {
        const string environmentVariable = "POSWEB_REMOTE_ACCESS_TEST__RemoteAccess__WorkerUrl";
        var previousValue = Environment.GetEnvironmentVariable(environmentVariable);
        Environment.SetEnvironmentVariable(environmentVariable, "https://environment.test");

        try
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["RemoteAccess:WorkerUrl"] = "https://published.test"
                });
            EmbeddedConfigurationDefaults.AddJsonDefaults(configuration, "{\"RemoteAccess\":{\"WorkerUrl\":\"https://embedded.test\"}}");
            configuration.AddEnvironmentVariables("POSWEB_REMOTE_ACCESS_TEST__");

            Assert.Equal("https://environment.test", configuration.Build()["RemoteAccess:WorkerUrl"]);
        }
        finally
        {
            Environment.SetEnvironmentVariable(environmentVariable, previousValue);
        }
    }

    [Fact]
    public async Task StatusAsync_MissingConfiguration_ReturnsNotConfiguredWithoutHttpCall()
    {
        var handler = new StubHttpMessageHandler(_ => throw new InvalidOperationException("HTTP should not be called"));
        var service = CreateService(new Dictionary<string, string?>(), handler);

        var result = await service.StatusAsync();

        Assert.Equal(RemoteAccessResultKind.NotConfigured, result.Kind);
    }

    [Theory]
    [InlineData("inactive")]
    [InlineData("provisioning")]
    [InlineData("waiting_connector")]
    [InlineData("active")]
    [InlineData("failed")]
    public async Task StatusAsync_MapsWorkerStatuses(string status)
    {
        var service = CreateService(ConfiguredValues(), JsonHandler(HttpStatusCode.OK,
            $"{{\"status\":\"{status}\",\"slug\":\"tienda\",\"hostname\":\"tienda.vendetoweb.com.ar\",\"lastError\":\"fallo\",\"connector\":{{\"state\":\"running\"}}}}"));

        var result = await service.StatusAsync();

        Assert.Equal(RemoteAccessResultKind.Success, result.Kind);
        Assert.Equal(status, result.Status!.Status);
        Assert.Equal("tienda", result.Status.Slug);
        Assert.Equal("running", result.Status.Connector!.State);
    }

    [Fact]
    public async Task ActivateAsync_PassesThroughWorkerValidationError()
    {
        var service = CreateService(ConfiguredValues(), JsonHandler(HttpStatusCode.Forbidden, "{\"error\":\"Licencia inválida\"}"));

        var result = await service.ActivateAsync("tienda");

        Assert.Equal(RemoteAccessResultKind.WorkerError, result.Kind);
        Assert.Equal(403, result.StatusCode);
        Assert.Equal("Licencia inválida", result.Error);
    }

    [Fact]
    public async Task StatusAsync_Timeout_ReturnsUnavailable()
    {
        var service = CreateService(ConfiguredValues(), new StubHttpMessageHandler(_ => throw new TaskCanceledException()));

        var result = await service.StatusAsync();

        Assert.Equal(RemoteAccessResultKind.Unavailable, result.Kind);
    }

    [Fact]
    public async Task StatusAsync_NonJsonGatewayError_ReturnsUnavailable()
    {
        var service = CreateService(ConfiguredValues(), new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.BadGateway)
        {
            Content = new StringContent("upstream unavailable", Encoding.UTF8, "text/plain")
        }));

        var result = await service.StatusAsync();

        Assert.Equal(RemoteAccessResultKind.Unavailable, result.Kind);
    }

    [Fact]
    public async Task ActivateAsync_NormalizesSlugAndSendsLicenseIdentityAndBearerKey()
    {
        HttpRequestMessage? sent = null;
        var service = CreateService(ConfiguredValues(), new StubHttpMessageHandler(request =>
        {
            sent = request;
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"status\":\"provisioning\"}") };
        }));

        await service.ActivateAsync(" TiEnDa Norte ");

        Assert.NotNull(sent);
        Assert.Equal("Bearer", sent!.Headers.Authorization!.Scheme);
        Assert.Equal("remote-key", sent.Headers.Authorization.Parameter);
        Assert.Equal("http://remote.test/activate", sent.RequestUri!.ToString());
        var body = await sent.Content!.ReadAsStringAsync();
        Assert.Contains("\"licenseKey\":\"license-key\"", body);
        Assert.Contains("\"machineId\":\"machine-id\"", body);
        Assert.Contains("\"slug\":\"tienda norte\"", body);
    }

    [Fact]
    public async Task DeactivateAsync_StopsConnectorBeforeCallingWorker()
    {
        var connector = new FakeRemoteAccessConnector();
        var service = CreateService(ConfiguredValues(), JsonHandler(HttpStatusCode.NoContent, ""), connector);

        var result = await service.DeactivateAsync();

        Assert.Equal(RemoteAccessResultKind.Success, result.Kind);
        Assert.Equal(1, connector.StopCount);
    }

    [Fact]
    public async Task DeactivateAsync_WhenWorkerCleanupFails_RestartsConnector()
    {
        var connector = new FakeRemoteAccessConnector();
        var service = CreateService(ConfiguredValues(), JsonHandler(HttpStatusCode.BadGateway, ""), connector);

        var result = await service.DeactivateAsync();

        Assert.Equal(RemoteAccessResultKind.Unavailable, result.Kind);
        Assert.Equal(1, connector.StopCount);
        Assert.Equal(1, connector.StartCount);
    }

    private static RemoteAccessService CreateService(IReadOnlyDictionary<string, string?> values, HttpMessageHandler handler, IRemoteAccessConnector? connector = null)
    {
        var options = new DbContextOptionsBuilder<PosDbContextLocal>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var context = new PosDbContextLocal(options);
        var encryption = new EncryptionService(Convert.ToBase64String(Encoding.UTF8.GetBytes("PosWeb_TestEncryptionKey_1234567890!")));
        context.Set<LicenciaConfig>().Add(new LicenciaConfig
        {
            LicenseKey = encryption.Encrypt("license-key"),
            MachineId = "machine-id",
            Plan = NivelesSuscripcion.Maxima,
            Estado = EstadosLicencia.Activa
        });
        context.SaveChanges();
        var config = new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        return new RemoteAccessService(new LicenciaService(context, config, encryption), config, new HttpClient(handler), connector);
    }

    private static IReadOnlyDictionary<string, string?> ConfiguredValues() => new Dictionary<string, string?>
    {
        ["RemoteAccess:WorkerUrl"] = "http://remote.test",
        ["RemoteAccess:InternalKey"] = "remote-key"
    };

    private static HttpMessageHandler JsonHandler(HttpStatusCode statusCode, string json) =>
        new StubHttpMessageHandler(_ => new HttpResponseMessage(statusCode) { Content = new StringContent(json, Encoding.UTF8, "application/json") });

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> send) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) => Task.FromResult(send(request));
    }

    private sealed class FakeRemoteAccessConnector : IRemoteAccessConnector
    {
        public int StopCount { get; private set; }
        public int StartCount { get; private set; }
        public RemoteAccessConnectorDto State { get; } = new();
        public Task StartAsync(CancellationToken cancellationToken = default) { StartCount++; return Task.CompletedTask; }
        public Task StopAsync(CancellationToken cancellationToken = default) { StopCount++; return Task.CompletedTask; }
    }
}
