using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.RemoteAccess;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/remote-access")]
[Authorize(Roles = "Admin,SuperAdmin")]
public class RemoteAccessController(RemoteAccessService service) : ControllerBase
{
    [HttpGet("status")]
    public async Task<IActionResult> Status()
    {
        var result = await service.StatusAsync();
        return ToActionResult(result);
    }
    [HttpPost("activate")]
    public async Task<IActionResult> Activate([FromBody] ActivateRequest request)
    {
        var result = await service.ActivateAsync(request.Slug?.Trim().ToLowerInvariant() ?? "");
        return ToActionResult(result);
    }
    [HttpPost("deactivate")]
    public async Task<IActionResult> Deactivate()
    {
        var result = await service.DeactivateAsync();
        return ToActionResult(result);
    }

    private IActionResult ToActionResult(RemoteAccessResult result) => result.Kind switch
    {
        RemoteAccessResultKind.Success => Ok(result.Status),
        RemoteAccessResultKind.NotConfigured => StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = result.Error }),
        RemoteAccessResultKind.LicenseRequired => Conflict(new { error = result.Error }),
        RemoteAccessResultKind.Unavailable => StatusCode(StatusCodes.Status502BadGateway, new { error = result.Error }),
        RemoteAccessResultKind.WorkerError => StatusCode(result.StatusCode!.Value, new { error = result.Error }),
        _ => StatusCode(StatusCodes.Status502BadGateway, new { error = "Acceso remoto no disponible" })
    };
    public record ActivateRequest(string? Slug);
}
