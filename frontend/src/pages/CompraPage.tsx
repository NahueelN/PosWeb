import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { CompraRequestDto, CompraResponseDto, ProductoDto, ProveedorDto, CrearProveedorRequestDto, CategoriaDto, UnidadMedidaDto, SucursalDto, OpenFoodFactsResultDto } from '../types';
import { api } from '../api/client';
import ProductFormModal from '../components/ProductFormModal';
import { useNotification } from '../context/NotificationContext';
import { useCart } from '../hooks/useCart';
import { useItemSnapshot } from '../hooks/useItemSnapshot';
import CartHost from '../components/hosts/CartHost';
import KeyboardHints from '../components/shared/KeyboardHints';
import ProductCard, { formatCodigoBarra } from '../components/shared/ProductCard';
import Dialog from '../components/ui/Dialog';
import { Search, X, Plus, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
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

import { formatCurrency, formatDate } from '../formats';

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
  const { markAdded, onFocusQty, onEscape } = useItemSnapshot();
  const montoPagoRef = useRef<HTMLInputElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const verifyRef = useRef<HTMLInputElement>(null);
  const fuenteRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Data
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [prodLoading, setProdLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [proveedorSearch, setProveedorSearch] = useState('');
  const [showProvDropdown, setShowProvDropdown] = useState(false);
  const [provHighIdx, setProvHighIdx] = useState(-1);
  const [_categorias, setCategorias] = useState<CategoriaDto[]>([]);
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

  // Nuevo proveedor
  const [showNewProvModal, setShowNewProvModal] = useState(false);
  const [newProvNombre, setNewProvNombre] = useState('');
  const [newProvForm, setNewProvForm] = useState({ tipoDocumento: '', nroDocumento: '', telefono: '', mail: '', domicilio: '', ivaCondicion: 'ConsumidorFinal' });

  const handleSelectOcasional = useCallback(() => {
    const occ = proveedores.find(p => p.nombre === 'Proveedor ocasional' || p.codigo === 'OCASIONAL');
    if (occ) {
      setProveedorId(occ.id); setProveedorNombre(occ.nombre); setProveedorSearch('');
    } else {
      api.proveedores.crear({ nombre: 'Proveedor ocasional', ivaCondicion: 'ConsumidorFinal' })
        .then(nuevo => {
          setProveedores(prev => [...prev, nuevo]);
          setProveedorId(nuevo.id); setProveedorNombre(nuevo.nombre); setProveedorSearch('');
        })
        .catch(err => notifyError(err instanceof Error ? err.message : 'Error'));
    }
    setShowProvDropdown(false);
    setTimeout(() => searchRef.current?.focus(), 50);
  }, [proveedores]);

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
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
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
        if (showNewModal) { setShowNewModal(false); searchRef.current?.focus(); return; }
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

  const unidadesMap = useMemo(() => {
    const m = new Map<number, string>()
    for (const u of unidades) m.set(u.id, u.codigo)
    return m
  }, [unidades])

  const cartTotal = cart.total;
  const proveedorOk = proveedorId > 0;

  // Auto-complete montoPago with cartTotal for caja/ahorro
  useEffect(() => {
    if (fuentePago !== 'dividir') {
      setMontoPago(cartTotal > 0 ? cartTotal.toFixed(2) : '')
    }
  }, [fuentePago, cartTotal]);

  // Auto-focus proveedor input on first load
  useEffect(() => {
    const id = setTimeout(() => provInputRef.current?.focus(), 150)
    return () => clearTimeout(id)
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────
  const addToCart = (p: ProductoDto) => {
    if (p.esBulto) {
      const unidadId = p.productoBultoId
      const cantidad = p.contenido ?? 1
      const unidad = unidadId ? productos.find(x => x.id === unidadId) : null
      if (unidad) {
        const existing = cart.items.find(i => i.productoId === unidad.id)
        markAdded(unidad.id, existing?.cantidad)
        const item: CartItem = {
          productoId: unidad.id, productoNombre: unidad.nombre, codigoBarra: unidad.codigoBarra,
          cantidad, costoUnitario: unidad.costo, subtotal: unidad.costo * cantidad,
          precio: unidad.precio, costo: unidad.costo,
          categoriaId: unidad.categoriaId ?? undefined,
          unidadMedidaId: unidad.unidadMedidaId ?? undefined,
          contenido: unidad.contenido ?? undefined,
          descAdicional: unidad.descAdicional ?? undefined,
        }
        cart.addItem(item)
      }
    } else {
      const existing = cart.items.find(i => i.productoId === p.id)
      markAdded(p.id, existing?.cantidad)
      const item: CartItem = {
        productoId: p.id, productoNombre: p.nombre, codigoBarra: p.codigoBarra,
        cantidad: 1, costoUnitario: p.costo, subtotal: p.costo,
        precio: p.precio, costo: p.costo,
        categoriaId: p.categoriaId ?? undefined,
        unidadMedidaId: p.unidadMedidaId ?? undefined,
        contenido: p.contenido ?? undefined,
        descAdicional: p.descAdicional ?? undefined,
      }
      cart.addItem(item)
    }
    const el = searchRef.current
    if (el) { el.classList.remove('animate-barcode-flash'); void el.offsetWidth; el.classList.add('animate-barcode-flash') }
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
    if (producto.esBulto) {
      setShowNewModal(false)
      searchRef.current?.focus()
      setProductos(prev => {
        if (prev.find(p => p.id === producto.id)) return prev
        return [...prev, producto]
      })
      return
    }
    addToCart(producto);
    setShowNewModal(false);
    searchRef.current?.focus()
    setProductos(prev => {
      if (prev.find(p => p.id === producto.id)) return prev;
      return [...prev, producto];
    });
  };

  async function crearProveedor(e: React.FormEvent) {
    e.preventDefault();
    if (!newProvNombre.trim()) return;
    try {
      const dto: CrearProveedorRequestDto = {
        nombre: newProvNombre.trim(),
        tipoDocumento: newProvForm.tipoDocumento || undefined,
        nroDocumento: newProvForm.nroDocumento || undefined,
        telefono: newProvForm.telefono || undefined,
        mail: newProvForm.mail || undefined,
        domicilio: newProvForm.domicilio || undefined,
        ivaCondicion: newProvForm.ivaCondicion || 'ConsumidorFinal',
      };
      const nuevo = await api.proveedores.crear(dto);
      setProveedores(prev => [...prev, nuevo]);
      setProveedorId(nuevo.id);
      setProveedorNombre(nuevo.nombre);
      setProveedorSearch('');
      setShowProvDropdown(false);
      setShowNewProvModal(false);
      setNewProvNombre('');
      setNewProvForm({ tipoDocumento: '', nroDocumento: '', telefono: '', mail: '', domicilio: '', ivaCondicion: 'ConsumidorFinal' });
      setTimeout(() => searchRef.current?.focus(), 50);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al crear proveedor');
    }
  }

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

  const handleNuevaCompra = () => { setStep('scan'); cart.clearCart(); setProveedorId(0); setProveedorNombre(''); setSuccess(null); setVerified(false); setDeudaGenerada(0); setTimeout(() => provInputRef.current?.focus(), 100); };

  // ── Render: SCAN step (two-column layout) ────────────────────────
  return (
    <>
    <CartHost
      cart={cart as any}
      confirmLabel={isConfirming ? 'Confirmando...' : 'Confirmar compra'}
      onConfirm={handleConfirm}
      confirmDisabled={!verified || isConfirming || cart.items.length === 0 || !proveedorOk}
      cartRef={cartListRef}
      confirmRef={confirmBtnRef}
      pageShell={{ title: 'Compras', subtitle: 'Registrar ingreso de mercadería' }}
      showVerify
      verified={verified}
      onVerifiedChange={(checked: boolean) => setVerified(checked)}
      verifyLabel="Verifiqué cantidades y costos"
      headerExtra={proveedorNombre ? (
        <span className="text-xs text-gray-500">{proveedorNombre}</span>
      ) : undefined}
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
            {(['caja', 'ahorro', 'dividir'] as const).map((f, idx) => (
              <button
                key={f}
                ref={el => { fuenteRefs.current[idx] = el; }}
                onClick={() => { setFuentePago(f); if (f !== 'dividir') setTimeout(() => montoPagoRef.current?.focus(), 0); }}
                onKeyDown={e => {
                  if (e.key === 'ArrowLeft') { e.preventDefault(); const prev = idx - 1; if (prev >= 0) fuenteRefs.current[prev]?.focus(); }
                  else if (e.key === 'ArrowRight') { e.preventDefault(); const next = idx + 1; if (next < 3) fuenteRefs.current[next]?.focus(); }
                  else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFuentePago(f); if (f !== 'dividir') setTimeout(() => montoPagoRef.current?.focus(), 0); }
                  else if (e.key === 'Tab' && e.shiftKey && idx === 0) { e.preventDefault(); searchRef.current?.focus(); }
                }}
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
      onMontoButtonClick={() => setMontoPago('')}
      verifyRef={verifyRef}
      searchInputRef={searchRef}
      emptyState={<div className="text-center py-12 text-gray-400"><p className="text-sm">Agregá productos desde la grilla</p></div>}
      getItemProps={(item: any, i: number) =>
        editingIdx === i ? {
          nombre: item.productoNombre || '(nuevo)',
          codigo: item.codigoBarra,
          precioUnitario: `${formatCurrency(item.costoUnitario)} c/u`,
          subtotal: formatCurrency(item.costoUnitario * item.cantidad),
          cantidad: item.cantidad,
          min: 0,
          onCantidadChange: () => {},
          onRemove: () => setEditingIdx(null),
          removeButton: <button onClick={() => setEditingIdx(null)} className="flex h-[20px] w-[20px] items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 active:scale-90"><Trash2 size={11}/></button>,
          details: (
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-gray-500 mb-0.5 block">Precio</label>
                  <input type="number" step="0.01" value={edPrecio} onChange={e => setEdPrecio(parseFloat(e.target.value)||0)}
                    className="w-full h-8 px-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)]" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 mb-0.5 block">Costo</label>
                  <input type="number" step="0.01" value={edCosto} onChange={e => setEdCosto(e.target.value)} autoFocus
                    onKeyDown={e => e.key === 'Enter' && saveEdit(editingIdx)}
                    className="w-full h-8 px-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)]" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-gray-500 mb-0.5 block">Cant</label>
                  <input type="number" min={1} value={edCant} onChange={e => setEdCant(Math.max(1,parseInt(e.target.value)||1))}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(editingIdx)}
                    className="w-full h-8 px-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)]" />
                </div>
              </div>
              <button onClick={() => saveEdit(editingIdx)}
                className="w-full h-8 bg-[oklch(0.595_0.172_152)] text-white text-[12px] font-semibold rounded-lg hover:bg-[oklch(0.52_0.182_152)] transition-colors">
                Guardar
              </button>
            </div>
          ),
        } : {
          nombre: item.productoNombre || '(nuevo)',
          codigo: formatCodigoBarra(item as any, unidadesMap),
          precioUnitario: `${formatCurrency(item.costoUnitario)} c/u`,
          subtotal: formatCurrency(item.costoUnitario * item.cantidad),
          cantidad: item.cantidad,
          min: 1,
          onCantidadChange: (c) => cart.updateQuantity(item.productoId, Math.max(0, c)),
          onEnter: () => searchRef.current?.focus(),
          onFocusQty: () => onFocusQty(item.productoId, item.cantidad),
          onEscape: () => onEscape(
            item.productoId,
            item.cantidad,
            (qty) => cart.updateQuantity(item.productoId, qty),
            () => cart.removeItem(item.productoId)
          ),
          inputRef: (el) => { if (el) cantidadRefs.current.set(item.productoId, el) },
          onRemove: () => cart.removeItem(item.productoId),
          onClickName: () => startEdit(i),
          badge: item.productoId === 0 ? <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold mr-1">NUEVO</span> : undefined,
        }
      }
      getItemKey={(_item, i) => i}
      topContent={
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <input ref={provInputRef} type="text"
                value={proveedorId > 0 ? proveedorNombre : proveedorSearch}
                onChange={e => { setProveedorSearch(e.target.value); if (proveedorId > 0) { setProveedorId(0); setProveedorNombre('') } setShowProvDropdown(true); setProvHighIdx(-1); }}
                onFocus={() => {}}
                onBlur={() => setTimeout(() => setShowProvDropdown(false), 200)}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!showProvDropdown) { setShowProvDropdown(true); setProvHighIdx(-1); return; }
                    setProvHighIdx(prev => prev < proveedoresFilt.length - 1 ? prev + 1 : prev);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setProvHighIdx(prev => prev <= 0 ? -1 : prev - 1);
                  } else if (e.key === 'Enter') {
                    if (!showProvDropdown) return;
                    e.preventDefault();
                    if (provHighIdx === -1) { handleSelectOcasional(); }
                    else if (provHighIdx >= 0 && provHighIdx < proveedoresFilt.length) {
                      const p = proveedoresFilt[provHighIdx];
                      setProveedorId(p.id); setProveedorNombre(p.nombre); setProveedorSearch(''); setShowProvDropdown(false);
                      setTimeout(() => searchRef.current?.focus(), 0);
                    }
                  }
                }}
                placeholder={proveedorId > 0 ? proveedorNombre : 'Seleccionar proveedor *'}
                className="w-full h-10 px-3 pr-10 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)] placeholder:text-gray-400" />
              <button type="button" onClick={() => setShowNewProvModal(true)}
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[oklch(0.52_0.255_278)] hover:bg-[oklch(0.52_0.255_278_/_0.08)] transition-all flex items-center justify-center"
                title="Nuevo proveedor"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
              {showProvDropdown && (
                <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg text-[13px] overflow-hidden">
                  <ul className="max-h-48 overflow-y-auto">
                    <li key="ocasional" onMouseDown={handleSelectOcasional}
                      onMouseEnter={() => setProvHighIdx(-1)}
                      className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${provHighIdx === -1 ? 'bg-[oklch(0.52_0.255_278_/_0.10)] text-[oklch(0.52_0.255_278)]' : 'hover:bg-gray-50'}`}>
                      <span className="font-medium">Ocasional</span>
                      <span className="text-xs text-gray-400">Proveedor sin registro fijo</span>
                    </li>
                    {proveedoresFilt.length > 0 && (
                      <>
                        <li className="mx-2 border-t border-gray-100" />
                        {proveedoresFilt.map((p, i) => (
                          <li key={p.id} onMouseDown={() => { setProveedorId(p.id); setProveedorNombre(p.nombre); setProveedorSearch(''); setShowProvDropdown(false); searchRef.current?.focus(); }}
                            onMouseEnter={() => setProvHighIdx(i)}
                            className={`px-3 py-2 cursor-pointer flex justify-between ${i === provHighIdx ? 'bg-[oklch(0.52_0.255_278_/_0.10)] text-[oklch(0.52_0.255_278)]' : 'hover:bg-gray-50'} ${p.id === proveedorId ? 'font-semibold' : ''}`}>
                            <span>{p.nombre}</span><span className="text-gray-400">{p.codigo}</span>
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                  {proveedorSearch.trim().length > 0 && proveedoresFilt.length === 0 && (
                    <div className="px-3 py-4 text-center text-gray-400 text-xs border-t border-gray-100">Sin resultados</div>
                  )}
                </div>
              )}
            </div>
            {proveedorOk && <Button variant="primary" size="sm" onClick={() => { setShowNewModal(true); setOffPrefillData(null); setInitialCodigo(''); }} icon={<Plus size={14} />}>Nuevo producto</Button>}
          </div>
          <div className="relative">
            <Search size={20} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input ref={searchRef} type="text" autoComplete="off" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onPasteCapture={async (e: React.ClipboardEvent<HTMLInputElement>) => { if (!proveedorOk) return; const text = e.clipboardData.getData('text/plain').trim(); if (!text) return; e.preventDefault(); e.stopPropagation(); await handleBarcodeLookup(text) }}
              onKeyDown={async e => {
                if (e.key === 'Tab' && !e.shiftKey && proveedorOk && cart.items.length > 0) { e.preventDefault(); fuenteRefs.current[0]?.focus(); return; }
                if (e.key === 'Escape') { if (searchQuery) { e.preventDefault(); setSearchQuery(''); searchRef.current?.focus() } return }
                if ((e.key === 'ArrowDown') && proveedorOk && filteredProducts.length > 0 && !searchQuery.trim()) { e.preventDefault(); setTimeout(() => productGridRef.current?.querySelector<HTMLButtonElement>('button')?.focus(), 0); return; }
                if (e.key === 'Enter' && proveedorOk && !searchQuery.trim()) { e.preventDefault(); fuenteRefs.current[0]?.focus(); return; }
                if (e.key === 'Enter' && proveedorOk && searchQuery.trim()) { e.preventDefault(); await handleBarcodeLookup(searchQuery.trim()); }
              }}
              placeholder={proveedorOk ? 'Buscar o escanear código de barras...' : 'Seleccione un proveedor para comenzar'}
              disabled={!proveedorOk}
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-10 text-[13.5px] text-gray-900 placeholder:text-gray-400 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)] disabled:opacity-50" />
            {searchLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-5 h-5 border-2 border-[oklch(0.52_0.255_278)] border-t-transparent rounded-full animate-spin" /></div>}
            {searchQuery && !searchLoading && (
              <button onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Product Grid */}
      <div className="flex-1 min-h-0 pb-4">
        <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
            <KeyboardHints showEnter={cart.items.length > 0} />
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
                  <ProductCard
                    key={p.id}
                    producto={p}
                    unidadesMap={unidadesMap}
                    onClick={() => addToCart(p)}
                    price={<span className="text-[16px] font-bold">{formatCurrency(p.costo)}</span>}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CartHost>

    {/* New Product Modal */}
    <ProductFormModal open={showNewModal} prefillData={offPrefillData} initialCodigo={initialCodigo || undefined}
      onCreated={handleProductCreatedInModal} onClose={() => { setShowNewModal(false); setOffPrefillData(null); setInitialCodigo(''); searchRef.current?.focus() }} />

    {/* Nuevo Proveedor Modal */}
      <Dialog
        open={showNewProvModal}
        onClose={() => { setShowNewProvModal(false); setNewProvNombre(''); setNewProvForm({ tipoDocumento: '', nroDocumento: '', telefono: '', mail: '', domicilio: '', ivaCondicion: 'ConsumidorFinal' }); }}
        title="Nuevo proveedor"
        width="md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setShowNewProvModal(false); setNewProvNombre(''); setNewProvForm({ tipoDocumento: '', nroDocumento: '', telefono: '', mail: '', domicilio: '', ivaCondicion: 'ConsumidorFinal' }); }}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={crearProveedor} disabled={!newProvNombre.trim()}>Crear proveedor</Button>
          </>
        }
      >
        <form id="nuevo-prov-form" onSubmit={crearProveedor} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-700">Nombre *</label>
            <input type="text" value={newProvNombre} onChange={e => setNewProvNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Tipo documento</label>
              <select value={newProvForm.tipoDocumento} onChange={e => setNewProvForm({ ...newProvForm, tipoDocumento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                <option value="">—</option>
                <option value="CUIT">CUIT</option>
                <option value="CUIL">CUIL</option>
                <option value="DNI">DNI</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Nro. documento</label>
              <input type="text" value={newProvForm.nroDocumento} onChange={e => setNewProvForm({ ...newProvForm, nroDocumento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">IVA</label>
            <select value={newProvForm.ivaCondicion} onChange={e => setNewProvForm({ ...newProvForm, ivaCondicion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
              <option value="ConsumidorFinal">Consumidor Final</option>
              <option value="ResponsableInscripto">Responsable Inscripto</option>
              <option value="Monotributista">Monotributista</option>
              <option value="Exento">Exento</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Teléfono</label>
              <input type="text" value={newProvForm.telefono} onChange={e => setNewProvForm({ ...newProvForm, telefono: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Mail</label>
              <input type="email" value={newProvForm.mail} onChange={e => setNewProvForm({ ...newProvForm, mail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Domicilio</label>
            <input type="text" value={newProvForm.domicilio} onChange={e => setNewProvForm({ ...newProvForm, domicilio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" />
          </div>
        </form>
      </Dialog>

    {/* Success Popup */}
    {step === 'done' && success && (
      <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={handleNuevaCompra}>
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">✓ Compra registrada</div>
          <p className="text-xs text-gray-400">{formatDate(success.fecha)}</p>
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
