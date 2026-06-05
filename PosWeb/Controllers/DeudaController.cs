using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Deudas;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/deudas")]
[Authorize]
public class DeudaController : ControllerBase
{
    private readonly DeudaService _deudaService;

    public DeudaController(DeudaService deudaService)
    {
        _deudaService = deudaService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DeudaDto>>> Listar(
        [FromQuery] int? proveedorId = null,
        [FromQuery] bool soloPendientes = false)
    {
        var deudas = await _deudaService.ListarAsync(proveedorId, soloPendientes);
        return Ok(deudas);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<DeudaDto>> ObtenerPorId(int id)
    {
        try
        {
            var deuda = await _deudaService.ObtenerPorIdAsync(id);
            return Ok(deuda);
        }
        catch (DeudaNoEncontradaException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("{id:int}/pagar")]
    public async Task<ActionResult<DeudaDto>> Pagar(int id)
    {
        try
        {
            var deuda = await _deudaService.RegistrarPagoAsync(id);
            return Ok(deuda);
        }
        catch (DeudaNoEncontradaException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (DeudaYaPagadaException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }
}
