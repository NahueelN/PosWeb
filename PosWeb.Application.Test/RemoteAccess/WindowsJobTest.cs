using PosWeb.Application.RemoteAccess;

namespace PosWeb.Application.Test.RemoteAccess;

public class WindowsJobTest
{
    [Fact]
    public async Task Start_AssignsStartedProcessToKillOnCloseJob()
    {
        var job = new FakeWindowsJob();
        var process = new CloudflaredProcess(job);

        var handle = process.Start(
            Path.Combine(Environment.SystemDirectory, "cmd.exe"),
            "/c timeout /t 30 /nobreak > nul",
            new Dictionary<string, string>());

        await handle.StopAsync();

        Assert.Single(job.AssignedHandles);
    }

    private sealed class FakeWindowsJob : IWindowsJob
    {
        public List<IntPtr> AssignedHandles { get; } = [];

        public bool TryAssign(IntPtr processHandle)
        {
            AssignedHandles.Add(processHandle);
            return true;
        }

        public void Dispose()
        {
        }
    }
}
