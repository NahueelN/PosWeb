using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class RenglonCompra
{
    [Key]
    public int ID_RENGLON_COMPRA { get; private set; }

    public int ID_COMPRA { get; private set; }

    public int ID_PRODUCTO { get; private set; }

    public decimal CANTIDAD { get; private set; }

    public decimal PRECIO_UNITARIO { get; private set; }

    public decimal SUBTOTAL { get; private set; }

    public RenglonCompra(int idProducto, decimal cantidad, decimal precioUnitario)
    {
        ID_PRODUCTO = SetProductoId(idProducto);
        CANTIDAD = SetCantidad(cantidad);
        PRECIO_UNITARIO = SetPrecioUnitario(precioUnitario);
        SUBTOTAL = cantidad * precioUnitario;
    }

    protected RenglonCompra()
    {
    }

    public void AsignarCompra(int idCompra)
    {
        if (idCompra <= 0)
            throw new ArgumentException("Compra inválida", nameof(idCompra));

        ID_COMPRA = idCompra;
    }

    private static int SetProductoId(int idProducto)
    {
        if (idProducto <= 0)
            throw new ProductoInvalidoException(idProducto);

        return idProducto;
    }

    private static decimal SetCantidad(decimal cantidad)
    {
        if (cantidad <= 0)
            throw new CantidadInvalidaException(cantidad);

        return cantidad;
    }

    private static decimal SetPrecioUnitario(decimal precioUnitario)
    {
        if (precioUnitario <= 0)
            throw new PrecioInvalidoException(precioUnitario);

        return precioUnitario;
    }
}
