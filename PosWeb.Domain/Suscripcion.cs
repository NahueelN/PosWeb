using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Suscripcion
{
    [Key]
    public int ID_SUSCRIPCION { get; private set; }

    public int ID_USUARIO_TITULAR { get; private set; }

    public string NIVEL { get; private set; } = null!;

    public string ESTADO { get; private set; } = null!;

    public decimal COSTO_MENSUAL { get; private set; }

    public int MAX_SUCURSALES { get; private set; }

    public int MAX_ADMIN { get; private set; }

    public int MAX_USUARIOS { get; private set; }

    public DateTime FECHA_INICIO { get; private set; }

    public DateTime? FECHA_FIN { get; private set; }

    public DateTime? PROXIMO_COBRO { get; private set; }

    public string? MERCADOPAGO_PREAPPROVAL_ID { get; private set; }

    protected Suscripcion() { }

    public Suscripcion(
        int idUsuarioTitular,
        string nivel,
        decimal costoMensual,
        int maxSucursales,
        int maxAdmin,
        int maxUsuarios)
    {
        if (idUsuarioTitular <= 0)
            throw new ArgumentException("Usuario titular inválido", nameof(idUsuarioTitular));
        if (string.IsNullOrWhiteSpace(nivel))
            throw new ArgumentException("El nivel es requerido", nameof(nivel));
        if (costoMensual < 0)
            throw new ArgumentException("El costo mensual no puede ser negativo", nameof(costoMensual));
        if (maxSucursales <= 0)
            throw new ArgumentException("La cantidad máxima de sucursales debe ser mayor a 0", nameof(maxSucursales));
        if (maxAdmin <= 0)
            throw new ArgumentException("La cantidad máxima de administradores debe ser mayor a 0", nameof(maxAdmin));
        if (maxUsuarios <= 0)
            throw new ArgumentException("La cantidad máxima de usuarios debe ser mayor a 0", nameof(maxUsuarios));

        ID_USUARIO_TITULAR = idUsuarioTitular;
        NIVEL = nivel.Trim();
        ESTADO = "Activa";
        COSTO_MENSUAL = costoMensual;
        MAX_SUCURSALES = maxSucursales;
        MAX_ADMIN = maxAdmin;
        MAX_USUARIOS = maxUsuarios;
        FECHA_INICIO = DateTime.UtcNow;
    }

    public void CambiarEstado(string estado)
    {
        if (string.IsNullOrWhiteSpace(estado))
            throw new ArgumentException("El estado es requerido");
        ESTADO = estado.Trim();
    }

    public void Finalizar()
    {
        ESTADO = "Finalizada";
        FECHA_FIN = DateTime.UtcNow;
    }
}
