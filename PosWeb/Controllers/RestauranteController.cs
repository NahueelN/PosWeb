using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Restaurante;
using PosWeb.Contracts;
using PosWeb.Domain;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/restaurante")]
[Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin}")]
public class RestauranteController : ControllerBase
{
    private readonly RestauranteService _restauranteService;

    public RestauranteController(RestauranteService restauranteService)
    {
        _restauranteService = restauranteService;
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        return claim != null && int.TryParse(claim.Value, out var id) ? id : 0;
    }

    // Configuración del módulo
    [HttpGet("config")]
    public IActionResult Config()
    {
        var tipo = _restauranteService.ObtenerTipoNegocio();
        return Ok(new RestauranteConfigDto
        {
            Habilitado = tipo == EmpresaConfiguracion.TipoRestaurante,
            TipoNegocio = tipo,
        });
    }

    [HttpPut("config")]
    public IActionResult SetConfig([FromBody] RestauranteConfigDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.TipoNegocio))
        {
            _restauranteService.SetTipoNegocio(dto.TipoNegocio);
        }
        else
        {
            _restauranteService.SetRestauranteHabilitado(dto.Habilitado);
        }

        return Ok(new RestauranteConfigDto
        {
            Habilitado = _restauranteService.ObtenerRestauranteHabilitado(),
            TipoNegocio = _restauranteService.ObtenerTipoNegocio(),
        });
    }

    // Mesas
    [HttpGet("mesas")]
    public IActionResult ListarMesas([FromQuery] int sucursalId)
    {
        if (sucursalId <= 0)
            return BadRequest(new { error = "Sucursal inválida" });

        return Ok(_restauranteService.ListarMesas(sucursalId));
    }

    [HttpPost("mesas")]
    public IActionResult CrearMesa([FromBody] UpsertMesaRequest req)
    {
        return Ok(_restauranteService.CrearMesa(req));
    }

    [HttpPut("mesas/{id:int}")]
    public IActionResult ActualizarMesa(int id, [FromBody] UpsertMesaRequest req)
    {
        return Ok(_restauranteService.ActualizarMesa(id, req));
    }

    [HttpDelete("mesas/{id:int}")]
    public IActionResult EliminarMesa(int id)
    {
        _restauranteService.EliminarMesa(id);
        return NoContent();
    }

    // Sesiones (cuentas)
    [HttpPost("mesas/{mesaId:int}/abrir")]
    public IActionResult AbrirSesion(int mesaId)
    {
        return Ok(_restauranteService.AbrirSesion(mesaId, GetUserId()));
    }

    [HttpGet("sesiones/abiertas")]
    public IActionResult SesionesAbiertas([FromQuery] int sucursalId)
    {
        if (sucursalId <= 0)
            return BadRequest(new { error = "Sucursal inválida" });

        return Ok(_restauranteService.ListarSesionesAbiertas(sucursalId));
    }

    [HttpGet("sesiones/{id:int}")]
    public IActionResult ObtenerSesion(int id)
    {
        return Ok(_restauranteService.ObtenerSesion(id));
    }

    [HttpPost("sesiones/{id:int}/items")]
    public IActionResult AgregarItem(int id, [FromBody] AgregarItemComandaRequest req)
    {
        return Ok(_restauranteService.AgregarItem(id, req));
    }

    [HttpPut("items/{itemId:int}")]
    public IActionResult ActualizarItem(int itemId, [FromBody] ActualizarItemComandaRequest req)
    {
        return Ok(_restauranteService.ActualizarItem(itemId, req));
    }

    [HttpPut("items/{itemId:int}/estado")]
    public IActionResult CambiarEstadoItem(int itemId, [FromBody] CambiarEstadoItemRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Estado))
            return BadRequest(new { error = "Estado requerido" });

        _restauranteService.CambiarEstadoItem(itemId, req.Estado);
        return NoContent();
    }

    [HttpPut("items/estado-batch")]
    public IActionResult CambiarEstadoItems([FromBody] CambiarEstadoItemsRequest req)
    {
        if (req.Items == null || req.Items.Length == 0)
            return BadRequest(new { error = "Debe indicar al menos un item" });

        if (string.IsNullOrWhiteSpace(req.Estado))
            return BadRequest(new { error = "Estado requerido" });

        var actualizados = _restauranteService.CambiarEstadoItems(req.Items, req.Estado);
        return Ok(new { actualizados });
    }

    [HttpPost("sesiones/{desde:int}/unificar/{hacia:int}")]
    public IActionResult Unificar(int desde, int hacia)
    {
        return Ok(_restauranteService.UnificarSesiones(desde, hacia));
    }

    [HttpPost("sesiones/{id:int}/cobrar")]
    public async Task<IActionResult> Cobrar(int id, [FromBody] CobrarCuentaRequest req)
    {
        return Ok(await _restauranteService.CobrarCuenta(id, req, GetUserId()));
    }

    [HttpPost("sesiones/{id:int}/cancelar")]
    public IActionResult Cancelar(int id)
    {
        _restauranteService.CancelarSesion(id);
        return NoContent();
    }
}

public record CambiarEstadoItemRequest(string Estado);