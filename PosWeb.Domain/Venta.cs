using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Venta
{
    [Key]
    public int ID_VENTA { get; private set; }

    public int ID_SUCURSAL { get; private set; }

    public DateTime FECHA_VENTA { get; private set; }

    public decimal TOTAL { get; private set; }

    public int? ID_USUARIO { get; private set; }

    public int? ID_CLIENTE { get; private set; }

    public bool ANULADA { get; private set; }

    private readonly List<RenglonVenta> _RENGLONES = new();

    public IReadOnlyCollection<RenglonVenta> RENGLONES => _RENGLONES;

    public Venta(int sucursalId, int? usuarioId = null)
    {
        ID_SUCURSAL = SetSucursalId(sucursalId);
        FECHA_VENTA = DateTime.Now;
        TOTAL = 0;
        ID_USUARIO = usuarioId;
    }

    protected Venta()
    {
    }

    private static int SetSucursalId(int sucursalId)
    {
        if (sucursalId <= 0)
        {
            throw new SucursalInvalidaException(sucursalId);
        }

        return sucursalId;
    }

    public void AgregarRenglon(Producto producto, decimal cantidad)
    {
        if (producto == null)
        {
            throw new ProductoInvalidoException(0);
        }

        if (cantidad <= 0)
        {
            throw new CantidadInvalidaException(cantidad);
        }

        RenglonVenta renglon = new RenglonVenta(
            producto.ID_PRODUCTO,
            cantidad,
            producto.PRECIO
        );

        _RENGLONES.Add(renglon);

        RecalcularTotal();
    }

    public void AsignarCliente(int? clienteId)
    {
        ID_CLIENTE = clienteId;
    }

    private void RecalcularTotal()
    {
        TOTAL = _RENGLONES.Sum(r => r.SUBTOTAL);
    }

    public void Anular()
    {
        ANULADA = true;
    }
}
