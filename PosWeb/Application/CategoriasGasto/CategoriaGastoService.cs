using Microsoft.EntityFrameworkCore;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.CategoriasGasto;

public class CategoriaGastoService
{
    private readonly PosDbContextLocal _context;

    public CategoriaGastoService(PosDbContextLocal context)
    {
        _context = context;
    }

    public List<CategoriaGastoDto> Listar()
    {
        return _context.Set<CategoriaGasto>()
            .Where(c => c.ACTIVO)
            .OrderBy(c => c.DESCRIPCION)
            .Select(c => new CategoriaGastoDto
            {
                Id = c.ID_CATEGORIA_GASTO,
                Descripcion = c.DESCRIPCION,
            })
            .ToList();
    }

    public CategoriaGastoDto Crear(string descripcion)
    {
        if (string.IsNullOrWhiteSpace(descripcion))
            throw new ArgumentException("La descripción es requerida");

        if (descripcion.Length > 100)
            throw new ArgumentException("La descripción no puede superar los 100 caracteres");

        var categoria = new CategoriaGasto(descripcion);
        _context.Set<CategoriaGasto>().Add(categoria);
        _context.SaveChanges();

        return new CategoriaGastoDto
        {
            Id = categoria.ID_CATEGORIA_GASTO,
            Descripcion = categoria.DESCRIPCION,
        };
    }
}
