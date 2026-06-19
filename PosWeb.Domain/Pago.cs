using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosWeb.Domain;

[Table("PAGOS")]
public class Pago
{
    [Key]
    public int ID_PAGO { get; private set; }

    public int ID_VENTA { get; private set; }

    public int ID_MEDIO_PAGO { get; private set; }

    public decimal MONTO { get; private set; }

    public decimal CAMBIO { get; private set; }

    public int ID_USUARIO_REGISTRA { get; private set; }

    /// <summary>
    /// ID_CAJA FK → CAJAS(ID_CAJA). For existing records migrated from the old schema,
    /// this defaults to 0 (sentinel) — needs manual reconcile.
    /// </summary>
    public int ID_CAJA { get; private set; }

    public Pago(int idVenta, int idMedioPago, decimal monto, int idUsuarioRegistra, int idCaja, decimal? conCambio = null)
    {
        if (monto <= 0)
        {
            throw new ArgumentException("El monto del pago debe ser mayor a 0");
        }

        ID_VENTA = idVenta;
        ID_MEDIO_PAGO = idMedioPago;
        MONTO = monto;
        ID_USUARIO_REGISTRA = idUsuarioRegistra;
        ID_CAJA = idCaja;

        if (conCambio.HasValue && conCambio.Value > monto)
        {
            CAMBIO = conCambio.Value - monto;
        }
        else
        {
            CAMBIO = 0;
        }
    }

    protected Pago()
    {
    }
}
