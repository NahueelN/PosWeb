using PosWeb.Domain.Exceptions;

namespace PosWeb.Domain;

public class Venta
{
    public int ID_VENTA { get; private set; }

    public int ID_SUCURSAL { get; private set; }

    public DateTime FECHA { get; private set; }

    public decimal TOTAL { get; private set; }

    private readonly List<RenglonVenta> _RENGLONES = new();

    public IReadOnlyCollection<RenglonVenta> RENGLONES => _RENGLONES;

    public Venta(int sucursalId)
    {
        ID_SUCURSAL = SetSucursalId(sucursalId);
        FECHA = DateTime.Now;
        TOTAL = 0;
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

    public void AgregarRenglon(Producto producto, int cantidad)
    {
        if (producto == null)
        {
            throw new ProductoInvalidoException(0);
        }

        if (cantidad <= 0)
        {
            throw new CantidadInvalidaException(cantidad);
        }

        producto.DescontarStock(cantidad);

        RenglonVenta renglon = new RenglonVenta(
            producto.ID_PRODUCTO,
            cantidad,
            producto.PRECIO
        );

        _RENGLONES.Add(renglon);

        RecalcularTotal();
    }

    private void RecalcularTotal()
    {
        TOTAL = _RENGLONES.Sum(r => r.SUBTOTAL);
    }
}