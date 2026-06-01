using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Gastos;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/gastos")]
[Authorize]
public class GastosController : ControllerBase
{
    private readonly GastoService _gastoService;

    public GastosController(GastoService gastoService)
    {
        _gastoService = gastoService;
    }

    [HttpPost]
    public IActionResult Crear([FromBody] CrearGastoRequest request)
    {
        var userId = GetUserId();
        try
        {
            var result = _gastoService.Crear(request.Monto, request.Detalle, userId);
            return Created($"/api/gastos/{result.Id}", result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public IActionResult ObtenerPorCaja([FromQuery] int cajaId)
    {
        var items = _gastoService.ObtenerPorCaja(cajaId);
        return Ok(new { items });
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(claim?.Value ?? "0");
    }
}
