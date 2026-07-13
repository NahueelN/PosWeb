using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/categorias")]
[Authorize]
public class CategoriasController : ControllerBase
{
    private readonly PosDbContextLocal _context;

    public CategoriasController(PosDbContextLocal context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<List<CategoriaDto>> Listar()
    {
        return await _context.Categoria
            .OrderBy(c => c.DESC_CATEGORIA)
            .Select(c => new CategoriaDto
            {
                Id = c.ID_CATEGORIA,
                Codigo = c.COD_CATEGORIA,
                Descripcion = c.DESC_CATEGORIA,
                MargenGanancia = c.MARGEN_GANANCIA
            })
            .ToListAsync();
    }

    [HttpGet("proximo-codigo")]
    public async Task<ProximoCodigoResponse> ProximoCodigo()
    {
        var codigos = await _context.Categoria
            .Select(c => c.COD_CATEGORIA)
            .ToListAsync();

        var numeros = codigos
            .Select(c => int.TryParse(c, out var n) ? n : (int?)null)
            .Where(n => n.HasValue)
            .Select(n => n!.Value);

        var max = numeros.Any() ? numeros.Max() : 0;
        return new ProximoCodigoResponse { Codigo = (max + 1).ToString() };
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearCategoriaRequest request)
    {
        try
        {
            var codigo = request.Codigo;
            if (string.IsNullOrWhiteSpace(codigo))
            {
                var proximo = await ProximoCodigo();
                codigo = proximo.Codigo;
            }

            var categoria = new Categoria(codigo, request.Descripcion);
            _context.Categoria.Add(categoria);
            await _context.SaveChangesAsync();
            return Created($"/api/categorias/{categoria.ID_CATEGORIA}", MapDto(categoria));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Actualizar(int id, [FromBody] ActualizarCategoriaRequest request)
    {
        var categoria = await _context.Categoria.FindAsync(id);
        if (categoria == null)
            return NotFound(new { error = "Categoría no encontrada" });

        try
        {
            if (!string.IsNullOrWhiteSpace(request.Codigo))
            {
                categoria.CambiarCodigo(request.Codigo);
            }
            categoria.CambiarDescripcion(request.Descripcion);
            await _context.SaveChangesAsync();
            return Ok(MapDto(categoria));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var categoria = await _context.Categoria.FindAsync(id);
        if (categoria == null)
            return NotFound(new { error = "Categoría no encontrada" });

        _context.Categoria.Remove(categoria);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("{id}/margen")]
    public async Task<IActionResult> ActualizarMargen(int id, [FromBody] ActualizarMargenRequest request)
    {
        var categoria = await _context.Categoria.FindAsync(id);
        if (categoria == null)
            return NotFound(new { error = "Categoría no encontrada" });

        try
        {
            categoria.AsignarMargen(request.MargenGanancia);
            await _context.SaveChangesAsync();
            return Ok(MapDto(categoria));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    private static CategoriaDto MapDto(Categoria c) => new()
    {
        Id = c.ID_CATEGORIA,
        Codigo = c.COD_CATEGORIA,
        Descripcion = c.DESC_CATEGORIA,
        MargenGanancia = c.MARGEN_GANANCIA
    };
}

public class CrearCategoriaRequest
{
    public string? Codigo { get; set; }
    public string Descripcion { get; set; } = null!;
}

public class ActualizarCategoriaRequest
{
    public string? Codigo { get; set; }
    public string Descripcion { get; set; } = null!;
}

public class ActualizarMargenRequest
{
    public decimal? MargenGanancia { get; set; }
}

public class ProximoCodigoResponse
{
    public string Codigo { get; set; } = null!;
}
