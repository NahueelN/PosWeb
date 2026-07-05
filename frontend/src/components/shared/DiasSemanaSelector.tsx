import { DIAS } from '../../lib/recurrencia'

export default function DiasSemanaSelector({ selected, onChange }: { selected: string[]; onChange: (dias: string[]) => void }) {
  function toggle(dia: string) {
    onChange(selected.includes(dia) ? selected.filter(d => d !== dia) : [...selected, dia])
  }
  const todosSeleccionados = DIAS.every(d => selected.includes(d))
  return (
    <div className="flex gap-1 items-center">
      {DIAS.map(dia => (
        <button key={dia} type="button" onClick={() => toggle(dia)}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${selected.includes(dia) ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          {dia}
        </button>
      ))}
      <button type="button" onClick={() => onChange(todosSeleccionados ? [] : [...DIAS])}
        className="px-2 py-1 rounded text-xs font-medium border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors">
        {todosSeleccionados ? 'Ninguno' : 'Todos'}
      </button>
    </div>
  )
}
