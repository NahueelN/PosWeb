interface EntidadContactoFormProps {
  nombre: string
  tipoDocumento: string
  documento: string
  ivaCondicion: string
  telefono: string
  mail: string
  domicilio: string
  onChange: (campo: string, valor: string) => void
  tiposDocumento: string[]
  ivaCondiciones: string[]
  documentoDisabled?: boolean
}

const inputClass =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm ' +
  'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none'

const labelClass = 'text-xs font-semibold text-gray-700'

/**
 * Unified contact form fields for Clientes and Proveedores.
 * The "documento" field maps to numeroDocumento (cliente) or nroDocumento (proveedor)
 * via the onChange callback in each page.
 */
export default function EntidadContactoForm({
  nombre,
  tipoDocumento,
  documento,
  ivaCondicion,
  telefono,
  mail,
  domicilio,
  onChange,
  tiposDocumento,
  ivaCondiciones,
  documentoDisabled = false,
}: EntidadContactoFormProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className={labelClass}>Nombre *</label>
        <input type="text" value={nombre} onChange={e => onChange('nombre', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Tipo documento</label>
        <select value={tipoDocumento} onChange={e => onChange('tipoDocumento', e.target.value)}
          className={`${inputClass} bg-white`}>
          {tiposDocumento.map(t => <option key={t} value={t}>{t === '' ? '—' : t}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>N° documento</label>
        <input type="text" value={documento} onChange={e => onChange('documento', e.target.value)}
          disabled={documentoDisabled} className={`${inputClass} disabled:bg-gray-100`} />
      </div>
      <div>
        <label className={labelClass}>IVA</label>
        <select value={ivaCondicion} onChange={e => onChange('ivaCondicion', e.target.value)}
          className={`${inputClass} bg-white`}>
          {ivaCondiciones.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className={labelClass}>Teléfono</label>
        <div className="flex items-center border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
          <span className="pl-3 py-2 text-sm text-gray-500 select-none">+549</span>
          <input type="tel" value={(telefono || '').replace(/^\+549/, '')}
            onChange={e => onChange('telefono', e.target.value ? `+549${e.target.value}` : '')}
            className="w-full py-2 pr-3 text-sm focus:outline-none bg-transparent" placeholder="11..." />
        </div>
      </div>
      <div>
        <label className={labelClass}>Mail</label>
        <input type="email" value={mail} onChange={e => onChange('mail', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Domicilio</label>
        <input type="text" value={domicilio} onChange={e => onChange('domicilio', e.target.value)} className={inputClass} />
      </div>
    </div>
  )
}
