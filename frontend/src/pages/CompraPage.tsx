import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { CompraRequestDto, CompraResponseDto, ProductoDto, ProveedorDto, CategoriaDto, UnidadMedidaDto, SucursalDto, OpenFoodFactsResultDto } from '../types';
import { api } from '../api/client';
import ProductFormModal from '../components/ProductFormModal';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../hooks/useCart';
import CartHost from '../components/hosts/CartHost';
import CartItemRow from '../components/shared/CartItemRow';
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

const COMPRA_CART_KEY = 'compra_cart_pending';
const COMPRA_PROV_KEY = 'compra_proveedor';

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Component ─────────────────────────────────────────────────────
export default function CompraPage() {
  const [step, setStep] = useState<Step>('scan');
  const [proveedorId, setProveedorId] = useState(() => {
    try { const s = localStorage.getItem(COMPRA_PROV_KEY); return s ? JSON.parse(s).id ?? 0 : 0 } catch { return 0 }
  });
  const [proveedorNombre, setProveedorNombre] = useState(() => {
    try { const s = localStorage.getItem(COMPRA_PROV_KEY); return s ? JSON.parse(s).nombre ?? '' : '' } catch { return '' }
  });
  const [success, setSuccess] = useState<CompraResponseDto | null>(null);
  const [verified, setVerified] = useState(false);

  const cart = useCart<CartItem>({
    storageKey: COMPRA_CART_KEY,
    storage: localStorage,
    getId: (i) => i.productoId,
    getPrecioUnitario: (i) => i.costoUnitario,
  });
  const { sucursal } = useOutletContext<{ sucursal: SucursalDto | null }>();
  const { notifyError } = useNotification();
  const sucursalId = sucursal?.id ?? 1;
  const searchRef = useRef<HTMLInputElement>(null);
  const productGridRef = useRef<HTMLDivElement>(null);
  const cartListRef = useRef<HTMLDivElement>(null);
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const montoPagoRef = useRef<HTMLInputElement>(null);

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
  const [montoPago, setMontoPago] = useState('');
  const [fuentePago, setFuentePago] = useState<'caja' | 'ahorro' | 'dividir'>('caja');
  const [montoCaja, setMontoCaja] = useState(0);
  const [montoAhorro, setMontoAhorro] = useState(0);
  const [deudaGenerada, setDeudaGenerada] = useState(0);

  // Editing
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [edPrecio, setEdPrecio] = useState(0);
  const [edCosto, setEdCosto] = useState('');
  const [edCant, setEdCant] = useState(1);

  // New product modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [offPrefillData, setOffPrefillData] = useState<OpenFoodFactsResultDto | null>(null);
  const [initialCodigo, setInitialCodigo] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const provInputRef = useRef<HTMLInputElement>(null);

  // Load data
  useEffect(() => {
    Promise.all([
      api.productos.listar().then(setProductos).catch(() => {}),
      api.proveedores.listar().then(setProveedores).catch(() => {}),
      api.categorias.listar().then(setCategorias).catch(() => {}),
      api.unidadesMedida.listar().then(setUnidades).catch(() => {}),
    ]).finally(() => setProdLoading(false));
  }, []);

  // beforeunload
  useEffect(() => {
    if (cart.items.length === 0) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [cart.items.length]);

  // Persist proveedor selection
  useEffect(() => {
    if (proveedorId > 0) {
      localStorage.setItem(COMPRA_PROV_KEY, JSON.stringify({ id: proveedorId, nombre: proveedorNombre }));
    } else {
      localStorage.removeItem(COMPRA_PROV_KEY);
    }
  }, [proveedorId, proveedorNombre]);

  // Focus search when proveedor selected
  useEffect(() => {
    if (proveedorId > 0) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [proveedorId]);
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

  const cartTotal = cart.total;
  const cartCount = cart.items.reduce((s, i) => s + i.cantidad, 0);
  const proveedorOk = proveedorId > 0;

  // Auto-complete montoPago with cartTotal for caja/ahorro
  useEffect(() => {
    if (fuentePago !== 'dividir') {
      setMontoPago(cartTotal > 0 ? cartTotal.toFixed(2) : '')
    }
  }, [fuentePago, cartTotal]);

  // ── Handlers ─────────────────────────────────────────────────────
  const addToCart = (p: ProductoDto) => {
    const item: CartItem = {
      productoId: p.id, productoNombre: p.nombre, codigoBarra: p.codigoBarra,
      cantidad: 1, costoUnitario: p.costo, subtotal: p.costo,
      precio: p.precio, costo: p.costo,
      categoriaId: p.categoriaId ?? undefined,
      unidadMedidaId: p.unidadMedidaId ?? undefined,
      contenido: p.contenido ?? undefined,
      descAdicional: p.descAdicional ?? undefined,
    };
    cart.addItem(item);
    setTimeout(() => {
      cantidadRefs.current.get(p.id)?.focus();
      cantidadRefs.current.get(p.id)?.select();
    }, 0);
  };

  const startEdit = (idx: number) => {
    const i = cart.items[idx];
    setEditingIdx(idx);
    setEdPrecio(i.precio ?? 0);
    setEdCosto(String(i.costoUnitario));
    setEdCant(i.cantidad);
  };
  const saveEdit = (idx: number) => {
    const newCosto = parseFloat(edCosto) || 0;
    cart.setItems(prev => prev.map((i, i2) =>
      i2 === idx ? { ...i, cantidad: edCant, costoUnitario: newCosto, subtotal: edCant * newCosto, precio: edPrecio } : i
    ));
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

  const handleBarcodeLookup = async (codigo: string) => {
    if (!proveedorOk) return;
    // 1. Try local DB by exact barcode
    try {
      const prod = await api.productos.obtenerPorBarra(codigo);
      if (prod) { addToCart(prod); setSearchQuery(''); return; }
    } catch {}
    // 2. Try local filtered list
    const localMatch = productos.find(
      p => p.codigoBarra.toLowerCase() === codigo.toLowerCase()
    );
    if (localMatch) { addToCart(localMatch); setSearchQuery(''); return; }
    // 3. Try external API (Open Food Facts)
    setSearchLoading(true);
    try {
      const res = await api.productos.lookupOpenFoodFacts(codigo);
      if (res.encontrado && res.datos) {
        setOffPrefillData(res.datos);
        setInitialCodigo('');
        setShowNewModal(true);
        setSearchQuery('');
      } else {
        notifyError(`Producto no encontrado: "${codigo}"`);
        setOffPrefillData(null);
        setInitialCodigo(codigo);
        setShowNewModal(true);
        setSearchQuery(codigo);
      }
    } catch {
      notifyError(`Error al buscar producto: "${codigo}"`);
      setOffPrefillData(null);
      setInitialCodigo(codigo);
      setShowNewModal(true);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const esDividir = fuentePago === 'dividir';
      const montoPagadoTotal = esDividir ? (montoCaja + montoAhorro) : (parseFloat(montoPago) || 0);
      const montoPagado = montoPagadoTotal > 0 ? montoPagadoTotal : undefined;
      const montoPagadoCaja = esDividir ? (montoCaja > 0 ? montoCaja : undefined) : undefined;
      const req: CompraRequestDto = {
        sucursalId: sucursalId, proveedorId: proveedorId,
        items: cart.items.map(i => ({
          productoId: i.productoId, cantidad: i.cantidad, costoUnitario: i.costoUnitario,
          codigoBarra: i.productoId === 0 ? i.codigoBarra : undefined,
          nombre: i.productoId === 0 ? i.productoNombre : undefined,
          precio: i.precio ?? 0, costo: i.costo,
          categoriaId: i.categoriaId, descAdicional: i.descAdicional,
          contenido: i.contenido, unidadMedidaId: i.unidadMedidaId,
        })),
        montoPagado,
        fuentePago,
        montoPagadoCaja,
      };
      const res = await api.compras.crear(req);
      setDeudaGenerada(res.totalGasto - montoPagadoTotal);
      setSuccess(res); setStep('done');
    } catch (err: any) {
      const errorMsg = err.message || 'Error al crear la compra';
      notifyError(errorMsg);
    } finally { setIsConfirming(false); }
  };

  const handleNuevaCompra = () => { setStep('scan'); cart.clearCart(); setProveedorId(0); setProveedorNombre(''); setSuccess(null); setVerified(false); setDeudaGenerada(0); searchRef.current?.focus(); };
  const handlePrint = () => window.print();

  // ── Render: SCAN step (two-column layout) ────────────────────────
  return (
    <>
    <CartHost
      cart={cart as any}
      title={cart.items.length > 0 ? `Productos (${cartCount})` : 'Nueva compra'}
      confirmLabel={isConfirming ? 'Confirmando...' : 'Confirmar compra'}
      onConfirm={handleConfirm}
      confirmDisabled={!verified || isConfirming || cart.items.length === 0 || !proveedorOk}
      cartRef={cartListRef}
      pageShell={{ title: 'Compras', subtitle: 'Registrar ingreso de mercadería' }}
      showVerify
      verified={verified}
      onVerifiedChange={(checked: boolean) => setVerified(checked)}
      verifyLabel="Verifiqué cantidades y costos"
      headerExtra={
        <div className="flex items-center gap-2">
          {proveedorNombre && <span className="text-xs text-gray-500">{proveedorNombre}</span>}
          {cart.items.length > 0 && (
            <button onClick={() => cart.clearCart()} className="w-7 h-7 rounded-md hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors" title="Vaciar carrito">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
            </button>
          )}
        </div>
      }
      paymentSlot={
        <>
          {fuentePago === 'dividir' ? (
            <>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-indigo-500 font-medium">$ Caja</span>
                  <input type="number" min={0} step="0.01" value={montoCaja || ''} onChange={e => setMontoCaja(parseFloat(e.target.value) || 0)}
                    className="w-full pl-14 pr-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="0.00" />
                </div>
                <button onClick={() => setMontoCaja(cartTotal - montoAhorro)} className="px-2 py-2 text-xs font-medium bg-indigo-50 border border-indigo-300 rounded-lg hover:bg-indigo-100 text-indigo-700 transition-colors" title="Caja cubre el resto">Completar</button>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-emerald-500 font-medium">$ Ahorro</span>
                  <input type="number" min={0} step="0.01" value={montoAhorro || ''} onChange={e => setMontoAhorro(parseFloat(e.target.value) || 0)}
                    className="w-full pl-16 pr-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" placeholder="0.00" />
                </div>
                <button onClick={() => setMontoAhorro(cartTotal - montoCaja)} className="px-2 py-2 text-xs font-medium bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors" title="Ahorro cubre el resto">Completar</button>
              </div>
            </>
          ) : (
            <></>
          )}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {(['caja', 'ahorro', 'dividir'] as const).map(f => (
              <button key={f} onClick={() => setFuentePago(f)}
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${fuentePago === f ? f === 'caja' ? 'bg-indigo-500 text-white' : f === 'ahorro' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>
                {f === 'caja' ? '💵 Caja' : f === 'ahorro' ? '🏦 Ahorro' : '↔ Dividir'}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 leading-tight text-center">Pagos inferiores al total o vacíos generan deuda. Podés revisarla en la pestaña Deudas.</p>
          {(() => {
            const pagado = fuentePago === 'dividir' ? (montoCaja + montoAhorro) : (parseFloat(montoPago) || 0);
            if (pagado < cartTotal && cartTotal > 0) return <p className="text-xs text-amber-600 text-center font-medium">↗ Queda una deuda de {formatCurrency(cartTotal - pagado)}</p>;
            if (pagado >= cartTotal && cartTotal > 0) return <p className="text-xs text-green-600 text-center font-medium">✓ Deuda saldada</p>;
            return null;
          })()}
        </>
      }
      montoValue={fuentePago !== 'dividir' ? montoPago : undefined}
      onMontoChange={fuentePago !== 'dividir' ? v => setMontoPago(v) : undefined}
      montoInputRef={montoPagoRef}
      montoButtonLabel="No pagar"
      onMontoButtonClick={() => setMontoPago('')}
      getItemProps={(item, i) => 
        editingIdx === i ? {
          nombre: 'Editando...',
          precioUnitario: '',
          subtotal: '',
          cantidad: item.cantidad,
          min: 0,
          onCantidadChange: () => {},
          onRemove: () => setEditingIdx(null),
          removeButton: <button onClick={() => setEditingIdx(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">✕</button>,
        } : {
          nombre: item.productoNombre || '(nuevo)',
          codigo: item.codigoBarra,
          precioUnitario: `${formatCurrency(item.costoUnitario)} c/u`,
          subtotal: formatCurrency(item.costoUnitario * item.cantidad),
          cantidad: item.cantidad,
          min: 1,
          onCantidadChange: (c) => c <= 0 ? cart.removeItem(item.productoId) : cart.updateQuantity(item.productoId, c),
          onEnter: () => searchRef.current?.focus(),
          inputRef: (el) => { if (el) cantidadRefs.current.set(item.productoId, el) },
          onRemove: () => cart.removeItem(item.productoId),
          onClickName: () => startEdit(i),
          badge: item.productoId === 0 ? <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold mr-1">NUEVO</span> : undefined,
        }
      }
      getItemKey={(item, i) => i}
      cartExtra={editingIdx !== null ? (
        <div className="bg-white border-2 border-indigo-300 rounded-xl p-3 text-xs mt-2">
          <div className="flex justify-between mb-2"><span className="font-bold text-indigo-900">Editar</span><button onClick={() => setEditingIdx(null)} className="text-gray-400 hover:text-gray-600">Cancelar</button></div>
          <div className="grid grid-cols-3 gap-1.5 mb-2">
            <div className="col-span-3"><label className="text-gray-500">Nombre</label><p className="text-gray-800 font-medium">{cart.items[editingIdx]?.productoNombre || '-'}</p></div>
            <div className="col-span-3"><label className="text-gray-500">Código</label><p className="text-gray-500 font-mono">{cart.items[editingIdx]?.codigoBarra || '-'}</p></div>
            <div><label className="text-gray-500">Precio</label><input type="number" step="0.01" value={edPrecio} onChange={e => setEdPrecio(parseFloat(e.target.value)||0)} className="w-full px-1.5 py-0.5 border rounded" /></div>
            <div><label className="text-gray-500">Costo</label><input type="number" step="0.01" value={edCosto} onChange={e => setEdCosto(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveEdit(editingIdx)} className="w-full px-1.5 py-0.5 border border-indigo-300 rounded" autoFocus /></div>
            <div><label className="text-gray-500">Cant</label><input type="number" min={1} value={edCant} onChange={e => setEdCant(Math.max(1,parseInt(e.target.value)||1))} onKeyDown={e => e.key === 'Enter' && saveEdit(editingIdx)} className="w-full px-1.5 py-0.5 border rounded" /></div>
            <div><label className="text-gray-500">Categ</label><p className="text-gray-800">{categorias.find(c => c.id === cart.items[editingIdx]?.categoriaId)?.descripcion || '-'}</p></div>
            <div><label className="text-gray-500">U.Med</label><p className="text-gray-800">{unidades.find(u => u.id === cart.items[editingIdx]?.unidadMedidaId)?.descripcion || '-'}</p></div>
            <div><label className="text-gray-500">Cont</label><p className="text-gray-800">{cart.items[editingIdx]?.contenido ?? '-'}</p></div>
            <div className="col-span-3"><label className="text-gray-500">Desc</label><p className="text-gray-800">{cart.items[editingIdx]?.descAdicional || '-'}</p></div>
          </div>
          <button onClick={() => saveEdit(editingIdx)} className="w-full py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700">Guardar cambios</button>
        </div>
      ) : undefined}
    >
      {/* Top bar — Proveedor */}
      <div className="shrink-0 space-y-3 pb-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <input ref={provInputRef} type="text"
              value={proveedorId > 0 ? proveedorNombre : proveedorSearch}
              onChange={e => { setProveedorSearch(e.target.value); if (proveedorId > 0) { setProveedorId(0); setProveedorNombre('') } if (e.target.value) setShowProvDropdown(true); setProvHighIdx(-1); }}
              onFocus={() => { if (proveedorSearch) setShowProvDropdown(true); }}
              onBlur={() => setTimeout(() => setShowProvDropdown(false), 200)}
              onKeyDown={e => {
                if (!showProvDropdown || proveedoresFilt.length === 0) return;
                if (e.key === 'ArrowDown') { e.preventDefault(); setProvHighIdx(Math.min(provHighIdx + 1, proveedoresFilt.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setProvHighIdx(Math.max(provHighIdx - 1, 0)); }
                else if (e.key === 'Enter' && provHighIdx >= 0) { e.preventDefault(); const p = proveedoresFilt[provHighIdx]; setProveedorId(p.id); setProveedorNombre(p.nombre); setProveedorSearch(''); setShowProvDropdown(false); setTimeout(() => searchRef.current?.focus(), 0); }
              }}
              placeholder={proveedorId > 0 ? proveedorNombre : 'Seleccionar proveedor *'}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            {showProvDropdown && proveedoresFilt.length > 0 && (
              <ul className="absolute z-30 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto text-xs">
                {proveedoresFilt.map((p, i) => (
                  <li key={p.id} onMouseDown={() => { setProveedorId(p.id); setProveedorNombre(p.nombre); setProveedorSearch(''); setShowProvDropdown(false); searchRef.current?.focus(); }}
                    onMouseEnter={() => setProvHighIdx(i)}
                    className={`px-3 py-1.5 cursor-pointer flex justify-between ${i === provHighIdx ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-100'} ${p.id === proveedorId ? 'font-semibold' : ''}`}>
                    <span>{p.nombre}</span><span className="text-gray-400">{p.codigo}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {proveedorOk && <button onClick={() => { setShowNewModal(true); setOffPrefillData(null); setInitialCodigo(''); }} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors">+ Nuevo producto</button>}
        </div>

        {/* Search bar */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
          <input ref={searchRef} type="text" autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            onPasteCapture={async (e: React.ClipboardEvent<HTMLInputElement>) => { if (!proveedorOk) return; const text = e.clipboardData.getData('text/plain').trim(); if (!text) return; e.preventDefault(); e.stopPropagation(); await handleBarcodeLookup(text) }}
            onKeyDown={async e => {
              if ((e.key === 'ArrowDown') && proveedorOk && filteredProducts.length > 0 && !searchQuery.trim()) { e.preventDefault(); setTimeout(() => productGridRef.current?.querySelector<HTMLButtonElement>('button')?.focus(), 0); return; }
              if (e.key === 'Enter' && proveedorOk && !searchQuery.trim()) { e.preventDefault(); montoPagoRef.current?.focus(); return; }
              if (e.key === 'Enter' && proveedorOk && searchQuery.trim()) { e.preventDefault(); await handleBarcodeLookup(searchQuery.trim()); }
            }}
            placeholder={proveedorOk ? 'Buscar o escanear código de barras...' : 'Seleccione un proveedor para comenzar'}
            disabled={!proveedorOk}
            className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-base placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all disabled:opacity-50" />
          {searchLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>}
          {searchQuery && !searchLoading && (
            <button onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 min-h-0 pb-4">
        <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
            {!proveedorOk ? <div className="text-center py-16 text-gray-500"><p className="font-medium text-sm">Seleccione un proveedor para ver productos</p></div>
            : prodLoading ? <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /><span className="ml-3 text-gray-500 text-sm">Cargando...</span></div>
            : filteredProducts.length === 0 ? <div className="text-center py-16"><p className="text-gray-500 font-medium text-sm">{searchQuery ? 'Sin resultados' : 'No hay productos'}</p></div>
            : (
              <div ref={productGridRef} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                onKeyDown={(e) => {
                  const buttons = Array.from(productGridRef.current?.querySelectorAll('button') ?? [])
                  const currentIdx = buttons.indexOf(e.target as HTMLButtonElement)
                  if (currentIdx === -1) return
                  const gridEl = productGridRef.current; if (!gridEl) return
                  let cols = 2; try { cols = getComputedStyle(gridEl).gridTemplateColumns.split(' ').length } catch {}
                  if (e.key === 'ArrowRight') { e.preventDefault(); const next = Math.min(currentIdx + 1, buttons.length - 1); if (next !== currentIdx) buttons[next]?.focus() }
                  else if (e.key === 'ArrowLeft') { e.preventDefault(); if (currentIdx > 0) buttons[currentIdx - 1]?.focus() }
                  else if (e.key === 'ArrowDown') { e.preventDefault(); const next = Math.min(currentIdx + cols, buttons.length - 1); if (next !== currentIdx) buttons[next]?.focus() }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); if (currentIdx - cols < 0) { searchRef.current?.focus() } else { buttons[currentIdx - cols]?.focus() } }
                  else if (e.key === 'Escape') { searchRef.current?.focus() }
                }}>
                {filteredProducts.map(p => (
                  <button key={p.id} onClick={() => addToCart(p)}
                    className="text-left bg-white border border-gray-200 rounded-xl p-3 hover:border-indigo-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                    <p className="font-medium text-gray-900 text-sm truncate">{p.nombre}</p>
                    <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{p.codigoBarra}</p>
                    <div className="flex items-center justify-between mt-2"><span className="text-sm font-semibold text-indigo-700">{formatCurrency(p.precio)}</span></div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {proveedorOk && filteredProducts.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-2 px-4 sm:px-6">
              <span className="flex items-center gap-1">
                <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 border border-gray-300 text-[10px] font-mono">←</kbd>
                <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 border border-gray-300 text-[10px] font-mono">↑</kbd>
                <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 border border-gray-300 text-[10px] font-mono">→</kbd>
                <kbd className="inline-flex items-center justify-center w-5 h-5 rounded bg-gray-100 border border-gray-300 text-[10px] font-mono">↓</kbd>
                <span>Productos</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </CartHost>

    {/* New Product Modal */}
    <ProductFormModal open={showNewModal} prefillData={offPrefillData} initialCodigo={initialCodigo || undefined}
      onCreated={handleProductCreatedInModal} onClose={() => { setShowNewModal(false); setOffPrefillData(null); setInitialCodigo(''); }} />

    {/* Success Popup */}
    {step === 'done' && success && (
      <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={handleNuevaCompra}>
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">✓ Compra registrada</div>
          <p className="text-xs text-gray-400">{formatFecha(success.fecha)}</p>
          {proveedorNombre && <p className="text-sm text-gray-600 mt-1">{proveedorNombre}</p>}
          <p className="text-2xl font-bold text-indigo-700 mt-2">{formatCurrency(success.totalGasto)}</p>
          {deudaGenerada > 0 && <p className="text-xs text-amber-600 mt-2 font-medium">Deuda generada: {formatCurrency(deudaGenerada)}</p>}
          <button onClick={handleNuevaCompra} autoFocus className="w-full mt-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">Nueva compra</button>
          <button onClick={handleNuevaCompra} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Cerrar</button>
        </div>
      </div>
    )}
    </>
  );
}
