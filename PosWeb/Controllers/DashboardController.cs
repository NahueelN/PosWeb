using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Analytics;
using PosWeb.Analytics.Models;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly DashboardBuilderService _service;

    public DashboardController(DashboardBuilderService service)
    {
        _service = service;
    }

    /// <summary>
    /// Construye el dashboard: devuelve definiciones disponibles + widgets renderizados.
    /// El frontend envía las instancias del usuario; el backend ejecuta las queries correspondientes.
    /// </summary>
    [HttpPost("build")]
    public async Task<IActionResult> Build(
        [FromQuery] int sucursalId,
        [FromBody] List<WidgetInstance>? instances)
    {
        if (sucursalId <= 0)
            return BadRequest(new { error = "SucursalId es requerido" });

        var result = await _service.BuildDashboardAsync(sucursalId, instances);
        return Ok(result);
    }

    /// <summary>
    /// Retorna solo las definiciones disponibles (sin ejecutar queries).
    /// Útil para el picker de "Agregar Widget" antes de que el usuario elija una visualización.
    /// </summary>
    [HttpGet("definitions")]
    public IActionResult GetDefinitions()
    {
        var definitions = WidgetDefinitionRegistry.GetAll();
        return Ok(definitions);
    }

    /// <summary>
    /// Endpoint legacy: devuelve el dashboard con widgets predefinidos (backward compatibility).
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> Obtener([FromQuery] int sucursalId)
    {
        if (sucursalId <= 0)
            return BadRequest(new { error = "SucursalId es requerido" });

        // Construir con instancias vacías = solo devuelve definiciones, sin widgets renderizados
        var result = await _service.BuildDashboardAsync(sucursalId, null);
        return Ok(result);
    }
}
