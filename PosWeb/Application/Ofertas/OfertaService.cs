using Microsoft.EntityFrameworkCore;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Ofertas;

public class OfertaService
{
    private readonly PosDbContext _context;

    public OfertaService(PosDbContext context)
    {
        _context = context;
    }

    public List<OfertaDto> ObtenerTodos()
    {
        return _context.Oferta
            .OrderBy(o => o.FECHA_INICIO)
            .Select(o => new OfertaDto
            {
                Id = o.ID_OFERTA,
                FechaInicio = o.FECHA_INICIO,
                FechaFin = o.FECHA_FIN,
                ProductoId = o.ID_PRODUCTO,
                ProductoNombre = _context.Producto
                    .Where(p => p.ID_PRODUCTO == o.ID_PRODUCTO)
                    .Select(p => p.DESC_PRODUCTO)
                    .FirstOrDefault(),
                CodigoBarra = _context.Producto
                    .Where(p => p.ID_PRODUCTO == o.ID_PRODUCTO)
                    .Select(p => p.CODIGO_BARRAS)
                    .FirstOrDefault(),
                Descuento = o.DESCUENTO,
                Activo = o.ACTIVO,
                DiasSemana = o.DIAS_SEMANA
            })
            .ToList();
    }

    public OfertaDto ObtenerPorId(int id)
    {
        var oferta = _context.Oferta
            .FirstOrDefault(o => o.ID_OFERTA == id && o.ACTIVO);

        if (oferta == null)
            throw new KeyNotFoundException($"Oferta con ID {id} no encontrada");

        return MapToDto(oferta);
    }

    public OfertaDto Crear(OfertaUpsertDto dto)
    {
        var producto = _context.Producto.Find(dto.ProductoId)
            ?? throw new KeyNotFoundException($"Producto con ID {dto.ProductoId} no encontrado");

        if (!producto.ACTIVO)
            throw new InvalidOperationException($"Producto '{producto.DESC_PRODUCTO}' está inactivo");

        var oferta = new Oferta(dto.FechaInicio, dto.FechaFin, dto.ProductoId, dto.Descuento, dto.DiasSemana);

        _context.Oferta.Add(oferta);
        _context.SaveChanges();

        return MapToDto(oferta);
    }

    public OfertaDto Modificar(int id, OfertaUpsertDto dto)
    {
        var oferta = _context.Oferta
            .FirstOrDefault(o => o.ID_OFERTA == id && o.ACTIVO)
            ?? throw new KeyNotFoundException($"Oferta con ID {id} no encontrada");

        var producto = _context.Producto.Find(dto.ProductoId)
            ?? throw new KeyNotFoundException($"Producto con ID {dto.ProductoId} no encontrado");

        if (!producto.ACTIVO)
            throw new InvalidOperationException($"Producto '{producto.DESC_PRODUCTO}' está inactivo");

        oferta.CambiarFechas(dto.FechaInicio, dto.FechaFin);
        oferta.CambiarProducto(dto.ProductoId);
        oferta.CambiarDescuento(dto.Descuento);
        oferta.CambiarDiasSemana(dto.DiasSemana);

        _context.SaveChanges();

        return MapToDto(oferta);
    }

    public void Reactivar(int id)
    {
        var oferta = _context.Oferta.Find(id)
            ?? throw new KeyNotFoundException($"Oferta con ID {id} no encontrada");

        oferta.Activar();
        _context.SaveChanges();
    }

    public void EliminarDefinitivo(int id)
    {
        var oferta = _context.Oferta.Find(id)
            ?? throw new KeyNotFoundException($"Oferta con ID {id} no encontrada");

        _context.Oferta.Remove(oferta);
        _context.SaveChanges();
    }

    public void Eliminar(int id)
    {
        var oferta = _context.Oferta.Find(id)
            ?? throw new KeyNotFoundException($"Oferta con ID {id} no encontrada");

        oferta.Desactivar();
        _context.SaveChanges();
    }

    private OfertaDto MapToDto(Oferta oferta)
    {
        return new OfertaDto
        {
            Id = oferta.ID_OFERTA,
            FechaInicio = oferta.FECHA_INICIO,
            FechaFin = oferta.FECHA_FIN,
            ProductoId = oferta.ID_PRODUCTO,
            ProductoNombre = _context.Producto
                .Where(p => p.ID_PRODUCTO == oferta.ID_PRODUCTO)
                .Select(p => p.DESC_PRODUCTO)
                .FirstOrDefault(),
            CodigoBarra = _context.Producto
                .Where(p => p.ID_PRODUCTO == oferta.ID_PRODUCTO)
                .Select(p => p.CODIGO_BARRAS)
                .FirstOrDefault(),
            Descuento = oferta.DESCUENTO,
            Activo = oferta.ACTIVO,
            DiasSemana = oferta.DIAS_SEMANA
        };
    }
}
