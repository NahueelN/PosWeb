using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Pedidos;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/pedidos")]
[Authorize]
public class PedidosController : ControllerBase
{
    private readonly PedidoService _pedidoService;

    public PedidosController(PedidoService pedidoService)
    {
        _pedidoService = pedidoService;
    }

    [HttpGet]
    public ActionResult<List<PedidoListDto>> Listar(
        [FromQuery] string? proveedor = null,
        [FromQuery] string? estado = null)
    {
        try
        {
            List<PedidoListDto> result = _pedidoService.Listar(proveedor, estado);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("{id}")]
    public ActionResult<PedidoDetailDto> Obtener(int id)
    {
        try
        {
            PedidoDetailDto result = _pedidoService.Obtener(id);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost]
    public ActionResult<PedidoDetailDto> Crear([FromBody] PedidoRequestDto request)
    {
        try
        {
            int userId = GetUserId();
            PedidoDetailDto result = _pedidoService.CrearPedido(request, userId);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ProveedorNoEncontradoException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ProductoNoEncontradoException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost("{id}/recibir")]
    public ActionResult<PedidoDetailDto> Recibir(int id, [FromBody] RecibirPedidoRequestDto request)
    {
        try
        {
            PedidoDetailDto result = _pedidoService.RecibirPedido(id, request, userId: GetUserId());
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ProveedorNoEncontradoException ex)
        {
            return BadRequest(ex.Message);
        }
        catch (ProductoNoEncontradoException ex)
        {
            return NotFound(ex.Message);
        }
        catch (CompraSinCajaActivaException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{id}/cancelar")]
    public ActionResult Cancelar(int id)
    {
        try
        {
            _pedidoService.Cancelar(id);
            return Ok();
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return int.Parse(claim?.Value ?? "0");
    }
}
