using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Exceptions;
using PosWeb.Application.StockSucursales;
using PosWeb.Contracts;
using PosWeb.Domain;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/stock")]
[Authorize(Roles = $"{Roles.SuperAdmin},{Roles.Admin}")]
public class StockController : ControllerBase
{
    private readonly StockSucursalService _stockService;

    public StockController(StockSucursalService stockService)
    {
        _stockService = stockService;
    }

    [HttpGet]
    public ActionResult<List<StockSucursalDto>> Listar([FromQuery] int sucursalId)
    {
        if (sucursalId <= 0)
        {
            return BadRequest("sucursalId es requerido");
        }

        try
        {
            return Ok(_stockService.ListarPorSucursal(sucursalId));
        }
        catch (SucursalNoExisteException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("bajo")]
    public ActionResult<List<StockSucursalDto>> BajoStock(
        [FromQuery] int sucursalId,
        [FromQuery] int limite = 5)
    {
        if (sucursalId <= 0)
        {
            return BadRequest("sucursalId es requerido");
        }

        try
        {
            return Ok(_stockService.ListarBajoStock(sucursalId, limite));
        }
        catch (SucursalNoExisteException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPut("ajustar")]
    public ActionResult Ajustar([FromBody] AjustarStockRequest request)
    {
        if (request.ProductoId <= 0 || request.SucursalId <= 0)
        {
            return BadRequest("productoId y sucursalId son requeridos");
        }

        try
        {
            _stockService.AjustarStock(request.ProductoId, request.SucursalId, request.Stock);
            return NoContent();
        }
        catch (SucursalNoExisteException ex)
        {
            return NotFound(ex.Message);
        }
        catch (ProductoNoEncontradoException ex)
        {
            return NotFound(ex.Message);
        }
        catch (ProductoInactivoException ex)
        {
            return NotFound(ex.Message);
        }
    }
}

public record AjustarStockRequest(
    [property: JsonPropertyName("productoId")] int ProductoId,
    [property: JsonPropertyName("sucursalId")] int SucursalId,
    [property: JsonPropertyName("stock")] decimal Stock
);
