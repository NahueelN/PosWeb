using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Estadisticas;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/estadisticas")]
[Authorize]
public class EstadisticasController : ControllerBase
{
    private readonly EstadisticasService _service;

    public EstadisticasController(EstadisticasService service)
    {
        _service = service;
    }

    [HttpPost]
    public IActionResult Obtener([FromBody] EstadisticasRequestDto request)
    {
        if (request.Desde == default || request.Hasta == default)
            return BadRequest("Debe especificar Desde y Hasta");

        if (request.Desde > request.Hasta)
            return BadRequest("Desde no puede ser mayor a Hasta");

        var resultado = _service.ObtenerEstadisticas(request.Desde, request.Hasta, request.SucursalId);
        return Ok(resultado);
    }
}
