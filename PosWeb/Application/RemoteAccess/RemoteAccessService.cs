using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using PosWeb.Application.Licensing;

namespace PosWeb.Application.RemoteAccess;

public class RemoteAccessService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private readonly LicenciaService _licensing;
    private readonly HttpClient _http;
    private readonly string? _url;
    private readonly string? _key;
    private readonly IRemoteAccessConnector? _connector;

    public RemoteAccessService(LicenciaService licensing, IConfiguration config, HttpClient http, IRemoteAccessConnector? connector = null)
    {
        _licensing = licensing;
        _http = http;
        _url = config["RemoteAccess:WorkerUrl"];
        _key = config["RemoteAccess:InternalKey"];
        _connector = connector;
    }

    public async Task<RemoteAccessResult> ActivateAsync(string slug, CancellationToken cancellationToken = default)
    {
        var result = await SendAsync("/activate", slug.Trim().ToLowerInvariant(), cancellationToken);
        if (result.Kind == RemoteAccessResultKind.Success && _connector != null)
            await _connector.StartAsync(cancellationToken);
        return result;
    }

    public Task<RemoteAccessResult> StatusAsync(CancellationToken cancellationToken = default) =>
        SendAsync("/status", null, cancellationToken);

    public async Task<RemoteAccessResult> DeactivateAsync(CancellationToken cancellationToken = default)
    {
        if (!IsConfigured()) return RemoteAccessResult.NotConfigured();
        if (_connector != null)
            await _connector.StopAsync(cancellationToken);

        try
        {
            var result = await SendAsync("/deactivate", null, cancellationToken);
            if (result.Kind == RemoteAccessResultKind.Success) return result;

            if (_connector != null)
                await _connector.StartAsync(cancellationToken);
            return result;
        }
        catch
        {
            if (_connector != null)
                await _connector.StartAsync(cancellationToken);
            throw;
        }
    }

    public async Task<RemoteAccessTokenResult> ObtenerTokenConectorAsync(CancellationToken cancellationToken = default)
    {
        if (!IsConfigured()) return RemoteAccessTokenResult.Failure("Acceso remoto no configurado");
        var identity = await _licensing.ObtenerIdentidadRemotaAsync();
        if (identity == null) return RemoteAccessTokenResult.Failure("Se requiere una licencia activa para usar el acceso remoto");

        try
        {
            using var response = await _http.SendAsync(Request("/connector-token", new { licenseKey = identity.Value.licenseKey, machineId = identity.Value.machineId }), cancellationToken);
            if (!response.IsSuccessStatusCode) return RemoteAccessTokenResult.Failure("No se pudo obtener la configuración del conector");
            var payload = await JsonSerializer.DeserializeAsync<ConnectorToken>(await response.Content.ReadAsStreamAsync(cancellationToken), JsonOptions, cancellationToken);
            return string.IsNullOrWhiteSpace(payload?.Token)
                ? RemoteAccessTokenResult.Failure("Token de conector inválido")
                : RemoteAccessTokenResult.Success(payload.Token);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return RemoteAccessTokenResult.Failure("No se pudo obtener la configuración del conector");
        }
    }

    private async Task<RemoteAccessResult> SendAsync(string path, string? slug, CancellationToken cancellationToken)
    {
        if (!IsConfigured()) return RemoteAccessResult.NotConfigured();
        var identity = await _licensing.ObtenerIdentidadRemotaAsync();
        if (identity == null) return RemoteAccessResult.LicenseRequired();

        try
        {
            object requestBody = slug == null
                ? new { licenseKey = identity.Value.licenseKey, machineId = identity.Value.machineId }
                : new { licenseKey = identity.Value.licenseKey, machineId = identity.Value.machineId, slug };
            using var response = await _http.SendAsync(Request(path, requestBody), cancellationToken);
            if (response.StatusCode == HttpStatusCode.NoContent)
                return RemoteAccessResult.Success(new RemoteAccessStatusDto { Status = "inactive", Connector = _connector?.State });

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var status = JsonSerializer.Deserialize<RemoteAccessStatusDto>(content, JsonOptions);
                return status == null ? RemoteAccessResult.Unavailable() : RemoteAccessResult.Success(WithConnector(status));
            }

            var error = JsonSerializer.Deserialize<WorkerError>(content, JsonOptions)?.Error;
            if (response.StatusCode is HttpStatusCode.BadRequest or HttpStatusCode.Forbidden or HttpStatusCode.Conflict)
                return string.IsNullOrWhiteSpace(error) ? RemoteAccessResult.Unavailable() : RemoteAccessResult.WorkerError((int)response.StatusCode, ToSpanishUxError(error));
            return RemoteAccessResult.Unavailable(string.IsNullOrWhiteSpace(error) ? null : ToSpanishUxError(error));
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return RemoteAccessResult.Unavailable();
        }
    }

    private RemoteAccessStatusDto WithConnector(RemoteAccessStatusDto status) => new()
    {
        Status = status.Status,
        Slug = status.Slug,
        Hostname = status.Hostname,
        LastError = status.LastError,
        Connector = _connector?.State ?? status.Connector
    };

    private bool IsConfigured() => !string.IsNullOrWhiteSpace(_url) && !string.IsNullOrWhiteSpace(_key);

    private static string ToSpanishUxError(string error) => error switch
    {
        "Invalid request" => "La solicitud de acceso remoto no es válida",
        "Slug unavailable" => "El subdominio elegido no está disponible",
        "Deactivate first" => "Primero desactivá el acceso remoto actual",
        "Licensing unavailable" => "El servicio de licencias no está disponible",
        "Invalid license or device" => "La licencia o el dispositivo no permiten usar el acceso remoto",
        "Provisioning in progress" => "El acceso remoto se está configurando",
        "Remote access is not active" => "El acceso remoto no está activo",
        "Connector token unavailable" => "No se pudo obtener la configuración del conector",
        _ => "No se pudo completar la operación de acceso remoto"
    };

    private HttpRequestMessage Request(string path, object body)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, $"{_url!.TrimEnd('/')}{path}") { Content = JsonContent.Create(body) };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _key);
        return request;
    }

    private sealed record ConnectorToken(string Token);
    private sealed record WorkerError(string? Error);
}
