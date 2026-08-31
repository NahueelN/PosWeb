import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Plus, Minus, Trash2, X, Mail, Share2, MessageCircle, Globe } from 'lucide-react';
import type { PedidoListDto, PedidoDetailDto, RecibirPedidoRequestDto, RecibirItemDto, ProveedorDto, ProductoDto, PedidoEditDto } from '../types';
import { api } from '../api/client';
import { useNotification } from '../context/NotificationContext';
import Dialog from '../components/ui/Dialog';
import PageShell from '../components/shared/PageShell';
import { openWhatsApp, getWhatsAppPref, setWhatsAppPref } from '../lib/whatsapp';
import { openEmail, getMailPref, setMailPref } from '../lib/mail';

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
  const [showShare, setShowShare] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [mailRecordar, setMailRecordar] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappRecordar, setWhatsappRecordar] = useState(false);
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
  const [editingPedidoId, setEditingPedidoId] = useState<number | null>(null);

  // Product search state (create/edit modal)
  const [prodSearch, setProdSearch] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [showProdDropdown, setShowProdDropdown] = useState(false);
  const [prodHighIdx, setProdHighIdx] = useState(-1);
  const [selectedProductId, setSelectedProductId] = useState(0);
  const prodInputRef = useRef<HTMLInputElement>(null);
  const cantInputRef = useRef<HTMLInputElement>(null);
  const [pedidoTab, setPedidoTab] = useState<'productos' | 'alertas'>('productos');

  // Reset product selection when proveedor changes
  useEffect(() => {
    setProdSearch('');
    setCantidad('1');
    setSelectedProductId(0);
    setShowProdDropdown(false);
    setProdHighIdx(-1);
    setPedidoTab('productos');
  }, [createProveedorId]);

  const [showProvDropdown, setShowProvDropdown] = useState(false);
  const [provHighIdx, setProvHighIdx] = useState(-1);
  const provFocusRef = useRef(false);
  const provInputRef = useRef<HTMLInputElement>(null);

  const createProveedoresFilt = createProveedorSearch.trim()
    ? proveedores.filter(p => p.nombre.toLowerCase().includes(createProveedorSearch.toLowerCase()) || p.codigo.toLowerCase().includes(createProveedorSearch.toLowerCase()))
    : proveedores;

  const productosFilt = useMemo(() => {
    if (createProveedorId === 0) return [];
    if (!prodSearch.trim()) return productos;
    const q = prodSearch.toLowerCase();
    return productos.filter(p => p.nombre.toLowerCase().includes(q) || p.codigoBarra.toLowerCase().includes(q));
  }, [productos, createProveedorId, prodSearch]);

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
    setShowShare(false);
  };

  const openDetalle = async (id: number) => {
    try {
      const detail = await api.pedidos.obtener(id);
      setShowShare(false);
      setDetalleModal(detail);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cargar detalle');
    }
  };

  const openMail = () => {
    setShowShare(false);
    const pref = getMailPref();
    if (pref && detalleModal) {
      openEmail(detalleModal, pref);
      return;
    }
    setMailRecordar(false);
    setMailModalOpen(true);
  };

  const elegirMail = (method: 'mailto' | 'gmail') => {
    setMailPref(mailRecordar ? method : null);
    setMailModalOpen(false);
    if (detalleModal) openEmail(detalleModal, method);
  };

  const openWhatsAppShare = () => {
    setShowShare(false);
    const pref = getWhatsAppPref();
    if (pref && detalleModal) {
      openWhatsApp(detalleModal, pref);
      return;
    }
    setWhatsappRecordar(false);
    setWhatsappModalOpen(true);
  };

  const elegirWhatsApp = (method: 'desktop' | 'web') => {
    setWhatsAppPref(whatsappRecordar ? method : null);
    setWhatsappModalOpen(false);
    if (detalleModal) openWhatsApp(detalleModal, method);
  };

  useEffect(() => {
    if (!detalleModal && !mailModalOpen && !whatsappModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (mailModalOpen) {
        setMailModalOpen(false);
      } else if (whatsappModalOpen) {
        setWhatsappModalOpen(false);
      } else {
        setDetalleModal(null);
        setShowShare(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [detalleModal, mailModalOpen, whatsappModalOpen]);

  useEffect(() => {
    if (!showShare) return;
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShare(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showShare]);

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

  const openEditar = async (id: number) => {
    try {
      const detail = await api.pedidos.obtener(id);
      const proveedor = proveedores.find(p => p.nombre === detail.proveedorNombre);
      setEditingPedidoId(id);
      setCreateProveedorId(proveedor?.id ?? 0);
      setCreateProveedorNombre(proveedor?.nombre ?? '');
      setCreateProveedorSearch('');
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

  const seleccionarDelDropdown = (id: number) => {
    const prod = productos.find(p => p.id === id);
    if (!prod) return;
    setProdSearch(prod.nombre);
    setSelectedProductId(id);
    setCantidad(String(sugerirCantidad(prod)));
    setShowProdDropdown(false);
    setProdHighIdx(-1);
    setTimeout(() => cantInputRef.current?.focus(), 50);
  };

  const agregarDesdeAlerta = (prod: ProductoDto) => {
    const cant = sugerirCantidad(prod);
    setCreateItems(prev => [...prev, { productoId: prod.id, productoNombre: prod.nombre, cantidad: cant, precioEstimado: prod.costo }]);
  };

  const agregarProductoSeleccionado = () => {
    const cant = parseFloat(cantidad);
    if (isNaN(cant) || cant <= 0) {
      notifyError('Cantidad inválida');
      return;
    }

    let productoId = selectedProductId;
    let productoNombre = '';
    let precioEstimado = 0;

    if (productoId > 0) {
      const prod = productos.find(p => p.id === productoId);
      if (!prod) return;
      productoNombre = prod.nombre;
      precioEstimado = prod.costo;
    } else if (prodSearch.trim()) {
      const match = productos.find(p =>
        p.nombre.toLowerCase() === prodSearch.trim().toLowerCase() ||
        p.codigoBarra === prodSearch.trim()
      );
      if (match) {
        productoId = match.id;
        productoNombre = match.nombre;
        precioEstimado = match.costo;
      } else {
        productoId = 0;
        productoNombre = prodSearch.trim();
        precioEstimado = 0;
      }
    } else {
      notifyError('Seleccioná un producto o escribí uno libre');
      return;
    }

    setCreateItems(prev => [...prev, { productoId, productoNombre, cantidad: cant, precioEstimado }]);
    setProdSearch('');
    setCantidad('1');
    setSelectedProductId(0);
    setShowProdDropdown(false);
    setProdHighIdx(-1);
    prodInputRef.current?.focus();
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
      setCreateProveedorSearch('');
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
        actions={
          <button onClick={() => { setEditingPedidoId(null); setShowCreateModal(true); setProdSearch(''); setCantidad('1'); setSelectedProductId(0); setPedidoTab('productos'); setCreateProveedorId(0); setCreateProveedorNombre(''); setCreateProveedorSearch(''); setCreateItems([]); setCreateFechaEsperada(''); setCreateObs(''); setProdLoading(true); api.productos.listar(getSucursalActivaId()).then(p => { setProductos(p); setProdLoading(false); }).catch(() => { setProdLoading(false); notifyError('Error al cargar productos'); }); setTimeout(() => provInputRef.current?.focus(), 100); }}
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
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidosFiltrados.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.proveedorNombre}</td>
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
                            <button onClick={() => openEditar(p.id)}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-200 transition-colors">
                              Editar
                            </button>
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
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-1.5 pr-2">{item.productoNombre}<br /><span className="text-gray-400 font-mono">{item.codigoBarra}</span></td>
                  <td className="text-right py-1.5">{item.cantidadPedida}</td>
                  <td className="text-right py-1.5"><span className={`px-1.5 py-0.5 rounded text-xs ${estadoBadge(item.estado)}`}>{item.estado}</span></td>
                </tr>
              ))}</tbody>
            </table>
            <div className="mt-4 flex gap-2">
              <div ref={shareRef} className="relative flex-1">
                <button onClick={() => setShowShare(v => !v)}
                  className="w-full py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <Share2 size={16} />
                  Compartir
                </button>
                {showShare && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                    <button onClick={openMail} disabled={!detalleModal.proveedorMail}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Mail size={16} className="text-gray-400" />
                      Enviar por mail
                    </button>
                    <button onClick={openWhatsAppShare} disabled={!detalleModal.proveedorTelefono}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed border-t border-gray-100">
                      <MessageCircle size={16} className="text-gray-400" />
                      Compartir por WhatsApp
                    </button>
                  </div>
                )}
              </div>
              <button onClick={closeDetalle} className="flex-1 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mail Method Modal ── */}
      {mailModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4" onClick={() => setMailModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-900">Compartir por mail</h3>
              <button onClick={() => setMailModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">¿Cómo querés abrir el correo?</p>
            <div className="space-y-2">
              <button onClick={() => elegirMail('mailto')}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl transition-colors hover:border-indigo-300 hover:bg-gray-50">
                <Mail size={18} className="text-indigo-600 shrink-0" />
                <span className="flex-1 text-left">
                  <span className="block font-medium text-gray-900 text-sm">Outlook</span>
                  <span className="block text-xs text-gray-400">Abre con mailto</span>
                </span>
              </button>
              <button onClick={() => elegirMail('gmail')}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl transition-colors hover:border-indigo-300 hover:bg-gray-50">
                <Globe size={18} className="text-indigo-600 shrink-0" />
                <span className="flex-1 text-left">
                  <span className="block font-medium text-gray-900 text-sm">Navegador (Gmail)</span>
                  <span className="block text-xs text-gray-400">Abre en Gmail web</span>
                </span>
              </button>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={mailRecordar} onChange={e => setMailRecordar(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              Guardar como opción predeterminada
            </label>
          </div>
        </div>
      )}

      {/* ── WhatsApp Method Modal ── */}
      {whatsappModalOpen && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4" onClick={() => setWhatsappModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-900">Compartir por WhatsApp</h3>
              <button onClick={() => setWhatsappModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">¿Cómo querés abrir WhatsApp?</p>
            <div className="space-y-2">
              <button onClick={() => elegirWhatsApp('desktop')}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl transition-colors hover:border-indigo-300 hover:bg-gray-50">
                <MessageCircle size={18} className="text-indigo-600 shrink-0" />
                <span className="flex-1 text-left">
                  <span className="block font-medium text-gray-900 text-sm">Escritorio</span>
                  <span className="block text-xs text-gray-400">WhatsApp Desktop</span>
                </span>
              </button>
              <button onClick={() => elegirWhatsApp('web')}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl transition-colors hover:border-indigo-300 hover:bg-gray-50">
                <Globe size={18} className="text-indigo-600 shrink-0" />
                <span className="flex-1 text-left">
                  <span className="block font-medium text-gray-900 text-sm">Navegador</span>
                  <span className="block text-xs text-gray-400">WhatsApp Web</span>
                </span>
              </button>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm text-gray-600 cursor-pointer select-none">
              <input type="checkbox" checked={whatsappRecordar} onChange={e => setWhatsappRecordar(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              Guardar como opción predeterminada
            </label>
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
            <p className="text-sm text-gray-600 mb-4">{recepcionPedido.proveedorNombre}</p>

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
          <form onSubmit={e => { e.preventDefault(); handleGuardarPedido(); }} onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                {editingPedidoId ? `Editar pedido #${editingPedidoId}` : 'Nuevo pedido'}
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            {/* Proveedor search */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Proveedor *</label>
              <div className="relative">
                <input ref={provInputRef} type="text"
                  value={createProveedorId > 0 ? createProveedorNombre : createProveedorSearch}
                  onChange={e => { setCreateProveedorSearch(e.target.value); if (createProveedorId > 0) { setCreateProveedorId(0); setCreateProveedorNombre(''); } setShowProvDropdown(true); setProvHighIdx(-1); provFocusRef.current = false; }}
                  onFocus={() => setShowProvDropdown(true)}
                  onBlur={() => setTimeout(() => { setShowProvDropdown(false); setProvHighIdx(-1); provFocusRef.current = false; }, 200)}
                  onKeyDown={e => {
                    if (!showProvDropdown || createProveedoresFilt.length === 0) {
                      if (e.key === 'Enter' && createProveedoresFilt.length === 1) {
                        e.preventDefault();
                        const p = createProveedoresFilt[0];
                        setCreateProveedorId(p.id); setCreateProveedorNombre(p.nombre); setCreateProveedorSearch(''); setShowProvDropdown(false);
                        setTimeout(() => prodInputRef.current?.focus(), 100);
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
                        setTimeout(() => prodInputRef.current?.focus(), 100);
                      } else if (total === 1) {
                        const p = createProveedoresFilt[0];
                        setCreateProveedorId(p.id); setCreateProveedorNombre(p.nombre); setCreateProveedorSearch(''); setShowProvDropdown(false);
                        setTimeout(() => prodInputRef.current?.focus(), 100);
                      }
                      return;
                    }
                    if (e.key === 'Escape') { setShowProvDropdown(false); setProvHighIdx(-1); provFocusRef.current = false; }
                  }}
                  placeholder="Buscar proveedor..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                {showProvDropdown && createProveedoresFilt.length > 0 && (
                  <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto text-[13px]">
                    {createProveedoresFilt.map((p, i) => (
                      <li key={p.id} onMouseDown={() => { setCreateProveedorId(p.id); setCreateProveedorNombre(p.nombre); setCreateProveedorSearch(''); setShowProvDropdown(false); setProvHighIdx(-1); provFocusRef.current = false; setTimeout(() => prodInputRef.current?.focus(), 100); }}
                        onMouseEnter={() => { setProvHighIdx(i); provFocusRef.current = true; }}
                        className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 ${i === provHighIdx && provFocusRef.current ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}>
                        <span className="truncate">{p.nombre}</span>
                        <span className="text-gray-400 shrink-0 font-mono text-[11px]">{p.codigo}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Productos */}
            {createProveedorId > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Productos del pedido</h4>
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
                <div className="flex gap-2 items-end">
                  <div className="flex-1 relative">
                    <label className="block text-xs text-gray-500 mb-1">Producto</label>
                    <input ref={prodInputRef} type="text" value={prodSearch}
                      onChange={e => { setProdSearch(e.target.value); setShowProdDropdown(true); setProdHighIdx(-1); setSelectedProductId(0); }}
                      onFocus={() => { if (prodSearch) setShowProdDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowProdDropdown(false), 200)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          if (showProdDropdown && productosFilt.length > 0 && prodHighIdx >= 0) {
                            e.preventDefault();
                            seleccionarDelDropdown(productosFilt[prodHighIdx].id);
                            return;
                          }
                          if (prodSearch.trim()) {
                            e.preventDefault();
                            agregarProductoSeleccionado();
                          }
                          return;
                        }
                        if (!showProdDropdown || productosFilt.length === 0) return;
                        if (e.key === 'ArrowDown') { e.preventDefault(); setProdHighIdx(Math.min(prodHighIdx + 1, productosFilt.length - 1)); }
                        else if (e.key === 'ArrowUp') { e.preventDefault(); setProdHighIdx(Math.max(prodHighIdx - 1, 0)); }
                      }}
                      placeholder={prodLoading ? 'Cargando...' : 'Buscar producto o escribir uno libre...'}
                      disabled={prodLoading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none disabled:opacity-50" />
                    {showProdDropdown && productosFilt.length > 0 && (
                      <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto text-[13px]">
                        {productosFilt.map((p, i) => (
                          <li key={p.id}
                            onMouseDown={() => seleccionarDelDropdown(p.id)}
                            onMouseEnter={() => setProdHighIdx(i)}
                            className={`px-3 py-2 cursor-pointer flex items-center justify-between gap-2 ${i === prodHighIdx ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}>
                            <span className="truncate">{p.nombre}</span>
                            <span className="text-gray-400 shrink-0 font-mono text-[11px]">{p.codigoBarra}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                    <input ref={cantInputRef} type="number" min="1" step="1" value={cantidad}
                      onChange={e => setCantidad(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregarProductoSeleccionado(); } }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                  </div>
                  <button type="button" onClick={agregarProductoSeleccionado}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    + Agregar
                  </button>
                </div>
                )}

                {pedidoTab === 'alertas' && (
                  <div className="mt-1">
                    {alertas.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3">No hay productos por debajo del 20% de su cantidad ideal.</p>
                    ) : (
                      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
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

                {createItems.length > 0 && (
                  <div className="mt-3">
                    <div className="grid grid-cols-[1fr_88px_24px] gap-1.5 px-2 mb-1">
                      <span className="text-[11px] text-gray-400 font-medium">Producto</span>
                      <span className="text-[11px] text-gray-400 font-medium text-center">Cantidad</span>
                      <span />
                    </div>
                    {createItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-[1fr_88px_24px] gap-1.5 items-center bg-gray-50 rounded-lg px-2 py-1.5 text-sm mb-1">
                        <span className="truncate font-medium">
                          {item.productoNombre}
                          {item.productoId === 0 && <span className="ml-1 text-[12px] text-indigo-500 font-medium">(libre)</span>}
                        </span>
                        <div className="flex items-center justify-center gap-0.5">
                          <button type="button"
                            onClick={() => {
                              const items = [...createItems];
                              if (item.cantidad <= 1) setCreateItems(items.filter((_, j) => j !== i));
                              else { items[i] = { ...items[i], cantidad: item.cantidad - 1 }; setCreateItems(items); }
                            }}
                            className="flex h-[20px] w-[20px] items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-90 transition-all duration-100"
                            aria-label={`Reducir cantidad de ${item.productoNombre}`}>
                            <Minus size={10} strokeWidth={3} />
                          </button>
                          <input type="number" min={1}
                            value={item.cantidad}
                            onChange={e => { const items = [...createItems]; items[i] = { ...items[i], cantidad: parseInt(e.target.value) || 1 }; setCreateItems(items); }}
                            className="w-12 text-center border border-gray-200 rounded px-1 py-0.5 text-[12px] font-bold tabular-nums text-indigo-600 bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-indigo-300 focus:border-indigo-400"
                          />
                          <button type="button"
                            onClick={() => { const items = [...createItems]; items[i] = { ...items[i], cantidad: item.cantidad + 1 }; setCreateItems(items); }}
                            className="flex h-[20px] w-[20px] items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-90 transition-all duration-100"
                            aria-label={`Aumentar cantidad de ${item.productoNombre}`}>
                            <Plus size={10} strokeWidth={3} />
                          </button>
                        </div>
                        <button type="button"
                          onClick={() => setCreateItems(createItems.filter((_, j) => j !== i))}
                          className="flex justify-center text-red-400 hover:text-red-600"
                          aria-label={`Quitar ${item.productoNombre}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fecha esperada</label>
                <input type="date" value={createFechaEsperada} onChange={e => setCreateFechaEsperada(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observaciones</label>
                <input type="text" value={createObs} onChange={e => setCreateObs(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
              </div>
            </div>

            <button type="submit"
              disabled={creating || createProveedorId === 0 || createItems.length === 0}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
              {creating ? 'Guardando...' : editingPedidoId ? 'Guardar cambios' : 'Crear pedido'}
            </button>
          </form>
        </div>
      )}

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
