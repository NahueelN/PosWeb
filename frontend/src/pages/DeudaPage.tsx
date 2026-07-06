import { useEffect, useState, useMemo, useRef } from 'react';
import type { DeudaDto, ProveedorDto, ClienteDto, CuentaCorrienteDto } from '../types';
import { api } from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { PageShell } from '../components/shared';
import { formatCurrency } from '../formats';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

type ModoDeuda = 'proveedores' | 'clientes';

interface EntidadResumen {
  id: number;
  nombre: string;
  total: number;
  ultimoPago: string | null;
  ultimaDeuda: string | null;
}

export default function DeudaPage() {
  const [modo, setModo] = useState<ModoDeuda>('clientes');
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [deudas, setDeudas] = useState<DeudaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [periodoActivo, setPeriodoActivo] = useState('');
  const [soloPendientes, setSoloPendientes] = useState(true);
  const { notifyError } = useNotification();

  // Detail view
  const [cuenta, setCuenta] = useState<CuentaCorrienteDto | null>(null);
  const [cuentaLoading, setCuentaLoading] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<EntidadResumen | null>(null);
  const [paying, setPaying] = useState(false);
  const [payMonto, setPayMonto] = useState('');
  const [confirmPay, setConfirmPay] = useState(false);
  const [undoPagoId, setUndoPagoId] = useState<number | null>(null);
  const [histSort, setHistSort] = useState<'fecha' | 'concepto' | 'cargo' | 'pago' | 'saldo' | null>(null);
  const [histDir, setHistDir] = useState<'asc' | 'desc'>('desc');

  const busquedaRef = useRef<HTMLInputElement>(null);
  const payInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { busquedaRef.current?.focus(); }, []);

  const toggleHistSort = (col: 'fecha' | 'concepto' | 'cargo' | 'pago' | 'saldo') => {
    if (histSort !== col) { setHistSort(col); setHistDir('asc'); }
    else if (histDir === 'asc') { setHistDir('desc'); }
    else { setHistSort(null); }
  };

  useEffect(() => {
    api.proveedores.listar().then(setProveedores).catch(() => {});
    api.clientes.listar().then(res => setClientes(res.items ?? [])).catch(() => {});
  }, []);

  const loadDeudas = async () => {
    setLoading(true);
    try {
      const data = modo === 'proveedores'
        ? await api.deudas.listar(undefined, soloPendientes)
        : await api.deudas.listarClientes(undefined, soloPendientes);
      setDeudas(data);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cargar deudas');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadDeudas(); }, [modo, soloPendientes]);

  // Entity summary: one row per entity with total debt
  const entidades = useMemo(() => {
    const lista = modo === 'proveedores' ? proveedores : clientes;
    return lista
      .map(e => {
        const deudasEntidad = deudas.filter(d => (modo === 'proveedores' ? d.proveedorId : d.clienteId) === e.id);
        const total = deudasEntidad
          .filter(d => !d.pago)
          .reduce((s, d) => s + d.saldoPendiente, 0);
        const fechasPago = deudasEntidad
          .map(d => d.fechaPago)
          .filter((f): f is string => f != null)
          .sort((a, b) => b.localeCompare(a));
        const ultimoPago = fechasPago.length > 0 ? fechasPago[0] : null;
        const fechasDeuda = deudasEntidad
          .map(d => d.fecha)
          .sort((a, b) => b.localeCompare(a));
        const ultimaDeuda = fechasDeuda.length > 0 ? fechasDeuda[0] : null;
        return { id: e.id!, nombre: e.nombre, total, ultimoPago, ultimaDeuda };
      })
      .filter(e => {
        if (soloPendientes && e.total === 0) return false;
        if (!busqueda.trim()) return true;
        return e.nombre.toLowerCase().includes(busqueda.toLowerCase());
      })
      .sort((a, b) => b.total - a.total);
  }, [modo, proveedores, clientes, deudas, busqueda, soloPendientes]);

  const totalGlobal = entidades.reduce((s, e) => s + e.total, 0);

  function aplicarPeriodo(p: string) {
    const hoy = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    let desde = ''; let hasta = '';
    switch (p) {
      case 'hoy': desde = fmt(hoy); hasta = fmt(hoy); break;
      case 'ayer': { const a = new Date(hoy); a.setDate(hoy.getDate() - 1); desde = fmt(a); hasta = fmt(a); break; }
      case 'semana': { const s = new Date(hoy); s.setDate(hoy.getDate() - 7); desde = fmt(s); hasta = fmt(hoy); break; }
      case 'mes_pasado': {
        const mp = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        const mu = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        desde = fmt(mp); hasta = fmt(mu); break;
      }
      case 'este_mes': {
        const em = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        desde = fmt(em); hasta = fmt(hoy); break;
      }
      default: break;
    }
    setFechaDesde(desde); setFechaHasta(hasta); setPeriodoActivo(p);
  }

  function handleFechaChange(tipo: 'desde' | 'hasta', valor: string) {
    if (tipo === 'desde') setFechaDesde(valor); else setFechaHasta(valor);
    setPeriodoActivo('');
  }

  async function openCuenta(entidad: EntidadResumen) {
    setEntidadSeleccionada(entidad);
    setCuentaLoading(true);
    try {
      const data = await api.deudas.cuentaCorriente(
        modo === 'proveedores' ? { proveedorId: entidad.id } : { clienteId: entidad.id }
      );
      setCuenta(data);
      setTimeout(() => payInputRef.current?.focus(), 100);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cargar cuenta corriente');
      setCuenta(null);
    } finally { setCuentaLoading(false); }
  }

  function closeCuenta() {
    setCuenta(null);
    setEntidadSeleccionada(null);
    setPayMonto('');
    setConfirmPay(false);
  }

  async function handlePagar() {
    const monto = parseFloat(payMonto);
    if (!monto || monto <= 0) return;
    if (!entidadSeleccionada) return;
    setPaying(true);
    try {
      if (modo === 'proveedores') {
        await api.deudas.pagarMultiple(entidadSeleccionada.id, monto);
      } else {
        await api.deudas.pagarMultipleCliente(entidadSeleccionada.id, monto);
      }
      setPayMonto('');
      setConfirmPay(false);
      openCuenta(entidadSeleccionada);
      loadDeudas();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al registrar pago');
    } finally { setPaying(false); }
  }

  async function handleDeshacerPago() {
    if (undoPagoId === null) return;
    try {
      await api.deudas.deshacerPago(undoPagoId);
      setUndoPagoId(null);
      openCuenta(entidadSeleccionada!);
      loadDeudas();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al deshacer pago');
    }
  }

  // ── Render ─────────────────────────────────────────────

  const ledgerDesc = useMemo(() => {
    if (!cuenta) return [];
    let list = [...cuenta.movimientos];
    // Date filter
    if (fechaDesde) {
      const desde = new Date(fechaDesde + 'T00:00:00');
      list = list.filter(m => new Date(m.fecha) >= desde);
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta + 'T23:59:59');
      list = list.filter(m => new Date(m.fecha) <= hasta);
    }
    if (histSort) {
      list.sort((a, b) => {
        let cmp = 0;
        if (histSort === 'fecha') cmp = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
        else if (histSort === 'concepto') cmp = (a.descripcion || '').localeCompare(b.descripcion || '');
        else if (histSort === 'cargo') cmp = (a.tipo === 'deuda' ? a.monto : 0) - (b.tipo === 'deuda' ? b.monto : 0);
        else if (histSort === 'pago') cmp = (a.tipo === 'pago' ? a.monto : 0) - (b.tipo === 'pago' ? b.monto : 0);
        else {
          const sa = a.tipo === 'deuda' ? a.monto : -a.monto;
          const sb = b.tipo === 'deuda' ? b.monto : -b.monto;
          cmp = sa - sb;
        }
        return histDir === 'asc' ? cmp : -cmp;
      });
    } else {
      list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }
    return list;
  }, [cuenta, histSort, histDir]);

  const movsConSaldoCrono = useMemo(() => {
    if (!cuenta) return [];
    const crono = [...cuenta.movimientos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    let running = 0;
    return crono.map(m => {
      if (m.tipo === 'deuda') running += m.monto;
      else running -= m.monto;
      return { ...m, saldo: running };
    });
  }, [cuenta]);

  function getSaldo(m: { fecha: string; tipo: string; monto: number; descripcion?: string }) {
    const found = movsConSaldoCrono.find(x =>
      x.fecha === m.fecha && x.tipo === m.tipo && x.monto === m.monto && x.descripcion === m.descripcion
    );
    return found ? found.saldo : 0;
  }

  if (cuenta && entidadSeleccionada) {
    const saldo = cuenta.saldoActual;

    return (
      <PageShell
        title="Deudas"
        subtitle={modo === 'proveedores' ? 'Cuenta de proveedor' : 'Cuenta de cliente'}
        actions={
          <button onClick={closeCuenta} className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1">
            ← Volver
          </button>
        }
      >
        <div className="flex flex-col flex-1 min-h-0">

          {/* Encabezado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 mb-2 sm:mb-3 flex items-center justify-between flex-wrap gap-2 shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{entidadSeleccionada.nombre}</h2>
              <p className="text-xs sm:text-sm text-gray-500">{modo === 'proveedores' ? 'Cuenta de proveedor' : 'Cuenta de cliente'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Saldo pendiente</p>
              <p className={`text-xl sm:text-2xl font-black ${
                saldo === 0 ? 'text-emerald-600' : saldo < 1000 ? 'text-amber-600' : 'text-red-600'
              }`}>{formatCurrency(saldo)}</p>
              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                saldo === 0 ? 'bg-emerald-100 text-emerald-700' :
                saldo < 1000 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {saldo === 0 ? 'Al día' : saldo < 1000 ? 'Deuda baja' : 'Pendiente'}
              </span>
            </div>
          </div>

          {/* Registrar pago */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 sm:p-3 mb-2 sm:mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 shrink-0 hidden sm:inline">Registrar pago</span>
              <div className="relative flex-1">
                <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs sm:text-sm">$</span>
                <input type="number" ref={payInputRef} min={0} step="0.01" value={payMonto} onChange={e => setPayMonto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const m = parseFloat(payMonto); if (m > 0) setConfirmPay(true); } }}
                  placeholder="0.00" disabled={saldo === 0}
                  className="w-full pl-6 sm:pl-7 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400" />
              </div>
              <button onClick={() => setPayMonto((saldo || 0).toFixed(2))}
                disabled={saldo === 0}
                className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shrink-0 disabled:opacity-50">Total</button>
              <button onClick={() => { const m = parseFloat(payMonto); if (m > 0) setConfirmPay(true); }}
                disabled={!payMonto || parseFloat(payMonto) <= 0 || paying || saldo === 0}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0">{paying ? '...' : 'Registrar'}</button>
            </div>
          </div>

          {/* Historial */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
            <div className="px-5 pt-4 pb-2 shrink-0 flex items-center gap-3 flex-wrap">
              <h3 className="text-base font-bold text-gray-900">Historial de movimientos</h3>
              <select value={periodoActivo} onChange={e => aplicarPeriodo(e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Definido por el usuario</option>
                <option value="hoy">Hoy</option>
                <option value="ayer">Ayer</option>
                <option value="semana">Últimos 7 días</option>
                <option value="este_mes">Este mes</option>
                <option value="mes_pasado">Mes pasado</option>
              </select>
              <input type="date" value={fechaDesde} onChange={e => handleFechaChange('desde', e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32" />
              <input type="date" value={fechaHasta} onChange={e => handleFechaChange('hasta', e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-32" />
              {ledgerDesc.length > 0 && (
                <span className="text-xs text-gray-400 ml-auto">{ledgerDesc.length} movimientos</span>
              )}
            </div>
            {cuentaLoading ? (
              <p className="text-sm text-gray-400 text-center py-12">Cargando...</p>
            ) : ledgerDesc.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-12">Sin movimientos registrados</p>
            ) : (
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider sticky top-0 z-10">
                      <th className="px-4 py-2.5 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleHistSort('fecha')}>Fecha{histSort === 'fecha' ? (histDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                      <th className="px-4 py-2.5 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleHistSort('concepto')}>Concepto{histSort === 'concepto' ? (histDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                      <th className="px-4 py-2.5 text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleHistSort('cargo')}>Cargo{histSort === 'cargo' ? (histDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                      <th className="px-4 py-2.5 text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleHistSort('pago')}>Pago{histSort === 'pago' ? (histDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                      <th className="px-4 py-2.5 text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleHistSort('saldo')}>Saldo{histSort === 'saldo' ? (histDir === 'asc' ? ' ▲' : ' ▼') : ''}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledgerDesc.map((m, i) => {
                      const saldoMov = getSaldo(m);
                      return (
                        <tr key={i} className={m.tipo === 'pago' ? 'bg-emerald-50/30' : ''}>
                          <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(m.fecha)}</td>
                          <td className="px-4 py-2.5 text-gray-700">
                            {m.descripcion || (m.tipo === 'pago' ? 'Pago' : 'Deuda')}
                            {m.usuario && m.tipo === 'pago' && <span className="text-[10px] text-gray-400 ml-1">({m.usuario})</span>}
                            {m.tipo === 'pago' && m.pagoId && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setUndoPagoId(m.pagoId!); }}
                                className="ml-2 text-[10px] text-red-400 hover:text-red-600 hover:underline"
                              >Deshacer</button>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs">{m.tipo === 'deuda' ? <span className="text-red-600 font-medium">-{formatCurrency(m.monto)}</span> : ''}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs">{m.tipo === 'pago' ? <span className="text-emerald-600 font-medium">{formatCurrency(m.monto)}</span> : ''}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-gray-900">{formatCurrency(saldoMov)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Footer anclado abajo */}
            {ledgerDesc.length > 0 && (
              <div className="shrink-0 border-t-2 border-gray-300 bg-gray-50">
                <table className="w-full text-sm">
                  <tfoot>
                    <tr>
                      <td className="px-4 py-2 text-[10px] sm:text-xs font-bold text-gray-600">Total deuda</td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2"></td>
                      <td className={`px-4 py-2 text-right font-mono text-[10px] sm:text-xs font-bold ${saldo > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{saldo > 0 ? `-${formatCurrency(saldo)}` : formatCurrency(Math.abs(saldo))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {confirmPay && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setConfirmPay(false)}>
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}
                onKeyDown={e => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const btns = e.currentTarget.querySelectorAll('button');
                    const idx = Array.from(btns).indexOf(document.activeElement as HTMLButtonElement);
                    if (e.key === 'ArrowLeft' && idx > 0) (btns[idx - 1] as HTMLButtonElement).focus();
                    if (e.key === 'ArrowRight' && idx < btns.length - 1) (btns[idx + 1] as HTMLButtonElement).focus();
                  }
                }}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar pago</h3>
                <p className="text-sm text-gray-600 mb-6">¿Registrar un pago de {formatCurrency(parseFloat(payMonto) || 0)} a {entidadSeleccionada?.nombre}?</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmPay(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">Cancelar</button>
                  <button onClick={handlePagar} autoFocus className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 text-sm">Continuar</button>
                </div>
              </div>
            </div>
          )}

          {/* Deshacer pago modal */}
          {undoPagoId !== null && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setUndoPagoId(null)}>
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}
                onKeyDown={e => {
                  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const btns = e.currentTarget.querySelectorAll('button');
                    const idx = Array.from(btns).indexOf(document.activeElement as HTMLButtonElement);
                    if (e.key === 'ArrowLeft' && idx > 0) (btns[idx - 1] as HTMLButtonElement).focus();
                    if (e.key === 'ArrowRight' && idx < btns.length - 1) (btns[idx + 1] as HTMLButtonElement).focus();
                  }
                }}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Deshacer pago</h3>
                <p className="text-sm text-gray-600 mb-6">¿Deshacer este pago? Se revertirá el monto a la deuda.</p>
                <div className="flex gap-3">
                  <button onClick={() => setUndoPagoId(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">Cancelar</button>
                  <button onClick={handleDeshacerPago} autoFocus className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 text-sm">Deshacer</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  // ── Entity list view ──
  return (
    <PageShell
      title="Deudas"
      subtitle="Administre las cuentas pendientes y registre los pagos."
      loading={loading}
      tabs={
        <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-1 w-fit">
          <button onClick={() => setModo('clientes')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${modo === 'clientes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}>
            Clientes
          </button>
          <button onClick={() => setModo('proveedores')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${modo === 'proveedores' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}>
            Proveedores
          </button>
        </div>
      }
    >
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
              <input type="text" ref={busquedaRef} value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder={`Buscar ${modo === 'proveedores' ? 'proveedor' : 'cliente'}...`}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <select value={periodoActivo} onChange={e => aplicarPeriodo(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Definido por el usuario</option>
                <option value="hoy">Hoy</option>
                <option value="ayer">Ayer</option>
                <option value="semana">Últimos 7 días</option>
                <option value="este_mes">Este mes</option>
                <option value="mes_pasado">Mes pasado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input type="date" value={fechaDesde} onChange={e => handleFechaChange('desde', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input type="date" value={fechaHasta} onChange={e => handleFechaChange('hasta', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="soloPendientes" checked={soloPendientes} onChange={e => setSoloPendientes(e.target.checked)}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
              <label htmlFor="soloPendientes" className="text-sm text-gray-700">Solo pendientes</label>
            </div>
            <div className="pt-5 ml-auto">
              <span className="text-sm font-medium text-gray-700">Total general: <span className="text-lg font-bold text-red-600">{formatCurrency(totalGlobal)}</span></span>
            </div>
          </div>
        </div>

        {/* Entity list */}
        {loading ? (
          <p className="text-center text-gray-500 py-12">Cargando...</p>
        ) : entidades.length === 0 ? (
          <p className="text-center text-gray-500 py-12 bg-white rounded-xl border border-dashed border-gray-300">No hay {modo === 'proveedores' ? 'proveedores' : 'clientes'} con deudas</p>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">{modo === 'proveedores' ? 'Proveedor' : 'Cliente'}</th>
                  <th className="px-4 py-3">Última deuda</th>
                  <th className="px-4 py-3">Último pago</th>
                  <th className="px-4 py-3 text-right">Total deuda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entidades.map(e => (
                  <tr key={e.id} onClick={() => openCuenta(e)}
                    className="hover:bg-indigo-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{e.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {e.ultimaDeuda ? formatDate(e.ultimaDeuda) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {e.ultimoPago ? formatDate(e.ultimoPago) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-600">{formatCurrency(e.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </PageShell>
  );
}
