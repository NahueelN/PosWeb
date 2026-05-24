using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Cajas;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/cajas")]
[Authorize]
public class CajasController : ControllerBase
{
    private readonly CajaService _cajaService;

    public CajasController(CajaService cajaService)
    {
        _cajaService = cajaService;
    }

    [HttpPost("abrir")]
    public IActionResult Abrir([FromBody] AbrirCajaRequest request)
    {
        var userId = GetUserId();
        var result = _cajaService.Abrir(request, userId);
        return Ok(result);
    }

    [HttpPost("cerrar")]
    public IActionResult Cerrar([FromQuery] int cajaId, [FromBody] CerrarCajaRequest request)
    {
        var userId = GetUserId();
        var result = _cajaService.Cerrar(cajaId, request, userId);
        return Ok(result);
    }

    [HttpGet("activa")]
    public IActionResult ObtenerActiva([FromQuery] int sucursalId)
    {
        var userId = GetUserId();
        var result = _cajaService.ObtenerActiva(sucursalId, userId);
        if (result == null)
        {
            return Ok(new { caja = (object?)null, activa = false });
        }
        return Ok(new { caja = result, activa = true });
    }

    [HttpGet("{cajaId}/preview-cierre")]
    public IActionResult PreviewCierre(int cajaId)
    {
        var result = _cajaService.ObtenerPreviewCierre(cajaId);
        if (result == null)
        {
            return NotFound(new { error = "Caja no encontrada" });
        }
        return Ok(result);
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(claim?.Value ?? "0");
    }
}
