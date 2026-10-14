using Microsoft.Extensions.Configuration;

namespace PosWeb.Application.RemoteAccess;

public sealed class RemoteAccessConnector : IRemoteAccessConnector
{
    private static readonly TimeSpan[] RestartDelays = [TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(15), TimeSpan.FromSeconds(60)];
    private readonly Func<CancellationToken, Task<RemoteAccessTokenResult>> _getToken;
    private readonly IConnectorProcess _process;
    private readonly string _path;
    private readonly Func<TimeSpan, CancellationToken, Task> _delay;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private IConnectorProcessHandle? _handle;
    private CancellationTokenSource? _restartCancellation;
    private bool _stopping;
    private int _restartAttempt;

    public RemoteAccessConnector(
        Func<CancellationToken, Task<RemoteAccessTokenResult>> getToken,
        IConnectorProcess process,
        IConfiguration configuration,
        Func<TimeSpan, CancellationToken, Task>? delay = null)
    {
        _getToken = getToken;
        _process = process;
        _path = configuration["RemoteAccess:CloudflaredPath"]
            ?? Path.Combine(AppContext.BaseDirectory, "vendeto-cloudflared.exe");
        _delay = delay ?? Task.Delay;
    }

    public RemoteAccessConnectorDto State { get; private set; } = new();

    public Task StartAsync(CancellationToken cancellationToken = default) => StartAsync(cancellationToken, isRestart: false);

    private async Task StartAsync(CancellationToken cancellationToken, bool isRestart)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (State.State is "running" or "starting") return;
            _stopping = false;
            _restartCancellation ??= new CancellationTokenSource();
            State = new RemoteAccessConnectorDto { State = "starting" };

            if (!_process.Exists(_path))
            {
                State = new RemoteAccessConnectorDto { State = "error", Error = "Conector no instalado" };
                return;
            }

            var token = await _getToken(cancellationToken);
            if (!token.IsSuccess || string.IsNullOrWhiteSpace(token.Token))
            {
                State = new RemoteAccessConnectorDto { State = "error", Error = token.Error ?? "No se pudo obtener la configuración del conector" };
                _ = RestartAfterDelayAsync(_restartCancellation.Token);
                return;
            }

            _handle = _process.Start(_path, "tunnel --no-autoupdate run", new Dictionary<string, string>
            {
                ["TUNNEL_TOKEN"] = token.Token
            });
            _handle.Exited += OnExited;
            if (!isRestart)
                _restartAttempt = 0;
            State = new RemoteAccessConnectorDto { State = "running" };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            State = new RemoteAccessConnectorDto { State = "error", Error = "No se pudo iniciar el conector" };
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task StopAsync(CancellationToken cancellationToken = default)
    {
        _stopping = true;
        _restartCancellation?.Cancel();
        _restartCancellation?.Dispose();
        _restartCancellation = null;

        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_handle != null)
            {
                _handle.Exited -= OnExited;
                await _handle.StopAsync();
                _handle = null;
            }
            _restartAttempt = 0;
            State = new RemoteAccessConnectorDto { State = "stopped" };
        }
        finally
        {
            _gate.Release();
        }
    }

    private void OnExited(object? sender, EventArgs e)
    {
        if (_stopping || _restartCancellation == null) return;
        if (_handle != null)
        {
            _handle.Exited -= OnExited;
            _handle = null;
        }
        State = new RemoteAccessConnectorDto { State = "error", Error = "El conector se detuvo inesperadamente" };
        _ = RestartAfterDelayAsync(_restartCancellation.Token);
    }

    private async Task RestartAfterDelayAsync(CancellationToken cancellationToken)
    {
        try
        {
            var delay = RestartDelays[Math.Min(_restartAttempt++, RestartDelays.Length - 1)];
            await _delay(delay, cancellationToken);
            if (!_stopping) await StartAsync(cancellationToken, isRestart: true);
        }
        catch (OperationCanceledException)
        {
        }
    }
}
