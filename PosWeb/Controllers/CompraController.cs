using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Compras;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/compras")]
[Authorize]
public class CompraController : ControllerBase
{
    private readonly CompraService _compraService;

    public CompraController(CompraService compraService)
    {
        _compraService = compraService;
    }

    [HttpPost("crear")]
    public ActionResult<CompraResponseDto> Crear([FromBody] CompraRequestDto request)
    {
        try
        {
            int userId = GetUserId();
            CompraResponseDto result = _compraService.CrearCompra(
                request.SucursalId,
                request.ProveedorId,
                userId,
                request.Items,
                montoPagado: request.MontoPagado,
                fuentePago: request.FuentePago,
                montoPagadoCaja: request.MontoPagadoCaja);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (CompraSinItemsException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (CompraSinCajaActivaException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ProveedorNoEncontradoException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ProductoCodigoDuplicadoException ex)
        {
            return Conflict(ex.Message);
        }
        catch (ProductoNoEncontradoException ex)
        {
            return NotFound(ex.Message);
        }
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(claim?.Value ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<CompraHistorialDto>>> ObtenerHistorial(
        [FromQuery] DateTime? fechaDesde,
        [FromQuery] DateTime? fechaHasta,
        [FromQuery] int? sucursalId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (fechaDesde.HasValue && fechaHasta.HasValue && fechaDesde > fechaHasta)
            return BadRequest(new { error = "fechaDesde no puede ser posterior a fechaHasta" });

        fechaDesde ??= DateTime.Today.AddDays(-30);
        fechaHasta = fechaHasta?.Date.AddDays(1) ?? DateTime.Today.AddDays(1);

        var filtro = new CompraHistorialFiltro
        {
            FechaDesde = fechaDesde,
            FechaHasta = fechaHasta,
            SucursalId = sucursalId,
            Page = page,
            PageSize = pageSize
        };

        var result = await _compraService.ObtenerHistorialAsync(filtro);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CompraDetalleDto>> ObtenerDetalle(int id)
    {
        var result = await _compraService.ObtenerDetalleAsync(id);
        if (result == null)
            return NotFound(new { error = "Compra no encontrada" });

        return Ok(result);
    }
}
