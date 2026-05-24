using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Caja
{
    [Key]
    public int ID_CAJA { get; private set; }

    public int ID_SUCURSAL { get; private set; }

    public string ESTADO { get; private set; } = null!;

    public DateTime FECHA_APERTURA { get; private set; }

    public DateTime? FECHA_CIERRE { get; private set; }

    public decimal MONTO_INICIAL { get; private set; }

    public decimal? MONTO_CONTADO_EFECTIVO { get; private set; }

    public decimal? MONTO_CONTADO_TARJETAS { get; private set; }

    public decimal? DIFERENCIA { get; private set; }

    public decimal MONTO_GASTOS { get; private set; }

    public int ID_USUARIO_APERTURA { get; private set; }

    public int? ID_USUARIO_CIERRE { get; private set; }

    public Caja(int sucursalId, decimal montoInicial, int usuarioApertura)
    {
        if (sucursalId <= 0)
        {
            throw new ArgumentException("Sucursal inválida");
        }

        if (montoInicial < 0)
        {
            throw new ArgumentException("El monto inicial no puede ser negativo");
        }

        ID_SUCURSAL = sucursalId;
        MONTO_INICIAL = montoInicial;
        ID_USUARIO_APERTURA = usuarioApertura;
        ESTADO = "Abierta";
        FECHA_APERTURA = DateTime.Now;
    }

    protected Caja()
    {
    }

    public void Cerrar(decimal montoContadoEfectivo, decimal montoContadoTarjetas, int usuarioCierre, decimal gastos = 0)
    {
        if (ESTADO != "Abierta")
        {
            throw new InvalidOperationException("La caja ya está cerrada");
        }

        if (montoContadoEfectivo < 0 || montoContadoTarjetas < 0)
        {
            throw new ArgumentException("Los montos contados no pueden ser negativos");
        }

        if (gastos < 0)
        {
            throw new ArgumentException("Los gastos no pueden ser negativos");
        }

        ESTADO = "Cerrada";
        FECHA_CIERRE = DateTime.Now;
        MONTO_CONTADO_EFECTIVO = montoContadoEfectivo;
        MONTO_CONTADO_TARJETAS = montoContadoTarjetas;
        MONTO_GASTOS = gastos;
        ID_USUARIO_CIERRE = usuarioCierre;
    }

    public void SetDiferencia(decimal totalVentas)
    {
        if (ESTADO != "Cerrada")
        {
            throw new InvalidOperationException("Solo se puede calcular diferencia en cajas cerradas");
        }

        decimal esperado = MONTO_INICIAL + totalVentas - MONTO_GASTOS;
        decimal contado = (MONTO_CONTADO_EFECTIVO ?? 0) + (MONTO_CONTADO_TARJETAS ?? 0);
        DIFERENCIA = esperado - contado;
    }
}
