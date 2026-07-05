import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import type { PedidoListDto, PedidoDetailDto, RecibirPedidoRequestDto, RecibirItemDto, ProveedorDto, ProductoDto } from '../types';
import { api } from '../api/client';
import { useNotification } from '../context/NotificationContext';

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    Pendiente: 'bg-amber-100 text-amber-700',
    Completado: 'bg-green-100 text-green-700',
    Cancelado: 'bg-gray-100 text-gray-500',
  };
  return map[estado] ?? 'bg-gray-100 text-gray-500';
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoListDto[]>([]);
  const [proveedorSearch, setProveedorSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [loading, setLoading] = useState(true);
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const { notifyError, notifySuccess } = useNotification();

  // Modal state
  const [detalleModal, setDetalleModal] = useState<PedidoDetailDto | null>(null);
  const [recepcionPedido, setRecepcionPedido] = useState<PedidoDetailDto | null>(null);
  const [recepcionItems, setRecepcionItems] = useState<Record<number, { cantidad: number; faltante: boolean; precioReal: number }>>({});
  const [receiving, setReceiving] = useState(false);
  const [faltantesResult, setFaltantesResult] = useState<{ productoId: number; productoNombre: string; cantidadFaltante: number; precioEstimado: number }[] | null>(null);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createProveedorId, setCreateProveedorId] = useState(0);
  const [createProveedorNombre, setCreateProveedorNombre] = useState('');
  const [createProveedorSearch, setCreateProveedorSearch] = useState('');
  const [createItems, setCreateItems] = useState<{ productoId: number; productoNombre: string; cantidad: number; precioEstimado: number }[]>([]);
  const [createFechaEsperada, setCreateFechaEsperada] = useState('');
  const [createObs, setCreateObs] = useState('');
  const [creating, setCreating] = useState(false);

  // Reset inline add when proveedor changes
  useEffect(() => { setInlineAdd(null); setHighlightIdx(-1); gridFocusRef.current = false; }, [createProveedorId]);

  const [showProvDropdown, setShowProvDropdown] = useState(false);
  const [provHighIdx, setProvHighIdx] = useState(-1);
  const provFocusRef = useRef(false);
  const provInputRef = useRef<HTMLInputElement>(null);

  const createProveedoresFilt = createProveedorSearch.trim()
    ? proveedores.filter(p => p.nombre.toLowerCase().includes(createProveedorSearch.toLowerCase()) || p.codigo.toLowerCase().includes(createProveedorSearch.toLowerCase()))
    : proveedores;

  const [createSearchQuery, setCreateSearchQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const highlightIdxRef = useRef(-1);
  const gridFocusRef = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Inline add state (when selecting from grid)
  const [inlineAdd, setInlineAdd] = useState<{ productoId: number; productoNombre: string; codigoBarra: string; costo: number } | null>(null);
  const [inlineCant, setInlineCant] = useState(1);
  const [inlinePrecio, setInlinePrecio] = useState('');
  const cantRef = useRef<HTMLInputElement>(null);
  const precioRef = useRef<HTMLInputElement>(null);

  const productosFilt = useMemo(() => {
    if (createProveedorId === 0) return [];
    if (!createSearchQuery.trim()) return productos;
    const q = createSearchQuery.toLowerCase();
    return productos.filter(p => p.nombre.toLowerCase().includes(q) || p.codigoBarra.toLowerCase().includes(q));
  }, [productos, createProveedorId, createSearchQuery]);

  useEffect(() => {
    api.proveedores.listar().then(setProveedores).catch(() => {});
  }, []);

  const loadPedidos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.pedidos.listar(
        proveedorSearch || undefined,
        estadoFilter || undefined
      );
      setPedidos(data);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  }, [proveedorSearch, estadoFilter]);

  useEffect(() => {
    const timer = setTimeout(loadPedidos, 300);
    return () => clearTimeout(timer);
  }, [loadPedidos]);

  // Date filtering (client-side)
  const pedidosFiltrados = useMemo(() => {
    let result = pedidos;
    if (fechaDesde) {
      const desde = new Date(fechaDesde + 'T00:00:00');
      result = result.filter(p => new Date(p.fecha) >= desde);
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta + 'T23:59:59');
      result = result.filter(p => new Date(p.fecha) <= hasta);
    }
    return result;
  }, [pedidos, fechaDesde, fechaHasta]);

  const totalPedidosFiltrado = pedidosFiltrados.reduce((s, p) => s + p.total, 0);

  const openDetalle = async (id: number) => {
    try {
      const detail = await api.pedidos.obtener(id);
      setDetalleModal(detail);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cargar detalle');
    }
  };

  const openRecepcion = async (id: number) => {
    try {
      const detail = await api.pedidos.obtener(id);
      setRecepcionPedido(detail);
      setFaltantesResult(null);
      const items: Record<number, { cantidad: number; faltante: boolean; precioReal: number }> = {};
      detail.items.forEach(item => {
        items[item.id] = {
          cantidad: item.cantidadPedida,
          faltante: false,
          precioReal: item.precioUnitarioEstimado,
        };
      });
      setRecepcionItems(items);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cargar pedido');
    }
  };

  const handleRecibir = async () => {
    if (!recepcionPedido) return;
    setReceiving(true);
    try {
      const dto: RecibirPedidoRequestDto = {
        items: recepcionPedido.items.map(item => {
          const ri = recepcionItems[item.id];
          return {
            renglonPedidoId: item.id,
            cantidadRecibida: ri.cantidad,
            esFaltante: ri.faltante,
            precioUnitarioReal: ri.precioReal,
          } as RecibirItemDto;
        }),
      };
      await api.pedidos.recibir(recepcionPedido.id, dto);

      // Check for faltantes in the updated state
      const faltantes = recepcionPedido.items
        .filter(item => recepcionItems[item.id]?.faltante)
        .map(item => ({
          productoId: item.productoId,
          productoNombre: item.productoNombre,
          cantidadFaltante: item.cantidadPedida - (recepcionItems[item.id]?.cantidad ?? 0),
          precioEstimado: item.precioUnitarioEstimado,
        }))
        .filter(f => f.cantidadFaltante > 0);

      if (faltantes.length > 0) {
        setFaltantesResult(faltantes);
      } else {
        notifySuccess('Pedido recibido correctamente');
        setRecepcionPedido(null);
        loadPedidos();
      }
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al recibir pedido');
    } finally {
      setReceiving(false);
    }
  };

  const handleCrearSiguientePedido = async () => {
    if (!faltantesResult || !recepcionPedido) return;
    try {
      const sucursalId = (() => { try { const s = JSON.parse(localStorage.getItem('sucursalActiva') ?? '{}'); return s.id ?? 1; } catch { return 1; } })();
      const proveedor = proveedores.find(p => p.nombre === recepcionPedido.proveedorNombre);
      if (!proveedor) { notifyError('Proveedor no encontrado'); return; }

      await api.pedidos.crear({
        sucursalId,
        proveedorId: proveedor.id,
        items: faltantesResult.map(f => ({
          productoId: f.productoId,
          cantidad: f.cantidadFaltante,
          precioUnitarioEstimado: f.precioEstimado,
        })),
      });
      notifySuccess('Pedido creado con faltantes');
      setRecepcionPedido(null);
      setFaltantesResult(null);
      loadPedidos();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al crear siguiente pedido');
    }
  };

  const handleCancelar = async (id: number) => {
    if (!confirm('¿Cancelar este pedido?')) return;
    try {
      await api.pedidos.cancelar(id);
      notifySuccess('Pedido cancelado');
      loadPedidos();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cancelar pedido');
    }
  };

  const handleCrearPedido = async () => {
    if (createProveedorId === 0 || createItems.length === 0) return;
    setCreating(true);
    try {
      const sucursalId = (() => { try { const s = JSON.parse(localStorage.getItem('sucursalActiva') ?? '{}'); return s.id ?? 1; } catch { return 1; } })();
      await api.pedidos.crear({
        sucursalId,
        proveedorId: createProveedorId,
        items: createItems.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitarioEstimado: i.precioEstimado, descripcion: i.productoId === 0 ? i.productoNombre : undefined })),
        fechaEsperada: createFechaEsperada || undefined,
        observaciones: createObs || undefined,
      });
      notifySuccess('Pedido creado');
      setShowCreateModal(false);
      setCreateProveedorId(0);
      setCreateProveedorNombre('');
      setCreateProveedorSearch('');
      setCreateItems([]);
      setCreateFechaEsperada('');
      setCreateObs('');
      setCreateSearchQuery('');
      loadPedidos();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al crear pedido');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pedidos a proveedores</h1>
          <button onClick={() => { setShowCreateModal(true); setCreateSearchQuery(''); setProdLoading(true); api.productos.listar().then(p => { setProductos(p); setProdLoading(false); }).catch(() => { setProdLoading(false); notifyError('Error al cargar productos'); }); setTimeout(() => provInputRef.current?.focus(), 100); }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
            + Nuevo pedido
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
              <input type="text"
                value={proveedorSearch}
                onChange={e => setProveedorSearch(e.target.value)}
                placeholder="Buscar proveedor..."
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Todos</option>
                <option value="Pendiente">Pendientes</option>
                <option value="Completado">Completados</option>
                <option value="Cancelado">Cancelados</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-36" />
            </div>
            <div className="pt-5 ml-auto">
              <span className="text-sm font-medium text-gray-700">
                Total:{' '}
                <span className="text-lg font-bold text-indigo-700">{formatCurrency(totalPedidosFiltrado)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando pedidos...</div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No hay pedidos</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidosFiltrados.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.proveedorNombre}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(p.total)}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(p.fecha)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge(p.estado)}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {p.estado === 'Pendiente' && (
                          <>
                            <button onClick={() => openRecepcion(p.id)}
                              className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-md hover:bg-green-700 transition-colors">
                              Recibir
                            </button>
                            <button onClick={() => handleCancelar(p.id)}
                              className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-md hover:bg-red-200 transition-colors">
                              Cancelar
                            </button>
                          </>
                        )}
                        <button onClick={() => openDetalle(p.id)}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-md hover:bg-gray-200 transition-colors">
                          Ver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detalle Modal ── */}
      {detalleModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setDetalleModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Pedido #{detalleModal.id}</h3>
              <button onClick={() => setDetalleModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div><span className="text-gray-500">Proveedor:</span> <span className="font-medium">{detalleModal.proveedorNombre}</span></div>
              <div><span className="text-gray-500">Fecha:</span> <span className="font-medium">{formatDate(detalleModal.fecha)}</span></div>
              <div><span className="text-gray-500">Total:</span> <span className="font-medium">{formatCurrency(detalleModal.total)}</span></div>
              <div><span className="text-gray-500">Estado:</span> <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge(detalleModal.estado)}`}>{detalleModal.estado}</span></div>
              {detalleModal.fechaEsperada && <div><span className="text-gray-500">Esperado:</span> <span className="font-medium">{formatDate(detalleModal.fechaEsperada)}</span></div>}
              {detalleModal.idPedidoOrigen && <div className="col-span-2"><span className="text-gray-500">Origen:</span> <span className="font-medium">Pedido #{detalleModal.idPedidoOrigen}</span></div>}
            </div>
            <table className="w-full text-xs border-collapse">
              <thead><tr className="border-b border-gray-200"><th className="text-left pb-2">Producto</th><th className="text-right pb-2">Cant</th><th className="text-right pb-2">Precio est.</th><th className="text-right pb-2">Subtotal</th><th className="text-right pb-2">Estado</th></tr></thead>
              <tbody>{detalleModal.items.map(item => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-1.5 pr-2">{item.productoNombre}<br /><span className="text-gray-400 font-mono">{item.codigoBarra}</span></td>
                  <td className="text-right py-1.5">{item.cantidadPedida}</td>
                  <td className="text-right py-1.5">{formatCurrency(item.precioUnitarioEstimado)}</td>
                  <td className="text-right py-1.5">{formatCurrency(item.subtotal)}</td>
                  <td className="text-right py-1.5"><span className={`px-1.5 py-0.5 rounded text-xs ${estadoBadge(item.estado)}`}>{item.estado}</span></td>
                </tr>
              ))}</tbody>
            </table>
            <button onClick={() => setDetalleModal(null)} className="mt-4 w-full py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Cerrar</button>
          </div>
        </div>
      )}

      {/* ── Recepción Modal ── */}
      {recepcionPedido && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { setRecepcionPedido(null); setFaltantesResult(null); }}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Recibir Pedido #{recepcionPedido.id}</h3>
              <button onClick={() => { setRecepcionPedido(null); setFaltantesResult(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-600 mb-4">{recepcionPedido.proveedorNombre} — Total pedido: {formatCurrency(recepcionPedido.total)}</p>

            {faltantesResult ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-green-800 font-semibold text-sm">✓ Pedido recibido — Compra generada</p>
                  <p className="text-green-700 text-xs mt-1">Los items recibidos ya impactaron en stock.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-amber-800 font-semibold text-sm mb-2">Faltantes — {faltantesResult.reduce((s, f) => s + f.cantidadFaltante, 0)} unidades</p>
                  <table className="w-full text-xs">
                    <thead><tr className="text-amber-600"><th className="text-left pb-1">Producto</th><th className="text-right pb-1">Cantidad</th><th className="text-right pb-1">Precio est.</th></tr></thead>
                    <tbody>{faltantesResult.map((f, i) => (
                      <tr key={i}><td className="py-0.5">{f.productoNombre}</td><td className="text-right">{f.cantidadFaltante}</td><td className="text-right">{formatCurrency(f.precioEstimado)}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
                <button onClick={handleCrearSiguientePedido}
                  className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors mb-2">
                  Crear pedido con faltantes
                </button>
                <button onClick={() => { setRecepcionPedido(null); setFaltantesResult(null); loadPedidos(); }}
                  className="w-full py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                {/* Header row */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-2 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <span className="col-span-4">Producto</span>
                  <span className="col-span-2 text-center">Pedido</span>
                  <span className="col-span-2 text-center">Recibido</span>
                  <span className="col-span-2 text-center">Precio real</span>
                  <span className="col-span-2 text-center">Faltante</span>
                </div>
                <div className="space-y-2 mb-4">
                  {recepcionPedido.items.map(item => {
                    const ri = recepcionItems[item.id];
                    const cantidadRecibida = ri?.cantidad ?? item.cantidadPedida;
                    const esFaltante = ri?.faltante ?? false;
                    const faltanteQty = esFaltante ? item.cantidadPedida - cantidadRecibida : 0;
                    return (
                      <div key={item.id} className={`grid grid-cols-1 sm:grid-cols-12 gap-2 items-center rounded-lg p-3 border ${esFaltante ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                        {/* Product name */}
                        <div className="sm:col-span-4 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{item.productoNombre}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{item.codigoBarra}</p>
                        </div>
                        {/* Pedido (readonly) */}
                        <div className="sm:col-span-2 text-center">
                          <span className="sm:hidden text-xs text-gray-500 mr-1">Pedido:</span>
                          <span className="text-sm font-mono">{item.cantidadPedida}</span>
                          <span className="text-xs text-gray-400 ml-1">× {formatCurrency(item.precioUnitarioEstimado)}</span>
                        </div>
                        {/* Recibido */}
                        <div className="sm:col-span-2 flex items-center justify-center">
                          <input type="number" min={0} max={item.cantidadPedida} step="1"
                            value={cantidadRecibida}
                            onChange={e => setRecepcionItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], cantidad: parseInt(e.target.value) || 0 } }))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center font-mono focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                        </div>
                        {/* Precio real */}
                        <div className="sm:col-span-2 flex items-center justify-center">
                          <input type="number" min={0} step="0.01"
                            value={ri?.precioReal ?? item.precioUnitarioEstimado}
                            onChange={e => setRecepcionItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], precioReal: parseFloat(e.target.value) || 0 } }))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right font-mono focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                        </div>
                        {/* Faltante checkbox */}
                        <div className="sm:col-span-2 flex items-center justify-center gap-1.5">
                          <input type="checkbox"
                            checked={esFaltante}
                            onChange={e => setRecepcionItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], faltante: e.target.checked } }))}
                            className="h-4 w-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500" />
                          <span className="text-xs text-gray-600">Faltante</span>
                          {faltanteQty > 0 && (
                            <span className="text-xs text-amber-600 font-medium">{faltanteQty}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={handleRecibir} disabled={receiving}
                  className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {receiving ? 'Recibiendo...' : 'Confirmar recepción'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Crear Pedido Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') { e.stopPropagation(); setShowCreateModal(false); } }}>
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Nuevo pedido</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* Proveedor search */}
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-700">Proveedor *</label>
              <div className="relative">
                <input ref={provInputRef} type="text"
                  value={createProveedorId > 0 ? createProveedorNombre : createProveedorSearch}
                  onChange={e => { setCreateProveedorSearch(e.target.value); if (createProveedorId > 0) { setCreateProveedorId(0); setCreateProveedorNombre(''); setCreateSearchQuery(''); } setShowProvDropdown(true); setProvHighIdx(-1); provFocusRef.current = false; }}
                  onFocus={() => setShowProvDropdown(true)}
                  onBlur={() => setTimeout(() => { setShowProvDropdown(false); setProvHighIdx(-1); provFocusRef.current = false; }, 200)}
                  onKeyDown={e => {
                    if (!showProvDropdown || createProveedoresFilt.length === 0) {
                      // Auto-select single result on Enter
                      if (e.key === 'Enter' && createProveedoresFilt.length === 1) {
                        e.preventDefault();
                        const p = createProveedoresFilt[0];
                        setCreateProveedorId(p.id); setCreateProveedorNombre(p.nombre); setCreateProveedorSearch(''); setShowProvDropdown(false);
                        setTimeout(() => searchInputRef.current?.focus(), 100);
                      }
                      return;
                    }
                    const pf = provFocusRef.current;
                    const total = createProveedoresFilt.length;
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (!pf) { setProvHighIdx(0); provFocusRef.current = true; }
                      else { const next = Math.min(provHighIdx + 1, total - 1); setProvHighIdx(next); }
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (pf) {
                        if (provHighIdx <= 0) { setProvHighIdx(-1); provFocusRef.current = false; }
                        else { setProvHighIdx(provHighIdx - 1); }
                      }
                      return;
                    }
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (pf && provHighIdx >= 0) {
                        const p = createProveedoresFilt[provHighIdx];
                        setCreateProveedorId(p.id); setCreateProveedorNombre(p.nombre); setCreateProveedorSearch(''); setShowProvDropdown(false);
                        setProvHighIdx(-1); provFocusRef.current = false;
                        setTimeout(() => searchInputRef.current?.focus(), 100);
                      } else if (total === 1) {
                        const p = createProveedoresFilt[0];
                        setCreateProveedorId(p.id); setCreateProveedorNombre(p.nombre); setCreateProveedorSearch(''); setShowProvDropdown(false);
                        setTimeout(() => searchInputRef.current?.focus(), 100);
                      }
                      return;
                    }
                    if (e.key === 'Escape') { setShowProvDropdown(false); setProvHighIdx(-1); provFocusRef.current = false; }
                  }}
                  placeholder="Buscar proveedor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                {showProvDropdown && createProveedoresFilt.length > 0 && (
                  <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto text-xs">
                    {createProveedoresFilt.map((p, i) => (
                      <li key={p.id} onMouseDown={() => { setCreateProveedorId(p.id); setCreateProveedorNombre(p.nombre); setCreateProveedorSearch(''); setShowProvDropdown(false); setProvHighIdx(-1); provFocusRef.current = false; setTimeout(() => searchInputRef.current?.focus(), 100); }}
                        onMouseEnter={() => { setProvHighIdx(i); provFocusRef.current = true; }}
                        className={`px-3 py-1.5 cursor-pointer flex justify-between ${i === provHighIdx && provFocusRef.current ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-100'}`}>
                        <span>{p.nombre}</span><span className="text-gray-400">{p.codigo}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Productos — unified bar + grid */}
            {createProveedorId > 0 && (
              <div className="mb-3">
                <label className="text-xs font-semibold text-gray-700 mb-1 block">Productos</label>

                {/* Inline add mini-form (appears when selecting from grid) */}
                {inlineAdd && (
                  <div className="flex items-center gap-2 mb-2 bg-indigo-50 border border-indigo-200 rounded-lg p-2">
                    <span className="text-xs font-medium text-indigo-900 truncate flex-1">{inlineAdd.productoNombre}</span>
                    <input ref={cantRef} type="number" min={1} value={inlineCant}
                      onChange={e => setInlineCant(parseInt(e.target.value) || 1)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); precioRef.current?.focus(); precioRef.current?.select(); }
                      }}
                      className="w-14 px-1.5 py-1 border border-indigo-300 rounded text-xs text-center focus:ring-1 focus:ring-indigo-500 outline-none" />
                    <input ref={precioRef} type="number" min={0} step="0.01" value={inlinePrecio}
                      onChange={e => setInlinePrecio(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const precio = parseFloat(inlinePrecio) || inlineAdd.costo;
                          setCreateItems([...createItems, { productoId: inlineAdd.productoId, productoNombre: inlineAdd.productoNombre, cantidad: inlineCant, precioEstimado: precio }]);
                          setInlineAdd(null); setInlineCant(1); setInlinePrecio('');
                          setCreateSearchQuery('');
                          highlightIdxRef.current = -1; setHighlightIdx(-1); gridFocusRef.current = false;
                          setTimeout(() => searchInputRef.current?.focus(), 50);
                        }
                      }}
                      className="w-20 px-1.5 py-1 border border-indigo-300 rounded text-xs text-right font-mono focus:ring-1 focus:ring-indigo-500 outline-none" />
                    <button onClick={() => setInlineAdd(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                  </div>
                )}

                {/* Unified search bar */}
                <div className="relative mb-2">
                  <input ref={searchInputRef} type="text" value={createSearchQuery}
                    onChange={e => { setCreateSearchQuery(e.target.value); highlightIdxRef.current = -1; setHighlightIdx(-1); gridFocusRef.current = false; }}
                    onKeyDown={e => {
                      const gf = gridFocusRef.current;
                      const idx = highlightIdxRef.current;
                      const total = productosFilt.length;
                      const cols = window.innerWidth >= 640 ? 3 : 2;
                      // Grid navigation (active when in grid)
                      if (gf) {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          const next = idx + cols;
                          highlightIdxRef.current = next < total ? next : idx; setHighlightIdx(highlightIdxRef.current);
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          if (idx < cols) { highlightIdxRef.current = -1; setHighlightIdx(-1); gridFocusRef.current = false; searchInputRef.current?.focus(); }
                          else { const prev = idx - cols; highlightIdxRef.current = prev; setHighlightIdx(prev); }
                          return;
                        }
                        if (e.key === 'ArrowRight') {
                          e.preventDefault();
                          const next = idx + 1;
                          if (next < total && Math.floor(next / cols) === Math.floor(idx / cols)) { highlightIdxRef.current = next; setHighlightIdx(next); }
                          return;
                        }
                        if (e.key === 'ArrowLeft') {
                          e.preventDefault();
                          const prev = idx - 1;
                          if (prev >= 0 && Math.floor(prev / cols) === Math.floor(idx / cols)) { highlightIdxRef.current = prev; setHighlightIdx(prev); }
                          return;
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          if (idx <= 0) { highlightIdxRef.current = -1; setHighlightIdx(-1); gridFocusRef.current = false; searchInputRef.current?.focus(); }
                          else { const prev = idx - 1; highlightIdxRef.current = prev; setHighlightIdx(prev); }
                          return;
                        }
                        if (e.key === 'Enter' && idx >= 0) {
                          e.preventDefault();
                          const p = productosFilt[idx];
                          setInlineAdd({ productoId: p.id, productoNombre: p.nombre, codigoBarra: p.codigoBarra, costo: p.costo });
                          setInlineCant(1); setInlinePrecio(String(p.costo));
                          highlightIdxRef.current = -1; setHighlightIdx(-1); gridFocusRef.current = false;
                          setTimeout(() => cantRef.current?.focus(), 50);
                          return;
                        }
                        if (e.key === 'Escape') { highlightIdxRef.current = -1; setHighlightIdx(-1); gridFocusRef.current = false; searchInputRef.current?.focus(); return; }
                        return;
                      }
                      // Arrow down → enter grid from search bar
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (productosFilt.length > 0) { highlightIdxRef.current = 0; setHighlightIdx(0); gridFocusRef.current = true; }
                        return;
                      }
                      // Enter with text → libre product, show inline add
                      if (e.key === 'Enter' && createSearchQuery.trim()) {
                        e.preventDefault();
                        setInlineAdd({ productoId: 0, productoNombre: createSearchQuery.trim(), codigoBarra: '', costo: 0 });
                        setInlineCant(1); setInlinePrecio('');
                        highlightIdxRef.current = -1; setHighlightIdx(-1); gridFocusRef.current = false;
                        setTimeout(() => cantRef.current?.focus(), 50);
                        return;
                      }
                      // Enter with empty bar → focus create button
                      if (e.key === 'Enter' && !createSearchQuery.trim() && createItems.length > 0) {
                        e.preventDefault();
                        // Focus the "Crear pedido" button
                        const btn = document.querySelector('[data-create-btn]') as HTMLButtonElement | null;
                        btn?.focus();
                      }
                    }}
                    placeholder={prodLoading ? 'Cargando...' : 'Buscar producto o escribir uno libre...'}
                    disabled={prodLoading}
                    className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
                  {createSearchQuery && (
                    <button onClick={() => { setCreateSearchQuery(''); highlightIdxRef.current = -1; setHighlightIdx(-1); gridFocusRef.current = false; }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
                  )}
                </div>

                {/* Product grid */}
                {createSearchQuery && !prodLoading && (
                  <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto mb-2 border border-gray-100 rounded-lg p-2 bg-gray-50">
                    {productosFilt.length === 0 ? (
                      <p className="col-span-full text-center text-xs text-gray-400 py-2">Sin resultados — Enter para agregar como libre</p>
                    ) : (
                      productosFilt.map((p, i) => (
                        <button key={p.id}
                          onClick={() => {
                            setInlineAdd({ productoId: p.id, productoNombre: p.nombre, codigoBarra: p.codigoBarra, costo: p.costo });
                            setInlineCant(1); setInlinePrecio(String(p.costo));
                            highlightIdxRef.current = -1; setHighlightIdx(-1); gridFocusRef.current = false;
                            setTimeout(() => cantRef.current?.focus(), 50);
                          }}
                          className={`text-left border rounded-lg p-2 transition-all text-xs ${
                            i === highlightIdx
                              ? 'border-indigo-400 bg-indigo-50 shadow-sm ring-1 ring-indigo-300'
                              : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                          }`}>
                          <p className="font-medium truncate">{p.nombre}</p>
                          <p className="text-gray-400 font-mono truncate text-[10px]">{p.codigoBarra}</p>
                          <p className="text-gray-500 mt-0.5">Costo: {formatCurrency(p.costo)}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Items added */}
                {createItems.length > 0 && (
                  <div className="space-y-1.5">
                    {createItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 bg-gray-50 rounded p-2 text-xs">
                        <span className="flex-1 font-medium">{item.productoNombre}{item.productoId === 0 ? <span className="text-indigo-500 ml-1">(libre)</span> : null}</span>
                        <input type="number" min={1} value={item.cantidad}
                          onChange={e => { const items = [...createItems]; items[i] = { ...items[i], cantidad: parseInt(e.target.value) || 1 }; setCreateItems(items); }}
                          className="w-16 px-1 py-0.5 border rounded text-center" />
                        <input type="number" min={0} step="0.01" value={item.precioEstimado}
                          onChange={e => { const items = [...createItems]; items[i] = { ...items[i], precioEstimado: parseFloat(e.target.value) || 0 }; setCreateItems(items); }}
                          className="w-20 px-1 py-0.5 border rounded text-right font-mono" />
                        <button onClick={() => setCreateItems(createItems.filter((_, j) => j !== i))}
                          className="text-red-500 hover:text-red-700">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">Fecha esperada</label>
                <input type="date" value={createFechaEsperada} onChange={e => setCreateFechaEsperada(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Observaciones</label>
                <input type="text" value={createObs} onChange={e => setCreateObs(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>

            <button onClick={handleCrearPedido} data-create-btn
              disabled={creating || createProveedorId === 0 || createItems.length === 0}
              className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
              {creating ? 'Creando...' : `Crear pedido — ${formatCurrency(createItems.reduce((s, i) => s + i.cantidad * i.precioEstimado, 0))}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
