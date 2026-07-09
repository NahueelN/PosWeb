using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using PosWeb.Data;

namespace PosWeb;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<PosDbContextLocal>
{
    public PosDbContextLocal CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("LocalConnection");

        var optionsBuilder = new DbContextOptionsBuilder<PosDbContextLocal>();
        optionsBuilder.UseSqlite(connectionString);

        return new PosDbContextLocal(optionsBuilder.Options);
    }
}
