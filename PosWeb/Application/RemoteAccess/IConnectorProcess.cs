using System.Diagnostics;

namespace PosWeb.Application.RemoteAccess;

public interface IConnectorProcess
{
    bool Exists(string path);
    IConnectorProcessHandle Start(string path, string arguments, IReadOnlyDictionary<string, string> environment);
}

public interface IConnectorProcessHandle
{
    event EventHandler? Exited;
    Task StopAsync();
}

public sealed class CloudflaredProcess : IConnectorProcess, IDisposable
{
    private readonly IWindowsJob _job;

    public CloudflaredProcess() : this(WindowsJob.CreateKillOnClose())
    {
    }

    public CloudflaredProcess(IWindowsJob job) => _job = job;

    public bool Exists(string path) => File.Exists(path);

    public IConnectorProcessHandle Start(string path, string arguments, IReadOnlyDictionary<string, string> environment)
    {
        var startInfo = new ProcessStartInfo(path, arguments)
        {
            UseShellExecute = false,
            CreateNoWindow = true
        };
        foreach (var item in environment)
            startInfo.Environment[item.Key] = item.Value;

        var process = Process.Start(startInfo) ?? throw new InvalidOperationException("No se pudo iniciar el conector");
        if (!_job.TryAssign(process.Handle))
            Console.Error.WriteLine("No se pudo asignar cloudflared al Job Object de Windows.");
        return new CloudflaredProcessHandle(process);
    }

    public void Dispose() => _job.Dispose();

    private sealed class CloudflaredProcessHandle(Process process) : IConnectorProcessHandle
    {
        public event EventHandler? Exited
        {
            add { process.EnableRaisingEvents = true; process.Exited += value; }
            remove { process.Exited -= value; }
        }

        public Task StopAsync()
        {
            if (!process.HasExited)
                process.Kill(entireProcessTree: true);
            process.Dispose();
            return Task.CompletedTask;
        }
    }
}
