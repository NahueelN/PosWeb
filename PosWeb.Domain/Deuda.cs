using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Deuda
{
    [Key]
    public int ID_DEUDA { get; private set; }

    public int? ID_CLIENTE { get; private set; }

    public int? ID_PROVEEDOR { get; private set; }

    public decimal MONTO_DEUDA { get; private set; }

    public DateTime FECHA_DEUDA { get; private set; }

    public DateTime? FECHA_PAGO { get; private set; }

    public bool PAGO { get; private set; }

    public int? ID_VENTA { get; private set; }

    public int? ID_COMPRA { get; private set; }

    // Navigation properties
    public Proveedor Proveedor { get; private set; } = null!;
    public Compra Compra { get; private set; } = null!;

    protected Deuda()
    {
    }

    public Deuda(decimal montoDeuda, int? idCliente = null, int? idProveedor = null, int? idVenta = null, int? idCompra = null)
    {
        if (montoDeuda <= 0)
            throw new ArgumentException("El monto de la deuda debe ser mayor a 0", nameof(montoDeuda));
        if (!idCliente.HasValue && !idProveedor.HasValue)
            throw new ArgumentException("Debe especificar un cliente o un proveedor para la deuda");

        MONTO_DEUDA = montoDeuda;
        ID_CLIENTE = idCliente;
        ID_PROVEEDOR = idProveedor;
        ID_VENTA = idVenta;
        ID_COMPRA = idCompra;
        FECHA_DEUDA = DateTime.UtcNow;
        PAGO = false;
    }

    public void RegistrarPago()
    {
        PAGO = true;
        FECHA_PAGO = DateTime.UtcNow;
    }
}
