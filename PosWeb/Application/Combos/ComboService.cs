using Microsoft.EntityFrameworkCore;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Combos;

public class ComboService
{
    private readonly PosDbContext _context;

    public ComboService(PosDbContext context)
    {
        _context = context;
    }

    public List<ComboDto> ObtenerActivos()
    {
        return _context.Combo
            .Where(c => c.ACTIVO)
            .Include(c => c.ITEMS)
            .OrderBy(c => c.DESC_COMBO)
            .Select(c => new ComboDto
            {
                Id = c.ID_COMBO,
                CodCombo = c.COD_COMBO,
                DescCombo = c.DESC_COMBO,
                Precio = c.PRECIO,
                Activo = c.ACTIVO,
                Items = c.ITEMS.Select(i => new ComboItemDto
                {
                    ProductoId = i.ID_PRODUCTO,
                    Cantidad = i.CANTIDAD,
                    ProductoNombre = _context.Producto
                        .Where(p => p.ID_PRODUCTO == i.ID_PRODUCTO)
                        .Select(p => p.DESC_PRODUCTO)
                        .FirstOrDefault(),
                    CodigoBarra = _context.Producto
                        .Where(p => p.ID_PRODUCTO == i.ID_PRODUCTO)
                        .Select(p => p.CODIGO_BARRAS)
                        .FirstOrDefault()
                }).ToList()
            })
            .ToList();
    }

    public ComboDto ObtenerPorId(int id)
    {
        var combo = _context.Combo
            .Include(c => c.ITEMS)
            .FirstOrDefault(c => c.ID_COMBO == id && c.ACTIVO);

        if (combo == null)
            throw new KeyNotFoundException($"Combo con ID {id} no encontrado");

        return MapToDto(combo);
    }

    public ComboDto ObtenerPorCodigo(string codigo)
    {
        var combo = _context.Combo
            .Include(c => c.ITEMS)
            .FirstOrDefault(c => c.COD_COMBO == codigo.Trim().ToUpperInvariant() && c.ACTIVO);

        if (combo == null)
            throw new KeyNotFoundException($"Combo con código '{codigo}' no encontrado");

        return MapToDto(combo);
    }

    public ComboDto Crear(ComboUpsertDto dto)
    {
        bool existe = _context.Combo.Any(c => c.COD_COMBO == dto.CodCombo.Trim().ToUpperInvariant());
        if (existe)
            throw new InvalidOperationException($"Ya existe un combo con código '{dto.CodCombo}'");

        var combo = new Combo(dto.CodCombo, dto.DescCombo, dto.Precio);

        foreach (var itemDto in dto.Items)
        {
            var producto = _context.Producto.Find(itemDto.ProductoId)
                ?? throw new KeyNotFoundException($"Producto con ID {itemDto.ProductoId} no encontrado");

            if (!producto.ACTIVO)
                throw new InvalidOperationException($"Producto '{producto.DESC_PRODUCTO}' está inactivo");

            combo.AgregarItem(new ComboItem(0, itemDto.ProductoId, itemDto.Cantidad));
        }

        _context.Combo.Add(combo);
        _context.SaveChanges();

        return MapToDto(combo);
    }

    public ComboDto Modificar(int id, ComboUpsertDto dto)
    {
        var combo = _context.Combo
            .Include(c => c.ITEMS)
            .FirstOrDefault(c => c.ID_COMBO == id && c.ACTIVO)
            ?? throw new KeyNotFoundException($"Combo con ID {id} no encontrado");

        var cod = dto.CodCombo.Trim().ToUpperInvariant();
        if (cod != combo.COD_COMBO)
        {
            bool existe = _context.Combo.Any(c => c.COD_COMBO == cod && c.ID_COMBO != id);
            if (existe)
                throw new InvalidOperationException($"Ya existe un combo con código '{dto.CodCombo}'");
            combo.CambiarCodigo(dto.CodCombo);
        }

        combo.CambiarDescripcion(dto.DescCombo);
        combo.CambiarPrecio(dto.Precio);

        var itemsToRemove = _context.ComboItem.Where(i => i.ID_COMBO == id).ToList();
        _context.ComboItem.RemoveRange(itemsToRemove);

        foreach (var itemDto in dto.Items)
        {
            var producto = _context.Producto.Find(itemDto.ProductoId)
                ?? throw new KeyNotFoundException($"Producto con ID {itemDto.ProductoId} no encontrado");

            if (!producto.ACTIVO)
                throw new InvalidOperationException($"Producto '{producto.DESC_PRODUCTO}' está inactivo");

            var nuevoItem = new ComboItem(id, itemDto.ProductoId, itemDto.Cantidad);
            _context.ComboItem.Add(nuevoItem);
        }

        _context.SaveChanges();

        return MapToDto(combo);
    }

    public void Eliminar(int id)
    {
        var combo = _context.Combo.Find(id)
            ?? throw new KeyNotFoundException($"Combo con ID {id} no encontrado");

        combo.Desactivar();
        _context.SaveChanges();
    }

    private ComboDto MapToDto(Combo combo)
    {
        return new ComboDto
        {
            Id = combo.ID_COMBO,
            CodCombo = combo.COD_COMBO,
            DescCombo = combo.DESC_COMBO,
            Precio = combo.PRECIO,
            Activo = combo.ACTIVO,
            Items = _context.ComboItem
                .Where(i => i.ID_COMBO == combo.ID_COMBO)
                .Select(i => new ComboItemDto
                {
                    ProductoId = i.ID_PRODUCTO,
                    Cantidad = i.CANTIDAD,
                    ProductoNombre = _context.Producto
                        .Where(p => p.ID_PRODUCTO == i.ID_PRODUCTO)
                        .Select(p => p.DESC_PRODUCTO)
                        .FirstOrDefault(),
                    CodigoBarra = _context.Producto
                        .Where(p => p.ID_PRODUCTO == i.ID_PRODUCTO)
                        .Select(p => p.CODIGO_BARRAS)
                        .FirstOrDefault()
                }).ToList()
        };
    }
}
