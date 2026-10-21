using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Soporte;

namespace PosWeb.Controllers;

/// <summary>
/// Reportes de problema de los usuarios. El reporte se envía a soporte con la descripción,
/// los logs recientes de la aplicación como adjunto y el email del titular de la cuenta.
/// </summary>
[ApiController]
[Route("api/soporte")]
[Authorize]
public class SoporteController : ControllerBase
{
    private const int DescripcionMinima = 10;
    private const int DescripcionMaxima = 2000;

    private readonly SoporteService _soporteService;

    public SoporteController(SoporteService soporteService) => _soporteService = soporteService;

    /// <summary>
    /// Envía un reporte de problema al equipo de soporte. El email del titular se resuelve
    /// en el servidor (no se recibe desde el cliente).
    /// </summary>
    [HttpPost("reportar")]
    public async Task<IActionResult> Reportar([FromBody] ReportarProblemaRequest req)
    {
        var descripcion = req.Descripcion?.Trim() ?? "";
        if (descripcion.Length < DescripcionMinima)
            return BadRequest(new { error = $"Contanos un poco más sobre el problema (mínimo {DescripcionMinima} caracteres)." });
        if (descripcion.Length > DescripcionMaxima)
            return BadRequest(new { error = $"La descripción no puede superar los {DescripcionMaxima} caracteres." });

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int? idUsuario = int.TryParse(userId, out var id) ? id : null;

        var enviado = await _soporteService.ReportarProblema(descripcion, idUsuario, req.Version?.Trim());
        if (!enviado)
            return StatusCode(502, new { error = "No se pudo enviar el reporte. Verificá tu conexión e intentá de nuevo." });

        return Ok(new { ok = true });
    }
}

public record ReportarProblemaRequest(string? Descripcion, string? Version);
