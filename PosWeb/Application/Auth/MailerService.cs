using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

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
    private readonly ILogger<MailerService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    public MailerService(IConfiguration configuration, ILogger<MailerService> logger, HttpClient httpClient)
    {
        _httpClient = httpClient;
        _logger = logger;
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
        {
            _logger.LogWarning("MailerService: Mailer:WorkerUrl o Mailer:InternalKey no configurados, no se envía el mail de {Kind} a {To}", kind, to);
            return false;
        }

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
            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("MailerService: el worker respondió {StatusCode} al enviar mail de {Kind} a {To}. Body: {Body}", (int)response.StatusCode, kind, to, body);
            }
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogError(ex, "MailerService: falló la conexión al mailer-worker enviando mail de {Kind} a {To}", kind, to);
            return false;
        }
    }
}
