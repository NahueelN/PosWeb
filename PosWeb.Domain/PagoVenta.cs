using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class PagoVenta
{
    [Key]
    public int ID_PAGO_VENTA { get; private set; }

    public int ID_VENTA { get; private set; }

    public int ID_MEDIO_PAGO { get; private set; }

    public decimal MONTO { get; private set; }

    public decimal? CON_CAMBIO { get; private set; }

    public decimal CAMBIO { get; private set; }

    public int ID_USUARIO_REGISTRA { get; private set; }

    public PagoVenta(int idVenta, int idMedioPago, decimal monto, int idUsuarioRegistra, decimal? conCambio = null)
    {
        if (monto <= 0)
        {
            throw new ArgumentException("El monto del pago debe ser mayor a 0");
        }

        if (conCambio.HasValue && conCambio.Value < monto)
        {
            throw new ArgumentException("El monto recibido debe ser mayor o igual al monto del pago");
        }

        ID_VENTA = idVenta;
        ID_MEDIO_PAGO = idMedioPago;
        MONTO = monto;
        CON_CAMBIO = conCambio;
        ID_USUARIO_REGISTRA = idUsuarioRegistra;

        if (conCambio.HasValue && conCambio.Value > monto)
        {
            CAMBIO = conCambio.Value - monto;
        }
        else
        {
            CAMBIO = 0;
        }
    }

    protected PagoVenta()
    {
    }
}
