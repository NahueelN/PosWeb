using System.Net;
using System.Reflection;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PosWeb.Application.Licensing;
using PosWeb.Application.RemoteAccess;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Controllers;

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

    [Fact]
    public async Task StatusAsync_MissingLicense_ReturnsLicenseRequiredWithoutHttpCall()
    {
        var handler = new StubHttpMessageHandler(_ => throw new InvalidOperationException("HTTP should not be called"));
        var service = CreateService(ConfiguredValues(), handler, addLicense: false);

        var result = await service.StatusAsync();

        Assert.Equal(RemoteAccessResultKind.LicenseRequired, result.Kind);
        Assert.Equal("Se requiere una licencia activa para usar el acceso remoto", result.Error);
    }

    [Fact]
    public async Task StatusAsync_AllowTrialWithTrialRow_SendsSyntheticTrialIdentity()
    {
        HttpRequestMessage? sent = null;
        var service = CreateService(ConfiguredValues("true"), new StubHttpMessageHandler(request =>
        {
            sent = request;
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"status\":\"inactive\"}") };
        }), addLicense: false, trialMachineId: "trial-machine-id");

        var result = await service.StatusAsync();

        Assert.Equal(RemoteAccessResultKind.Success, result.Kind);
        var body = await sent!.Content!.ReadAsStringAsync();
        Assert.Contains("\"licenseKey\":\"trial:trial-machine-id\"", body);
        Assert.Contains("\"machineId\":\"trial-machine-id\"", body);
    }

    [Fact]
    public async Task StatusAsync_AllowTrialWithoutLicenciaConfig_ReturnsLicenseRequiredWithoutHttpCall()
    {
        var handler = new StubHttpMessageHandler(_ => throw new InvalidOperationException("HTTP should not be called"));
        var service = CreateService(ConfiguredValues("true"), handler, addLicense: false);

        var result = await service.StatusAsync();

        Assert.Equal(RemoteAccessResultKind.LicenseRequired, result.Kind);
    }

    [Fact]
    public async Task StatusAsync_InvalidAllowTrialValue_ReturnsLicenseRequiredWithoutHttpCall()
    {
        var handler = new StubHttpMessageHandler(_ => throw new InvalidOperationException("HTTP should not be called"));
        var service = CreateService(ConfiguredValues("invalid"), handler, addLicense: false, trialMachineId: "trial-machine-id");

        var result = await service.StatusAsync();

        Assert.Equal(RemoteAccessResultKind.LicenseRequired, result.Kind);
    }

    [Fact]
    public async Task StatusAsync_AllowTrialWithLicensedIdentity_PrefersLicensedIdentity()
    {
        HttpRequestMessage? sent = null;
        var service = CreateService(ConfiguredValues("true"), new StubHttpMessageHandler(request =>
        {
            sent = request;
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"status\":\"inactive\"}") };
        }));

        await service.StatusAsync();

        var body = await sent!.Content!.ReadAsStringAsync();
        Assert.Contains("\"licenseKey\":\"license-key\"", body);
        Assert.DoesNotContain("trial:", body);
    }

    [Fact]
    public async Task ObtenerTokenConectorAsync_AllowTrialWithTrialRow_UsesSyntheticTrialIdentity()
    {
        HttpRequestMessage? sent = null;
        var service = CreateService(ConfiguredValues("true"), new StubHttpMessageHandler(request =>
        {
            sent = request;
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("{\"token\":\"connector-token\"}") };
        }), addLicense: false, trialMachineId: "trial-machine-id");

        var result = await service.ObtenerTokenConectorAsync();

        Assert.True(result.IsSuccess);
        var body = await sent!.Content!.ReadAsStringAsync();
        Assert.Contains("\"licenseKey\":\"trial:trial-machine-id\"", body);
        Assert.Contains("\"machineId\":\"trial-machine-id\"", body);
    }

    [Fact]
    public void LicenseRequired_MapsToConflict()
    {
        var controller = new RemoteAccessController(null!);
        var method = typeof(RemoteAccessController).GetMethod("ToActionResult", BindingFlags.Instance | BindingFlags.NonPublic)!;

        var response = Assert.IsType<Microsoft.AspNetCore.Mvc.ConflictObjectResult>(method.Invoke(controller, [RemoteAccessResult.LicenseRequired()]));

        Assert.Equal(409, response.StatusCode);
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
    public async Task ActivateAsync_MapsInvalidLicenseError()
    {
        var service = CreateService(ConfiguredValues(), JsonHandler(HttpStatusCode.Forbidden, "{\"error\":\"Invalid license or device\"}"));

        var result = await service.ActivateAsync("tienda");

        Assert.Equal(RemoteAccessResultKind.WorkerError, result.Kind);
        Assert.Equal(403, result.StatusCode);
        Assert.Equal("La licencia o el dispositivo no permiten usar el acceso remoto", result.Error);
    }

    [Theory]
    [InlineData(HttpStatusCode.BadRequest, "Invalid request", "La solicitud de acceso remoto no es válida")]
    [InlineData(HttpStatusCode.Conflict, "Slug unavailable", "El subdominio elegido no está disponible")]
    [InlineData(HttpStatusCode.Conflict, "Deactivate first", "Primero desactivá el acceso remoto actual")]
    [InlineData(HttpStatusCode.ServiceUnavailable, "Licensing unavailable", "El servicio de licencias no está disponible")]
    public async Task ActivateAsync_MapsWorkerErrorsToSpanishUxText(HttpStatusCode statusCode, string workerError, string expectedError)
    {
        var service = CreateService(ConfiguredValues(), JsonHandler(statusCode, $"{{\"error\":\"{workerError}\"}}"));

        var result = await service.ActivateAsync("tienda");

        Assert.Equal(statusCode == HttpStatusCode.ServiceUnavailable ? RemoteAccessResultKind.Unavailable : RemoteAccessResultKind.WorkerError, result.Kind);
        Assert.Equal(expectedError, result.Error);
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

    private static RemoteAccessService CreateService(IReadOnlyDictionary<string, string?> values, HttpMessageHandler handler, IRemoteAccessConnector? connector = null, bool addLicense = true, string? trialMachineId = null)
    {
        var options = new DbContextOptionsBuilder<PosDbContextLocal>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var context = new PosDbContextLocal(options);
        var encryption = new EncryptionService(Convert.ToBase64String(Encoding.UTF8.GetBytes("PosWeb_TestEncryptionKey_1234567890!")));
        if (addLicense)
        {
            context.Set<LicenciaConfig>().Add(new LicenciaConfig
            {
                LicenseKey = encryption.Encrypt("license-key"),
                MachineId = "machine-id",
                Plan = NivelesSuscripcion.Maxima,
                Estado = EstadosLicencia.Activa
            });
        }
        else if (trialMachineId != null)
        {
            context.Set<LicenciaConfig>().Add(new LicenciaConfig { MachineId = trialMachineId });
        }
        context.SaveChanges();
        var config = new ConfigurationBuilder().AddInMemoryCollection(values).Build();
        return new RemoteAccessService(new LicenciaService(context, config, encryption), config, new HttpClient(handler), connector);
    }

    private static IReadOnlyDictionary<string, string?> ConfiguredValues(string? allowTrial = null)
    {
        var values = new Dictionary<string, string?>
        {
            ["RemoteAccess:WorkerUrl"] = "http://remote.test",
            ["RemoteAccess:InternalKey"] = "remote-key"
        };
        if (allowTrial != null)
            values["RemoteAccess:AllowTrial"] = allowTrial;
        return values;
    }

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
