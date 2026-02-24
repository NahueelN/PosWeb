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
        try
        {
            VentaResultadoDto resultado = _ventaService.CrearVenta(dto);
            return Ok(resultado);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}