using PosWeb.Application.Exceptions;
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

            if (!producto.Activo)
            {
                throw new ProductoInactivoException(item.ProductoId);
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
