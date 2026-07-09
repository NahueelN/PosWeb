using Microsoft.EntityFrameworkCore;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Combos;

public class ComboService
{
    private readonly PosDbContextLocal _context;

    public ComboService(PosDbContextLocal context)
    {
        _context = context;
    }

    public List<ComboDto> ObtenerTodos()
    {
        return _context.Combo
            .Include(c => c.ITEMS)
            .OrderBy(c => c.DESC_COMBO)
            .Select(c => new ComboDto
            {
                Id = c.ID_COMBO,
                CodCombo = c.COD_COMBO,
                DescCombo = c.DESC_COMBO,
                Precio = c.PRECIO,
                Activo = c.ACTIVO,
                FechaInicio = c.FECHA_INICIO,
                FechaFin = c.FECHA_FIN,
                DiasSemana = c.DIAS_SEMANA,
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
            .FirstOrDefault(c => c.ID_COMBO == id);

        if (combo == null)
            throw new KeyNotFoundException($"Combo con ID {id} no encontrado");

        return MapToDto(combo);
    }

    public ComboDto ObtenerPorCodigo(string codigo)
    {
        var combo = _context.Combo
            .Include(c => c.ITEMS)
            .FirstOrDefault(c => c.COD_COMBO == codigo.Trim().ToUpperInvariant());

        if (combo == null)
            throw new KeyNotFoundException($"Combo con código '{codigo}' no encontrado");

        return MapToDto(combo);
    }

    public ComboDto Crear(ComboUpsertDto dto)
    {
        bool existe = _context.Combo.Any(c => c.COD_COMBO == dto.CodCombo.Trim().ToUpperInvariant());
        if (existe)
            throw new InvalidOperationException($"Ya existe un combo con código '{dto.CodCombo}'");

        ValidarCombinacionUnica(dto.Items, null);

        var combo = new Combo(dto.CodCombo, dto.DescCombo, dto.Precio);

        combo.CambiarFechas(dto.FechaInicio, dto.FechaFin);
        combo.CambiarDiasSemana(dto.DiasSemana);

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
        using var transaction = _context.Database.BeginTransaction();
        try
        {
            var combo = _context.Combo
                .Include(c => c.ITEMS)
                .FirstOrDefault(c => c.ID_COMBO == id)
                ?? throw new KeyNotFoundException($"Combo con ID {id} no encontrado");

            var cod = dto.CodCombo.Trim().ToUpperInvariant();
            if (cod != combo.COD_COMBO)
            {
                bool existe = _context.Combo.Any(c => c.COD_COMBO == cod && c.ID_COMBO != id);
                if (existe)
                    throw new InvalidOperationException($"Ya existe un combo con código '{dto.CodCombo}'");
                combo.CambiarCodigo(dto.CodCombo);
            }

            ValidarCombinacionUnica(dto.Items, id);

            combo.CambiarDescripcion(dto.DescCombo);
            combo.CambiarPrecio(dto.Precio);
            combo.CambiarFechas(dto.FechaInicio, dto.FechaFin);
            combo.CambiarDiasSemana(dto.DiasSemana);

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
            transaction.Commit();

            return MapToDto(combo);
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public void Eliminar(int id)
    {
        var combo = _context.Combo.Find(id)
            ?? throw new KeyNotFoundException($"Combo con ID {id} no encontrado");

        combo.Desactivar();
        _context.SaveChanges();
    }

    public void Reactivar(int id)
    {
        var combo = _context.Combo.Find(id)
            ?? throw new KeyNotFoundException($"Combo con ID {id} no encontrado");

        combo.Activar();
        _context.SaveChanges();
    }

    public void EliminarDefinitivo(int id)
    {
        var combo = _context.Combo
            .Include(c => c.ITEMS)
            .FirstOrDefault(c => c.ID_COMBO == id)
            ?? throw new KeyNotFoundException($"Combo con ID {id} no encontrado");

        if (_context.RenglonVenta.Any(r => r.ID_COMBO == id))
            throw new InvalidOperationException("No se puede eliminar: el combo está referenciado en ventas realizadas");

        _context.ComboItem.RemoveRange(combo.ITEMS);
        _context.Combo.Remove(combo);
        _context.SaveChanges();
    }

    private void ValidarCombinacionUnica(List<ComboItemDto> items, int? comboIdExcluido)
    {
        var cantidadItems = items.Count;
        if (cantidadItems == 0) return;

        var combosExistentes = _context.Combo
            .Where(c => c.ACTIVO && (comboIdExcluido == null || c.ID_COMBO != comboIdExcluido.Value))
            .Include(c => c.ITEMS)
            .Where(c => c.ITEMS.Count == cantidadItems)
            .ToList();

        foreach (var existente in combosExistentes)
        {
            bool coincide = true;
            foreach (var nuevoItem in items)
            {
                var match = existente.ITEMS.FirstOrDefault(i =>
                    i.ID_PRODUCTO == nuevoItem.ProductoId && i.CANTIDAD == nuevoItem.Cantidad);
                if (match == null)
                {
                    coincide = false;
                    break;
                }
            }
            if (coincide)
                throw new InvalidOperationException($"Ya existe un combo activo con la misma combinación de productos: '{existente.DESC_COMBO}'");
        }
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
            FechaInicio = combo.FECHA_INICIO,
            FechaFin = combo.FECHA_FIN,
            DiasSemana = combo.DIAS_SEMANA,
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
