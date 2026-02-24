using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Productos;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/productos")]
public class ProductosController : ControllerBase
{
    private readonly ProductoService _productoService;

    public ProductosController(ProductoService productoService)
    {
        _productoService = productoService;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(_productoService.ObtenerActivos());
    }

    [HttpGet("barra/{codigoBarra}")]
    public IActionResult GetPorCodigoBarra(string codigoBarra)
    {
        try
        {
            return Ok(_productoService.ObtenerPorCodigoBarra(codigoBarra));
        }
        catch (Exception ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost]
    public IActionResult Post(ProductoDto dto)
    {
        try
        {
            return Ok(_productoService.Crear(dto));
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        try
        {
            _productoService.Eliminar(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}