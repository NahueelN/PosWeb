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

    [HttpGet]
    public async Task<ActionResult<PagedResult<VentaHistorialDto>>> ObtenerHistorial(
        [FromQuery] DateTime? fechaDesde,
        [FromQuery] DateTime? fechaHasta,
        [FromQuery] int? sucursalId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde > fechaHasta)
            return BadRequest(new { error = "fechaDesde no puede ser posterior a fechaHasta" });

        if (sucursalId.HasValue)
        {
            bool existe = await _ventaService.ExisteSucursalAsync(sucursalId.Value);
            if (!existe)
                return BadRequest(new { error = "Sucursal no encontrada" });
        }

        fechaDesde ??= DateTime.Today.AddDays(-30);
        fechaHasta ??= DateTime.Today.AddDays(1);

        var filtro = new VentaHistorialFiltro
        {
            FechaDesde = fechaDesde,
            FechaHasta = fechaHasta,
            SucursalId = sucursalId,
            Page = page,
            PageSize = pageSize
        };

        var result = await _ventaService.ObtenerHistorialAsync(filtro);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<VentaDetalleDto>> ObtenerDetalle(int id)
    {
        var result = await _ventaService.ObtenerDetalleAsync(id);
        if (result == null)
            return NotFound(new { error = "Venta no encontrada" });

        return Ok(result);
    }
}
