namespace PosWeb.Domain;

public class Gasto
{
    public int ID_GASTO { get; private set; }
    public int? ID_CAJA { get; private set; }
    public decimal MONTO { get; private set; }
    public DateTime FECHA_GASTO { get; private set; }
    public string DETALLE { get; private set; } = null!;
    public bool ANULADO { get; private set; }
    public int? ID_USUARIO { get; private set; }

    // EF Core constructor
    protected Gasto() { }

    public Gasto(int? idCaja, decimal monto, string detalle, int? userId = null)
    {
        if (monto <= 0)
            throw new ArgumentException("El monto debe ser positivo", nameof(monto));
        if (string.IsNullOrWhiteSpace(detalle))
            throw new ArgumentException("El detalle es requerido", nameof(detalle));

        ID_CAJA = idCaja;
        MONTO = monto;
        DETALLE = detalle;
        FECHA_GASTO = DateTime.Now;
        ID_USUARIO = userId;
    }

    public void Anular()
    {
        if (ANULADO)
            throw new InvalidOperationException("El gasto ya fue anulado");
        ANULADO = true;
    }
}
