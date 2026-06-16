using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Compra
{
    [Key]
    public int ID_COMPRA { get; private set; }

    public int NUMERO_COMPROBANTE { get; private set; }

    public int ID_SUCURSAL { get; private set; }

    public int ID_PROVEEDOR { get; private set; }

    public int ID_USUARIO { get; private set; }

    public int? ID_GASTO { get; private set; }

    public int? ID_PEDIDO { get; private set; }

    public DateTime FECHA_COMPRA { get; private set; }

    public decimal TOTAL { get; private set; }

    private readonly List<RenglonCompra> _RENGLONES = new();

    public IReadOnlyCollection<RenglonCompra> RENGLONES => _RENGLONES;

    public Compra(int idSucursal, int idUsuario, int numeroComprobante, int idProveedor, int? idGasto = null)
    {
        if (idSucursal <= 0)
            throw new ArgumentException("Sucursal inválida", nameof(idSucursal));
        if (idUsuario <= 0)
            throw new ArgumentException("Usuario inválido", nameof(idUsuario));
        if (numeroComprobante <= 0)
            throw new ArgumentException("Número de comprobante inválido", nameof(numeroComprobante));
        if (idProveedor <= 0)
            throw new ArgumentException("Proveedor inválido", nameof(idProveedor));

        ID_SUCURSAL = idSucursal;
        ID_USUARIO = idUsuario;
        NUMERO_COMPROBANTE = numeroComprobante;
        ID_PROVEEDOR = idProveedor;
        ID_GASTO = idGasto;
        FECHA_COMPRA = DateTime.Now;
        TOTAL = 0;
    }

    protected Compra()
    {
    }

    public void AgregarRenglon(RenglonCompra renglon)
    {
        if (renglon == null)
            throw new ArgumentNullException(nameof(renglon));

        _RENGLONES.Add(renglon);
        RecalcularTotal();
    }

    public void AgregarRenglon(Producto producto, decimal cantidad, decimal precioUnitario)
    {
        if (producto == null)
            throw new ArgumentNullException(nameof(producto));

        var renglon = new RenglonCompra(producto.ID_PRODUCTO, cantidad, precioUnitario);
        _RENGLONES.Add(renglon);
        RecalcularTotal();
    }

    public void AsignarProveedor(int idProveedor)
    {
        if (idProveedor <= 0)
            throw new ArgumentException("Proveedor inválido", nameof(idProveedor));

        ID_PROVEEDOR = idProveedor;
    }

    public void AsignarGasto(int? idGasto)
    {
        ID_GASTO = idGasto;
    }

    public void AsignarPedido(int idPedido)
    {
        if (idPedido <= 0)
            throw new ArgumentException("Pedido inválido", nameof(idPedido));

        ID_PEDIDO = idPedido;
    }

    private void RecalcularTotal()
    {
        TOTAL = _RENGLONES.Sum(r => r.SUBTOTAL);
    }
}
