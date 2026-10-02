using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

/// <summary>
/// Configuración por empresa del negocio. Hoy cubre el tipo de negocio (Tienda/Restaurante)
/// y el módulo restaurante (mesas). El tipo de negocio es la fuente de verdad: un negocio
/// tipo Restaurante tiene el módulo mesas habilitado.
/// </summary>
public class EmpresaConfiguracion
{
    public const string TipoTienda = "Tienda";
    public const string TipoRestaurante = "Restaurante";

    [Key]
    public int ID_EMPRESA { get; private set; }

    public string TIPO_NEGOCIO { get; private set; } = TipoTienda;

    public bool MODULO_RESTAURANTE { get; private set; }

    public EmpresaConfiguracion(int idEmpresa)
    {
        ID_EMPRESA = idEmpresa;
        TIPO_NEGOCIO = TipoTienda;
        MODULO_RESTAURANTE = false;
    }

    protected EmpresaConfiguracion()
    {
    }

    public void SetTipoNegocio(string tipoNegocio)
    {
        if (tipoNegocio != TipoTienda && tipoNegocio != TipoRestaurante)
        {
            throw new ArgumentException($"Tipo de negocio inválido. Debe ser {TipoTienda} o {TipoRestaurante}");
        }

        TIPO_NEGOCIO = tipoNegocio;
        MODULO_RESTAURANTE = tipoNegocio == TipoRestaurante;
    }

    public void SetRestauranteHabilitado(bool habilitado)
    {
        MODULO_RESTAURANTE = habilitado;
        TIPO_NEGOCIO = habilitado ? TipoRestaurante : TipoTienda;
    }
}