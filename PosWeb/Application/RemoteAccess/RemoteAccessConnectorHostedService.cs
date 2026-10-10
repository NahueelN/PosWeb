using Microsoft.Extensions.Hosting;

namespace PosWeb.Application.RemoteAccess;

public sealed class RemoteAccessConnectorHostedService : IHostedService
{
    private readonly Func<CancellationToken, Task<RemoteAccessResult>> _getStatus;
    private readonly IRemoteAccessConnector _connector;

    public RemoteAccessConnectorHostedService(Func<CancellationToken, Task<RemoteAccessResult>> getStatus, IRemoteAccessConnector connector)
    {
        _getStatus = getStatus;
        _connector = connector;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _ = StartConnectorAsync(cancellationToken);
        return Task.CompletedTask;
    }

    private async Task StartConnectorAsync(CancellationToken cancellationToken)
    {
        var result = await _getStatus(cancellationToken);
        if (result.Kind == RemoteAccessResultKind.Success && result.Status?.Status is "active" or "waiting_connector")
            await _connector.StartAsync(cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken) => _connector.StopAsync(cancellationToken);
}
