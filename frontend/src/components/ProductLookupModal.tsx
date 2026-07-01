import { useState, useEffect, useRef, useMemo } from 'react';
import type { ProductoDto, ProductoDetailDto } from '../types';
import { api } from '../api/client';

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProductLookupModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [productos, setProductos] = useState<ProductoDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [_selected, setSelected] = useState<ProductoDto | null>(null);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const hlRef = useRef(-1);
  const gridRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [detailProd, setDetailProd] = useState<ProductoDetailDto | null>(null);
  const aceptarRef = useRef<HTMLButtonElement>(null);

  const showDetail = async (prod: ProductoDto) => {
    try {
      const detail = await api.productos.detalle(prod.id);
      setDetailProd(detail);
    } catch {
      setDetailProd({
        id: prod.id, codigoBarra: prod.codigoBarra, codProducto: prod.codigoBarra,
        nombre: prod.nombre, precio: prod.precio, costo: prod.costo, stock: prod.stock,
        tamano: prod.tamano, activo: prod.activo,
        fechaAlta: '', fechaUltimaMod: '',
      });
    }
  };

  useEffect(() => {
    if (detailProd) setTimeout(() => aceptarRef.current?.focus(), 100);
  }, [detailProd]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setProductos([]);
      setSelected(null);
      setHighlightIdx(-1);
      hlRef.current = -1;
      gridRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setProductos([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Try barcode first
        const byBarra = await api.productos.obtenerPorBarra(query.trim()).catch(() => null);
        if (byBarra) {
          setProductos([byBarra]);
          showDetail(byBarra);
        } else {
          const results = await api.productos.buscar(query.trim());
          setProductos(results);
        }
      } catch {
        setProductos([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const resultados = useMemo(() => productos, [productos]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-start justify-center pt-[15vh] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
        <div className="flex justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Buscar producto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="relative mb-3">
          <input ref={inputRef} type="text" value={query}
            onChange={e => { setQuery(e.target.value); hlRef.current = -1; setHighlightIdx(-1); gridRef.current = false; setDetailProd(null); }}
            onKeyDown={e => {
              const gf = gridRef.current;
              const idx = hlRef.current;
              const total = resultados.length;
              const cols = 2;
              if (gf) {
                if (e.key === 'ArrowDown') { e.preventDefault(); const next = Math.min(idx + cols, total - 1); hlRef.current = next; setHighlightIdx(next); return; }
                if (e.key === 'ArrowUp') { e.preventDefault(); if (idx < cols) { hlRef.current = -1; setHighlightIdx(-1); gridRef.current = false; inputRef.current?.focus(); } else { const prev = idx - cols; hlRef.current = prev; setHighlightIdx(prev); } return; }
                if (e.key === 'ArrowRight') { e.preventDefault(); const next = idx + 1; if (next < total && Math.floor(next / cols) === Math.floor(idx / cols)) { hlRef.current = next; setHighlightIdx(next); } return; }
                if (e.key === 'ArrowLeft') { e.preventDefault(); const prev = idx - 1; if (prev >= 0 && Math.floor(prev / cols) === Math.floor(idx / cols)) { hlRef.current = prev; setHighlightIdx(prev); } return; }
                if (e.key === 'Enter' && idx >= 0) { e.preventDefault(); showDetail(resultados[idx]); return; }
                if (e.key === 'Escape') { hlRef.current = -1; setHighlightIdx(-1); gridRef.current = false; inputRef.current?.focus(); return; }
                return;
              }
              if (e.key === 'ArrowDown') { e.preventDefault(); if (total > 0) { hlRef.current = 0; setHighlightIdx(0); gridRef.current = true; } return; }
              if (e.key === 'Enter' && total === 1) { e.preventDefault(); showDetail(resultados[0]); return; }
              if (e.key === 'Enter' && total > 1) { e.preventDefault(); hlRef.current = 0; setHighlightIdx(0); gridRef.current = true; return; }
            }}
            placeholder="Nombre o código de barras..."
            className="w-full pl-3 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors" />
          {query && (
            <button onClick={() => { setQuery(''); setProductos([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Buscando...</span>
          </div>
        )}

        {/* Detail card — all product data */}
        {detailProd && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-3 shadow-sm">
            {/* Header: name + code */}
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <h4 className="text-lg font-bold text-gray-900 truncate">{detailProd.nombre}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500 font-mono">{detailProd.codigoBarra}</span>
                    {detailProd.codProducto !== detailProd.codigoBarra && (
                      <span className="text-xs text-gray-400 font-mono">Cód: {detailProd.codProducto}</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${detailProd.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {detailProd.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <button onClick={() => setDetailProd(null)} className="text-gray-400 hover:text-gray-600 ml-2 shrink-0">✕</button>
              </div>
            </div>

            {/* Prices — hero: just the price */}
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Precio</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(detailProd.precio)}</p>
            </div>

            {/* Stock */}
            <div className={`px-5 py-4 border-b ${detailProd.stock <= 5 ? 'bg-red-50 border-red-100' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">Stock</p>
                  <p className={`text-2xl font-bold ${detailProd.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                    {detailProd.stock} unid.
                  </p>
                </div>
                {detailProd.stock <= 5 && (
                  <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full font-medium">Stock bajo</span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="px-5 py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Detalles</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Costo</span><span className="font-medium text-gray-700">{formatCurrency(detailProd.costo)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Margen</span><span className="font-medium text-green-600">{detailProd.costo > 0 ? `${((detailProd.precio - detailProd.costo) / detailProd.costo * 100).toFixed(0)}%` : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Ganancia</span><span className="font-medium text-green-600">{formatCurrency(detailProd.precio - detailProd.costo)}</span></div>
                {detailProd.categoria && (
                  <div className="flex justify-between"><span className="text-gray-500">Categoría</span><span className="font-medium text-gray-700">{detailProd.categoria}</span></div>
                )}
                {detailProd.unidadMedida && (
                  <div className="flex justify-between"><span className="text-gray-500">Unidad</span><span className="font-medium text-gray-700">{detailProd.unidadMedida}</span></div>
                )}
                {detailProd.tamano && (
                  <div className="flex justify-between"><span className="text-gray-500">Tamaño</span><span className="font-medium text-gray-700">{detailProd.tamano}</span></div>
                )}
                {detailProd.contenido != null && (
                  <div className="flex justify-between"><span className="text-gray-500">Contenido</span><span className="font-medium text-gray-700">{detailProd.contenido}</span></div>
                )}
                <div className="flex justify-between"><span className="text-gray-500">Alta</span><span className="text-gray-700">{detailProd.fechaAlta ? new Date(detailProd.fechaAlta).toLocaleDateString('es-AR') : '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Última mod.</span><span className="text-gray-700">{detailProd.fechaUltimaMod ? new Date(detailProd.fechaUltimaMod).toLocaleDateString('es-AR') : '—'}</span></div>
                {detailProd.fechaBaja && (
                  <div className="flex justify-between col-span-2"><span className="text-red-500">Fecha baja</span><span className="text-red-600">{new Date(detailProd.fechaBaja).toLocaleDateString('es-AR')}</span></div>
                )}
              </div>
              {detailProd.descAdicional && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Descripción adicional</p>
                  <p className="text-sm text-gray-600">{detailProd.descAdicional}</p>
                </div>
              )}
            </div>

            {/* Aceptar button */}
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
              <button ref={aceptarRef} onClick={() => { setDetailProd(null); setQuery(''); setProductos([]); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm">
                Aceptar
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && resultados.length > 0 && !detailProd && (
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {resultados.map((p, i) => (
              <button key={p.id} onClick={() => showDetail(p)}
                className={`text-left border rounded-xl p-3 transition-all ${
                  i === highlightIdx && gridRef.current
                    ? 'border-indigo-400 bg-indigo-50 shadow-sm ring-1 ring-indigo-300'
                    : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                }`}>
                <p className="font-medium text-sm truncate">{p.nombre}</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{p.codigoBarra}</p>
                <div className="flex justify-between mt-1.5">
                  <span className="text-sm font-semibold text-indigo-700">{formatCurrency(p.precio)}</span>
                  <span className="text-xs text-gray-400">Stock: {p.stock}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && query && resultados.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-8">Sin resultados</p>
        )}

        {!query && !loading && (
          <p className="text-center text-sm text-gray-400 py-8">Escribí para buscar por nombre o código de barras</p>
        )}
      </div>
    </div>
  );
}
