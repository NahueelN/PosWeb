import React, { useReducer, useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CompraRequestDto, CompraResponseDto, ProductoDto, ProveedorDto, CategoriaDto, UnidadMedidaDto } from '../types';
import { api } from '../api/client';
import ProductFormModal from '../components/ProductFormModal';
import { useNotification } from '../context/NotificationContext';
import './CompraPage.css';

// ─── Types ──────────────────────────────────────────────────────────
type Step = 'scan' | 'done';

interface CartItem {
  productoId: number;
  productoNombre: string;
  codigoBarra: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  precio?: number;
  costo?: number;
  categoriaId?: number;
  descAdicional?: string;
  contenido?: number;
  unidadMedidaId?: number;
}

interface CompraState {
  step: Step;
  cart: CartItem[];
  proveedorId: number;
  proveedorNombre: string;
  error: string | null;
  success: CompraResponseDto | null;
  verified: boolean;
  sucursalId: number;
}

type CompraAction =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'ADD_TO_CART'; item: CartItem }
  | { type: 'REMOVE_FROM_CART'; index: number }
  | { type: 'UPDATE_CART_ITEM'; index: number; item: CartItem }
  | { type: 'SET_PROVEEDOR_ID'; proveedorId: number; proveedorNombre: string }
  | { type: 'SET_VERIFIED'; verified: boolean }
  | { type: 'CONFIRM_SUCCESS'; response: CompraResponseDto }
  | { type: 'CONFIRM_ERROR'; error: string }
  | { type: 'RESET' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SUCURSAL'; sucursalId: number };

function compraReducer(state: CompraState, action: CompraAction): CompraState {
  switch (action.type) {
    case 'SET_STEP': return { ...state, step: action.step };
    case 'ADD_TO_CART': {
      const idx = state.cart.findIndex(i => i.productoId === action.item.productoId && i.productoId !== 0);
      if (idx >= 0) {
        const cart = [...state.cart];
        const old = cart[idx];
        const nc = old.cantidad + action.item.cantidad;
        cart[idx] = { ...old, cantidad: nc, subtotal: nc * old.costoUnitario };
        return { ...state, cart };
      }
      return { ...state, cart: [...state.cart, action.item] };
    }
    case 'REMOVE_FROM_CART': { const cart = [...state.cart]; cart.splice(action.index, 1); return { ...state, cart }; }
    case 'UPDATE_CART_ITEM': {
      const cart = [...state.cart];
      cart[action.index] = { ...action.item, subtotal: action.item.cantidad * action.item.costoUnitario };
      return { ...state, cart };
    }
    case 'SET_PROVEEDOR_ID': return { ...state, proveedorId: action.proveedorId, proveedorNombre: action.proveedorNombre };
    case 'SET_VERIFIED': return { ...state, verified: action.verified };
    case 'CONFIRM_SUCCESS': return { ...state, step: 'done', success: action.response, error: null };
    case 'CONFIRM_ERROR': return { ...state, error: action.error };
    case 'RESET': return { ...initialState, sucursalId: state.sucursalId };
    case 'SET_ERROR': return { ...state, error: action.error };
    case 'CLEAR_ERROR': return { ...state, error: null };
    case 'SET_SUCURSAL': return { ...state, sucursalId: action.sucursalId };
    default: return state;
  }
}

function getInitialSucursalId(): number {
  try { const s = JSON.parse(localStorage.getItem('sucursalActiva') ?? '{}'); return s.id ?? 1; } catch { return 1; }
}
const initialState: CompraState = {
  step: 'scan', cart: [], proveedorId: 0, proveedorNombre: '',
  error: null, success: null, verified: false, sucursalId: getInitialSucursalId(),
};

function getSucursalNombre(id: number): string {
  const m: Record<number, string> = { 1: 'Central', 2: 'Norte', 3: 'Sur' };
  return m[id] ?? `#${id}`;
}
function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Component ─────────────────────────────────────────────────────
export default function CompraPage() {
  const [state, dispatch] = useReducer(compraReducer, initialState);
  const navigate = useNavigate();
  const { notifyError } = useNotification();
  const searchRef = useRef<HTMLInputElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const cartListRef = useRef<HTMLDivElement>(null);

  // Data
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [proveedorSearch, setProveedorSearch] = useState('');
  const [showProvDropdown, setShowProvDropdown] = useState(false);
  const [provHighIdx, setProvHighIdx] = useState(-1);
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedidaDto[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  // Payment
  const [pagoType, setPagoType] = useState<'none' | 'total' | 'partial'>('none');
  const [montoPago, setMontoPago] = useState(0);

  // Editing
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [edNombre, setEdNombre] = useState(''); const [edCodigo, setEdCodigo] = useState('');
  const [edPrecio, setEdPrecio] = useState(0); const [edCosto, setEdCosto] = useState('');
  const [edCant, setEdCant] = useState(1); const [edCatId, setEdCatId] = useState<number>(0);
  const [edUnidadId, setEdUnidadId] = useState<number>(0); const [edCont, setEdCont] = useState('');
  const [edDesc, setEdDesc] = useState('');

  // New product modal
  const [showNewModal, setShowNewModal] = useState(false);

  const provInputRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    Promise.all([
      api.productos.buscar('').then(setProductos).catch(() => {}),
      api.proveedores.listar().then(setProveedores).catch(() => {}),
      api.categorias.listar().then(setCategorias).catch(() => {}),
      api.unidadesMedida.listar().then(setUnidades).catch(() => {}),
    ]).finally(() => setProdLoading(false));
  }, []);

  // Auto-focus proveedor if none selected
  useEffect(() => {
    if (state.step === 'scan' && state.proveedorId === 0) setTimeout(() => provInputRef.current?.focus(), 200);
  }, [state.step, state.proveedorId]);

  // beforeunload
  useEffect(() => {
    if (state.cart.length === 0) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [state.cart.length]);

  // Keyboard handler
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingIdx !== null) { setEditingIdx(null); return; }
        if (showNewModal) { setShowNewModal(false); return; }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [editingIdx, showNewModal]);

  // ── Derived ───────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productos;
    const q = searchQuery.toLowerCase();
    return productos.filter(p => p.nombre.toLowerCase().includes(q) || p.codigoBarra.toLowerCase().includes(q));
  }, [productos, searchQuery]);

  const proveedoresFilt = proveedorSearch.trim()
    ? proveedores.filter(p => p.nombre.toLowerCase().includes(proveedorSearch.toLowerCase()) || p.codigo.toLowerCase().includes(proveedorSearch.toLowerCase()))
    : proveedores;

  const cartTotal = state.cart.reduce((s, i) => s + i.subtotal, 0);
  const cartCount = state.cart.reduce((s, i) => s + i.cantidad, 0);
  const proveedorOk = state.proveedorId > 0;

  // ── Handlers ─────────────────────────────────────────────────────
  const addToCart = (p: ProductoDto) => {
    const item: CartItem = {
      productoId: p.id, productoNombre: p.nombre, codigoBarra: p.codigoBarra,
      cantidad: 1, costoUnitario: p.costo, subtotal: p.costo,
      precio: p.precio, costo: p.costo,
    };
    dispatch({ type: 'ADD_TO_CART', item });
  };

  const startEdit = (idx: number) => {
    const i = state.cart[idx];
    setEditingIdx(idx); setEdNombre(i.productoNombre); setEdCodigo(i.codigoBarra);
    setEdPrecio(i.precio ?? 0); setEdCosto(String(i.costoUnitario)); setEdCant(i.cantidad);
    setEdCatId(i.categoriaId ?? 0); setEdUnidadId(i.unidadMedidaId ?? 0);
    setEdCont(i.contenido?.toString() ?? ''); setEdDesc(i.descAdicional ?? '');
  };
  const saveEdit = (idx: number) => {
    const item: CartItem = {
      ...state.cart[idx],
      productoNombre: edNombre || state.cart[idx].productoNombre,
      codigoBarra: edCodigo || state.cart[idx].codigoBarra,
      cantidad: edCant, costoUnitario: parseFloat(edCosto) || 0,
      precio: edPrecio, categoriaId: edCatId || undefined,
      unidadMedidaId: edUnidadId || undefined,
      contenido: parseFloat(edCont) || undefined, descAdicional: edDesc || undefined,
    };
    dispatch({ type: 'UPDATE_CART_ITEM', index: idx, item });
    setEditingIdx(null);
  };

  const handleProductCreatedInModal = (producto: ProductoDto) => {
    // Add the newly created product to cart with quantity 1
    addToCart(producto);
    setShowNewModal(false);
    setProductos(prev => {
      if (prev.find(p => p.id === producto.id)) return prev;
      return [...prev, producto];
    });
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const montoPagado = pagoType === 'none' ? undefined
        : pagoType === 'total' ? cartTotal
        : Math.min(montoPago, cartTotal);
      const req: CompraRequestDto = {
        sucursalId: state.sucursalId, proveedorId: state.proveedorId,
        items: state.cart.map(i => ({
          productoId: i.productoId, cantidad: i.cantidad, costoUnitario: i.costoUnitario,
          codigoBarra: i.productoId === 0 ? i.codigoBarra : undefined,
          nombre: i.productoId === 0 ? i.productoNombre : undefined,
          precio: i.precio ?? 0, costo: i.costo,
          categoriaId: i.categoriaId, descAdicional: i.descAdicional,
          contenido: i.contenido, unidadMedidaId: i.unidadMedidaId,
        })),
        montoPagado,
      };
      const res = await api.compras.crear(req);
      dispatch({ type: 'CONFIRM_SUCCESS', response: res });
    } catch (err: any) {
      const errorMsg = err.message || 'Error al crear la compra';
      notifyError(errorMsg);
      dispatch({ type: 'CONFIRM_ERROR', error: errorMsg });
    } finally { setIsConfirming(false); }
  };

  const handleNuevaCompra = () => { dispatch({ type: 'RESET' }); searchRef.current?.focus(); };
  const handleCerrar = () => navigate(-1);
  const handlePrint = () => window.print();

  // ── Render: DONE step ────────────────────────────────────────────
  if (state.step === 'done' && state.success) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="no-print text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full text-lg font-semibold">✓ COMPRA REGISTRADA</div>
          </div>
          <div className="receipt bg-white border border-gray-300 rounded-xl p-6 max-w-[80mm] mx-auto">
            <h1 className="text-center text-base font-bold mb-3">PosWeb{'\u2014'} Punto de Venta</h1>
            <div className="text-xs mb-3 space-y-0.5">
              <p><span className="font-semibold">Comprobante:</span> C-{new Date(state.success.fecha).getFullYear()}{String(new Date(state.success.fecha).getMonth()+1).padStart(2,'0')}{String(new Date(state.success.fecha).getDate()).padStart(2,'0')}-{state.success.compraId}</p>
              <p><span className="font-semibold">Fecha:</span> {formatFecha(state.success.fecha)}</p>
              <p><span className="font-semibold">Sucursal:</span> {getSucursalNombre(state.sucursalId)}</p>
              {state.proveedorNombre && <p><span className="font-semibold">Proveedor:</span> {state.proveedorNombre}</p>}
            </div>
            <table className="w-full border-collapse text-xs mb-3">
              <thead><tr className="border-b border-gray-400"><th className="text-left pb-1 pr-1">Producto</th><th className="text-right pb-1 pr-1">Cant</th><th className="text-right pb-1 pr-1">Costo</th><th className="text-right pb-1">Subtotal</th></tr></thead>
              <tbody>{state.success.items.map((it, i) => (<tr key={i}><td className="py-0.5 pr-1">{it.productoNombre}</td><td className="text-right py-0.5 pr-1">{it.cantidad}</td><td className="text-right py-0.5 pr-1">{formatCurrency(it.costoUnitario)}</td><td className="text-right py-0.5">{formatCurrency(it.subtotal)}</td></tr>))}</tbody>
              <tfoot><tr className="border-t border-gray-400 font-bold"><td colSpan={3} className="text-right pt-1 pr-1">Total gasto:</td><td className="text-right pt-1">{formatCurrency(state.success.totalGasto)}</td></tr></tfoot>
            </table>
            <p className="text-xs text-gray-600 text-center">Unidades: {state.success.items.reduce((s, i) => s + i.cantidad, 0)}</p>
          </div>
          <div className="no-print flex justify-center gap-3 mt-6 flex-wrap">
            <button onClick={handlePrint} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 border border-gray-300">Imprimir</button>
            <button onClick={handleNuevaCompra} autoFocus className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Nueva compra</button>
            <button onClick={handleCerrar} className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700">Cerrar</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: SCAN step (two-column layout) ────────────────────────
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col pb-16 lg:mr-[33.333vw] min-h-0 overflow-hidden">
        {/* Top bar */}
        <div className="shrink-0 space-y-3 px-4 sm:px-6 pt-4 pb-2">
          {/* Sucursal + Proveedor */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Suc:</span>
              <select value={state.sucursalId} onChange={e => dispatch({ type: 'SET_SUCURSAL', sucursalId: Number(e.target.value) })}
                className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value={1}>Central</option><option value={2}>Norte</option><option value={3}>Sur</option>
              </select>
            </div>
            <div className="h-4 w-px bg-gray-300" />
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <input ref={provInputRef} type="text"
                value={state.proveedorId > 0 ? state.proveedorNombre : proveedorSearch}
                onChange={e => { setProveedorSearch(e.target.value); if (state.proveedorId > 0) dispatch({ type: 'SET_PROVEEDOR_ID', proveedorId: 0, proveedorNombre: '' }); setShowProvDropdown(true); setProvHighIdx(-1); }}
                onFocus={() => setShowProvDropdown(true)}
                onBlur={() => setTimeout(() => setShowProvDropdown(false), 200)}
                onKeyDown={e => {
                  if (!showProvDropdown || proveedoresFilt.length === 0) return;
                  if (e.key === 'ArrowDown') { e.preventDefault(); setProvHighIdx(Math.min(provHighIdx + 1, proveedoresFilt.length - 1)); }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); setProvHighIdx(Math.max(provHighIdx - 1, 0)); }
                  else if (e.key === 'Enter' && provHighIdx >= 0) { e.preventDefault();
                    const p = proveedoresFilt[provHighIdx];
                    dispatch({ type: 'SET_PROVEEDOR_ID', proveedorId: p.id, proveedorNombre: p.nombre });
                    setProveedorSearch(''); setShowProvDropdown(false);
                  }
                }}
                placeholder={state.proveedorId > 0 ? state.proveedorNombre : 'Seleccionar proveedor *'}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              {showProvDropdown && proveedoresFilt.length > 0 && (
                <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto text-xs">
                  {proveedoresFilt.map((p, i) => (
                    <li key={p.id} onMouseDown={() => { dispatch({ type: 'SET_PROVEEDOR_ID', proveedorId: p.id, proveedorNombre: p.nombre }); setProveedorSearch(''); setShowProvDropdown(false); }}
                      onMouseEnter={() => setProvHighIdx(i)}
                      className={`px-3 py-1.5 cursor-pointer flex justify-between ${i === provHighIdx ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-100'} ${p.id === state.proveedorId ? 'font-semibold' : ''}`}>
                      <span>{p.nombre}</span><span className="text-gray-400">{p.codigo}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {proveedorOk && (
              <button onClick={() => { setShowNewModal(true); setBarcodeStatus('idle'); }}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors">+ Nuevo producto</button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input ref={searchRef} type="text" autoFocus
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={async e => {
                if (e.key === 'Enter' && proveedorOk && searchQuery.trim()) {
                  e.preventDefault();
                  const q = searchQuery.trim();
                  // Try barcode lookup first
                  try {
                    const prod = await api.productos.obtenerPorBarra(q);
                    if (prod) {
                      addToCart(prod);
                      setSearchQuery('');
                      return;
                    }
                  } catch {
                    // Not found by barcode, fall through to local search
                  }
                  // Local search fallback
                  const match = filteredProducts.find(p =>
                    p.codigoBarra.toLowerCase() === q.toLowerCase()
                  );
                  if (match) {
                    addToCart(match);
                    setSearchQuery('');
                  } else {
                    notifyError(`Producto no encontrado: "${q}"`);
                  }
                }
              }}
              placeholder={proveedorOk ? 'Buscar o escanear código de barras...' : 'Seleccione un proveedor para comenzar'}
              disabled={!proveedorOk}
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-base placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-50" />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 min-h-0 px-4 sm:px-6 pb-4">
          <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="h-full overflow-y-auto p-4">
              {!proveedorOk ? (
                <div className="text-center py-16 text-gray-500">
                  <p className="font-medium text-sm">Seleccione un proveedor para ver productos</p>
                </div>
              ) : prodLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-gray-500 text-sm">Cargando...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500 font-medium text-sm">{searchQuery ? 'Sin resultados' : 'No hay productos'}</p>
                </div>
              ) : (
                <div ref={productGridRef} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => addToCart(p)}
                      className="text-left bg-white border border-gray-200 rounded-xl p-3 hover:border-indigo-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                      <p className="font-medium text-gray-900 text-sm truncate">{p.nombre}</p>
                      <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{p.codigoBarra}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-indigo-700">{formatCurrency(p.precio)}</span>
                        <span className="text-xs text-gray-400">{formatCurrency(p.costo)} c.</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      {proveedorOk && (
        <div className="hidden lg:flex fixed right-0 top-16 bottom-0 w-1/3 border-l border-gray-200 bg-gray-50 z-30 flex flex-col p-4 gap-3">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <h3 className="text-sm font-semibold text-gray-700">
              {state.cart.length > 0 ? `Compra (${cartCount})` : 'Nueva compra'}
            </h3>
            <span className="text-xs text-gray-500">{state.proveedorNombre}</span>
          </div>

          {/* Cart items */}
          <div ref={cartListRef} className="flex-1 overflow-y-auto min-h-0">
            {state.cart.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">Agregá productos para armar la compra</div>
            ) : (
              <div className="space-y-2">
                {state.cart.map((item, i) => (
                  editingIdx === i ? (
                    /* Edit mode */
                    <div key={i} className="bg-white border-2 border-indigo-300 rounded-xl p-3 text-xs">
                      <div className="flex justify-between mb-2">
                        <span className="font-bold text-indigo-900">Editar</span>
                        <button onClick={() => setEditingIdx(null)} className="text-gray-400 hover:text-gray-600">Cancelar</button>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-2">
                        <div className="col-span-3"><label className="text-gray-500">Nombre</label><input type="text" value={edNombre} onChange={e => setEdNombre(e.target.value)} className="w-full px-1.5 py-0.5 border rounded" /></div>
                        <div className="col-span-3"><label className="text-gray-500">Código</label><input type="text" value={edCodigo} onChange={e => setEdCodigo(e.target.value)} className="w-full px-1.5 py-0.5 border rounded" /></div>
                        <div><label className="text-gray-500">Precio</label><input type="number" step="0.01" value={edPrecio} onChange={e => setEdPrecio(parseFloat(e.target.value)||0)} className="w-full px-1.5 py-0.5 border rounded" /></div>
                        <div><label className="text-gray-500">Costo</label><input type="number" step="0.01" value={edCosto} onChange={e => setEdCosto(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit(i)} className="w-full px-1.5 py-0.5 border border-indigo-300 rounded" autoFocus /></div>
                        <div><label className="text-gray-500">Cant</label><input type="number" min={1} value={edCant} onChange={e => setEdCant(Math.max(1,parseInt(e.target.value)||1))} onKeyDown={e => e.key === 'Enter' && saveEdit(i)} className="w-full px-1.5 py-0.5 border rounded" /></div>
                        <div><label className="text-gray-500">Categ</label><select value={edCatId} onChange={e => setEdCatId(Number(e.target.value))} className="w-full px-1.5 py-0.5 border rounded text-xs"><option value={0}>-</option>{categorias.map(c=>(<option key={c.id} value={c.id}>{c.descripcion}</option>))}</select></div>
                        <div><label className="text-gray-500">U.Med</label><select value={edUnidadId} onChange={e => setEdUnidadId(Number(e.target.value))} className="w-full px-1.5 py-0.5 border rounded text-xs"><option value={0}>-</option>{unidades.map(u=>(<option key={u.id} value={u.id}>{u.descripcion}</option>))}</select></div>
                        <div><label className="text-gray-500">Cont</label><input type="number" step="0.01" value={edCont} onChange={e => setEdCont(e.target.value)} className="w-full px-1.5 py-0.5 border rounded" /></div>
                        <div className="col-span-3"><label className="text-gray-500">Desc</label><input type="text" value={edDesc} onChange={e => setEdDesc(e.target.value)} className="w-full px-1.5 py-0.5 border rounded" /></div>
                      </div>
                      <button onClick={() => saveEdit(i)} className="w-full py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700">Guardar cambios</button>
                    </div>
                  ) : (
                    /* View mode */
                    <div key={i} className="flex items-center gap-3 pb-2 border-b border-gray-100 last:border-b-0 last:pb-0">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => startEdit(i)}>
                        <p className="font-medium text-gray-800 text-xs truncate">{item.productoNombre || '(nuevo)'}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{item.codigoBarra}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{formatCurrency(item.costoUnitario)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => dispatch({ type: 'UPDATE_CART_ITEM', index: i, item: { ...item, cantidad: item.cantidad - 1, costoUnitario: item.costoUnitario } })}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs">−</button>
                        <input type="number" min={0} value={item.cantidad}
                          onChange={e => { const v = parseInt(e.target.value); dispatch({ type: 'UPDATE_CART_ITEM', index: i, item: { ...item, cantidad: isNaN(v) ? 0 : v, costoUnitario: item.costoUnitario } }); if (isNaN(v) || v <= 0) dispatch({ type: 'REMOVE_FROM_CART', index: i }); }}
                          className="w-10 text-center border border-gray-200 rounded px-1 py-0.5 text-xs font-medium focus:ring-1 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
                        <button onClick={() => dispatch({ type: 'UPDATE_CART_ITEM', index: i, item: { ...item, cantidad: item.cantidad + 1, costoUnitario: item.costoUnitario } })}
                          className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xs">+</button>
                      </div>
                    </div>
                    )
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 space-y-3 border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-lg font-bold text-indigo-700">{formatCurrency(cartTotal)}</span>
            </div>

            {/* Payment section */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-600">Pago</p>
              <div className="flex gap-1.5">
                {(['none', 'total', 'partial'] as const).map(t => (
                  <button key={t} onClick={() => { setPagoType(t); if (t === 'total') setMontoPago(cartTotal); }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      pagoType === t
                        ? 'bg-indigo-100 border-indigo-400 text-indigo-800'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {t === 'none' ? 'No pagar' : t === 'total' ? 'Pagar todo' : 'Pago parcial'}
                  </button>
                ))}
              </div>
              {pagoType === 'partial' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 shrink-0">Monto a pagar:</span>
                  <input type="number" min={0} max={cartTotal} step="0.01"
                    value={montoPago} onChange={e => setMontoPago(Math.min(parseFloat(e.target.value) || 0, cartTotal))}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs text-right font-mono focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                  <span className="text-xs text-gray-400">/ {formatCurrency(cartTotal)}</span>
                </div>
              )}
              {pagoType !== 'none' && (
                <p className="text-xs text-gray-500">
                  {pagoType === 'total' ? '✓ Deuda saldada al momento de la compra' : `↗ Se registra deuda por ${formatCurrency(cartTotal - montoPago)}`}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input type="checkbox" checked={state.verified} onChange={e => dispatch({ type: 'SET_VERIFIED', verified: e.target.checked })}
                className="h-3.5 w-3.5 text-indigo-600 border-gray-300 rounded" />
              Verifiqué cantidades y costos
            </label>
            <button onClick={handleConfirm}
              disabled={!state.verified || isConfirming || state.cart.length === 0 || (pagoType === 'partial' && (!montoPago || montoPago <= 0))}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {isConfirming ? 'Confirmando...' : `Confirmar compra — ${formatCurrency(cartTotal)}`}
            </button>
          </div>
        </div>
      )}

      {/* New Product Modal */}
      <ProductFormModal
        open={showNewModal}
        onCreated={handleProductCreatedInModal}
        onClose={() => setShowNewModal(false)}
      />
    </div>
  );
}
