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
                fuentePago: request.FuentePago);
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
}
