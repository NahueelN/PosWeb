using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Application.StockSucursales;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Ventas;

public class VentaService
{
    private readonly PosDbContext _context;
    private readonly StockSucursalService _stockSucursalService;

    public VentaService(PosDbContext context, StockSucursalService stockSucursalService)
    {
        _context = context;
        _stockSucursalService = stockSucursalService;
    }

    public VentaResultadoDto CrearVenta(VentaDto dto)
    {
        if (dto.Items == null || dto.Items.Count == 0)
        {
            throw new VentaSinItemsException();
        }

        Sucursal? sucursal = _context.Sucursales.Find(dto.SucursalId);

        if (sucursal == null)
        {
            throw new SucursalNoExisteException(dto.SucursalId);
        }

        if (!sucursal.ACTIVO)
        {
            throw new SucursalInactivaException(dto.SucursalId);
        }

        Venta venta = new Venta(dto.SucursalId);

        foreach (VentaItemDto item in dto.Items)
        {
            Producto? producto = _context.Productos.Find(item.ProductoId);

            if (producto == null)
            {
                throw new ProductoNoExisteException(item.ProductoId);
            }

            if (!producto.ACTIVO)
            {
                throw new ProductoInactivoException(item.ProductoId);
            }

            // Per-sucursal stock check
            StockSucursal? stockSuc = _context.StockSucursales
                .FirstOrDefault(s => s.IdProducto == item.ProductoId && s.IdSucursal == dto.SucursalId);

            int available = stockSuc?.Stock ?? 0;

            if (available < item.Cantidad)
            {
                throw new StockSucursalInsuficienteException(
                    producto.NOMBRE,
                    dto.SucursalId,
                    available,
                    item.Cantidad
                );
            }

            stockSuc!.DescontarStock(item.Cantidad);
            venta.AgregarRenglon(producto, item.Cantidad);
        }

        _context.Ventas.Add(venta);
        _context.SaveChanges();

        return new VentaResultadoDto
        {
            VentaId = venta.ID_VENTA,
            Fecha = venta.FECHA,
            Total = venta.TOTAL
        };
    }

    public async Task<bool> ExisteSucursalAsync(int sucursalId)
    {
        return await _context.Sucursales.AnyAsync(s => s.ID_SUCURSAL == sucursalId);
    }

    public async Task<PagedResult<VentaHistorialDto>> ObtenerHistorialAsync(VentaHistorialFiltro filtro)
    {
        IQueryable<Venta> query = _context.Ventas
            .OrderByDescending(v => v.FECHA);

        if (filtro.FechaDesde.HasValue)
            query = query.Where(v => v.FECHA >= filtro.FechaDesde.Value);

        if (filtro.FechaHasta.HasValue)
            query = query.Where(v => v.FECHA <= filtro.FechaHasta.Value);

        if (filtro.SucursalId.HasValue)
            query = query.Where(v => v.ID_SUCURSAL == filtro.SucursalId.Value);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((filtro.Page - 1) * filtro.PageSize)
            .Take(filtro.PageSize)
            .Select(v => new VentaHistorialDto
            {
                VentaId = v.ID_VENTA,
                Fecha = v.FECHA,
                SucursalNombre = _context.Sucursales
                    .Where(s => s.ID_SUCURSAL == v.ID_SUCURSAL)
                    .Select(s => s.NOMBRE)
                    .FirstOrDefault(),
                Total = v.TOTAL,
                CantidadItems = v.RENGLONES.Count
            })
            .ToListAsync();

        return new PagedResult<VentaHistorialDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = filtro.Page,
            PageSize = filtro.PageSize
        };
    }

    public async Task<VentaDetalleDto?> ObtenerDetalleAsync(int ventaId)
    {
        Venta? venta = await _context.Ventas.FindAsync(ventaId);
        if (venta == null) return null;

        string? sucursalNombre = await _context.Sucursales
            .Where(s => s.ID_SUCURSAL == venta.ID_SUCURSAL)
            .Select(s => s.NOMBRE)
            .FirstOrDefaultAsync();

        var items = await (
            from r in _context.RenglonesVenta
            join p in _context.Productos on r.ID_PRODUCTO equals p.ID_PRODUCTO
            where EF.Property<int>(r, "ID_VENTA") == ventaId
            select new RenglonHistorialDto
            {
                ProductoId = r.ID_PRODUCTO,
                ProductoNombre = p.NOMBRE,
                CodigoBarra = p.CODIGO_BARRA,
                Cantidad = r.CANTIDAD,
                PrecioUnitario = r.PRECIO_UNITARIO,
                Subtotal = r.SUBTOTAL
            }
        ).ToListAsync();

        return new VentaDetalleDto
        {
            VentaId = venta.ID_VENTA,
            Fecha = venta.FECHA,
            SucursalId = venta.ID_SUCURSAL,
            SucursalNombre = sucursalNombre,
            Total = venta.TOTAL,
            Items = items
        };
    }
}
