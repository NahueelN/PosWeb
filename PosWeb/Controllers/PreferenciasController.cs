using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Preferencias;
using System.Text.Json;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/preferencias")]
[Authorize]
public class PreferenciasController : ControllerBase
{
    private readonly PreferenciaService _preferenciaService;

    public PreferenciasController(PreferenciaService preferenciaService)
    {
        _preferenciaService = preferenciaService;
    }

    [HttpGet]
    public async Task<IActionResult> Obtener()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var preferencias = await _preferenciaService.ObtenerAsync(userId.Value);
        return Ok(new
        {
            preferencias
        });
    }

    [HttpPut]
    public async Task<IActionResult> Guardar([FromBody] Dictionary<string, JsonElement> preferencias)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        if (preferencias == null || preferencias.Count == 0)
            return BadRequest(new { error = "No se recibieron preferencias" });

        await _preferenciaService.GuardarAsync(userId.Value, preferencias);

        var resultado = await _preferenciaService.ObtenerAsync(userId.Value);
        return Ok(new
        {
            preferencias = resultado
        });
    }

    private int? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim == null) return null;
        return int.TryParse(claim.Value, out var id) ? id : null;
    }
}
