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
        AsegurarPendiente();
        ESTADO = "Cancelado";
    }

    public void Completar()
    {
        AsegurarPendiente();
        ESTADO = "Completado";
    }

    public void CambiarProveedor(int idProveedor)
    {
        if (idProveedor <= 0)
            throw new ArgumentException("Proveedor inválido", nameof(idProveedor));
        AsegurarPendiente();
        ID_PROVEEDOR = idProveedor;
    }

    public void CambiarFechaEsperada(DateTime? fechaEsperada)
    {
        AsegurarPendiente();
        FECHA_ESPERADA = fechaEsperada;
    }

    public void SetObservaciones(string? observaciones)
    {
        AsegurarPendiente();
        OBSERVACIONES = string.IsNullOrWhiteSpace(observaciones) ? null : observaciones.Trim();
    }

    public void ReemplazarRenglones(IEnumerable<(int productoId, decimal cantidad, decimal precioUnitarioEstimado, string? descripcion)> items)
    {
        AsegurarPendiente();
        _RENGLONES.Clear();
        foreach (var item in items)
        {
            AgregarRenglon(item.productoId, item.cantidad, item.precioUnitarioEstimado, item.descripcion);
        }
        RecalcularTotal();
    }

    public void ModificarRenglon(int idRenglonPedido, decimal cantidad, decimal precioUnitarioEstimado)
    {
        AsegurarPendiente();
        RenglonPedido? renglon = _RENGLONES.FirstOrDefault(r => r.ID_RENGLON_PEDIDO == idRenglonPedido);
        if (renglon == null)
            throw new ArgumentException("Renglón no encontrado", nameof(idRenglonPedido));
        renglon.Modificar(cantidad, precioUnitarioEstimado);
        RecalcularTotal();
    }

    public void QuitarRenglon(int idRenglonPedido)
    {
        AsegurarPendiente();
        RenglonPedido? renglon = _RENGLONES.FirstOrDefault(r => r.ID_RENGLON_PEDIDO == idRenglonPedido);
        if (renglon != null)
        {
            _RENGLONES.Remove(renglon);
            RecalcularTotal();
        }
    }

    private void AsegurarPendiente()
    {
        if (ESTADO != "Pendiente")
            throw new InvalidOperationException("Solo se pueden editar pedidos pendientes");
    }

    private void RecalcularTotal()
    {
        TOTAL = _RENGLONES.Sum(r => r.SUBTOTAL);
    }
}
