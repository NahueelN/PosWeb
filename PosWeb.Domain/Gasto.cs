namespace PosWeb.Domain;

public class Gasto
{
    public int ID_GASTO { get; private set; }
    public int ID_CAJA { get; private set; }
    public decimal MONTO { get; private set; }
    public DateTime FECHA_GASTO { get; private set; }
    public string DETALLE { get; private set; } = null!;

    // EF Core constructor
    protected Gasto() { }

    public Gasto(int idCaja, decimal monto, string detalle)
    {
        if (idCaja <= 0)
            throw new ArgumentException("Caja inválida", nameof(idCaja));
        if (monto <= 0)
            throw new ArgumentException("El monto debe ser positivo", nameof(monto));
        if (string.IsNullOrWhiteSpace(detalle))
            throw new ArgumentException("El detalle es requerido", nameof(detalle));

        ID_CAJA = idCaja;
        MONTO = monto;
        DETALLE = detalle;
        FECHA_GASTO = DateTime.Now;
    }
}
