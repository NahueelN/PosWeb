using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Ventas;

public class VentaService
{
    private readonly PosDbContext _context;

    public VentaService(PosDbContext context)
    {
        _context = context;
    }

    public VentaResultadoDto CrearVenta(VentaDto dto)
    {
        if (dto.Items == null || dto.Items.Count == 0)
        {
            throw new ArgumentException("La venta debe tener al menos un producto");
        }

        Sucursal? sucursal = _context.Sucursales.Find(dto.SucursalId);

        if (sucursal == null || !sucursal.ACTIVO)
        {
            throw new ArgumentException("Sucursal inválida");
        }

        Venta venta = new Venta(dto.SucursalId);

        foreach (VentaItemDto item in dto.Items)
        {
            Producto? producto = _context.Productos.Find(item.ProductoId);

            if (producto == null || !producto.Activo)
            {
                throw new ArgumentException($"Producto inválido: {item.ProductoId}");
            }

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
}