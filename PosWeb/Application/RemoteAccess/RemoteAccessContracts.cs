namespace PosWeb.Application.RemoteAccess;

public sealed class RemoteAccessStatusDto
{
    public string Status { get; init; } = "inactive";
    public string? Slug { get; init; }
    public string? Hostname { get; init; }
    public string? LastError { get; init; }
    public RemoteAccessConnectorDto? Connector { get; init; }
}

public sealed class RemoteAccessConnectorDto
{
    public string State { get; init; } = "stopped";
    public string? Error { get; init; }
}

public enum RemoteAccessResultKind
{
    Success,
    NotConfigured,
    LicenseRequired,
    DefaultCredentials,
    Unavailable,
    WorkerError
}

public sealed record RemoteAccessResult(RemoteAccessResultKind Kind, RemoteAccessStatusDto? Status = null, int? StatusCode = null, string? Error = null)
{
    public static RemoteAccessResult Success(RemoteAccessStatusDto status) => new(RemoteAccessResultKind.Success, status);
    public static RemoteAccessResult NotConfigured() => new(RemoteAccessResultKind.NotConfigured, Error: "Acceso remoto no configurado");
    public static RemoteAccessResult LicenseRequired() => new(RemoteAccessResultKind.LicenseRequired, Error: "Se requiere una licencia activa para usar el acceso remoto");
    public static RemoteAccessResult DefaultCredentials() => new(RemoteAccessResultKind.DefaultCredentials, Error: "Cambiá la contraseña del usuario admin antes de activar el acceso remoto");
    public static RemoteAccessResult Unavailable(string? error = null) => new(RemoteAccessResultKind.Unavailable, Error: error ?? "Acceso remoto no disponible");
    public static RemoteAccessResult WorkerError(int statusCode, string error) => new(RemoteAccessResultKind.WorkerError, StatusCode: statusCode, Error: error);
}

public sealed record RemoteAccessTokenResult(bool IsSuccess, string? Token, string? Error)
{
    public static RemoteAccessTokenResult Success(string token) => new(true, token, null);
    public static RemoteAccessTokenResult Failure(string error) => new(false, null, error);
}

public interface IRemoteAccessConnector
{
    RemoteAccessConnectorDto State { get; }
    Task StartAsync(CancellationToken cancellationToken = default);
    Task StopAsync(CancellationToken cancellationToken = default);
}
