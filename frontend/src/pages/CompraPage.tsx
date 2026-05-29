import React, { useReducer, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CompraRequestDto, CompraResponseDto, ProductoDto } from '../types';
import { api } from '../api/client';
import './CompraPage.css';

// ─── Types ──────────────────────────────────────────────────────────
type Step = 'scan' | 'confirm' | 'done';

type ScanMode = 'idle' | 'loading' | 'found' | 'not-found' | 'picker';

interface CartItem {
  productoId: number;
  productoNombre: string;
  codigoBarra: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
  // Optional: for inline creation or price/cost update
  precio?: number;
  costo?: number;
  tamano?: string;
}

interface CompraState {
  step: Step;
  cart: CartItem[];
  searchTerm: string;
  cantidad: number;
  error: string | null;
  success: CompraResponseDto | null;
  verified: boolean;
  sucursalId: number;
}

type CompraAction =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'ADD_TO_CART'; item: CartItem }
  | { type: 'REMOVE_FROM_CART'; index: number }
  | { type: 'UPDATE_CANTIDAD_CART'; index: number; cantidad: number }
  | { type: 'SET_SEARCH_TERM'; term: string }
  | { type: 'SET_CANTIDAD'; cantidad: number }
  | { type: 'SET_VERIFIED'; verified: boolean }
  | { type: 'CONFIRM_SUCCESS'; response: CompraResponseDto }
  | { type: 'CONFIRM_ERROR'; error: string }
  | { type: 'RESET' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SUCURSAL'; sucursalId: number };

// ─── Reducer ────────────────────────────────────────────────────────
function compraReducer(state: CompraState, action: CompraAction): CompraState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, step: action.step };

    case 'ADD_TO_CART': {
      // Merge with existing item if same productoId (existing products only)
      const idx = state.cart.findIndex(
        i => i.productoId === action.item.productoId && i.productoId !== 0
      );
      if (idx >= 0) {
        const cart = [...state.cart];
        const existing = cart[idx];
        const nuevaCant = existing.cantidad + action.item.cantidad;
        cart[idx] = { ...existing, cantidad: nuevaCant, subtotal: nuevaCant * existing.costoUnitario };
        return { ...state, cart };
      }
      return { ...state, cart: [...state.cart, action.item] };
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

    case 'RESET':
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

  // Scan interaction local state
  const [scanMode, setScanMode] = useState<ScanMode>('idle');
  const [foundProduct, setFoundProduct] = useState<ProductoDto | null>(null);
  const [searchResults, setSearchResults] = useState<ProductoDto[]>([]);
  const [editPrecio, setEditPrecio] = useState(0);
  const [editCosto, setEditCosto] = useState('');
  const [inlineNombre, setInlineNombre] = useState('');  // for new-product creation form
  const [editCantidad, setEditCantidad] = useState(1);
  const [editTamano, setEditTamano] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<ProductoDto[]>([]);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const precioRef = useRef<HTMLInputElement>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

  // ── Effects ──────────────────────────────────────────────────────

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
        if (state.searchTerm) {
          dispatch({ type: 'SET_SEARCH_TERM', term: '' });
        }
        resetScan();
      } else if (state.step === 'confirm') {
        dispatch({ type: 'SET_STEP', step: 'scan' });
      } else if (state.step === 'done') {
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [state.step, state.searchTerm, navigate]);

  // ── Autocomplete: debounced search while typing ────────────────
  useEffect(() => {
    const q = state.searchTerm.trim();
    if (q.length < 2 || scanMode !== 'idle') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await api.productos.buscar(q);
        setSuggestions(results);
        setHighlightedIdx(results.length > 0 ? 0 : -1);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [state.searchTerm, scanMode]);

  // ── Auto-focus: precio si existe, nombre si es nuevo ──────────
  useEffect(() => {
    if (scanMode === 'found') {
      setTimeout(() => precioRef.current?.focus(), 50);
    } else if (scanMode === 'not-found') {
      setTimeout(() => nombreRef.current?.focus(), 50);
    }
  }, [scanMode]);

  // ── Scan helpers ─────────────────────────────────────────────────

  function resetScan() {
    setScanMode('idle');
    setFoundProduct(null);
    setSearchResults([]);
    setEditPrecio(0);
    setEditCosto('');
    setInlineNombre('');
    setEditCantidad(1);
    setEditTamano('');
  }

  // ── Handlers ─────────────────────────────────────────────────────

  const selectSuggestion = (p: ProductoDto) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setFoundProduct(p);
    setEditPrecio(p.precio);
    setEditCosto(String(p.costo));
    setEditCantidad(state.cantidad);
    setEditTamano(p.tamano ?? '');
    setScanMode('found');
    dispatch({ type: 'SET_SEARCH_TERM', term: p.codigoBarra });
  };

  const handleSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    const q = e.currentTarget.value.trim();

    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIdx(prev => Math.min(prev + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIdx(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const idx = highlightedIdx >= 0 ? highlightedIdx : 0;
        if (idx < suggestions.length) {
          selectSuggestion(suggestions[idx]);
          return;
        }
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key !== 'Enter') return;
    if (!q) return;

    // Close suggestions and proceed with barcode lookup
    setShowSuggestions(false);

    // Scanner dedup
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.barcode === q && now - lastScanRef.current.time < LAST_SCAN_MS) {
      return;
    }
    lastScanRef.current = { barcode: q, time: now };

    // Clear previous results
    resetScan();
    setScanMode('loading');

    try {
      // 1. Try barcode lookup
      const product = await api.productos.obtenerPorBarra(q, state.sucursalId);

      // If we get here, product was found
      setFoundProduct(product);
      setEditPrecio(product.precio);
      setEditCosto(String(product.costo));
      setEditCantidad(state.cantidad);
      setEditTamano(product.tamano ?? '');
      setScanMode('found');
    } catch {
      // 2. Barcode not found — try name search
      try {
        const results = await api.productos.buscar(q);
        if (results.length > 0) {
          setSearchResults(results);
          setScanMode('picker');
        } else {
          // 3. No results — show creation form
          setEditPrecio(0);
          setEditCosto('');
          setInlineNombre('');
          setEditCantidad(1);
          setEditTamano('');
          setScanMode('not-found');
        }
      } catch {
        // Fallback to creation form
        setEditPrecio(0);
        setEditCosto('');
        setInlineNombre('');
        setEditCantidad(1);
        setEditTamano('');
        setScanMode('not-found');
      }
    }
  };

  const handleSelectFromPicker = (p: ProductoDto) => {
    setFoundProduct(p);
    setEditPrecio(p.precio);
    setEditCosto(String(p.costo));
    setEditCantidad(state.cantidad);
    setEditTamano(p.tamano ?? '');
    setScanMode('found');
  };

  const handleAddToCart = () => {
    if (isAdding) return;
    setIsAdding(true);

    const cantidad = editCantidad;
    let costoUnitario = parseFloat(editCosto) || 0;

    if (scanMode === 'not-found') {
      // Inline creation
      if (!inlineNombre.trim()) {
        setIsAdding(false);
        dispatch({ type: 'SET_ERROR', error: 'Debe ingresar un nombre para el producto nuevo' });
        return;
      }

      const item: CartItem = {
        productoId: 0,
        productoNombre: inlineNombre.trim(),
        codigoBarra: state.searchTerm,
        cantidad,
        costoUnitario,
        subtotal: cantidad * costoUnitario,
        precio: editPrecio || undefined,
        costo: costoUnitario || undefined,
        tamano: editTamano || undefined,
      };

      dispatch({ type: 'ADD_TO_CART', item });
    } else if (scanMode === 'found' && foundProduct) {
      // Existing product with optional price/cost updates
      const item: CartItem = {
        productoId: foundProduct.id,
        productoNombre: foundProduct.nombre,
        codigoBarra: foundProduct.codigoBarra,
        cantidad,
        costoUnitario,
        subtotal: cantidad * costoUnitario,
        precio: editPrecio > 0 ? editPrecio : undefined,
        costo: costoUnitario > 0 ? costoUnitario : undefined,
        tamano: editTamano || undefined,
      };
      dispatch({ type: 'ADD_TO_CART', item });
    }

    // Reset scan — keep search term clear (user sees barcode in cart)
    resetScan();
    dispatch({ type: 'SET_SEARCH_TERM', term: '' });
    dispatch({ type: 'SET_CANTIDAD', cantidad: 1 });
    searchRef.current?.focus();
    setTimeout(() => setIsAdding(false), 200);
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const request: CompraRequestDto = {
        sucursalId: state.sucursalId,
        items: state.cart.map(i => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          costoUnitario: i.costoUnitario,
          codigoBarra: i.productoId === 0 ? i.codigoBarra : undefined,
          nombre: i.productoId === 0 ? i.productoNombre : undefined,
          precio: i.precio ?? 0,
          costo: i.costo,
          tamano: i.tamano,
        })),
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
    dispatch({ type: 'RESET' });
    resetScan();
    dispatch({ type: 'SET_CANTIDAD', cantidad: 1 });
    searchRef.current?.focus();
  };

  const handleCerrar = () => navigate(-1);
  const handlePrint = () => window.print();

  // ── Derived data ─────────────────────────────────────────────────

  const cartTotal = state.cart.reduce((s, i) => s + i.subtotal, 0);

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">

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
            {/* ── Search row ──────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-0 flex-wrap relative z-10">
              <div className="relative flex-1 min-w-[200px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  autoFocus
                  value={state.searchTerm}
                  onChange={e => {
                    dispatch({ type: 'SET_SEARCH_TERM', term: e.target.value });
                    if (e.target.value !== state.searchTerm) resetScan();
                  }}
                  onKeyDown={handleSearchKeyDown}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Buscar producto por código o nombre..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                />

                {/* ── Suggestions dropdown ─────────────────────── */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto z-20">
                    {suggestions.map((p, i) => (
                      <div
                        key={p.id}
                        onMouseDown={() => selectSuggestion(p)}
                        onMouseEnter={() => setHighlightedIdx(i)}
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm ${
                          i === highlightedIdx
                            ? 'bg-indigo-50 text-indigo-900'
                            : 'hover:bg-gray-50 text-gray-900'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <span className="font-medium">{p.nombre}</span>
                          <span className="ml-2 text-xs text-gray-500">{p.codigoBarra}</span>
                        </div>
                        <div className="text-xs text-gray-500 shrink-0 ml-2">
                          {formatCurrency(p.precio)}
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-1.5 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
                      ↑↓ Navegar · Enter seleccionar · Esc cerrar
                    </div>
                  </div>
                )}
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

            {/* ── Result area ─────────────────────────────────────── */}
            <div className="mb-6">
              {scanMode === 'loading' && (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mr-3" />
                  Buscando producto...
                </div>
              )}

              {scanMode === 'found' && foundProduct && (
                <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">{foundProduct.nombre}</h3>
                  <p className="text-xs text-gray-500 mb-3">Código: {foundProduct.codigoBarra}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Precio actual: {formatCurrency(foundProduct.precio)}</label>
                      <input
                        ref={precioRef}
                        type="number"
                        step="0.01"
                        value={editPrecio}
                        onChange={e => setEditPrecio(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Precio"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Costo actual: {formatCurrency(foundProduct.costo)}</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editCosto}
                        onChange={e => setEditCosto(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Costo"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Talle</label>
                      <input
                        type="text"
                        value={editTamano}
                        onChange={e => setEditTamano(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Talle (opcional)"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Stock actual: {foundProduct.stock}</label>
                      <input
                        type="number"
                        min={1}
                        value={editCantidad}
                        onChange={e => setEditCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Cantidad"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {isAdding ? 'Agregando...' : 'Agregar a compra'}
                  </button>
                </div>
              )}

              {scanMode === 'picker' && searchResults.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Se encontraron {searchResults.length} producto(s) — seleccione uno:
                  </h3>
                  <div className="space-y-2">
                    {searchResults.map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectFromPicker(p)}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-400 hover:shadow-sm cursor-pointer transition-all flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{p.nombre}</p>
                          <p className="text-xs text-gray-500">Código: {p.codigoBarra}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-gray-700">Precio: {formatCurrency(p.precio)}</p>
                          <p className="text-gray-500">Costo: {formatCurrency(p.costo)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setEditPrecio(0);
                      setEditCosto('');
                      setInlineNombre('');
                      setEditCantidad(1);
                      setEditTamano('');
                      setScanMode('not-found');
                    }}
                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    No encuentro el producto — crear uno nuevo
                  </button>
                </div>
              )}

              {scanMode === 'not-found' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-amber-900 mb-3">
                    Producto no encontrado — crear nuevo
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Código de barras</label>
                      <input
                        type="text"
                        value={state.searchTerm}
                        readOnly
                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                      <input
                        ref={nombreRef}
                        type="text"
                        value={inlineNombre}
                        onChange={e => setInlineNombre(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Nombre del producto"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Precio</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editPrecio}
                        onChange={e => setEditPrecio(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Precio de venta"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Costo (opcional)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={editCosto}
                        onChange={e => setEditCosto(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Costo por unidad"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Talle (opcional)</label>
                      <input
                        type="text"
                        value={editTamano}
                        onChange={e => setEditTamano(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Talle"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min={1}
                        value={editCantidad}
                        onChange={e => setEditCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Cantidad"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className="px-5 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    {isAdding ? 'Agregando...' : 'Crear y agregar a compra'}
                  </button>
                </div>
              )}

              {scanMode === 'idle' && state.cart.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 mb-6">
                  <p className="text-sm">Escanee o busque un producto para comenzar</p>
                </div>
              )}
            </div>

            {/* ── Cart / items list ───────────────────────────────── */}
            {state.cart.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h2 className="text-base font-semibold text-gray-900 mb-3">
                  Items cargados ({state.cart.length})
                </h2>
                <div className="space-y-2">
                  {state.cart.map((item, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {item.productoNombre || '(nuevo producto)'}
                          </p>
                          {item.productoId === 0 && (
                            <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">nuevo</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{item.codigoBarra}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
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
                      <p className="text-sm font-medium text-gray-900 w-24 text-right shrink-0">
                        {formatCurrency(item.subtotal)}
                      </p>
                      <button
                        onClick={() => dispatch({ type: 'REMOVE_FROM_CART', index: i })}
                        className="text-red-400 hover:text-red-600 shrink-0 text-sm"
                        title="Eliminar"
                      >
                        {'\u2715'}
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                  <span className="text-base font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-indigo-700">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => dispatch({ type: 'SET_STEP', step: 'confirm' })}
                    disabled={state.cart.length === 0}
                    className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Ver resumen →
                  </button>
                </div>
              </div>
            )}
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
                      <td className="py-1.5 pr-2">
                        {item.productoNombre}
                        {item.productoId === 0 && (
                          <span className="ml-1 text-xs text-amber-600 font-sans">(nuevo)</span>
                        )}
                      </td>
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
                He verificado que las cantidades y costos coinciden con la boleta fisica
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
