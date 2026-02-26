using System.Reflection;

namespace PosWeb.Testing;

public static class TestHelpers
{
    /// <summary>
    /// Asigna un valor a una propiedad Id privada o protegida de una entidad,
    /// simulando el comportamiento de EF Core durante los tests.
    /// </summary>
    /// <typeparam name="T">Tipo de la entidad a la que se le asignará el Id.</typeparam>
    /// <param name="entity"> Instancia de la entidad de dominio.</param>
    /// <param name="id"> Valor del identificador a asignar.</param>
    /// <param name="EntityID"> Nombre de la propiedad Id (por ejemplo: "ID_PRODUCTO", "ID_VENTA").</param>
    public static void SetId<T>(T entity, int id, string EntityID)
    {
        PropertyInfo? property = typeof(T)
            .GetProperty(
                EntityID,
                BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic
            );

        if (property == null)
        {
            throw new InvalidOperationException(
                $"La entidad {typeof(T).Name} no tiene una propiedad Id"
            );
        }

        property.SetValue(entity, id);
    }
}