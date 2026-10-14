using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;

namespace PosWeb.Application.Auth;

/// <summary>
/// Cliente del mailer-worker (Cloudflare). El worker es el único que contacta a ZeptoMail;
/// el backend local solo le pasa el destinatario, tipo y código. Replica el patrón
/// de LicenciaService (URL + clave interna en config, auth Bearer, SnakeCase).
/// </summary>
public class MailerService
{
    private readonly HttpClient _httpClient;
    private readonly string? _workerUrl;
    private readonly string? _internalKey;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    public MailerService(IConfiguration configuration, HttpMessageHandler? handler = null)
    {
        _httpClient = handler == null
            ? new HttpClient { Timeout = TimeSpan.FromSeconds(10) }
            : new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(10) };
        _workerUrl = configuration["Mailer:WorkerUrl"];
        _internalKey = configuration["Mailer:InternalKey"];
    }

    /// <summary>
    /// Envía un código transaccional vía el mailer-worker. Devuelve false si el worker no está
    /// configurado o falla (el flujo de recuperación no debe romper por un error de envío).
    /// </summary>
    public async Task<bool> EnviarCodigo(string to, string kind, string code)
    {
        if (string.IsNullOrWhiteSpace(_workerUrl) || string.IsNullOrWhiteSpace(_internalKey))
            return false;

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, $"{_workerUrl}/send-code")
            {
                Content = JsonContent.Create(new
                {
                    to,
                    kind,
                    code
                }, options: JsonOptions)
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _internalKey);

            var response = await _httpClient.SendAsync(request);
            return response.IsSuccessStatusCode;
        }
        catch (HttpRequestException)
        {
            return false;
        }
    }
}
