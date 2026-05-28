using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Sucursales;
using PosWeb.Contracts;
using PosWeb.Domain;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/sucursales")]
[Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin}")]
public class SucursalesController : ControllerBase
{
    private readonly SucursalService _sucursalService;

    public SucursalesController(SucursalService sucursalService)
    {
        _sucursalService = sucursalService;
    }

    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get()
    {
        return Ok(_sucursalService.ObtenerActivas());
    }

    [HttpPost]
    public IActionResult Post(SucursalDto dto)
    {
        return Ok(_sucursalService.Crear(dto));
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _sucursalService.Eliminar(id);
        return NoContent();
    }
}
