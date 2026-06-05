using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class RenglonVenta
{
    [Key]
    public int ID_RENGLON_VENTA { get; private set; }

    public int ID_VENTA { get; private set; }

    public int ID_PRODUCTO { get; private set; }

    public decimal CANTIDAD { get; private set; }

    public decimal PRECIO_UNITARIO { get; private set; }

    public decimal SUBTOTAL { get; private set; }

    public RenglonVenta(int productoId, decimal cantidad, decimal precioUnitario)
    {
        ID_PRODUCTO = SetProductoId(productoId);
        CANTIDAD = SetCantidad(cantidad);
        PRECIO_UNITARIO = SetPrecioUnitario(precioUnitario);
        SUBTOTAL = cantidad * precioUnitario;
    }

    protected RenglonVenta()
    {
    }

    private static decimal SetSubtotal(decimal cantidad, decimal precioUnitario)
    {
        return cantidad * precioUnitario;
    }

    private static decimal SetPrecioUnitario(decimal precioUnitario)
    {
        if (precioUnitario <= 0)
        {
            throw new PrecioInvalidoException(precioUnitario);
        }

        return precioUnitario;
    }

    private static decimal SetCantidad(decimal cantidad)
    {
        if (cantidad <= 0)
        {
            throw new CantidadInvalidaException(cantidad);
        }

        return cantidad;
    }

    private static int SetProductoId(int productoId)
    {
        if (productoId <= 0)
        {
            throw new ProductoInvalidoException(productoId);
        }

        return productoId;
    }
}
