import { useState, type RefObject } from 'react'
import { Plus } from 'lucide-react'
import type { ProveedorDto } from '../../types'

interface ProveedorAltaCruzadaProps {
  proveedores: ProveedorDto[]
  proveedorId: number
  proveedorNombre: string
  inputRef?: RefObject<HTMLInputElement | null>
  onSelect: (proveedor: ProveedorDto) => void
  onCreate: () => void
  onSelectOcasional: () => void
  onSelected?: () => void
}

export default function ProveedorAltaCruzada({ proveedores, proveedorId, proveedorNombre, inputRef, onSelect, onCreate, onSelectOcasional, onSelected }: ProveedorAltaCruzadaProps) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(-1)
  const filtered = (search.trim() ? proveedores.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())) : proveedores)
    .filter(p => p.nombre !== 'Proveedor ocasional')

  const select = (proveedor: ProveedorDto) => {
    onSelect(proveedor)
    setSearch('')
    setOpen(false)
    onSelected?.()
  }

  return (
    <div className="relative flex-1 min-w-[180px] max-w-xs">
      <input ref={inputRef} type="text" value={proveedorId > 0 ? proveedorNombre : search}
        onChange={e => { setSearch(e.target.value); setOpen(true); setHighlight(-1) }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) { setOpen(true); setHighlight(-1) } else setHighlight(current => current < filtered.length - 1 ? current + 1 : current) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(current => current <= 0 ? -1 : current - 1) }
          else if (e.key === 'Enter' && open) { e.preventDefault(); if (highlight === -1) onSelectOcasional(); else if (filtered[highlight]) select(filtered[highlight]); setOpen(false) }
        }}
        placeholder={proveedorId > 0 ? proveedorNombre : 'Seleccionar proveedor *'}
        className="w-full h-10 px-3 pr-10 border border-gray-200 rounded-xl text-[13px] focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)] placeholder:text-gray-400" />
      <button type="button" onClick={onCreate} className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg text-[oklch(0.52_0.255_278)] hover:bg-[oklch(0.52_0.255_278_/_0.08)] transition-all flex items-center justify-center" title="Nuevo proveedor"><Plus size={16} strokeWidth={2.5} /></button>
      {open && <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg text-[13px] overflow-hidden"><ul className="max-h-48 overflow-y-auto"><li onMouseDown={onSelectOcasional} onMouseEnter={() => setHighlight(-1)} className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${highlight === -1 ? 'bg-[oklch(0.52_0.255_278_/_0.10)] text-[oklch(0.52_0.255_278)]' : 'hover:bg-gray-50'}`}><span className="font-medium">Ocasional</span><span className="text-xs text-gray-400">Proveedor sin registro fijo</span></li>{filtered.length > 0 && <><li className="mx-2 border-t border-gray-100" />{filtered.map((p, i) => <li key={p.id} onMouseDown={() => select(p)} onMouseEnter={() => setHighlight(i)} className={`px-3 py-2 cursor-pointer flex justify-between ${i === highlight ? 'bg-[oklch(0.52_0.255_278_/_0.10)] text-[oklch(0.52_0.255_278)]' : 'hover:bg-gray-50'} ${p.id === proveedorId ? 'font-semibold' : ''}`}><span>{p.nombre}</span><span className="text-gray-400">{p.codigo}</span></li>)}</>}</ul>{search.trim().length > 0 && filtered.length === 0 && <div className="px-3 py-4 text-center text-gray-400 text-xs border-t border-gray-100">Sin resultados</div>}</div>}
    </div>
  )
}
