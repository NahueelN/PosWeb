using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Exceptions;
using PosWeb.Application.OpenFoodFacts;
using PosWeb.Application.Productos;
using PosWeb.Contracts;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/productos")]
public class ProductosController : ControllerBase
{
    private readonly ProductoService _productoService;
    private readonly OpenFoodFactsService _openFoodFactsService;

    public ProductosController(ProductoService productoService, OpenFoodFactsService openFoodFactsService)
    {
        _productoService = productoService;
        _openFoodFactsService = openFoodFactsService;
    }

    [HttpGet]
    public IActionResult Get()
    {
        return Ok(_productoService.ObtenerActivos());
    }

    [HttpGet("barra/{codigoBarra}")]
    public IActionResult GetPorCodigoBarra(string codigoBarra, [FromQuery] int? sucursalId = null)
    {
        if (sucursalId.HasValue)
            return Ok(_productoService.ObtenerPorCodigoBarra(codigoBarra, sucursalId.Value));
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

    /// <summary>
    /// Busca un producto por código de barras: primero en la DB local, luego en Open Food Facts.
    /// </summary>
    [HttpGet("openfoodfacts/{codigo}")]
    public async Task<IActionResult> LookupOpenFoodFacts(string codigo)
    {
        // 1. Buscar en DB local
        try
        {
            var local = _productoService.ObtenerPorCodigoBarra(codigo);
            return Ok(new ProductoLookupResponseDto
            {
                Local = true,
                Producto = local,
                Encontrado = true
            });
        }
        catch (ProductoNoEncontradoException)
        {
            // No existe localmente, continuar
        }

        // 2. Consultar Open Food Facts
        var datos = await _openFoodFactsService.ConsultarAsync(codigo);

        if (datos != null)
        {
            return Ok(new ProductoLookupResponseDto
            {
                Local = false,
                Encontrado = true,
                Datos = datos
            });
        }

        // 3. No encontrado en ningún lado
        return Ok(new ProductoLookupResponseDto
        {
            Local = false,
            Encontrado = false
        });
    }

    [HttpGet("proximo-codigo")]
    public IActionResult GetProximoCodigo()
    {
        var codigo = _productoService.ObtenerSiguienteCodigo();
        return Ok(new { codigo });
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
