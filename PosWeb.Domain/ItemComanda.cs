using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public static class EstadosItemComanda
{
    public const string Pendiente = "Pendiente";
    public const string EnCocina = "EnCocina";
    public const string Servido = "Servido";
    public const string Devuelto = "Devuelto";
    public const string Cancelado = "Cancelado";

    public static readonly string[] Todos = { Pendiente, EnCocina, Servido, Devuelto, Cancelado };
}

/// <summary>
/// Grupos de la comanda: rondas/batches que se envían juntos a cocina.
/// Se eligen al agregar (cualquier producto/combo puede ir a cualquier grupo).
/// </summary>
public static class GruposComanda
{
    public const string Entrada = "Entrada";
    public const string Principal = "Principal";
    public const string Postre = "Postre";
    public const string Otros = "Otros";

    public static readonly string[] Todos = { Entrada, Principal, Postre, Otros };
}

/// <summary>
/// Item de una comanda de mesa. Captura descripción y precio en el momento del alta,
/// y registra el estado del plato (pendiente → en cocina → servido / devuelto / cancelado).
/// No maneja stock: la venta de mesa se cobra sin descontar stock.
/// </summary>
public class ItemComanda
{
    [Key]
    public int ID_ITEM_COMANDA { get; private set; }

    public int ID_SESION_MESA { get; private set; }

    public int? ID_PRODUCTO { get; private set; }

    public int? ID_COMBO { get; private set; }

    public string DESCRIPCION { get; private set; } = null!;

    public decimal CANTIDAD { get; private set; }

    public decimal PRECIO_UNITARIO { get; private set; }

    public string? NOTA { get; private set; }

    public string ESTADO { get; private set; } = EstadosItemComanda.Pendiente;

    /// <summary>Grupo/ronda de la comanda al que pertenece (se envía junto a cocina).</summary>
    public string GRUPO { get; private set; } = GruposComanda.Principal;

    public DateTime FECHA_ALTA { get; private set; } = DateTime.Now;

    public DateTime? FECHA_ESTADO { get; private set; }

    /// <summary>El item se suma a la cuenta cuando está pendiente, en cocina o servido.</summary>
    public bool Contable => ESTADO is EstadosItemComanda.Pendiente
        or EstadosItemComanda.EnCocina
        or EstadosItemComanda.Servido;

    public decimal SUBTOTAL => CANTIDAD * PRECIO_UNITARIO;

    public ItemComanda(int sesionMesaId, int? productoId, int? comboId, string descripcion, decimal cantidad, decimal precioUnitario, string? nota = null, string grupo = GruposComanda.Principal)
    {
        if (sesionMesaId <= 0)
            throw new ArgumentException("Sesión inválida");
        if (cantidad <= 0)
            throw new ArgumentException("La cantidad debe ser mayor a cero");
        if (precioUnitario < 0)
            throw new ArgumentException("El precio no puede ser negativo");
        if (string.IsNullOrWhiteSpace(descripcion))
            throw new ArgumentException("La descripción es requerida");

        ID_SESION_MESA = sesionMesaId;
        ID_PRODUCTO = productoId;
        ID_COMBO = comboId;
        DESCRIPCION = descripcion.Trim();
        CANTIDAD = cantidad;
        PRECIO_UNITARIO = precioUnitario;
        NOTA = string.IsNullOrWhiteSpace(nota) ? null : nota.Trim();
        CambiarGrupo(grupo);
        FECHA_ALTA = DateTime.Now;
    }

    protected ItemComanda()
    {
    }

    public void CambiarEstado(string estado)
    {
        if (!EstadosItemComanda.Todos.Contains(estado))
            throw new ArgumentException($"Estado de item inválido: {estado}");

        if (ESTADO is EstadosItemComanda.Devuelto or EstadosItemComanda.Cancelado && estado is EstadosItemComanda.Pendiente or EstadosItemComanda.EnCocina)
            throw new InvalidOperationException("No se puede reactivar un item devuelto o cancelado");

        ESTADO = estado;
        FECHA_ESTADO = DateTime.Now;
    }

    public void CambiarCantidad(decimal cantidad)
    {
        if (cantidad <= 0)
            throw new ArgumentException("La cantidad debe ser mayor a cero");

        CANTIDAD = cantidad;
    }

    public void CambiarNota(string? nota)
    {
        NOTA = string.IsNullOrWhiteSpace(nota) ? null : nota.Trim();
    }

    /// <summary>Reasigna el item a otro grupo de la comanda (drag &amp; drop).</summary>
    public void CambiarGrupo(string grupo)
    {
        if (!GruposComanda.Todos.Contains(grupo))
            throw new ArgumentException($"Grupo de comanda inválido: {grupo}");

        GRUPO = grupo;
    }

    /// <summary>Reasigna el item a otra sesión (unificación de mesas).</summary>
    public void MoverA(int sesionMesaId)
    {
        if (sesionMesaId <= 0)
            throw new ArgumentException("Sesión inválida");

        ID_SESION_MESA = sesionMesaId;
    }
}