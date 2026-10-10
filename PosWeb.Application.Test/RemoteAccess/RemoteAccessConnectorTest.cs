using Microsoft.Extensions.Configuration;
using PosWeb.Application.RemoteAccess;

namespace PosWeb.Application.Test.RemoteAccess;

public class RemoteAccessConnectorTest
{
    [Fact]
    public async Task StartAsync_PassesTokenOnlyThroughEnvironment()
    {
        var process = new FakeConnectorProcess { ExistsResult = true };
        var connector = CreateConnector(process, _ => Task.FromResult(RemoteAccessTokenResult.Success("secret-token")));

        await connector.StartAsync();

        Assert.Equal("running", connector.State.State);
        Assert.Equal("tunnel --no-autoupdate run", process.Arguments);
        Assert.Equal("secret-token", process.Environment["TUNNEL_TOKEN"]);
        Assert.DoesNotContain("secret-token", process.Arguments);
    }

    [Fact]
    public async Task StartAsync_WhenBinaryIsMissing_SetsError()
    {
        var connector = CreateConnector(new FakeConnectorProcess { ExistsResult = false }, _ => Task.FromResult(RemoteAccessTokenResult.Success("secret-token")));

        await connector.StartAsync();

        Assert.Equal("error", connector.State.State);
        Assert.Equal("Conector no instalado", connector.State.Error);
    }

    [Fact]
    public async Task StartAsync_WhenTokenFetchFails_SchedulesRestart()
    {
        var process = new FakeConnectorProcess { ExistsResult = true };
        var delays = new List<TimeSpan>();
        var tokenCalls = 0;
        var secondTokenFetch = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var connector = CreateConnector(process, _ => Task.FromResult(++tokenCalls == 1
            ? RemoteAccessTokenResult.Failure("Worker no disponible")
            : GetSuccessfulToken()), (delay, _) =>
        {
            delays.Add(delay);
            return Task.CompletedTask;
        });

        await connector.StartAsync();
        await secondTokenFetch.Task.WaitAsync(TimeSpan.FromSeconds(1));

        Assert.Equal([TimeSpan.FromSeconds(5)], delays);
        Assert.Equal(2, tokenCalls);
        Assert.Equal("running", connector.State.State);

        RemoteAccessTokenResult GetSuccessfulToken()
        {
            secondTokenFetch.SetResult();
            return RemoteAccessTokenResult.Success("secret-token");
        }
    }

    [Fact]
    public async Task UnexpectedExit_SchedulesRestart()
    {
        var process = new FakeConnectorProcess { ExistsResult = true };
        var connector = CreateConnector(process, _ => Task.FromResult(RemoteAccessTokenResult.Success("secret-token")), (_, _) => Task.CompletedTask);

        await connector.StartAsync();
        process.Handle.RaiseExited();
        await Task.Yield();
        await Task.Yield();

        Assert.Equal(2, process.StartCount);
        Assert.Equal("running", connector.State.State);
    }

    [Fact]
    public async Task UnexpectedExits_IncreaseRestartBackoff()
    {
        var delays = new List<TimeSpan>();
        var process = new FakeConnectorProcess { ExistsResult = true };
        var connector = CreateConnector(process, _ => Task.FromResult(RemoteAccessTokenResult.Success("secret-token")), (delay, _) =>
        {
            delays.Add(delay);
            return Task.CompletedTask;
        });
        await connector.StartAsync();

        process.Handle.RaiseExited();
        await Task.Yield();
        await Task.Yield();
        process.Handle.RaiseExited();
        await Task.Yield();
        await Task.Yield();

        Assert.Equal([TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(15)], delays);
    }

    [Fact]
    public async Task StopAsync_PreventsRestartAfterExit()
    {
        var process = new FakeConnectorProcess { ExistsResult = true };
        var connector = CreateConnector(process, _ => Task.FromResult(RemoteAccessTokenResult.Success("secret-token")), (_, _) => Task.CompletedTask);
        await connector.StartAsync();

        await connector.StopAsync();
        process.Handle.RaiseExited();
        await Task.Yield();

        Assert.Equal(1, process.StartCount);
        Assert.Equal("stopped", connector.State.State);
    }

    [Fact]
    public async Task HostedService_WithInactiveRemoteAccess_DoesNotStartConnector()
    {
        var connector = new FakeRemoteAccessConnector();
        var hostedService = new RemoteAccessConnectorHostedService(
            _ => Task.FromResult(RemoteAccessResult.Success(new RemoteAccessStatusDto { Status = "inactive" })), connector);

        await hostedService.StartAsync(CancellationToken.None);

        Assert.Equal(0, connector.StartCount);
    }

    [Fact]
    public async Task HostedService_StartAsync_ReturnsBeforeStatusCompletes()
    {
        var statusCompletion = new TaskCompletionSource<RemoteAccessResult>();
        var connector = new FakeRemoteAccessConnector();
        var hostedService = new RemoteAccessConnectorHostedService(_ => statusCompletion.Task, connector);

        var start = hostedService.StartAsync(CancellationToken.None);

        Assert.True(start.IsCompletedSuccessfully);
        statusCompletion.SetResult(RemoteAccessResult.Success(new RemoteAccessStatusDto { Status = "active" }));
        await Task.Yield();

        Assert.Equal(1, connector.StartCount);
    }

    private static RemoteAccessConnector CreateConnector(FakeConnectorProcess process, Func<CancellationToken, Task<RemoteAccessTokenResult>> token, Func<TimeSpan, CancellationToken, Task>? delay = null) =>
        new(token, process, new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["RemoteAccess:CloudflaredPath"] = "cloudflared.exe"
        }).Build(), delay);

    private sealed class FakeConnectorProcess : IConnectorProcess
    {
        public bool ExistsResult { get; init; }
        public int StartCount { get; private set; }
        public string Arguments { get; private set; } = "";
        public IReadOnlyDictionary<string, string> Environment { get; private set; } = new Dictionary<string, string>();
        public FakeConnectorProcessHandle Handle { get; private set; } = new();

        public bool Exists(string path) => ExistsResult;
        public IConnectorProcessHandle Start(string path, string arguments, IReadOnlyDictionary<string, string> environment)
        {
            StartCount++;
            Arguments = arguments;
            Environment = environment;
            Handle = new FakeConnectorProcessHandle();
            return Handle;
        }
    }

    private sealed class FakeConnectorProcessHandle : IConnectorProcessHandle
    {
        public event EventHandler? Exited;
        public Task StopAsync() => Task.CompletedTask;
        public void RaiseExited() => Exited?.Invoke(this, EventArgs.Empty);
    }

    private sealed class FakeRemoteAccessConnector : IRemoteAccessConnector
    {
        public int StartCount { get; private set; }
        public RemoteAccessConnectorDto State { get; } = new();
        public Task StartAsync(CancellationToken cancellationToken = default) { StartCount++; return Task.CompletedTask; }
        public Task StopAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
