using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Sucursales;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/sucursales")]
public class SucursalesController : ControllerBase
{
    private readonly SucursalService _sucursalService;

    public SucursalesController(SucursalService sucursalService)
    {
        _sucursalService = sucursalService;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(_sucursalService.ObtenerActivas());
    }

    [HttpPost]
    public IActionResult Post(SucursalDto dto)
    {
        try
        {
            return Ok(_sucursalService.Crear(dto));
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        try
        {
            _sucursalService.Eliminar(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
