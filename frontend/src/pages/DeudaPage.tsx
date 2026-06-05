import { useEffect, useState } from 'react';
import type { DeudaDto, ProveedorDto } from '../types';
import { api } from '../api/client';

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function DeudaPage() {
  const [deudas, setDeudas] = useState<DeudaDto[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [proveedorId, setProveedorId] = useState<number>(0);
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.proveedores.listar().then(setProveedores).catch(() => {});
  }, []);

  const loadDeudas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.deudas.listar(
        proveedorId || undefined,
        soloPendientes
      );
      setDeudas(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar deudas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeudas();
  }, [proveedorId, soloPendientes]);

  const handlePagar = async (id: number) => {
    if (!confirm('¿Confirmar el pago de esta deuda?')) return;
    setPaying(id);
    setError(null);
    try {
      await api.deudas.pagar(id);
      await loadDeudas();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar pago');
    } finally {
      setPaying(null);
    }
  };

  const totalPendiente = deudas
    .filter(d => !d.pago)
    .reduce((sum, d) => sum + d.monto, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Deudas</h1>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <select
                value={proveedorId}
                onChange={e => setProveedorId(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>Todos los proveedores</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                type="checkbox"
                id="soloPendientes"
                checked={soloPendientes}
                onChange={e => setSoloPendientes(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="soloPendientes" className="text-sm text-gray-700">
                Solo pendientes
              </label>
            </div>

            <div className="pt-5 ml-auto">
              <span className="text-sm font-medium text-gray-700">
                Total pendiente:{' '}
                <span className="text-lg font-bold text-red-600">{formatCurrency(totalPendiente)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando deudas...</div>
        ) : deudas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No hay deudas{proveedorId > 0 ? ' para este proveedor' : ''}</p>
            {soloPendientes && (
              <p className="text-gray-400 text-xs mt-1">Desmarcá "Solo pendientes" para ver todas</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deudas.map(d => (
                  <tr key={d.id} className={d.pago ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-3 font-medium text-gray-900">{d.proveedorNombre || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(d.monto)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(d.fecha)}</td>
                    <td className="px-4 py-3">
                      {d.pago ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          ✓ Pagado {d.fechaPago ? formatDate(d.fechaPago) : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!d.pago && (
                        <button
                          onClick={() => handlePagar(d.id)}
                          disabled={paying === d.id}
                          className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {paying === d.id ? '...' : 'Pagar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
