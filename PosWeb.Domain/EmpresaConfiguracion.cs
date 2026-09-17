using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

/// <summary>
/// Configuración por empresa del módulo restaurante (mesas). El módulo es habilitable:
/// off por defecto.
/// </summary>
public class EmpresaConfiguracion
{
    [Key]
    public int ID_EMPRESA { get; private set; }

    public bool MODULO_RESTAURANTE { get; private set; }

    public EmpresaConfiguracion(int idEmpresa)
    {
        ID_EMPRESA = idEmpresa;
        MODULO_RESTAURANTE = false;
    }

    protected EmpresaConfiguracion()
    {
    }

    public void SetRestauranteHabilitado(bool habilitado)
    {
        MODULO_RESTAURANTE = habilitado;
    }
}