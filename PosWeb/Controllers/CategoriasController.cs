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
    private readonly PosDbContext _context;

    public CategoriasController(PosDbContext context)
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
                Descripcion = c.DESC_CATEGORIA,
                MargenGanancia = c.MARGEN_GANANCIA
            })
            .ToListAsync();
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
            return Ok(new CategoriaDto
            {
                Id = categoria.ID_CATEGORIA,
                Descripcion = categoria.DESC_CATEGORIA,
                MargenGanancia = categoria.MARGEN_GANANCIA
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public class ActualizarMargenRequest
{
    public decimal? MargenGanancia { get; set; }
}
