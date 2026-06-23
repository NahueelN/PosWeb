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

    [HttpGet("clientes")]
    public async Task<ActionResult<List<DeudaDto>>> ListarClientes(
        [FromQuery] int? clienteId = null,
        [FromQuery] bool soloPendientes = false)
    {
        var deudas = await _deudaService.ListarClientesAsync(clienteId, soloPendientes);
        return Ok(deudas);
    }

    [HttpPost("clientes/crear")]
    public async Task<ActionResult<DeudaDto>> CrearDeudaCliente([FromBody] CrearDeudaClienteRequestDto request)
    {
        try
        {
            var deuda = await _deudaService.CrearDeudaClienteAsync(request.ClienteId, request.VentaId, request.Monto, request.MontoPagado);
            return Ok(deuda);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
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
    public async Task<ActionResult<DeudaDto>> Pagar(int id, [FromBody] PagarDeudaRequestDto? request = null)
    {
        try
        {
            var userId = GetUserId();
            var deuda = await _deudaService.RegistrarPagoAsync(id, request?.Monto, userId);
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
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("pagar-multiple")]
    public async Task<ActionResult<List<DeudaDto>>> PagarMultiple([FromBody] PagarMultipleRequestDto request)
    {
        try
        {
            var userId = GetUserId();
            var deudas = await _deudaService.PagarMultipleAsync(request.ProveedorId, request.Monto, userId);
            return Ok(deudas);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("pagar-multiple-cliente")]
    public async Task<ActionResult<List<DeudaDto>>> PagarMultipleCliente([FromBody] PagarMultipleClienteRequestDto request)
    {
        try
        {
            var userId = GetUserId();
            var deudas = await _deudaService.PagarMultipleClienteAsync(request.ClienteId, request.Monto, userId);
            return Ok(deudas);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("pagos")]
    public async Task<ActionResult<List<PagoDeudaDto>>> ListarPagos(
        [FromQuery] int? clienteId = null,
        [FromQuery] int? proveedorId = null)
    {
        var pagos = await _deudaService.ListarPagosAsync(clienteId, proveedorId);
        return Ok(pagos);
    }

    [HttpGet("cuenta-corriente")]
    public async Task<ActionResult<CuentaCorrienteDto>> CuentaCorriente(
        [FromQuery] int? clienteId = null,
        [FromQuery] int? proveedorId = null)
    {
        try
        {
            var cuenta = await _deudaService.ObtenerCuentaCorrienteAsync(clienteId, proveedorId);
            return Ok(cuenta);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("pagos/{pagoId:int}")]
    public async Task<IActionResult> DeshacerPago(int pagoId)
    {
        try
        {
            await _deudaService.DeshacerPagoAsync(pagoId);
            return Ok(new { success = true });
        }
        catch (DeudaNoEncontradaException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        return int.Parse(claim?.Value ?? "0");
    }
}
