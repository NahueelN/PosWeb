import { useState, useEffect, type FormEvent } from 'react'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { SucursalDto } from '../types'

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<SucursalDto[]>([])
  const [numero, setNumero] = useState('')
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const { notifyError } = useNotification()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { listar() }, [])

  async function listar() {
    try {
      setSucursales(await api.sucursales.listar())
    } catch (e: any) { notifyError(e.message) }
  }

  async function handleCrear(e: FormEvent) {
    e.preventDefault()
    try {
      await api.sucursales.crear({ numero: Number(numero), codigo, nombre })
      setNumero(''); setCodigo(''); setNombre('')
      setShowForm(false)
      await listar()
    } catch (e: any) { notifyError(e.message) }
  }

  async function handleEliminar(id: number) {
    try {
      await api.sucursales.eliminar(id)
      await listar()
    } catch (e: any) { notifyError(e.message) }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sucursales</h2>
          <p className="text-sm text-gray-500 mt-0.5">{sucursales.length} sucursales activas</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva sucursal
        </button>
      </div>

      {/* Formulario crear */}
      {showForm && (
        <form onSubmit={handleCrear}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4 animate-[fadeIn_0.2s_ease]"
        >
          <h3 className="font-semibold text-gray-900 text-sm">Nueva sucursal</h3>
          <div className="flex gap-3">
            <input
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm w-28 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              type="number" placeholder="Número" value={numero} onChange={(e) => setNumero(e.target.value)} required
            />
            <input
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm w-32 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Código" value={codigo} onChange={(e) => setCodigo(e.target.value)} required
            />
            <input
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required
            />
            <button type="submit"
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Crear
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sucursales.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    No hay sucursales
                  </td>
                </tr>
              )}
              {sucursales.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{s.numero}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.codigo}</td>
                  <td className="px-4 py-3 text-gray-800">{s.nombre}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEliminar(s.id)}
                      className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
