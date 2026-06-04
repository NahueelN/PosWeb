using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public static class NivelesSuscripcion
{
    public const string Basica = "Basica";
    public const string Media = "Media";
    public const string Maxima = "Maxima";

    public static readonly string[] Todos = { Basica, Media, Maxima };
}

public static class EstadosSuscripcion
{
    public const string Pendiente = "Pendiente";
    public const string Activa = "Activa";
    public const string Suspendida = "Suspendida";
    public const string Vencida = "Vencida";
    public const string Cancelada = "Cancelada";

    public static readonly string[] Todos = { Pendiente, Activa, Suspendida, Vencida, Cancelada };
}

public class Suscripcion
{
    [Key]
    public int ID_SUSCRIPCION { get; private set; }

    public int ID_USUARIO_TITULAR { get; private set; }

    public string NIVEL { get; private set; } = null!;

    public string ESTADO { get; private set; } = null!;

    public decimal COSTO_MENSUAL { get; private set; }

    public int? MAX_SUCURSALES { get; private set; }

    public int? MAX_ADMINS { get; private set; }

    public int? MAX_USUARIOS { get; private set; }

    public DateTime FECHA_INICIO { get; private set; }

    public DateTime? FECHA_FIN { get; private set; }

    public DateTime? PROXIMO_COBRO { get; private set; }

    public string? MERCADOPAGO_PREAPPROVAL_ID { get; private set; }

    public Suscripcion(
        int usuarioTitularId,
        string nivel,
        decimal costoMensual,
        int? maxSucursales,
        int? maxAdmins,
        int? maxUsuarios,
        string estado = EstadosSuscripcion.Activa,
        DateTime? fechaInicio = null,
        DateTime? fechaFin = null,
        DateTime? proximoCobro = null,
        string? mercadoPagoPreapprovalId = null)
    {
        ID_USUARIO_TITULAR = usuarioTitularId;
        CambiarNivel(nivel, costoMensual, maxSucursales, maxAdmins, maxUsuarios);
        CambiarEstado(estado);
        FECHA_INICIO = fechaInicio ?? DateTime.UtcNow;
        FECHA_FIN = fechaFin;
        PROXIMO_COBRO = proximoCobro;
        MERCADOPAGO_PREAPPROVAL_ID = mercadoPagoPreapprovalId;
    }

    protected Suscripcion()
    {
    }

    public static Suscripcion CrearBasica(int usuarioTitularId, decimal costoMensual = 0m)
    {
        return new Suscripcion(usuarioTitularId, NivelesSuscripcion.Basica, costoMensual, 1, 1, 1);
    }

    public static Suscripcion CrearMedia(int usuarioTitularId, decimal costoMensual = 0m)
    {
        return new Suscripcion(usuarioTitularId, NivelesSuscripcion.Media, costoMensual, 3, 1, 5);
    }

    public static Suscripcion CrearMaxima(int usuarioTitularId, decimal costoMensual = 0m)
    {
        return new Suscripcion(usuarioTitularId, NivelesSuscripcion.Maxima, costoMensual, null, null, null);
    }

    public void CambiarNivel(string nivel, decimal costoMensual, int? maxSucursales, int? maxAdmins, int? maxUsuarios)
    {
        if (!NivelesSuscripcion.Todos.Contains(nivel))
        {
            throw new ArgumentException($"Nivel de suscripción inválido. Debe ser uno de: {string.Join(", ", NivelesSuscripcion.Todos)}");
        }

        if (costoMensual < 0)
        {
            throw new ArgumentException("El costo mensual no puede ser negativo");
        }

        if (maxSucursales.HasValue && maxSucursales <= 0)
        {
            throw new ArgumentException("El máximo de sucursales debe ser mayor a cero o nulo para ilimitado");
        }

        if (maxAdmins.HasValue && maxAdmins <= 0)
        {
            throw new ArgumentException("El máximo de administradores debe ser mayor a cero o nulo para ilimitado");
        }

        if (maxUsuarios.HasValue && maxUsuarios <= 0)
        {
            throw new ArgumentException("El máximo de usuarios debe ser mayor a cero o nulo para ilimitado");
        }

        NIVEL = nivel;
        COSTO_MENSUAL = costoMensual;
        MAX_SUCURSALES = maxSucursales;
        MAX_ADMINS = maxAdmins;
        MAX_USUARIOS = maxUsuarios;
    }

    public void CambiarEstado(string estado)
    {
        if (!EstadosSuscripcion.Todos.Contains(estado))
        {
            throw new ArgumentException($"Estado de suscripción inválido. Debe ser uno de: {string.Join(", ", EstadosSuscripcion.Todos)}");
        }

        ESTADO = estado;
    }

    public void Activar()
    {
        ESTADO = EstadosSuscripcion.Activa;
    }

    public void Suspender()
    {
        ESTADO = EstadosSuscripcion.Suspendida;
    }

    public void Cancelar()
    {
        ESTADO = EstadosSuscripcion.Cancelada;
        FECHA_FIN = DateTime.UtcNow;
    }

    public void Vencer()
    {
        ESTADO = EstadosSuscripcion.Vencida;
        FECHA_FIN = DateTime.UtcNow;
    }

    public void ProgramarProximoCobro(DateTime proximoCobro)
    {
        PROXIMO_COBRO = proximoCobro;
    }

    public void VincularMercadoPago(string preapprovalId)
    {
        if (string.IsNullOrWhiteSpace(preapprovalId))
        {
            throw new ArgumentException("El identificador de Mercado Pago no puede estar vacío");
        }

        MERCADOPAGO_PREAPPROVAL_ID = preapprovalId.Trim();
    }

    public bool EstaActiva()
    {
        return ESTADO == EstadosSuscripcion.Activa;
    }

    public bool PermiteUsuariosIlimitados()
    {
        return MAX_USUARIOS == null;
    }

    public bool PermiteSucursalesIlimitadas()
    {
        return MAX_SUCURSALES == null;
    }
}
