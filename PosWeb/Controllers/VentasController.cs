using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Ventas;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/ventas")]
public class VentasController : ControllerBase
{
    private readonly VentaService _ventaService;

    public VentasController(VentaService ventaService)
    {
        _ventaService = ventaService;
    }

    [HttpPost]
    public IActionResult Post(VentaDto dto)
    {
        return Ok(_ventaService.CrearVenta(dto));
    }
}
