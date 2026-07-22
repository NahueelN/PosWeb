import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

const LANDING_URL = 'https://posweb-licensing.chiacchio-eze01.workers.dev'

export default function ActivarLicenciaPage() {
  const [licenseKey, setLicenseKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleActivate = async () => {
    if (!licenseKey.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await api.licencia.activar({ licenseKey: licenseKey.trim() })
      if (result.activa) {
        navigate('/login')
      }
    } catch (e: any) {
      setError(e.message || 'Error al activar la licencia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-8 rounded-lg shadow-md w-full max-w-md border border-slate-700">
        <h1 className="text-2xl font-bold mb-2 text-center text-white">Activar PosWeb</h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Ingresá la clave de licencia que recibiste al contratar el plan
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">Clave de licencia</label>
          <input
            type="text"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
            placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white font-mono text-sm tracking-wider placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            maxLength={32}
            autoFocus
          />
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-900/50 border border-red-700 text-red-300 rounded text-sm">{error}</div>
        )}

        <button
          onClick={handleActivate}
          disabled={loading || licenseKey.trim().length < 10}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Activando...' : 'Activar licencia'}
        </button>

        <div className="mt-6 text-center text-sm text-gray-400">
          No tenés licencia?
          {' '}
          <a
            href={LANDING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:underline"
          >
            Contratar ahora
          </a>
        </div>
      </div>
    </div>
  )
}
