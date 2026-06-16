using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Pedido
{
    [Key]
    public int ID_PEDIDO { get; private set; }

    public int ID_SUCURSAL { get; private set; }

    public int ID_PROVEEDOR { get; private set; }

    public int ID_USUARIO { get; private set; }

    public DateTime FECHA_PEDIDO { get; private set; }

    public DateTime? FECHA_ESPERADA { get; private set; }

    public decimal TOTAL { get; private set; }

    public string? OBSERVACIONES { get; private set; }

    public string ESTADO { get; private set; } = null!;

    public int? ID_PEDIDO_ORIGEN { get; private set; }

    private readonly List<RenglonPedido> _RENGLONES = new();

    public IReadOnlyCollection<RenglonPedido> RENGLONES => _RENGLONES;

    public Pedido(
        int idSucursal,
        int idProveedor,
        int idUsuario,
        DateTime? fechaEsperada = null,
        string? observaciones = null,
        int? idPedidoOrigen = null)
    {
        if (idSucursal <= 0)
            throw new ArgumentException("Sucursal inválida", nameof(idSucursal));
        if (idProveedor <= 0)
            throw new ArgumentException("Proveedor inválido", nameof(idProveedor));
        if (idUsuario <= 0)
            throw new ArgumentException("Usuario inválido", nameof(idUsuario));

        ID_SUCURSAL = idSucursal;
        ID_PROVEEDOR = idProveedor;
        ID_USUARIO = idUsuario;
        FECHA_PEDIDO = DateTime.Now;
        FECHA_ESPERADA = fechaEsperada;
        OBSERVACIONES = observaciones;
        ID_PEDIDO_ORIGEN = idPedidoOrigen;
        ESTADO = "Pendiente";
        TOTAL = 0;
    }

    protected Pedido()
    {
    }

    public void AgregarRenglon(RenglonPedido renglon)
    {
        if (renglon == null)
            throw new ArgumentNullException(nameof(renglon));

        _RENGLONES.Add(renglon);
        RecalcularTotal();
    }

    public void AgregarRenglon(int productoId, decimal cantidad, decimal precioUnitarioEstimado, string? descripcion = null)
    {
        if (productoId <= 0 && string.IsNullOrWhiteSpace(descripcion))
            throw new ArgumentException("Producto inválido o descripción requerida", nameof(productoId));

        var renglon = new RenglonPedido(productoId, cantidad, precioUnitarioEstimado, descripcion);
        _RENGLONES.Add(renglon);
        RecalcularTotal();
    }

    public void Cancelar()
    {
        if (ESTADO != "Pendiente")
            throw new InvalidOperationException("Solo se pueden cancelar pedidos pendientes");

        ESTADO = "Cancelado";
    }

    public void Completar()
    {
        if (ESTADO != "Pendiente")
            throw new InvalidOperationException("Solo se pueden completar pedidos pendientes");

        ESTADO = "Completado";
    }

    private void RecalcularTotal()
    {
        TOTAL = _RENGLONES.Sum(r => r.SUBTOTAL);
    }
}
