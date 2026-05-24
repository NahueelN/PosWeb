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
        return Ok(_productoService.ObtenerPorCodigoBarra(codigoBarra));
    }

    [HttpGet("buscar")]
    public IActionResult Buscar([FromQuery] string q, [FromQuery] int? sucursalId = null)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(new List<ProductoDto>());
        }

        if (sucursalId.HasValue)
        {
            return Ok(_productoService.BuscarParaVenta(q.Trim(), sucursalId.Value));
        }

        return Ok(_productoService.BuscarPorNombre(q.Trim()));
    }

    [HttpGet("buscar-venta")]
    public IActionResult BuscarParaVenta([FromQuery] string q, [FromQuery] int sucursalId)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(new List<ProductoDto>());
        }

        if (sucursalId <= 0)
        {
            return BadRequest("sucursalId es requerido");
        }

        return Ok(_productoService.BuscarParaVenta(q.Trim(), sucursalId));
    }

    [HttpPost]
    public IActionResult Post([FromBody] ProductoUpsertDto dto)
    {
        return Ok(_productoService.Crear(dto));
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _productoService.Eliminar(id);
        return NoContent();
    }

    [HttpPut("{id}")]
    public IActionResult Put(int id, [FromBody] ProductoUpsertDto dto)
    {
        return Ok(_productoService.Modificar(id, dto));
    }
}
