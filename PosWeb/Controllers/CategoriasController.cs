using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosWeb.Contracts;
using PosWeb.Data;

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
                Descripcion = c.DESC_CATEGORIA
            })
            .ToListAsync();
    }
}
