using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Preferencias;

public class PreferenciaService
{
    private readonly PosDbContextLocal _context;

    public PreferenciaService(PosDbContextLocal context)
    {
        _context = context;
    }

    public async Task<Dictionary<string, string>> ObtenerAsync(int userId)
    {
        return await _context.UsuarioPreferencia
            .Where(p => p.ID_USUARIO == userId)
            .ToDictionaryAsync(p => p.CLAVE, p => p.VALOR);
    }

    public async Task GuardarAsync(int userId, Dictionary<string, JsonElement> preferencias)
    {
        if (preferencias == null || preferencias.Count == 0) return;

        var claves = preferencias.Keys.ToList();
        var existentes = await _context.UsuarioPreferencia
            .Where(p => p.ID_USUARIO == userId && claves.Contains(p.CLAVE))
            .ToListAsync();

        var map = existentes.ToDictionary(p => p.CLAVE);

        foreach (var (clave, valor) in preferencias)
        {
            var valorStr = valor.ValueKind switch
            {
                JsonValueKind.String => valor.GetString() ?? string.Empty,
                JsonValueKind.Null => string.Empty,
                _ => valor.GetRawText(),
            };

            if (string.IsNullOrWhiteSpace(valorStr)) continue;

            if (map.TryGetValue(clave, out var existente))
            {
                existente.CambiarValor(valorStr);
            }
            else
            {
                _context.UsuarioPreferencia.Add(new UsuarioPreferencia(userId, clave, valorStr));
            }
        }

        await _context.SaveChangesAsync();
    }
}