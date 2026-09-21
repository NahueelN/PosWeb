import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Plus, Minus, Trash2, ClipboardList, Search, ChevronRight } from 'lucide-react';
import { HELP_KEYS } from '../help/content';
import type { PedidoListDto, PedidoDetailDto, RecibirPedidoRequestDto, RecibirItemDto, ProveedorDto, ProductoDto, PedidoEditDto, CrearProveedorRequestDto } from '../types';
import { api } from '../api/client';
import { useNotification } from '../context/NotificationContext';
import Dialog from '../components/ui/Dialog';
import Button from '../components/ui/Button';
import CarritoPopup from '../components/shared/CarritoPopup';
import ProveedorAltaCruzada from '../components/shared/ProveedorAltaCruzada';
import PageShell from '../components/shared/PageShell';
import CompartirMenu from '../components/CompartirMenu';
import { buildPedidoWhatsAppMessage } from '../lib/whatsapp';

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

function getSucursalActivaId(): number {
  try {
    const s = JSON.parse(localStorage.getItem('sucursalActiva') ?? '{}');
    return s.id ?? 1;
  } catch {
    return 1;
  }
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
  const [pedidoCancelarId, setPedidoCancelarId] = useState<number | null>(null);
  const { notifyError, notifySuccess } = useNotification();

  // Modal state
  const [detalleModal, setDetalleModal] = useState<PedidoDetailDto | null>(null);
  const [compartirModalOpen, setCompartirModalOpen] = useState(false);
  const [recepcionPedido, setRecepcionPedido] = useState<PedidoDetailDto | null>(null);
  const [recepcionItems, setRecepcionItems] = useState<Record<number, { cantidad: number; faltante: boolean; precioReal: number; precioVenta: number }>>({});
  const [receiving, setReceiving] = useState(false);
  const [faltantesResult, setFaltantesResult] = useState<{ productoId: number; productoNombre: string; cantidadFaltante: number; precioEstimado: number }[] | null>(null);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createProveedorId, setCreateProveedorId] = useState(0);
  const [createProveedorNombre, setCreateProveedorNombre] = useState('');
  const [createItems, setCreateItems] = useState<{ productoId: number; productoNombre: string; cantidad: number; precioEstimado: number }[]>([]);
  const [createFechaEsperada, setCreateFechaEsperada] = useState('');
  const [createObs, setCreateObs] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingPedidoId, setEditingPedidoId] = useState<number | null>(null);
  const [editingPedidoDetalle, setEditingPedidoDetalle] = useState<PedidoDetailDto | null>(null);
  const [showNewProvModal, setShowNewProvModal] = useState(false);
  const [newProvNombre, setNewProvNombre] = useState('');

  // Product search state (create/edit modal)
  const [prodSearch, setProdSearch] = useState('');
  const [productoLibrePendiente, setProductoLibrePendiente] = useState<string | null>(null);
  const [productoCatalogoIdx, setProductoCatalogoIdx] = useState(-1);
  const prodInputRef = useRef<HTMLInputElement>(null);
  const fechaEsperadaRef = useRef<HTMLInputElement>(null);
  const observacionesRef = useRef<HTMLInputElement>(null);
  const cancelarPedidoRef = useRef<HTMLButtonElement>(null);
  const ultimaCantidadRef = useRef<HTMLInputElement>(null);
  const [pedidoTab, setPedidoTab] = useState<'productos' | 'alertas'>('productos');

  // Reset product selection when proveedor changes
  useEffect(() => {
    setProdSearch('');
    setPedidoTab('productos');
  }, [createProveedorId]);

  const provInputRef = useRef<HTMLInputElement>(null);

  const seleccionarProveedorPedido = (proveedor: ProveedorDto) => {
    setCreateProveedorId(proveedor.id);
    setCreateProveedorNombre(proveedor.nombre);
    setTimeout(() => prodInputRef.current?.focus(), 100);
  };

  const seleccionarProveedorOcasional = async () => {
    const existente = proveedores.find(p => p.nombre === 'Proveedor ocasional' || p.codigo === 'OCASIONAL');
    if (existente) { seleccionarProveedorPedido(existente); return; }
    try {
      const nuevo = await api.proveedores.crear({ nombre: 'Proveedor ocasional', ivaCondicion: 'ConsumidorFinal' });
      setProveedores(items => [...items, nuevo]);
      seleccionarProveedorPedido(nuevo);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al crear proveedor ocasional');
    }
  };

  const crearProveedorPedido = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newProvNombre.trim()) return;
    try {
      const dto: CrearProveedorRequestDto = { nombre: newProvNombre.trim(), ivaCondicion: 'ConsumidorFinal' };
      const nuevo = await api.proveedores.crear(dto);
      setProveedores(items => [...items, nuevo]);
      seleccionarProveedorPedido(nuevo);
      setNewProvNombre('');
      setShowNewProvModal(false);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al crear proveedor');
    }
  };

  const productosFilt = useMemo(() => {
    if (createProveedorId === 0) return [];
    const disponibles = productos.filter(p => !createItems.some(item => item.productoId === p.id));
    if (!prodSearch.trim()) return disponibles;
    const q = prodSearch.toLowerCase();
    return disponibles.filter(p => p.nombre.toLowerCase().includes(q) || p.codigoBarra.toLowerCase().includes(q));
  }, [productos, createItems, createProveedorId, prodSearch]);

  const sugerirCantidad = (prod: ProductoDto): number => {
    if (prod.seguirStock === false) return 1;
    const ideal = prod.cantidadIdeal ?? 0;
    const stock = prod.stock ?? 0;
    if (ideal > 0 && stock < ideal) {
      const diff = Math.ceil(ideal - stock);
      return diff > 0 ? diff : 1;
    }
    return 1;
  };

  const alertas = useMemo(() => {
    return productos.filter(p => {
      if (p.seguirStock === false) return false;
      const ideal = p.cantidadIdeal ?? 0;
      const stock = p.stock ?? 0;
      return ideal > 0 && stock < ideal * 0.2;
    });
  }, [productos]);

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

  const closeDetalle = () => {
    setDetalleModal(null);
  };

  const openDetalle = async (id: number) => {
    try {
      const detail = await api.pedidos.obtener(id);
      setDetalleModal(detail);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cargar detalle');
    }
  };

  useEffect(() => {
    if (!detalleModal) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (compartirModalOpen) return;
      setDetalleModal(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [detalleModal, compartirModalOpen]);

  const openRecepcion = async (id: number) => {
    try {
      const detail = await api.pedidos.obtener(id);
      setRecepcionPedido(detail);
      setFaltantesResult(null);
      const items: Record<number, { cantidad: number; faltante: boolean; precioReal: number; precioVenta: number }> = {};
      detail.items.forEach(item => {
        items[item.id] = {
          cantidad: item.cantidadPedida,
          faltante: false,
          precioReal: item.precioUnitarioEstimado,
          precioVenta: productos.find(producto => producto.id === item.productoId)?.precio ?? 0,
        };
      });
      setRecepcionItems(items);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cargar pedido');
    }
  };

  const openEditar = async (id: number) => {
    try {
      const detail = await api.pedidos.obtener(id);
      const proveedor = proveedores.find(p => p.nombre === detail.proveedorNombre);
      setEditingPedidoId(id);
      setEditingPedidoDetalle(detail);
      setCreateProveedorId(proveedor?.id ?? 0);
      setCreateProveedorNombre(proveedor?.nombre ?? '');
      setCreateItems(detail.items.map(i => ({
        productoId: i.productoId,
        productoNombre: i.productoNombre,
        cantidad: i.cantidadPedida,
        precioEstimado: i.precioUnitarioEstimado,
      })));
      setCreateFechaEsperada(detail.fechaEsperada ? detail.fechaEsperada.split('T')[0] : '');
      setCreateObs('');
      setProdSearch('');
      setShowCreateModal(true);
      setProdLoading(true);
      api.productos.listar(getSucursalActivaId()).then(p => { setProductos(p); setProdLoading(false); }).catch(() => { setProdLoading(false); notifyError('Error al cargar productos'); });
      setTimeout(() => provInputRef.current?.focus(), 100);
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
            precioVenta: ri.precioVenta,
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

  const handleCancelar = (id: number) => {
    setPedidoCancelarId(id);
  };

  const confirmarCancelar = async () => {
    if (!pedidoCancelarId) return;
    try {
      await api.pedidos.cancelar(pedidoCancelarId);
      notifySuccess('Pedido cancelado');
      loadPedidos();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cancelar pedido');
    }
    setPedidoCancelarId(null);
  };

  const agregarDesdeAlerta = (prod: ProductoDto) => {
    const cant = sugerirCantidad(prod);
    setCreateItems(prev => [...prev, { productoId: prod.id, productoNombre: prod.nombre, cantidad: cant, precioEstimado: prod.costo }]);
  };

  const handleGuardarPedido = async () => {
    if (createProveedorId === 0 || createItems.length === 0) return;
    setCreating(true);
    try {
      const itemsPayload = createItems.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, precioUnitarioEstimado: i.precioEstimado, descripcion: i.productoId === 0 ? i.productoNombre : undefined }));
      let detalleCreado: PedidoDetailDto | null = null;
      if (editingPedidoId) {
        const dto: PedidoEditDto = {
          proveedorId: createProveedorId,
          items: itemsPayload,
          fechaEsperada: createFechaEsperada || undefined,
          observaciones: createObs || undefined,
        };
        await api.pedidos.editar(editingPedidoId, dto);
        notifySuccess('Pedido actualizado');
      } else {
        const sucursalId = (() => { try { const s = JSON.parse(localStorage.getItem('sucursalActiva') ?? '{}'); return s.id ?? 1; } catch { return 1; } })();
        detalleCreado = await api.pedidos.crear({
          sucursalId,
          proveedorId: createProveedorId,
          items: itemsPayload,
          fechaEsperada: createFechaEsperada || undefined,
          observaciones: createObs || undefined,
        });
      }
      setShowCreateModal(false);
      setEditingPedidoId(null);
      setCreateProveedorId(0);
      setCreateProveedorNombre('');
      setCreateItems([]);
      setCreateFechaEsperada('');
      setCreateObs('');
      setProdSearch('');
      if (detalleCreado) {
        setDetalleModal(detalleCreado);
      }
      loadPedidos();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al guardar pedido');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <PageShell
        title="Pedidos a proveedores"
        subtitle={`${pedidosFiltrados.length} pedidos`}
        loading={loading}
        loadingMessage="Cargando pedidos..."
        helpKey={HELP_KEYS.pedidos}
        actions={
          <button onClick={() => { setEditingPedidoId(null); setShowCreateModal(true); setProdSearch(''); setPedidoTab('productos'); setCreateProveedorId(0); setCreateProveedorNombre(''); setCreateItems([]); setCreateFechaEsperada(''); setCreateObs(''); setProdLoading(true); api.productos.listar(getSucursalActivaId()).then(p => { setProductos(p); setProdLoading(false); }).catch(() => { setProdLoading(false); notifyError('Error al cargar productos'); }); setTimeout(() => provInputRef.current?.focus(), 100); }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
            + Nuevo pedido
          </button>
        }
      >
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
          </div>
        </div>

        {/* Table */}
        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">No hay pedidos</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-[86px]">Pedido</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3 text-center">Productos</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="hidden md:table-cell px-4 py-3">Esperado</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-300">
                {pedidosFiltrados.map(p => (
                  <tr key={p.id} onClick={() => p.estado === 'Pendiente' ? openEditar(p.id) : openDetalle(p.id)} className="group cursor-pointer hover:bg-indigo-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-600">#{p.id}</td>
                    <td className="px-4 py-3"><span className="block font-medium text-gray-900">{p.proveedorNombre}</span><span className="block text-xs text-gray-400">Creado {formatDate(p.fecha)}</span></td>
                    <td className="px-4 py-3 text-center"><span className="inline-flex min-w-7 justify-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">{p.cantidadItems}</span></td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-900">${p.total.toFixed(2)}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-gray-500">{p.fechaEsperada ? formatDate(p.fechaEsperada) : 'Sin fecha'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${estadoBadge(p.estado)}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-400 group-hover:text-indigo-600"><ChevronRight size={18} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>

      {/* ── Detalle Modal ── */}
      {detalleModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={closeDetalle}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Pedido #{detalleModal.id}</h3>
              <button onClick={closeDetalle} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div><span className="text-gray-500">Proveedor:</span> <span className="font-medium">{detalleModal.proveedorNombre}</span></div>
              <div><span className="text-gray-500">Fecha:</span> <span className="font-medium">{formatDate(detalleModal.fecha)}</span></div>
              <div><span className="text-gray-500">Estado:</span> <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge(detalleModal.estado)}`}>{detalleModal.estado}</span></div>
              {detalleModal.fechaEsperada && <div><span className="text-gray-500">Esperado:</span> <span className="font-medium">{formatDate(detalleModal.fechaEsperada)}</span></div>}
              {detalleModal.idPedidoOrigen && <div className="col-span-2"><span className="text-gray-500">Origen:</span> <span className="font-medium">Pedido #{detalleModal.idPedidoOrigen}</span></div>}
            </div>
            <table className="w-full text-xs border-collapse">
              <thead><tr className="border-b border-gray-200"><th className="text-left pb-2">Producto</th><th className="text-right pb-2">Cant</th><th className="text-right pb-2">Estado</th></tr></thead>
              <tbody>{detalleModal.items.map(item => (
                <tr key={item.id} className="border-b-2 border-gray-300">
                  <td className="py-1.5 pr-2">{item.productoNombre}<br /><span className="text-gray-400 font-mono">{item.codigoBarra}</span></td>
                  <td className="text-right py-1.5">{item.cantidadPedida}</td>
                  <td className="text-right py-1.5"><span className={`px-1.5 py-0.5 rounded text-xs ${estadoBadge(item.estado)}`}>{item.estado}</span></td>
                </tr>
              ))}</tbody>
            </table>
            <div className="mt-4 flex gap-2">
              <CompartirMenu
                mail={detalleModal.proveedorMail}
                telefono={detalleModal.proveedorTelefono}
                mailSubject={`Pedido #${detalleModal.id}`}
                mensaje={buildPedidoWhatsAppMessage(detalleModal)}
                className="relative flex-1"
                dropdownUp
                onOpenChange={setCompartirModalOpen}
              />
              <button onClick={closeDetalle} className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recepción Modal ── */}
      {recepcionPedido && (
        <Dialog
          open
          onClose={() => { setRecepcionPedido(null); setFaltantesResult(null) }}
          closeOnBackdrop={false}
          title="PEDIDO"
          icon={ClipboardList}
          highlight={`Recibir pedido #${recepcionPedido.id}`}
          description={recepcionPedido.proveedorNombre}
          width="xl"
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button variant="secondary" size="md" onClick={() => { setRecepcionPedido(null); setFaltantesResult(null); loadPedidos() }}>Cerrar</Button>
              {faltantesResult ? (
                <Button variant="primary" size="md" onClick={handleCrearSiguientePedido}>Crear pedido con faltantes</Button>
              ) : (
                <Button variant="primary" size="md" onClick={handleRecibir} loading={receiving}>Confirmar recepción</Button>
              )}
            </div>
          }
        >
          <div className="space-y-3">

            {faltantesResult ? (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-green-800 font-semibold text-sm">✓ Pedido recibido — Compra generada</p>
                  <p className="text-green-700 text-xs mt-1">Los items recibidos ya impactaron en stock.</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                  <p className="text-amber-800 font-semibold text-sm mb-2">Faltantes — {faltantesResult.reduce((s, f) => s + f.cantidadFaltante, 0)} unidades</p>
                  <table className="w-full text-xs">
                    <thead><tr className="text-amber-600"><th className="text-left pb-1">Producto</th><th className="text-right pb-1">Cantidad</th></tr></thead>
                    <tbody>{faltantesResult.map((f, i) => (
                      <tr key={i}><td className="py-0.5">{f.productoNombre}</td><td className="text-right">{f.cantidadFaltante}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            ) : (
              <>
                {/* Header row */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-2 mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <span className="col-span-4">Producto</span>
                  <span className="col-span-2 text-center">Pedido</span>
                  <span className="col-span-2 text-center">Recibido</span>
                  <span className="col-span-2 text-center">Precio de venta</span>
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
                        </div>
                        {/* Recibido */}
                        <div className="sm:col-span-2 flex items-center justify-center">
                          <input type="number" min={0} max={item.cantidadPedida} step="1"
                            value={cantidadRecibida}
                            onChange={e => setRecepcionItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], cantidad: parseInt(e.target.value) || 0 } }))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center font-mono focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                        </div>
                        {/* Precio de venta */}
                        <div className="sm:col-span-2 flex items-center justify-center">
                          <input type="number" min={0} step="0.01"
                            value={ri?.precioVenta ?? 0}
                            onChange={e => setRecepcionItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], precioVenta: parseFloat(e.target.value) || 0 } }))}
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
              </>
            )}
          </div>
        </Dialog>
      )}

      {/* ── Crear Pedido Modal ── */}
      {showCreateModal && (
        <Dialog
          open
          onClose={() => setShowCreateModal(false)}
          closeOnBackdrop={false}
          closeOnEscape={false}
          title="PEDIDO"
          icon={ClipboardList}
          highlight={editingPedidoId ? `Editar pedido #${editingPedidoId}` : 'Nuevo pedido'}
          description="Seleccioná el proveedor y armá el pedido desde el carrito."
          width="2xl"
          fillHeight
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              {editingPedidoId && editingPedidoDetalle && (
                <>
                  <Button variant="destructive" size="md" className="mr-auto" type="button" onClick={() => { setShowCreateModal(false); handleCancelar(editingPedidoId) }}>Cancelar pedido</Button>
                  <CompartirMenu mail={editingPedidoDetalle.proveedorMail} telefono={editingPedidoDetalle.proveedorTelefono}
                    mailSubject={`Pedido #${editingPedidoDetalle.id}`} mensaje={buildPedidoWhatsAppMessage(editingPedidoDetalle)} destinatarioManual className="relative"
                    buttonClassName="min-w-[128px] px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2" dropdownUp />
                  <Button variant="confirm" size="md" type="button" onClick={() => { setShowCreateModal(false); openRecepcion(editingPedidoId) }}>Recibir</Button>
                </>
              )}
              <Button ref={cancelarPedidoRef} variant="secondary" size="md" className="min-w-[128px]" type="button" onClick={() => setShowCreateModal(false)}>Cerrar</Button>
              <Button variant="primary" size="md" className="min-w-[128px]" type="submit" form="pedido-form"
                disabled={creating || createProveedorId === 0 || createItems.length === 0} loading={creating}>
                {editingPedidoId ? 'Guardar cambios' : 'Crear pedido'}
              </Button>
            </div>
          }
        >
          <form id="pedido-form" onSubmit={e => { e.preventDefault(); handleGuardarPedido(); }} onKeyDown={e => {
            if (e.key !== 'Enter' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
            e.preventDefault()
            document.querySelector<HTMLButtonElement>('button[form="pedido-form"][type="submit"]')?.focus()
          }} className="lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 lg:flex-1 lg:min-h-0">
              <div className="min-w-0 flex flex-col gap-4 lg:min-h-0">

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Proveedor *</label>
              <ProveedorAltaCruzada proveedores={proveedores} proveedorId={createProveedorId} proveedorNombre={createProveedorNombre}
                inputRef={provInputRef} onSelect={seleccionarProveedorPedido} onCreate={() => setShowNewProvModal(true)} onSelectOcasional={seleccionarProveedorOcasional} />
            </div>

            {/* Catálogo de productos */}
            {createProveedorId > 0 && (
              <div className="lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
                <div className="flex gap-1 mb-3">
                  <button type="button" onClick={() => setPedidoTab('productos')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${pedidoTab === 'productos' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    Agregar
                  </button>
                  <button type="button" onClick={() => setPedidoTab('alertas')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${pedidoTab === 'alertas' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    Alertas{alertas.length > 0 ? ` (${alertas.length})` : ''}
                  </button>
                </div>
                {pedidoTab === 'productos' && (
                  <div className="border border-gray-300 bg-white overflow-hidden lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
                    <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-300 shrink-0">
                      <h3 className="text-xs font-semibold text-black">PRODUCTOS DISPONIBLES</h3>
                      <div className="relative w-64 max-w-[60%]">
                        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input ref={prodInputRef} type="text" value={prodSearch} onChange={e => { setProdSearch(e.target.value); setProductoLibrePendiente(null); setProductoCatalogoIdx(-1) }}
                          onKeyDown={e => {
                            if (e.key === 'Tab' && !e.shiftKey) {
                              e.preventDefault()
                              if (createItems.length > 0) ultimaCantidadRef.current?.focus()
                              else fechaEsperadaRef.current?.focus()
                              return
                            }
                            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                              e.preventDefault()
                              setProductoCatalogoIdx(current => {
                                const next = e.key === 'ArrowDown'
                                  ? Math.min(current + 1, productosFilt.length - 1)
                                  : Math.max(current - 1, 0)
                                setTimeout(() => document.querySelector<HTMLElement>(`[data-pedido-product-row="${next}"]`)?.scrollIntoView({ block: 'nearest' }), 0)
                                return next
                              })
                              return
                            }
                            if (e.key !== 'Enter') return
                            e.preventDefault()
                            e.stopPropagation()
                            if (productoLibrePendiente) {
                              setCreateItems(items => [...items, { productoId: 0, productoNombre: productoLibrePendiente, cantidad: 1, precioEstimado: 0 }])
                              setProdSearch('')
                              setProductoLibrePendiente(null)
                              return
                            }
                            const productoSeleccionado = productosFilt[productoCatalogoIdx]
                            if (productoSeleccionado) {
                              setCreateItems(items => [...items, { productoId: productoSeleccionado.id, productoNombre: productoSeleccionado.nombre, cantidad: sugerirCantidad(productoSeleccionado), precioEstimado: productoSeleccionado.costo }])
                              setProdSearch('')
                              setProductoCatalogoIdx(-1)
                              return
                            }
                            const nombre = prodSearch.trim()
                            if (!nombre) return
                            const producto = productos.find(p => p.nombre.toLowerCase() === nombre.toLowerCase() || p.codigoBarra === nombre)
                            if (producto) {
                              setCreateItems(items => [...items, { productoId: producto.id, productoNombre: producto.nombre, cantidad: sugerirCantidad(producto), precioEstimado: producto.costo }])
                              setProdSearch('')
                              return
                            }
                            setProductoLibrePendiente(nombre)
                          }}
                          placeholder={prodLoading ? 'Cargando...' : 'Buscar producto...'} disabled={prodLoading}
                          className="w-full pl-8 pr-2 py-1 border border-gray-300 text-sm text-black outline-none focus:border-[var(--color-primary)] disabled:opacity-50" />
                        {productoLibrePendiente && (
                          <div className="absolute z-20 top-full mt-1 right-0 w-72 border border-amber-300 bg-amber-50 p-2.5 shadow-lg text-xs text-amber-900">
                            <p><strong>{productoLibrePendiente}</strong> no existe. ¿Deseás agregarlo al pedido?</p>
                            <div className="mt-2 flex justify-end gap-2">
                              <button type="button" onClick={() => setProductoLibrePendiente(null)} className="px-2 py-1 text-gray-600 hover:text-gray-900">Cancelar</button>
                              <button type="button" onClick={() => { setCreateItems(items => [...items, { productoId: 0, productoNombre: productoLibrePendiente, cantidad: 1, precioEstimado: 0 }]); setProdSearch(''); setProductoLibrePendiente(null); prodInputRef.current?.focus() }} className="px-2 py-1 bg-amber-600 text-white hover:bg-amber-700">Agregar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[380px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="sticky top-0 z-10 bg-gray-100">
                          <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-black border-b border-gray-300">
                            <th className="px-2 py-1.5">Producto</th>
                            <th className="px-1 py-1.5 text-right w-[56px]">Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productosFilt.map((p, i) => (
                            <tr key={p.id} data-pedido-product-row={i} onClick={() => { setCreateItems(items => [...items, { productoId: p.id, productoNombre: p.nombre, cantidad: sugerirCantidad(p), precioEstimado: p.costo }]); setProdSearch(''); setProductoCatalogoIdx(-1) }}
                              className={`cursor-pointer border-b border-gray-200 last:border-0 hover:bg-gray-50 ${i === productoCatalogoIdx ? 'bg-indigo-50' : ''}`}>
                              <td className="px-2 py-1.5"><span className="text-black">{p.nombre}</span><span className="block font-mono text-[11px] text-black">{p.codigoBarra || p.codigoProducto || ''}</span></td>
                              <td className="px-1 py-1.5 text-right tabular-nums whitespace-nowrap"><span className={p.stock > 0 ? 'text-emerald-600' : 'text-red-500'}>●</span> {p.stock}</td>
                            </tr>
                          ))}
                          {productosFilt.length === 0 && <tr><td colSpan={2} className="px-3 py-10 text-center text-sm text-black">Sin productos para mostrar</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {pedidoTab === 'alertas' && (
                  <div className="mt-1">
                    {alertas.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3">No hay productos por debajo del 20% de su cantidad ideal.</p>
                    ) : (
                      <div className="border border-gray-200 rounded-lg divide-y-2 divide-gray-300 max-h-48 overflow-y-auto">
                        {alertas.map(p => {
                          const ideal = p.cantidadIdeal ?? 0;
                          const stock = p.stock ?? 0;
                          return (
                            <div key={p.id} className="flex items-center justify-between gap-2 px-3 py-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-800 truncate">{p.nombre}</p>
                                <p className="text-xs text-gray-400">Stock: {stock} / Ideal: {ideal}</p>
                              </div>
                              <button type="button" onClick={() => agregarDesdeAlerta(p)}
                                className="shrink-0 px-2.5 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg hover:bg-indigo-200 transition-colors">
                                + Agregar {sugerirCantidad(p)}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha esperada</label>
                <input ref={fechaEsperadaRef} type="date" value={createFechaEsperada} onChange={e => setCreateFechaEsperada(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); observacionesRef.current?.focus() } }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
                <input ref={observacionesRef} type="text" value={createObs} onChange={e => setCreateObs(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); cancelarPedidoRef.current?.focus() } }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
              </div>
            </div>
              </div>

              <CarritoPopup
                title="PRODUCTOS DEL PEDIDO"
                count={createItems.length}
                onClear={() => setCreateItems([])}
                emptyState="Agregá productos desde la lista de la izquierda"
                footer={<div className="flex items-center justify-between px-3 py-2 text-[13px] font-medium text-black"><span>RESUMEN</span><span>{createItems.reduce((total, item) => total + item.cantidad, 0)} unidades</span></div>}
              >
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 z-10 bg-gray-100">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-black border-b border-gray-300">
                      <th className="px-2 py-1.5">Producto</th>
                      <th className="px-1 py-1.5 text-center w-[86px]">Cant.</th>
                      <th className="px-1 py-1.5 w-[24px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {createItems.map((item, i) => (
                      <tr key={`${item.productoId}-${i}`} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                        <td className="px-2 py-1.5 text-black">
                          {item.productoNombre}
                          {item.productoId === 0 && <span className="ml-1 text-[12px] text-indigo-500 font-medium">(libre)</span>}
                        </td>
                        <td className="px-1 py-1.5">
                          <div className="flex items-center justify-center gap-0.5">
                            <button type="button" onClick={() => setCreateItems(items => item.cantidad <= 1 ? items.filter((_, j) => j !== i) : items.map((current, j) => j === i ? { ...current, cantidad: current.cantidad - 1 } : current))}
                              className="w-5 h-5 border border-gray-300 flex items-center justify-center text-black hover:bg-gray-100"><Minus size={11} /></button>
                            <input ref={i === createItems.length - 1 ? ultimaCantidadRef : undefined} type="number" min={1} value={item.cantidad} onChange={e => setCreateItems(items => items.map((current, j) => j === i ? { ...current, cantidad: parseInt(e.target.value) || 1 } : current))}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); prodInputRef.current?.focus() } }}
                              className="w-10 py-0.5 text-center border border-gray-300 font-mono text-xs tabular-nums outline-none focus:border-[var(--color-primary)]" />
                            <button type="button" onClick={() => setCreateItems(items => items.map((current, j) => j === i ? { ...current, cantidad: current.cantidad + 1 } : current))}
                              className="w-5 h-5 border border-gray-300 flex items-center justify-center text-black hover:bg-gray-100"><Plus size={11} /></button>
                          </div>
                        </td>
                        <td className="px-1 py-1.5 text-center"><button type="button" onClick={() => setCreateItems(items => items.filter((_, j) => j !== i))} className="text-black hover:text-red-500" aria-label={`Quitar ${item.productoNombre}`}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CarritoPopup>
            </div>
          </form>
        </Dialog>
      )}

      <Dialog open={showNewProvModal} onClose={() => { setShowNewProvModal(false); setNewProvNombre('') }} title="Nuevo proveedor" width="md"
        footer={<><Button variant="secondary" size="sm" onClick={() => { setShowNewProvModal(false); setNewProvNombre('') }}>Cancelar</Button><Button variant="primary" size="sm" type="submit" form="nuevo-prov-pedido-form" disabled={!newProvNombre.trim()}>Crear proveedor</Button></>}>
        <form id="nuevo-prov-pedido-form" onSubmit={crearProveedorPedido} onKeyDown={e => {
          if (e.key !== 'Enter') return
          e.preventDefault()
          document.querySelector<HTMLButtonElement>('button[form="nuevo-prov-pedido-form"][type="submit"]')?.focus()
        }}>
          <label className="text-xs font-semibold text-gray-700">Nombre *</label>
          <input autoFocus type="text" value={newProvNombre} onChange={e => setNewProvNombre(e.target.value)} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
        </form>
      </Dialog>

    <Dialog
      open={pedidoCancelarId !== null}
      onClose={() => setPedidoCancelarId(null)}
      title="Cancelar pedido"
      description="¿Cancelar este pedido? Esta acción no se puede deshacer."
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            onClick={() => setPedidoCancelarId(null)}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmarCancelar}
            className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Cancelar pedido
          </button>
        </div>
      }
    />
    </>
  );
}
