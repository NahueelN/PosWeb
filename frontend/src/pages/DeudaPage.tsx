import { useEffect, useState, useMemo } from 'react';
import type { DeudaDto, ProveedorDto } from '../types';
import { api } from '../api/client';

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface Distribucion {
  deuda: DeudaDto;
  pago: number;
}

function calcularDistribucion(deudas: DeudaDto[], monto: number): Distribucion[] {
  let restante = monto;
  return deudas.map(d => {
    const pago = Math.min(restante, d.saldoPendiente);
    restante -= pago;
    return { deuda: d, pago };
  });
}

export default function DeudaPage() {
  const [deudas, setDeudas] = useState<DeudaDto[]>([]);
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [proveedorId, setProveedorId] = useState<number>(0);
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<number | null>(null);
  const [payMonto, setPayMonto] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Pago masivo
  const [pagoMasivoMonto, setPagoMasivoMonto] = useState('');
  const [pagandoMasivo, setPagandoMasivo] = useState(false);
  const [exitoMasivo, setExitoMasivo] = useState<string | null>(null);

  // Deudas pendientes del proveedor seleccionado, ordenadas ASC (más vieja primero)
  const deudasProveedor = useMemo(() => {
    if (!proveedorId) return [];
    return [...deudas]
      .filter(d => !d.pago && d.proveedorNombre)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }, [deudas, proveedorId]);

  // Distribución preview
  const distribucionPreview = useMemo(() => {
    const m = parseFloat(pagoMasivoMonto);
    if (!m || m <= 0 || deudasProveedor.length === 0) return [];
    return calcularDistribucion(deudasProveedor, m);
  }, [deudasProveedor, pagoMasivoMonto]);

  const totalPreview = distribucionPreview.reduce((s, d) => s + d.pago, 0);

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

  const handlePagar = async (id: number, monto?: number) => {
    if (monto === undefined && !confirm('¿Pagar el saldo restante de esta deuda?')) return;
    setPaying(id);
    setError(null);
    try {
      await api.deudas.pagar(id, monto);
      setPayMonto(prev => { const n = { ...prev }; delete n[id]; return n; });
      await loadDeudas();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar pago');
    } finally {
      setPaying(null);
    }
  };

  const handlePagarMasivo = async () => {
    const monto = parseFloat(pagoMasivoMonto);
    if (!monto || monto <= 0) return;
    if (!proveedorId) return;
    setPagandoMasivo(true);
    setError(null);
    setExitoMasivo(null);
    try {
      await api.deudas.pagarMultiple(proveedorId, monto);
      setPagoMasivoMonto('');
      setExitoMasivo(`Pago de ${formatCurrency(monto)} registrado correctamente`);
      await loadDeudas();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setPagandoMasivo(false);
    }
  };

  const totalPendiente = deudas
    .filter(d => !d.pago)
    .reduce((sum, d) => sum + d.saldoPendiente, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Deudas a proveedores</h1>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={() => setError(null)} className="text-red-500 text-xs mt-1">Cerrar</button>
          </div>
        )}

        {/* Éxito banner */}
        {exitoMasivo && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 rounded-r-lg">
            <p className="text-green-700 text-sm">{exitoMasivo}</p>
            <button onClick={() => setExitoMasivo(null)} className="text-green-500 text-xs mt-1">Cerrar</button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <select
                value={proveedorId}
                onChange={e => { setProveedorId(Number(e.target.value)); setPagoMasivoMonto(''); }}
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

        {/* Pago masivo por proveedor */}
        {proveedorId > 0 && deudasProveedor.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-4 mb-6">
            <h2 className="text-sm font-bold text-indigo-800 mb-3">
              Pago a {proveedores.find(p => p.id === proveedorId)?.nombre ?? 'proveedor'}
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Ingresá el monto total que le pagás y se distribuye automáticamente desde la deuda más antigua.
            </p>

            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-600 block mb-1">Monto a pagar</label>
                <input type="number" min={0} step="0.01"
                  value={pagoMasivoMonto}
                  onChange={e => setPagoMasivoMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base text-right font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <button onClick={handlePagarMasivo}
                disabled={!pagoMasivoMonto || parseFloat(pagoMasivoMonto) <= 0 || pagandoMasivo}
                className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0">
                {pagandoMasivo ? 'Pagando...' : 'Pagar'}
              </button>
            </div>

            {/* Preview de distribución */}
            {distribucionPreview.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-xs font-semibold text-gray-600">Distribución:</p>
                {distribucionPreview.map(({ deuda, pago }) => (
                  <div key={deuda.id}
                    className={`flex items-center justify-between text-xs px-3 py-1.5 rounded-md ${
                      pago > 0
                        ? pago >= deuda.saldoPendiente
                          ? 'bg-green-50 text-green-800'
                          : 'bg-amber-50 text-amber-800'
                        : 'bg-gray-50 text-gray-400'
                    }`}>
                    <span className="font-medium">{formatDate(deuda.fecha)}</span>
                    <span className="font-mono">
                      {pago > 0 ? formatCurrency(pago) : '—'}
                    </span>
                    {pago > 0 && (
                      <span className="text-[10px] opacity-70">
                        {pago >= deuda.saldoPendiente ? '✓ Pagado' : `Saldo restante: ${formatCurrency(deuda.saldoPendiente - pago)}`}
                      </span>
                    )}
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold text-indigo-700 pt-1 border-t border-dashed border-gray-200 mt-1">
                  <span>Total a pagar</span>
                  <span>{formatCurrency(totalPreview)}</span>
                </div>
              </div>
            )}
          </div>
        )}

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
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Pagado</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
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
                    <td className="px-4 py-3 text-right font-mono">{d.montoPagado > 0 ? formatCurrency(d.montoPagado) : '—'}</td>
                    <td className={`px-4 py-3 text-right font-mono ${d.saldoPendiente > 0 ? 'text-red-600 font-medium' : 'text-green-600'}`}>
                      {formatCurrency(d.saldoPendiente)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(d.fecha)}</td>
                    <td className="px-4 py-3">
                      {d.pago ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          ✓ Pagado {d.fechaPago ? formatDate(d.fechaPago) : ''}
                        </span>
                      ) : d.montoPagado > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Parcial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!d.pago && (
                        <div className="flex items-center gap-1 justify-end">
                          {paying === d.id ? (
                            <span className="text-xs text-gray-400">...</span>
                          ) : (
                            <>
                              <input type="number" min={0} max={d.saldoPendiente} step="0.01"
                                value={payMonto[d.id] ?? ''}
                                onChange={e => setPayMonto(prev => ({ ...prev, [d.id]: e.target.value }))}
                                placeholder="Monto"
                                className="w-20 px-1.5 py-1 border border-gray-300 rounded text-xs text-right font-mono focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                              <button
                                onClick={() => {
                                  const m = parseFloat(payMonto[d.id] || '');
                                  handlePagar(d.id, m > 0 && m <= d.saldoPendiente ? m : undefined);
                                }}
                                className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors"
                              >
                                Pagar
                              </button>
                              <button
                                onClick={() => handlePagar(d.id)}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors"
                                title="Pagar saldo restante"
                              >
                                ✦
                              </button>
                            </>
                          )}
                        </div>
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
