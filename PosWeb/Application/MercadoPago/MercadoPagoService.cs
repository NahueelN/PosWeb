using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Web;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.MercadoPago;

public class MercadoPagoService
{
    private readonly PosDbContextLocal _context;
    private readonly TokenEncryptionService _encryption;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<MercadoPagoService> _logger;
    private readonly string _clientId;
    private readonly string _clientSecret;
    private readonly string _redirectUri;

    private static string? _pendingState;
    private static string? _pendingCodeVerifier;

    public MercadoPagoService(
        PosDbContextLocal context,
        TokenEncryptionService encryption,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<MercadoPagoService> logger)
    {
        _context = context;
        _encryption = encryption;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _clientId = configuration["MercadoPago:ClientId"] ?? "";
        _clientSecret = configuration["MercadoPago:ClientSecret"] ?? "";
        _redirectUri = configuration["MercadoPago:RedirectUri"] ?? "http://localhost:5196/api/mercadopago/callback";
    }

    public string GenerarAuthUrl()
    {
        _pendingState = Guid.NewGuid().ToString("N");
        _pendingCodeVerifier = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");

        var codeChallenge = Base64UrlEncode(SHA256.HashData(Encoding.UTF8.GetBytes(_pendingCodeVerifier)));

        var url = $"https://auth.mercadopago.com/authorization" +
            $"?client_id={_clientId}" +
            $"&response_type=code" +
            $"&platform_id=mp" +
            $"&redirect_uri={HttpUtility.UrlEncode(_redirectUri)}" +
            $"&state={_pendingState}" +
            $"&code_challenge={codeChallenge}" +
            $"&code_challenge_method=S256";
        return url;
    }

    public async Task<(bool success, string? error)> IntercambiarCodigo(string code, string state)
    {
        if (state != _pendingState)
            return (false, "Estado OAuth inválido. Posible ataque CSRF.");

        if (string.IsNullOrWhiteSpace(code))
            return (false, "Código de autorización vacío");

        if (_pendingCodeVerifier == null)
            return (false, "Error interno: code_verifier no encontrado");

        try
        {
            var client = _httpClientFactory.CreateClient("MercadoPago");
            var body = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["client_id"] = _clientId,
                ["client_secret"] = _clientSecret,
                ["code"] = code,
                ["redirect_uri"] = _redirectUri,
                ["code_verifier"] = _pendingCodeVerifier,
            });

            var response = await client.PostAsync("https://api.mercadopago.com/oauth/token", body);
            if (!response.IsSuccessStatusCode)
                return (false, "Error al intercambiar código con MercadoPago");

            var content = await response.Content.ReadAsStringAsync();
            var doc = JsonSerializer.Deserialize<JsonElement>(content);

            var accessToken = doc.GetProperty("access_token").GetString()!;
            var refreshToken = doc.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null;
            var userId = doc.GetProperty("user_id").GetInt32().ToString();

            var suscripcion = _context.Suscripcion.FirstOrDefault();
            if (suscripcion == null)
                return (false, "No se encontró una suscripción activa");

            var encryptedAccess = _encryption.Encrypt(accessToken);
            var encryptedRefresh = refreshToken != null ? _encryption.Encrypt(refreshToken) : null;

            suscripcion.VincularMP(encryptedAccess, encryptedRefresh, userId);
            suscripcion.AsignarPosId("CAJA1");
            _context.SaveChanges();

            await ConfigurarPos(accessToken, userId, suscripcion);

            return (true, null);
        }
        catch (Exception ex)
        {
            return (false, $"Error: {ex.Message}");
        }
    }

    private async Task ConfigurarPos(string accessToken, string userId, Suscripcion suscripcion)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("MercadoPago");

            var storeBody = new StringContent(JsonSerializer.Serialize(new
            {
                name = "PosWeb",
                external_id = "POSWEB-001",
                location = new
                {
                    street_number = "0",
                    street_name = "Principal",
                    city_name = "Palermo",
                    state_name = "Capital Federal",
                    latitude = -34.6037,
                    longitude = -58.3816,
                    reference = "Local"
                }
            }), Encoding.UTF8, "application/json");

            var storeReq = new HttpRequestMessage(HttpMethod.Post, $"https://api.mercadopago.com/users/{userId}/stores")
            { Content = storeBody };
            storeReq.Headers.Add("Authorization", $"Bearer {accessToken}");

            var storeRes = await client.SendAsync(storeReq);
            int? storeIdInt = null;

            if (storeRes.IsSuccessStatusCode)
            {
                var storeContent = await storeRes.Content.ReadAsStringAsync();
                var storeDoc = JsonSerializer.Deserialize<JsonElement>(storeContent);
                storeIdInt = int.Parse(storeDoc.GetProperty("id").GetRawText());
                _logger.LogInformation("Store created: {StoreId}", storeIdInt);
            }
            else
            {
                var storeErr = await storeRes.Content.ReadAsStringAsync();
                _logger.LogError("Store create [{StatusCode}]: {ErrorBody}", storeRes.StatusCode, storeErr);
                if (!storeErr.Contains("already assigned"))
                    return;
                _logger.LogInformation("Store already exists, will use external_store_id");
            }

            await CrearPos(client, accessToken, storeIdInt, suscripcion);
            _context.SaveChanges();
            _logger.LogInformation("Store and POS configured successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError($"ConfigurarPos error: {ex.Message}");
        }
    }

    public async Task<string?> ObtenerTokenValido()
    {
        var token = ObtenerToken();
        if (token != null) return token;

        return await RefrescarToken();
    }

    public async Task<string?> RefrescarToken()
    {
        var suscripcion = _context.Suscripcion.FirstOrDefault();
        if (suscripcion == null || !suscripcion.MP_VINCULADO || string.IsNullOrEmpty(suscripcion.MP_REFRESH_TOKEN))
            return null;

        try
        {
            var refreshToken = _encryption.Decrypt(suscripcion.MP_REFRESH_TOKEN);

            var client = _httpClientFactory.CreateClient("MercadoPago");
            var body = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["client_id"] = _clientId,
                ["client_secret"] = _clientSecret,
                ["refresh_token"] = refreshToken,
            });

            var response = await client.PostAsync("https://api.mercadopago.com/oauth/token", body);
            if (!response.IsSuccessStatusCode) return null;

            var content = await response.Content.ReadAsStringAsync();
            var doc = JsonSerializer.Deserialize<JsonElement>(content);

            var newAccessToken = doc.GetProperty("access_token").GetString()!;
            var newRefreshToken = doc.TryGetProperty("refresh_token", out var rt2) ? rt2.GetString() : null;

            suscripcion.ActualizarTokens(_encryption.Encrypt(newAccessToken), newRefreshToken != null ? _encryption.Encrypt(newRefreshToken) : null);

            _context.SaveChanges();

            return newAccessToken;
        }
        catch
        {
            return null;
        }
    }

    private async Task CrearPosAutomatico(string accessToken, string userId, Suscripcion suscripcion)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("MercadoPago");

            var storeBody = new StringContent(JsonSerializer.Serialize(new
            {
                name = "PosWeb",
                external_id = "POSWEB-001",
                location = new
                {
                    street_number = "0",
                    street_name = "Principal",
                    city_name = "Palermo",
                    state_name = "Capital Federal",
                    latitude = -34.6037,
                    longitude = -58.3816,
                    reference = "Local principal"
                }
            }), Encoding.UTF8, "application/json");

            var storeRequest = new HttpRequestMessage(HttpMethod.Post,
                "https://api.mercadopago.com/instore/stores")
            { Content = storeBody };
            storeRequest.Headers.Add("Authorization", $"Bearer {accessToken}");

            var storeResponse = await client.SendAsync(storeRequest);
            if (!storeResponse.IsSuccessStatusCode)
            {
                var storeError = await storeResponse.Content.ReadAsStringAsync();
                _logger.LogError($"MP Store create failed: {storeResponse.StatusCode} - {storeError}");
                return;
            }

            var storeContent = await storeResponse.Content.ReadAsStringAsync();
            var storeDoc = JsonSerializer.Deserialize<JsonElement>(storeContent);
            var storeId = storeDoc.GetProperty("id").GetString()!;

            var posBody = new StringContent(JsonSerializer.Serialize(new
            {
                name = "Caja 1",
                external_id = "CAJA1"
            }), Encoding.UTF8, "application/json");

            var posRequest = new HttpRequestMessage(HttpMethod.Post,
                $"https://api.mercadopago.com/instore/stores/{storeId}/pos")
            { Content = posBody };
            posRequest.Headers.Add("Authorization", $"Bearer {accessToken}");

            var posResponse = await client.SendAsync(posRequest);
            if (!posResponse.IsSuccessStatusCode) return;

            var posContent = await posResponse.Content.ReadAsStringAsync();
            var posDoc = JsonSerializer.Deserialize<JsonElement>(posContent);
            var posId = posDoc.GetProperty("id").GetString()!;

            var qrData = await ObtenerQrData(client, accessToken, userId, posId);
            suscripcion.AsignarPosId(posId);
            if (qrData != null)
                suscripcion.AsignarQrData(qrData);
            _context.SaveChanges();
        }
        catch (Exception ex)
        {
            _logger.LogError($"MP CrearPosAutomatico error: {ex.Message}");
        }
    }

    private static async Task<string?> ObtenerQrData(HttpClient client, string accessToken, string userId, string posId)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Get,
                $"https://api.mercadopago.com/instore/orders/qr/seller/collectors/{userId}/pos/{posId}/qrs");
            request.Headers.Add("Authorization", $"Bearer {accessToken}");

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode) return null;

            var content = await response.Content.ReadAsStringAsync();
            var doc = JsonSerializer.Deserialize<JsonElement>(content);

            if (doc.TryGetProperty("qr_data", out var qrData))
                return qrData.GetString();

            return null;
        }
        catch
        {
            return null;
        }
    }

    public async Task<(bool success, string? qrData)> CrearOrdenQr(decimal monto, string externalReference)
    {
        var token = await ObtenerTokenValido();
        if (token == null) return (false, null);

        var suscripcion = _context.Suscripcion.FirstOrDefault();
        if (suscripcion == null || string.IsNullOrEmpty(suscripcion.MP_USER_ID) || string.IsNullOrEmpty(suscripcion.MP_POS_ID))
            return (false, null);

        try
        {
            var client = _httpClientFactory.CreateClient("MercadoPago");

            var montoStr = monto.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);
            var body = new StringContent(JsonSerializer.Serialize(new
            {
                type = "qr",
                total_amount = montoStr,
                external_reference = externalReference,
                description = $"Compra {externalReference}",
                expiration_time = "PT15M",
                config = new
                {
                    qr = new
                    {
                        external_pos_id = suscripcion.MP_POS_ID,
                        mode = "dynamic"
                    }
                },
                transactions = new
                {
                    payments = new[]
                    {
                        new { amount = montoStr }
                    }
                }
            }), Encoding.UTF8, "application/json");

            var url = "https://api.mercadopago.com/v1/orders";
            var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = body };
            request.Headers.Add("Authorization", $"Bearer {token}");
            request.Headers.Add("X-Idempotency-Key", Guid.NewGuid().ToString());

            var response = await client.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                var doc = JsonSerializer.Deserialize<JsonElement>(content);
                var qrData = ExtractQrData(doc);
                return (true, qrData);
            }

            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("Order create failed [{StatusCode}]: {ErrorBody}", response.StatusCode, errorBody);

            if (errorBody.Contains("pos_not_found"))
            {
                _logger.LogInformation("POS not found, creating store and POS...");
                token = await ObtenerTokenValido();
                if (token == null) return (false, null);
                await ConfigurarPos(token, suscripcion.MP_USER_ID, suscripcion);

                var retryBody = JsonSerializer.Serialize(new
                {
                    type = "qr",
                    total_amount = montoStr,
                    external_reference = externalReference,
                    description = $"Compra {externalReference}",
                    expiration_time = "PT15M",
                    config = new { qr = new { external_pos_id = suscripcion.MP_POS_ID, mode = "dynamic" } },
                    transactions = new { payments = new[] { new { amount = montoStr } } }
                });
                client = _httpClientFactory.CreateClient("MercadoPago");
                var retryContent = new StringContent(retryBody, Encoding.UTF8, "application/json");
                var retryReq = new HttpRequestMessage(HttpMethod.Post, url) { Content = retryContent };
                retryReq.Headers.Add("Authorization", $"Bearer {token}");
                retryReq.Headers.Add("X-Idempotency-Key", Guid.NewGuid().ToString());

                var retryResponse = await client.SendAsync(retryReq);
                if (!retryResponse.IsSuccessStatusCode)
                {
                    var retryErr = await retryResponse.Content.ReadAsStringAsync();
                    _logger.LogError("Order create retry failed [{StatusCode}]: {ErrorBody}", retryResponse.StatusCode, retryErr);
                    return (false, null);
                }

                var retryStr = await retryResponse.Content.ReadAsStringAsync();
                var retryDoc = JsonSerializer.Deserialize<JsonElement>(retryStr);
                return (true, ExtractQrData(retryDoc));
            }

            return (false, null);
        }
        catch
        {
            return (false, null);
        }
    }

    private static string? ExtractQrData(JsonElement doc)
    {
        if (doc.TryGetProperty("type_response", out var tr) &&
            tr.TryGetProperty("qr_data", out var qr))
            return qr.GetString();
        if (doc.TryGetProperty("qr_data", out var qr2))
            return qr2.GetString();
        return null;
    }

    public MercadoPagoEstadoDto? ObtenerEstado()
    {
        var suscripcion = _context.Suscripcion.FirstOrDefault();
        if (suscripcion == null || !suscripcion.MP_VINCULADO)
            return null;

        return new MercadoPagoEstadoDto
        {
            Vinculado = true,
            NombreTitular = suscripcion.MP_USER_ID,
            QrData = suscripcion.MP_QR_DATA
        };
    }

    public void Desvincular()
    {
        var suscripcion = _context.Suscripcion.FirstOrDefault();
        if (suscripcion == null)
            return;

        suscripcion.DesvincularMP();
        _context.SaveChanges();
    }

    public async Task<string?> ObtenerQrDataActivo()
    {
        var token = await ObtenerTokenValido();
        if (token == null) return null;

        var suscripcion = _context.Suscripcion.FirstOrDefault();
        if (suscripcion == null || string.IsNullOrEmpty(suscripcion.MP_USER_ID) || string.IsNullOrEmpty(suscripcion.MP_POS_ID))
            return null;

        try
        {
            var client = _httpClientFactory.CreateClient("MercadoPago");
            var url = $"https://api.mercadopago.com/instore/qr/seller/collectors/{suscripcion.MP_USER_ID}/pos/{suscripcion.MP_POS_ID}/qrs";
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("Authorization", $"Bearer {token}");

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode) return null;

            var content = await response.Content.ReadAsStringAsync();
            var doc = JsonSerializer.Deserialize<JsonElement>(content);

            if (doc.TryGetProperty("qr_data", out var qrData))
            {
                var data = qrData.GetString();
                if (!string.IsNullOrEmpty(data))
                {
                    suscripcion.AsignarQrData(data);
                    _context.SaveChanges();
                }
                return data;
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    public string? ObtenerToken()
    {
        var suscripcion = _context.Suscripcion.FirstOrDefault();
        if (suscripcion == null || !suscripcion.MP_VINCULADO || string.IsNullOrEmpty(suscripcion.MP_ACCESS_TOKEN))
            return null;

        return _encryption.Decrypt(suscripcion.MP_ACCESS_TOKEN);
    }

    public async Task<bool> VerificarTransferencia(decimal montoEsperado)
    {
        var token = await ObtenerTokenValido();
        if (token == null) return false;

        try
        {
            var client = _httpClientFactory.CreateClient("MercadoPago");
            var desde = DateTime.UtcNow.AddMinutes(-10).ToString("o");
            var hasta = DateTime.UtcNow.ToString("o");
            var minimo = montoEsperado * 0.99m;
            var maximo = montoEsperado * 1.01m;

            var url = $"https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&range=date_created&begin_date={Uri.EscapeDataString(desde)}&end_date={Uri.EscapeDataString(hasta)}&status=approved&limit=30";

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("Authorization", $"Bearer {token}");

            var response = await client.SendAsync(request);
            if (!response.IsSuccessStatusCode) return false;

            var content = await response.Content.ReadAsStringAsync();
            var doc = JsonSerializer.Deserialize<JsonElement>(content);

            if (!doc.TryGetProperty("results", out var results)) return false;

            foreach (var payment in results.EnumerateArray())
            {
                if (payment.TryGetProperty("transaction_amount", out var amountProp) &&
                    amountProp.TryGetDecimal(out var amount))
                {
                    if (amount >= minimo && amount <= maximo)
                        return true;
                }
            }

            return false;
        }
        catch
        {
            return false;
        }
    }

    private static string Base64UrlEncode(byte[] bytes)
    {
        return Convert.ToBase64String(bytes).Replace("=", "").Replace("+", "-").Replace("/", "_");
    }

    private static async Task<int> BuscarStoreExistente(HttpClient client, string accessToken, string userId)
    {
        try
        {
            var searchReq = new HttpRequestMessage(HttpMethod.Get,
                $"https://api.mercadopago.com/users/{userId}/stores/search");
            searchReq.Headers.Add("Authorization", $"Bearer {accessToken}");

            var res = await client.SendAsync(searchReq);
            if (!res.IsSuccessStatusCode) return 0;

            var content = await res.Content.ReadAsStringAsync();
            System.Diagnostics.Debug.WriteLine($"Store search response: {content}");
            var doc = JsonSerializer.Deserialize<JsonElement>(content);

            if (doc.TryGetProperty("results", out var results))
            {
                foreach (var store in results.EnumerateArray())
                {
                    if (store.TryGetProperty("external_id", out var extId) &&
                        extId.GetString() == "POSWEB-001")
                    {
                        return int.Parse(store.GetProperty("id").GetRawText());
                    }
                }
            }
        }
        catch { }
        return 0;
    }

    private static async Task CrearPos(HttpClient client, string accessToken, int? storeIdInt, Suscripcion suscripcion)
    {
        var posBodyObj = new Dictionary<string, object>
        {
            ["name"] = "Caja 1",
            ["external_id"] = "CAJA1",
            ["category"] = 621102,
            ["fixed_amount"] = false
        };
        if (storeIdInt.HasValue)
            posBodyObj["store_id"] = storeIdInt.Value;
        else
            posBodyObj["external_store_id"] = "POSWEB-001";

        var posBody = new StringContent(JsonSerializer.Serialize(posBodyObj), Encoding.UTF8, "application/json");

        var posReq = new HttpRequestMessage(HttpMethod.Post, "https://api.mercadopago.com/pos")
        { Content = posBody };
        posReq.Headers.Add("Authorization", $"Bearer {accessToken}");

        var posRes = await client.SendAsync(posReq);
        if (!posRes.IsSuccessStatusCode)
        {
            var posErr = await posRes.Content.ReadAsStringAsync();
            System.Diagnostics.Debug.WriteLine($"POS create [{posRes.StatusCode}]: {posErr}");
            return;
        }

        var posContent = await posRes.Content.ReadAsStringAsync();
        var posDoc = JsonSerializer.Deserialize<JsonElement>(posContent);

        if (posDoc.TryGetProperty("qr", out var qrObj))
        {
            if (qrObj.TryGetProperty("image", out var img))
                suscripcion.AsignarQrData(img.GetString());
        }
    }
}

public class MercadoPagoEstadoDto
{
    public bool Vinculado { get; set; }
    public string? NombreTitular { get; set; }
    public string? QrData { get; set; }
}
