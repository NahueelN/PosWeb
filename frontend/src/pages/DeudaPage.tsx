import { useEffect, useState, useMemo, useRef } from 'react';
import type { DeudaDto, ProveedorDto, ClienteDto, CuentaCorrienteDto, CrearDeudaRequestDto, VentaDetalleDto, CompraDetalleDto } from '../types';
import { api } from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { PageShell } from '../components/shared';
import EntidadContactoForm from '../components/shared/EntidadContactoForm';
import DetalleVentaCompraModal from '../components/DetalleVentaCompraModal';
import CompartirMenu from '../components/CompartirMenu';
import Dialog from '../components/ui/Dialog';
import Button from '../components/ui/Button';
import { formatCurrency } from '../formats';
import { buildDeudaMessage } from '../lib/deuda';
import { Plus } from 'lucide-react';

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
  const { notifyError, notifySuccess } = useNotification();
  const { user } = useAuth();

  // Detail view
  const [cuenta, setCuenta] = useState<CuentaCorrienteDto | null>(null);
  const [cuentaLoading, setCuentaLoading] = useState(false);
  const [detalleOrigen, setDetalleOrigen] = useState<{ tipo: 'venta' | 'compra'; detalle: VentaDetalleDto | CompraDetalleDto } | null>(null);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState<EntidadResumen | null>(null);
  const [paying, setPaying] = useState(false);
  const [payMonto, setPayMonto] = useState('');
  const [confirmPay, setConfirmPay] = useState(false);
  const [undoPagoId, setUndoPagoId] = useState<number | null>(null);
  const [anularDeudaId, setAnularDeudaId] = useState<number | null>(null);
  const [histSort, setHistSort] = useState<'fecha' | 'concepto' | 'cargo' | 'pago' | 'saldo' | null>(null);
  const [histDir, setHistDir] = useState<'asc' | 'desc'>('desc');

  const busquedaRef = useRef<HTMLInputElement>(null);
  const payInputRef = useRef<HTMLInputElement>(null);
  const ndBusquedaRef = useRef<HTMLInputElement>(null);
  const ndMontoRef = useRef<HTMLInputElement>(null);

  const [showNuevaDeuda, setShowNuevaDeuda] = useState(false);
  const [ndBusqueda, setNdBusqueda] = useState('');
  const [ndEntidadId, setNdEntidadId] = useState<number | null>(null);
  const [ndMonto, setNdMonto] = useState('');
  const [creandoDeuda, setCreandoDeuda] = useState(false);
  const [ndDropdownAbierto, setNdDropdownAbierto] = useState(false);
  const [ndHighIdx, setNdHighIdx] = useState(-1);
  const [showNuevaEntidad, setShowNuevaEntidad] = useState(false);
  const [nuevaEntidadForm, setNuevaEntidadForm] = useState({ nombre: '', tipoDocumento: '', documento: '', ivaCondicion: 'ConsumidorFinal', telefono: '', mail: '', domicilio: '' });
  const [creandoEntidad, setCreandoEntidad] = useState(false);

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

  const deudasPendientes = useMemo(() => {
    if (!entidadSeleccionada) return [];
    return deudas
      .filter(d => (modo === 'proveedores' ? d.proveedorId : d.clienteId) === entidadSeleccionada.id && d.saldoPendiente > 0)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [deudas, entidadSeleccionada, modo]);

  const entidadContacto = useMemo(() => {
    if (!entidadSeleccionada) return { mail: null as string | null, telefono: null as string | null };
    if (modo === 'proveedores') {
      const p = proveedores.find(x => x.id === entidadSeleccionada.id);
      return { mail: p?.mail ?? null, telefono: p?.telefono ?? null };
    }
    const c = clientes.find(x => x.id === entidadSeleccionada.id);
    return { mail: c?.mail ?? null, telefono: c?.telefono ?? null };
  }, [entidadSeleccionada, modo, proveedores, clientes]);

  const deudaMensaje = useMemo(
    () => buildDeudaMessage(deudasPendientes.map(d => ({ saldoPendiente: d.saldoPendiente, fecha: d.fecha }))),
    [deudasPendientes]
  );

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

  async function handleAnularDeuda() {
    if (anularDeudaId === null || !entidadSeleccionada) return;
    try {
      await api.deudas.anular(anularDeudaId);
      setAnularDeudaId(null);
      openCuenta(entidadSeleccionada);
      loadDeudas();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cancelar deuda');
    }
  }

  const ndResultados = useMemo(() => {
    const lista = modo === 'proveedores' ? proveedores : clientes;
    const q = ndBusqueda.trim().toLowerCase();
    if (!q) return [];
    return lista.filter(e => e.nombre.toLowerCase().includes(q)).slice(0, 20);
  }, [modo, clientes, proveedores, ndBusqueda]);

  async function handleCrearDeuda() {
    if (ndEntidadId == null) return;
    const monto = parseFloat(ndMonto);
    if (!monto || monto <= 0) return;
    setCreandoDeuda(true);
    try {
      const payload: CrearDeudaRequestDto = { monto };
      if (modo === 'clientes') payload.clienteId = ndEntidadId;
      else payload.proveedorId = ndEntidadId;
      await api.deudas.crear(payload);
      notifySuccess('Deuda creada');
      setShowNuevaDeuda(false);
      setNdBusqueda(''); setNdEntidadId(null); setNdMonto('');
      if (entidadSeleccionada) openCuenta(entidadSeleccionada);
      loadDeudas();
    } catch (err: any) {
      notifyError(err instanceof Error ? err.message : 'Error al crear la deuda');
    } finally {
      setCreandoDeuda(false);
    }
  }

  function resetNuevaEntidad() {
    setShowNuevaEntidad(false);
    setNuevaEntidadForm({ nombre: '', tipoDocumento: '', documento: '', ivaCondicion: 'ConsumidorFinal', telefono: '', mail: '', domicilio: '' });
  }

  async function handleCrearEntidad(e: React.FormEvent) {
    e.preventDefault();
    if (!nuevaEntidadForm.nombre.trim()) return;
    setCreandoEntidad(true);
    try {
      if (modo === 'clientes') {
        const nueva = await api.clientes.crear({
          nombre: nuevaEntidadForm.nombre.trim(),
          tipoDocumento: nuevaEntidadForm.tipoDocumento,
          numeroDocumento: nuevaEntidadForm.documento,
          ivaCondicion: nuevaEntidadForm.ivaCondicion,
          telefono: nuevaEntidadForm.telefono || undefined,
          mail: nuevaEntidadForm.mail || undefined,
          domicilio: nuevaEntidadForm.domicilio || undefined,
        });
        setClientes(prev => [...prev, nueva]);
        setNdEntidadId(nueva.id!);
        setNdBusqueda(nueva.nombre);
      } else {
        const nueva = await api.proveedores.crear({
          nombre: nuevaEntidadForm.nombre.trim(),
          tipoDocumento: nuevaEntidadForm.tipoDocumento || undefined,
          nroDocumento: nuevaEntidadForm.documento || undefined,
          ivaCondicion: nuevaEntidadForm.ivaCondicion,
          telefono: nuevaEntidadForm.telefono || undefined,
          mail: nuevaEntidadForm.mail || undefined,
          domicilio: nuevaEntidadForm.domicilio || undefined,
        });
        setProveedores(prev => [...prev, nueva]);
        setNdEntidadId(nueva.id);
        setNdBusqueda(nueva.nombre);
      }
      setNdDropdownAbierto(false);
      resetNuevaEntidad();
      setTimeout(() => ndMontoRef.current?.focus(), 50);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : `Error al crear ${modo === 'clientes' ? 'cliente' : 'proveedor'}`);
    } finally {
      setCreandoEntidad(false);
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
      if (m.tipo === 'deuda' && !m.anulado) running += m.monto;
      else if (!m.anulado) running -= m.monto;
      return { ...m, saldo: running };
    });
  }, [cuenta]);

  function getSaldo(m: { fecha: string; tipo: string; monto: number; descripcion?: string }) {
    const found = movsConSaldoCrono.find(x =>
      x.fecha === m.fecha && x.tipo === m.tipo && x.monto === m.monto && x.descripcion === m.descripcion
    );
    return found ? found.saldo : 0;
  }

  async function abrirDetalleOrigen(m: { ventaId?: number; compraId?: number }) {
    try {
      if (m.ventaId) {
        const detalle = await api.ventas.detalle(m.ventaId);
        setDetalleOrigen({ tipo: 'venta', detalle });
      } else if (m.compraId) {
        const detalle = await api.compras.detalle(m.compraId);
        setDetalleOrigen({ tipo: 'compra', detalle });
      }
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cargar el detalle');
    }
  }

  const renderTabs = (onSwitch: (m: ModoDeuda) => void) => (
    <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-1 w-fit">
      <button onClick={() => onSwitch('clientes')}
        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${modo === 'clientes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}>
        Clientes
      </button>
      {user?.rol !== 'UsuarioComun' && (
        <button onClick={() => onSwitch('proveedores')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${modo === 'proveedores' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}>
          Proveedores
        </button>
      )}
    </div>
  );

  const handleTabSwitch = (m: ModoDeuda) => {
    if (m === modo) return;
    closeCuenta();
    setModo(m);
  };

  if (cuenta && entidadSeleccionada) {
    const saldo = cuenta.saldoActual;

    return (
      <PageShell
        title="Deudas"
        tabs={renderTabs(handleTabSwitch)}
        backButton={
          <button onClick={closeCuenta} className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1 mt-2">
            ← Volver
          </button>
        }
        actions={
          <div className="flex items-center gap-3">
            <CompartirMenu
              mail={entidadContacto.mail}
              telefono={entidadContacto.telefono}
              mailSubject={`Deuda de ${entidadSeleccionada.nombre}`}
              mensaje={deudaMensaje}
              className="relative"
              buttonClassName="px-3 py-1.5 text-xs sm:text-sm font-semibold bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
              dropdownUp={false}
            />
            <button onClick={() => { setNdEntidadId(entidadSeleccionada.id); setNdBusqueda(entidadSeleccionada.nombre); setNdMonto(''); setShowNuevaDeuda(true); }}
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              + Nueva deuda
            </button>
          </div>
        }
      >
        <div className="flex flex-col flex-1 min-h-0">

          {/* Encabezado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 mb-2 sm:mb-3 flex items-center justify-between flex-wrap gap-2 shrink-0">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">{entidadSeleccionada.nombre}</h2>
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
                        <tr key={i} className={m.anulado ? 'bg-gray-50 text-gray-400 line-through' : m.tipo === 'pago' ? 'bg-emerald-50/30' : ''}>
                          <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(m.fecha)}</td>
                          <td className="px-4 py-2.5 text-gray-700">
                            {(m.ventaId || m.compraId) ? (
                              <button
                                onClick={() => abrirDetalleOrigen(m)}
                                className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium text-left"
                                title={m.ventaId ? 'Ver venta' : 'Ver compra'}
                              >
                                {m.descripcion || (m.tipo === 'pago' ? 'Pago' : 'Deuda')}
                              </button>
                            ) : (
                              m.descripcion || (m.tipo === 'pago' ? 'Pago' : 'Deuda')
                            )}
                            {m.usuario && m.tipo === 'pago' && <span className="text-[10px] text-gray-400 ml-1">({m.usuario})</span>}
                            {m.anulado && <span className="ml-2 text-[10px] font-semibold text-red-500 no-underline">Anulado</span>}
                            {m.tipo === 'deuda' && m.deudaId && !m.anulado && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setAnularDeudaId(m.deudaId!); }}
                                className="ml-2 text-[10px] text-red-400 hover:text-red-600 hover:underline"
                              >Cancelar</button>
                            )}
                            {m.tipo === 'pago' && m.pagoId && !m.anulado && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setUndoPagoId(m.pagoId!); }}
                                className="ml-2 text-[10px] text-red-400 hover:text-red-600 hover:underline"
                              >Deshacer</button>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs">{m.tipo === 'deuda' ? <span className="text-red-600 font-medium">-{formatCurrency(m.monto)}</span> : ''}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs">{m.tipo === 'pago' ? <span className="text-emerald-600 font-medium">{formatCurrency(m.monto)}</span> : ''}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-xs font-bold text-gray-900">{m.anulado ? '' : formatCurrency(saldoMov)}</td>
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

          {anularDeudaId !== null && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setAnularDeudaId(null)}>
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar deuda</h3>
                <p className="text-sm text-gray-600 mb-6">¿Cancelar esta deuda? Quedará registrada como anulada y no se incluirá en el saldo pendiente.</p>
                <div className="flex gap-3">
                  <button onClick={() => setAnularDeudaId(null)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">Volver</button>
                  <button onClick={handleAnularDeuda} autoFocus className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 text-sm">Cancelar deuda</button>
                </div>
              </div>
            </div>
          )}

          {showNuevaDeuda && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevaDeuda(false)}>
              <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Nueva deuda</h3>
                <p className="text-sm text-gray-600 mb-4">Registrar una deuda para <strong>{entidadSeleccionada.nombre}</strong>.</p>
                <label className="block text-xs font-medium text-gray-700 mb-1">Monto de la deuda</label>
                <input ref={ndMontoRef} type="number" min={0} step="0.01" value={ndMonto} onChange={e => setNdMonto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCrearDeuda(); } }}
                  placeholder="0.00" autoFocus
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowNuevaDeuda(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">Cancelar</button>
                  <button onClick={handleCrearDeuda} disabled={!ndMonto || parseFloat(ndMonto) <= 0 || creandoDeuda}
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 text-sm disabled:opacity-50">{creandoDeuda ? 'Creando...' : 'Crear'}</button>
                </div>
              </div>
            </div>
          )}

          {detalleOrigen && (
            <DetalleVentaCompraModal
              tipo={detalleOrigen.tipo}
              detalle={detalleOrigen.detalle}
              onClose={() => setDetalleOrigen(null)}
            />
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
      actions={
        <button onClick={() => { setNdBusqueda(''); setNdEntidadId(null); setNdMonto(''); setShowNuevaDeuda(true) }}
          className="px-3 py-1.5 text-xs sm:text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shrink-0">
          + Nueva deuda
        </button>
      }
      tabs={renderTabs(setModo)}
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

        {/* Nueva deuda modal */}
        {showNuevaDeuda && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevaDeuda(false)}>
            <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}
              onKeyDown={e => {
                if (e.key === 'Escape') { setShowNuevaDeuda(false) }
                if (e.key === 'Enter') { e.preventDefault(); handleCrearDeuda() }
              }}>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Nueva deuda</h3>
              <p className="text-sm text-gray-600 mb-4">Creá una deuda para {modo === 'clientes' ? 'un cliente' : 'un proveedor'} sin atarla a una venta o compra.</p>

              {/* Buscador de entidad */}
              <div className="relative mb-4">
                <input ref={ndBusquedaRef} type="text" value={ndBusqueda} onChange={e => { setNdBusqueda(e.target.value); setNdEntidadId(null); setNdDropdownAbierto(true); setNdHighIdx(-1) }}
                  onFocus={() => setNdDropdownAbierto(true)}
                  onBlur={() => setTimeout(() => setNdDropdownAbierto(false), 150)}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (!ndDropdownAbierto) { setNdDropdownAbierto(true); setNdHighIdx(-1); return; }
                      setNdHighIdx(prev => Math.min(prev + 1, ndResultados.length - 1));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setNdHighIdx(prev => Math.max(prev - 1, -1));
                    } else if (e.key === 'Enter' && ndHighIdx >= 0 && ndResultados[ndHighIdx]) {
                      e.preventDefault();
                      const entidad = ndResultados[ndHighIdx];
                      setNdEntidadId(entidad.id!); setNdBusqueda(entidad.nombre); setNdDropdownAbierto(false);
                      setTimeout(() => ndMontoRef.current?.focus(), 0);
                    }
                  }}
                  placeholder={`Buscar ${modo === 'clientes' ? 'cliente' : 'proveedor'}...`}
                  autoFocus
                  className="w-full pl-3 pr-16 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="button" onClick={() => setShowNuevaEntidad(true)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[oklch(0.52_0.255_278)] hover:bg-[oklch(0.52_0.255_278_/_0.08)] transition-all flex items-center justify-center"
                  title={`Nuevo ${modo === 'clientes' ? 'cliente' : 'proveedor'}`}>
                  <Plus size={16} strokeWidth={2.5} />
                </button>
                {ndBusqueda && (
                  <button type="button" onClick={() => { setNdBusqueda(''); setNdEntidadId(null); setNdDropdownAbierto(false); ndBusquedaRef.current?.focus() }}
                    className="absolute right-10 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600">
                    <span className="text-xs">✕</span>
                  </button>
                )}
                {ndDropdownAbierto && ndResultados.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {ndResultados.map(ent => (
                      <button key={ent.id} type="button"
                        onMouseDown={() => { setNdEntidadId(ent.id!); setNdBusqueda(ent.nombre); setNdDropdownAbierto(false); ndMontoRef.current?.focus() }}
                        onMouseEnter={() => setNdHighIdx(ndResultados.indexOf(ent))}
                        className={`w-full text-left px-3 py-2 text-sm ${ndHighIdx === ndResultados.indexOf(ent) ? 'bg-[oklch(0.52_0.255_278_/_0.10)] text-[oklch(0.52_0.255_278)]' : 'hover:bg-gray-50'} ${ndEntidadId === ent.id ? 'font-semibold' : 'text-gray-700'}`}>
                        {ent.nombre}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Monto */}
              <label className="block text-xs font-medium text-gray-700 mb-1">Monto de la deuda</label>
              <input ref={ndMontoRef} type="number" min={0} step="0.01" value={ndMonto} onChange={e => setNdMonto(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCrearDeuda() } }}
                placeholder="0.00" disabled={ndEntidadId == null}
                className="w-full pl-3 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-gray-100 disabled:text-gray-400" />

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowNuevaDeuda(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">Cancelar</button>
                <button onClick={handleCrearDeuda} disabled={ndEntidadId == null || !ndMonto || parseFloat(ndMonto) <= 0 || creandoDeuda}
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 text-sm disabled:opacity-50">{creandoDeuda ? 'Creando...' : 'Crear'}</button>
              </div>
            </div>
          </div>
        )}

        <Dialog
          open={showNuevaEntidad}
          onClose={resetNuevaEntidad}
          title={`Nuevo ${modo === 'clientes' ? 'cliente' : 'proveedor'}`}
          width="md"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={resetNuevaEntidad}>Cancelar</Button>
              <Button variant="primary" size="sm" onClick={handleCrearEntidad} loading={creandoEntidad} disabled={!nuevaEntidadForm.nombre.trim()}>Crear</Button>
            </>
          }
        >
          <form onSubmit={handleCrearEntidad}>
            <EntidadContactoForm
              {...nuevaEntidadForm}
              onChange={(campo, valor) => setNuevaEntidadForm(prev => ({ ...prev, [campo]: valor }))}
              tiposDocumento={['', 'CUIT', 'CUIL', 'DNI']}
              ivaCondiciones={['ConsumidorFinal', 'ResponsableInscripto', 'Monotributista', 'Exento']}
            />
          </form>
        </Dialog>

      </PageShell>
    );
  }
