import React, { useReducer, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CompraRequestDto, CompraResponseDto, NuevoProductoDto, ProductoDto } from '../types';
import { api } from '../api/client';
import './CompraPage.css';

// ─── Types ──────────────────────────────────────────────────────────
type Step = 'scan' | 'confirm' | 'done';

interface CartItem {
  productoId: number;
  productoNombre: string;
  codigoBarra: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

interface CompraState {
  step: Step;
  cart: CartItem[];
  nuevosProductos: NuevoProductoDto[];
  searchTerm: string;
  cantidad: number;
  error: string | null;
  success: CompraResponseDto | null;
  verified: boolean;
  sucursalId: number;
}

type CompraAction =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'ADD_PRODUCT'; productoId: number; nombre: string; codigoBarra: string; costo: number; cantidad: number }
  | { type: 'REMOVE_FROM_CART'; index: number }
  | { type: 'UPDATE_CANTIDAD_CART'; index: number; cantidad: number }
  | { type: 'SET_SEARCH_TERM'; term: string }
  | { type: 'SET_CANTIDAD'; cantidad: number }
  | { type: 'SET_VERIFIED'; verified: boolean }
  | { type: 'CONFIRM_SUCCESS'; response: CompraResponseDto }
  | { type: 'CONFIRM_ERROR'; error: string }
  | { type: 'ADD_NUEVO_PRODUCTO' }
  | { type: 'UPDATE_NUEVO_PRODUCTO'; index: number; data: Partial<NuevoProductoDto> }
  | { type: 'REMOVE_NUEVO_PRODUCTO'; index: number }
  | { type: 'RESET_CART' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SUCURSAL'; sucursalId: number };

// ─── Reducer ────────────────────────────────────────────────────────
function compraReducer(state: CompraState, action: CompraAction): CompraState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };

    case 'ADD_PRODUCT': {
      const idx = state.cart.findIndex(i => i.productoId === action.productoId);
      if (idx >= 0) {
        const cart = [...state.cart];
        const item = cart[idx];
        const nuevaCant = item.cantidad + action.cantidad;
        cart[idx] = { ...item, cantidad: nuevaCant, subtotal: nuevaCant * item.costoUnitario };
        return { ...state, cart };
      }
      return {
        ...state,
        cart: [...state.cart, {
          productoId: action.productoId,
          productoNombre: action.nombre,
          codigoBarra: action.codigoBarra,
          cantidad: action.cantidad,
          costoUnitario: action.costo,
          subtotal: action.cantidad * action.costo,
        }],
      };
    }

    case 'REMOVE_FROM_CART': {
      const cart = [...state.cart];
      cart.splice(action.index, 1);
      return { ...state, cart };
    }

    case 'UPDATE_CANTIDAD_CART': {
      if (action.cantidad <= 0) {
        const cart = [...state.cart];
        cart.splice(action.index, 1);
        return { ...state, cart };
      }
      const cart = [...state.cart];
      const item = { ...cart[action.index] };
      item.cantidad = action.cantidad;
      item.subtotal = action.cantidad * item.costoUnitario;
      cart[action.index] = item;
      return { ...state, cart };
    }

    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.term };

    case 'SET_CANTIDAD':
      return { ...state, cantidad: action.cantidad };

    case 'SET_VERIFIED':
      return { ...state, verified: action.verified };

    case 'CONFIRM_SUCCESS':
      return { ...state, step: 'done', success: action.response, error: null };

    case 'CONFIRM_ERROR':
      return { ...state, error: action.error };

    case 'ADD_NUEVO_PRODUCTO':
      return {
        ...state,
        nuevosProductos: [...state.nuevosProductos, { codigoBarra: '', nombre: '', precio: 0, costo: 0 }],
      };

    case 'UPDATE_NUEVO_PRODUCTO': {
      const np = [...state.nuevosProductos];
      np[action.index] = { ...np[action.index], ...action.data };
      return { ...state, nuevosProductos: np };
    }

    case 'REMOVE_NUEVO_PRODUCTO': {
      const np = [...state.nuevosProductos];
      np.splice(action.index, 1);
      return { ...state, nuevosProductos: np };
    }

    case 'RESET_CART':
      return { ...initialState, sucursalId: state.sucursalId };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'SET_SUCURSAL':
      return { ...state, sucursalId: action.sucursalId };

    default:
      return state;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────
const LAST_SCAN_MS = 500;

function getInitialSucursalId(): number {
  try {
    const saved = localStorage.getItem('sucursalActiva');
    if (saved) {
      const s = JSON.parse(saved);
      return s.id ?? 1;
    }
  } catch { /* ignore */ }
  return 1;
}

const initialState: CompraState = {
  step: 'scan',
  cart: [],
  nuevosProductos: [],
  searchTerm: '',
  cantidad: 1,
  error: null,
  success: null,
  verified: false,
  sucursalId: getInitialSucursalId(),
};

function getSucursalNombre(id: number): string {
  const map: Record<number, string> = {
    1: 'Sucursal Central',
    2: 'Sucursal Norte',
    3: 'Sucursal Sur',
  };
  return map[id] ?? `Sucursal #${id}`;
}

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatFecha(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getComprobanteNum(fecha: string, gastoId: number): string {
  const d = new Date(fecha);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `C-${y}${m}${dd}-${gastoId}`;
}

// ─── Component ─────────────────────────────────────────────────────
export default function CompraPage() {
  const [state, dispatch] = useReducer(compraReducer, initialState);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const lastScanRef = useRef<{ barcode: string; time: number } | null>(null);

  // Local state (async / external — not in reducer)
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [productosLoading, setProductosLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  // ── Effects ──────────────────────────────────────────────────────

  // Load / reload products when sucursal changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setProductosLoading(true);
      try {
        const data = await api.productos.listar();
        if (!cancelled) setProductos(data);
      } catch (err: any) {
        if (!cancelled) dispatch({ type: 'SET_ERROR', error: err.message || 'Error al cargar productos' });
      } finally {
        if (!cancelled) setProductosLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [state.sucursalId]);

  // Auto-focus search when entering scan step
  useEffect(() => {
    if (state.step === 'scan') {
      searchRef.current?.focus();
    }
  }, [state.step]);

  // beforeunload warning when cart has items
  useEffect(() => {
    if (state.cart.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [state.cart.length]);

  // Escape key handling per step
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (state.step === 'scan') {
        if (state.searchTerm) dispatch({ type: 'SET_SEARCH_TERM', term: '' });
      } else if (state.step === 'confirm') {
        dispatch({ type: 'SET_STEP', step: 'scan' });
      } else if (state.step === 'done') {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.step, state.searchTerm, navigate]);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = e.currentTarget.value.trim();
    if (!q) return;

    const match = productos.find(p => p.codigoBarra === q);
    if (!match) return; // partial text → no action (per spec)

    // Scanner dedup: ignore same barcode within 500ms
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.barcode === q && now - lastScanRef.current.time < LAST_SCAN_MS) {
      return;
    }
    lastScanRef.current = { barcode: q, time: now };

    dispatch({ type: 'ADD_PRODUCT', productoId: match.id, nombre: match.nombre, codigoBarra: match.codigoBarra, costo: match.costo, cantidad: state.cantidad });
    dispatch({ type: 'SET_SEARCH_TERM', term: '' });
    dispatch({ type: 'SET_CANTIDAD', cantidad: 1 });
    searchRef.current?.focus();
  };

  const handleAddProduct = (p: ProductoDto) => {
    dispatch({ type: 'ADD_PRODUCT', productoId: p.id, nombre: p.nombre, codigoBarra: p.codigoBarra, costo: p.costo, cantidad: state.cantidad });
    dispatch({ type: 'SET_CANTIDAD', cantidad: 1 });
    searchRef.current?.focus();
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const request: CompraRequestDto = {
        sucursalId: state.sucursalId,
        items: state.cart.map(i => ({ productoId: i.productoId, cantidad: i.cantidad, costoUnitario: i.costoUnitario })),
        nuevosProductos: state.nuevosProductos.length > 0 ? state.nuevosProductos : undefined,
      };
      const response = await api.compras.crear(request);
      dispatch({ type: 'CONFIRM_SUCCESS', response });
    } catch (err: any) {
      dispatch({ type: 'CONFIRM_ERROR', error: err.message || 'Error al crear la compra' });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleNuevaCompra = () => {
    dispatch({ type: 'RESET_CART' });
    dispatch({ type: 'SET_CANTIDAD', cantidad: 1 });
    searchRef.current?.focus();
  };

  const handleCerrar = () => navigate(-1);
  const handlePrint = () => window.print();

  // ── Derived data ─────────────────────────────────────────────────

  const filteredProductos = productos.filter(p => {
    if (!state.searchTerm) return true;
    const q = state.searchTerm.toLowerCase();
    return p.codigoBarra.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q);
  });

  const cartTotal = state.cart.reduce((s, i) => s + i.subtotal, 0);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Sucursal header ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Sucursal:</label>
          <select
            value={state.sucursalId}
            onChange={e => dispatch({ type: 'SET_SUCURSAL', sucursalId: Number(e.target.value) })}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={1}>Sucursal Central</option>
            <option value={2}>Sucursal Norte</option>
            <option value={3}>Sucursal Sur</option>
          </select>
        </div>

        {/* ── Error banner ────────────────────────────────────────── */}
        {state.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 flex items-start gap-3 rounded-r-lg">
            <p className="text-red-700 text-sm flex-1">{state.error}</p>
            <button
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
              className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP: SCAN
            ════════════════════════════════════════════════════════════ */}
        {state.step === 'scan' && (
          <>
            {/* Search + Quantity row */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">🔍</span>
                <input
                  ref={searchRef}
                  type="text"
                  autoFocus
                  value={state.searchTerm}
                  onChange={e => dispatch({ type: 'SET_SEARCH_TERM', term: e.target.value })}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Buscar producto por código o nombre..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-sm font-medium text-gray-600">Cant:</label>
                <input
                  type="number"
                  min={1}
                  value={state.cantidad}
                  onChange={e => dispatch({ type: 'SET_CANTIDAD', cantidad: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center text-base"
                />
              </div>
            </div>

            {/* Product grid + Cart panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── Product grid ────────────────────────────────── */}
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Productos</h2>

                {productosLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
                    <span className="ml-3 text-gray-500">Cargando productos...</span>
                  </div>
                ) : filteredProductos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    {state.searchTerm
                      ? 'No se encontraron productos con ese criterio'
                      : 'No hay productos disponibles'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredProductos.map(p => (
                      <div key={p.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow bg-white flex flex-col">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{p.nombre}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">Cod: {p.codigoBarra}</p>
                          <div className="mt-2 space-y-0.5">
                            <p className="text-sm text-gray-700"><span className="font-medium">Precio:</span> {formatCurrency(p.precio)}</p>
                            <p className="text-sm text-gray-700"><span className="font-medium">Costo:</span> {formatCurrency(p.costo)}</p>
                            <p className="text-sm text-gray-700"><span className="font-medium">Stock:</span> {p.stock}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddProduct(p)}
                          className="mt-3 w-full px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          + Agregar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Cart panel ───────────────────────────────────── */}
              <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Carrito</h2>

                {state.cart.length === 0 && state.nuevosProductos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <p className="text-sm">Agregue productos al carrito para continuar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {state.cart.length > 0 && (
                      <>
                        {state.cart.map((item, i) => (
                          <div key={i} className="bg-white border border-gray-200 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-900 text-sm truncate">{item.productoNombre}</p>
                                <p className="text-xs text-gray-500">{item.codigoBarra}</p>
                              </div>
                              <button
                                onClick={() => dispatch({ type: 'REMOVE_FROM_CART', index: i })}
                                className="text-red-400 hover:text-red-600 shrink-0 text-sm"
                                title="Eliminar"
                              >
                                {'🗑'}
                              </button>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => dispatch({ type: 'UPDATE_CANTIDAD_CART', index: i, cantidad: item.cantidad - 1 })}
                                  className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium"
                                >
                                  {'\u2212'}
                                </button>
                                <span className="w-8 text-center text-sm font-medium">{item.cantidad}</span>
                                <button
                                  onClick={() => dispatch({ type: 'UPDATE_CANTIDAD_CART', index: i, cantidad: item.cantidad + 1 })}
                                  className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded hover:bg-gray-200 text-sm font-medium"
                                >
                                  +
                                </button>
                              </div>
                              <p className="text-sm font-medium text-gray-900">{formatCurrency(item.subtotal)}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-sm font-semibold text-gray-900">Total:</span>
                          <span className="text-lg font-bold text-indigo-700">{formatCurrency(cartTotal)}</span>
                        </div>
                      </>
                    )}

                    {/* ── New products section ──────────────────────── */}
                    {state.nuevosProductos.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Productos nuevos</h3>
                        {state.nuevosProductos.map((np, idx) => (
                          <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <input type="text" placeholder="Codigo" value={np.codigoBarra}
                                onChange={e => dispatch({ type: 'UPDATE_NUEVO_PRODUCTO', index: idx, data: { codigoBarra: e.target.value } })}
                                className="px-2 py-1 border border-gray-300 rounded text-xs" />
                              <input type="text" placeholder="Nombre" value={np.nombre}
                                onChange={e => dispatch({ type: 'UPDATE_NUEVO_PRODUCTO', index: idx, data: { nombre: e.target.value } })}
                                className="px-2 py-1 border border-gray-300 rounded text-xs" />
                              <input type="number" step="0.01" placeholder="Precio" value={np.precio}
                                onChange={e => dispatch({ type: 'UPDATE_NUEVO_PRODUCTO', index: idx, data: { precio: parseFloat(e.target.value) || 0 } })}
                                className="px-2 py-1 border border-gray-300 rounded text-xs" />
                              <input type="number" step="0.01" placeholder="Costo" value={np.costo}
                                onChange={e => dispatch({ type: 'UPDATE_NUEVO_PRODUCTO', index: idx, data: { costo: parseFloat(e.target.value) || 0 } })}
                                className="px-2 py-1 border border-gray-300 rounded text-xs" />
                              <div className="col-span-2">
                                <input type="text" placeholder="Tamano (opcional)" value={np.tamano || ''}
                                  onChange={e => dispatch({ type: 'UPDATE_NUEVO_PRODUCTO', index: idx, data: { tamano: e.target.value || undefined } })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs" />
                              </div>
                            </div>
                            <button
                              onClick={() => dispatch({ type: 'REMOVE_NUEVO_PRODUCTO', index: idx })}
                              className="mt-2 text-xs text-red-600 hover:text-red-800"
                            >
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action buttons in cart panel */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => dispatch({ type: 'ADD_NUEVO_PRODUCTO' })}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        + Nuevo producto
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'SET_STEP', step: 'confirm' })}
                        disabled={state.cart.length === 0}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Ver resumen →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP: CONFIRM
            ════════════════════════════════════════════════════════════ */}
        {state.step === 'confirm' && (
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Verificar compra</h2>

            {/* Boleta table */}
            <div className="bg-white border border-gray-300 rounded-xl p-5 font-mono text-sm mb-4">
              <div className="text-center mb-4">
                <p className="text-xs text-gray-500">
                  Fecha: {new Date().toLocaleDateString('es-AR')}  |  Sucursal: {getSucursalNombre(state.sucursalId)}
                </p>
              </div>

              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-300">
                    <th className="pb-2 pr-2">Codigo</th>
                    <th className="pb-2 pr-2">Producto</th>
                    <th className="pb-2 pr-2 text-right">Cant</th>
                    <th className="pb-2 pr-2 text-right">Costo</th>
                    <th className="pb-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {state.cart.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-1.5 pr-2 text-gray-600">{item.codigoBarra}</td>
                      <td className="py-1.5 pr-2">{item.productoNombre}</td>
                      <td className="py-1.5 pr-2 text-right">{item.cantidad}</td>
                      <td className="py-1.5 pr-2 text-right">{formatCurrency(item.costoUnitario)}</td>
                      <td className="py-1.5 text-right font-medium">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-400 font-bold">
                    <td colSpan={4} className="pt-2 pr-2 text-right">Total:</td>
                    <td className="pt-2 text-right text-lg">{formatCurrency(cartTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Verification checkbox */}
            <label className="flex items-start gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer">
              <input
                type="checkbox"
                checked={state.verified}
                onChange={e => dispatch({ type: 'SET_VERIFIED', verified: e.target.checked })}
                className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                He verificado que las cantidades y precios coinciden con la boleta fisica
              </span>
            </label>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => dispatch({ type: 'SET_STEP', step: 'scan' })}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Volver a editar
              </button>
              <button
                onClick={handleConfirm}
                disabled={!state.verified || isConfirming}
                className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isConfirming ? 'Confirmando...' : 'Confirmar compra'}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            STEP: DONE
            ════════════════════════════════════════════════════════════ */}
        {state.step === 'done' && state.success && (
          <div className="max-w-3xl mx-auto">
            {/* Success badge - hidden when printing */}
            <div className="no-print text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full text-lg font-semibold">
                COMPRA REGISTRADA
              </div>
            </div>

            {/* Receipt / Comprobante */}
            <div className="receipt bg-white border border-gray-300 rounded-xl p-6 max-w-[80mm] mx-auto">
              <h1 className="text-center text-base font-bold mb-3">PosWeb{'\u2014'} Punto de Venta</h1>

              <div className="text-xs mb-3 space-y-0.5">
                <p><span className="font-semibold">Comprobante:</span> {getComprobanteNum(state.success.fecha, state.success.gastoId)}</p>
                <p><span className="font-semibold">Fecha:</span> {formatFecha(state.success.fecha)}</p>
                <p><span className="font-semibold">Sucursal:</span> {getSucursalNombre(state.sucursalId)}</p>
              </div>

              <table className="w-full border-collapse text-xs mb-3">
                <thead>
                  <tr className="border-b border-gray-400">
                    <th className="text-left pb-1 pr-1">Producto</th>
                    <th className="text-right pb-1 pr-1">Cant</th>
                    <th className="text-right pb-1 pr-1">Costo</th>
                    <th className="text-right pb-1">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {state.success.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-0.5 pr-1">{item.productoNombre}</td>
                      <td className="text-right py-0.5 pr-1">{item.cantidad}</td>
                      <td className="text-right py-0.5 pr-1">{formatCurrency(item.costoUnitario)}</td>
                      <td className="text-right py-0.5">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-400 font-bold">
                    <td colSpan={3} className="text-right pt-1 pr-1">Total gasto:</td>
                    <td className="text-right pt-1">{formatCurrency(state.success.totalGasto)}</td>
                  </tr>
                </tfoot>
              </table>

              <p className="text-xs text-gray-600 text-center">
                Unidades: {state.success.items.reduce((s, i) => s + i.cantidad, 0)}
              </p>
            </div>

            {/* Action buttons - hidden when printing */}
            <div className="no-print flex justify-center gap-3 mt-6 flex-wrap">
              <button onClick={handlePrint} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-300">
                Imprimir
              </button>
              <button onClick={handleNuevaCompra} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                Nueva compra
              </button>
              <button onClick={handleCerrar} className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
