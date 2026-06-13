using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class RenglonPedido
{
    [Key]
    public int ID_RENGLON_PEDIDO { get; private set; }

    public int ID_PEDIDO { get; private set; }

    public int? ID_PRODUCTO { get; private set; }

    public decimal CANTIDAD_PEDIDA { get; private set; }

    public decimal PRECIO_UNITARIO_ESTIMADO { get; private set; }

    public decimal SUBTOTAL { get; private set; }

    public string ESTADO { get; private set; } = null!;

    public string? DESCRIPCION { get; private set; }

    public RenglonPedido(int productoId, decimal cantidad, decimal precioUnitarioEstimado, string? descripcion = null)
    {
        ID_PRODUCTO = SetProductoId(productoId, descripcion);
        CANTIDAD_PEDIDA = SetCantidad(cantidad);
        PRECIO_UNITARIO_ESTIMADO = SetPrecioUnitario(precioUnitarioEstimado);
        SUBTOTAL = cantidad * precioUnitarioEstimado;
        DESCRIPCION = descripcion;
        ESTADO = "Pendiente";
    }

    protected RenglonPedido()
    {
    }

    public void AsignarPedido(int idPedido)
    {
        if (idPedido <= 0)
            throw new ArgumentException("Pedido inválido", nameof(idPedido));

        ID_PEDIDO = idPedido;
    }

    public void MarcarRecibido()
    {
        ESTADO = "Recibido";
    }

    public void MarcarFaltante()
    {
        ESTADO = "Faltante";
    }

    private static int? SetProductoId(int productoId, string? descripcion)
    {
        if (productoId == 0 && !string.IsNullOrWhiteSpace(descripcion))
            return null;

        if (productoId <= 0)
            throw new ProductoInvalidoException(productoId);

        return productoId;
    }

    private static decimal SetCantidad(decimal cantidad)
    {
        if (cantidad <= 0)
            throw new CantidadInvalidaException(cantidad);

        return cantidad;
    }

    private static decimal SetPrecioUnitario(decimal precioUnitario)
    {
        if (precioUnitario < 0)
            throw new PrecioInvalidoException(precioUnitario);

        return precioUnitario;
    }
}
