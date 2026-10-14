using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Configuration.Json;

namespace PosWeb.Application;

public static class EmbeddedConfigurationDefaults
{
    public static void AddJsonDefaults(IConfigurationBuilder configuration, string json)
    {
        configuration.Sources.Insert(0, new JsonStreamConfigurationSource
        {
            Stream = new MemoryStream(Encoding.UTF8.GetBytes(json))
        });
    }
}
