import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import { HELP_KEYS } from '../help/content'
import { ApiError, api, type RemoteAccessStatus } from '../api/client'
import { remoteAccessView } from './configuracion/remoteAccessView'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import MargenesTab from '../components/MargenesTab'
import StockTab from '../components/StockTab'
import AltaUsuarioTab from '../components/AltaUsuarioTab'
import RespaldoTab from '../components/RespaldoTab'
import type { EmpresaDto, LicenciaEstado } from '../types'
import { getMailPref, setMailPref as persistMailPref, type MailMethod } from '../lib/mail'
import { getWhatsAppPref, setWhatsAppPref as persistWhatsAppPref, type WhatsAppMethod } from '../lib/whatsapp'

type Tab = 'usuarios' | 'perfil' | 'compartir' | 'margenes' | 'stock' | 'respaldo' | 'acceso-remoto'

const tabStyle = (active: boolean) =>
  `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
    active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
  }`

const remoteAccessUnavailableMessage = 'El acceso remoto no está disponible en este momento.'

function remoteAccessUnavailableMessageFor(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503) return 'El acceso remoto no está configurado en esta instalación'
    if (error.status === 409) return error.message
  }
  return remoteAccessUnavailableMessage
}

export default function ConfiguracionPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifyError, notifySuccess } = useNotification()
  const canManageUsers = user?.rol === 'SuperAdmin' || user?.rol === 'Admin'

  const [tab, setTab] = useState<Tab>('perfil')

  const [empresa, setEmpresa] = useState<EmpresaDto | null>(null)
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [empresaDireccion, setEmpresaDireccion] = useState('')
  const [empresaTelefono, setEmpresaTelefono] = useState('')
  const [mostrarTelefonoTicket, setMostrarTelefonoTicket] = useState(false)
  const [empresaDoc, setEmpresaDoc] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mailPref, setMailPref] = useState<MailMethod | ''>(getMailPref() ?? '')
  const [whatsappPref, setWhatsappPref] = useState<WhatsAppMethod | ''>(getWhatsAppPref() ?? '')
  const [tipoNegocio, setTipoNegocio] = useState<'Tienda' | 'Restaurante'>('Tienda')
  const [remoteSlug, setRemoteSlug] = useState('')
  const [remoteStatus, setRemoteStatus] = useState<RemoteAccessStatus>({ status: 'inactive' })
  const [remoteUnavailable, setRemoteUnavailable] = useState(false)
  const [remoteUnavailableMessage, setRemoteUnavailableMessage] = useState<string | null>(null)
  const [remoteRequestInFlight, setRemoteRequestInFlight] = useState(false)
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('')
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  const remotePollStartedAt = useRef<number | null>(null)
  const remoteUnavailableNotified = useRef(false)
  const actualizarEstadoRemoto = useEffectEvent(async () => {
    try {
      const remote = await api.remoteAccess.status()
      setRemoteStatus(remote)
      setRemoteUnavailable(false)
      setRemoteUnavailableMessage(null)
      remoteUnavailableNotified.current = false
      if (remote.slug) setRemoteSlug(remote.slug)
    } catch (error) {
      const message = remoteAccessUnavailableMessageFor(error)
      setRemoteUnavailable(true)
      setRemoteUnavailableMessage(message)
      if (!remoteUnavailableNotified.current) {
        remoteUnavailableNotified.current = true
        notifyError(message)
      }
    }
  })

  const [mpVinculado, setMpVinculado] = useState(false)
  const [mpTitular, setMpTitular] = useState<string | null>(null)
  const [mpAlias, setMpAlias] = useState('')
  const [mpAliasGuardando, setMpAliasGuardando] = useState(false)

  const [licencia, setLicencia] = useState<LicenciaEstado | null>(null)
  const esGratuito = licencia?.plan === 'Gratuito'

  const datosEmpresa = useCallback(() => ({
    nombre: empresaNombre.trim(),
    direccion: empresaDireccion.trim(),
    telefono: empresaTelefono.trim(),
    mostrarTelefonoTicket,
    documento: empresaDoc.trim(),
  }), [empresaNombre, empresaDireccion, empresaTelefono, mostrarTelefonoTicket, empresaDoc])

  useEffect(() => {
    setLoading(true)
    api.empresas.obtener()
      .then(e => {
        setEmpresa(e)
        setEmpresaNombre(e.nombre)
        setEmpresaDireccion(e.direccion ?? '')
        setEmpresaTelefono(e.telefono ?? '')
        setMostrarTelefonoTicket(e.mostrarTelefonoTicket ?? false)
        setEmpresaDoc(e.documento)
      })
      .catch(() => notifyError('Error al cargar empresa'))
      .finally(() => setLoading(false))
    api.licencia.estado().then(setLicencia).catch(() => {})
    if (canManageUsers) void actualizarEstadoRemoto()
  }, [canManageUsers, notifyError])

  useEffect(() => {
    if (remoteStatus.status !== 'provisioning' && remoteStatus.status !== 'waiting_connector') {
      remotePollStartedAt.current = null
      return
    }

    remotePollStartedAt.current ??= Date.now()
    const interval = window.setInterval(() => {
      if (remotePollStartedAt.current && Date.now() - remotePollStartedAt.current >= 5 * 60 * 1000) {
        window.clearInterval(interval)
        return
      }
      void actualizarEstadoRemoto()
    }, 5_000)
    return () => window.clearInterval(interval)
  }, [remoteStatus.status])

  useEffect(() => {
    api.restaurante.config()
      .then(c => setTipoNegocio(c.tipoNegocio ?? (c.habilitado ? 'Restaurante' : 'Tienda')))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!canManageUsers) return
    api.mercadopago.estado()
      .then(e => {
        setMpVinculado(Boolean(e.vinculado))
        setMpTitular(e.nombreTitular ?? null)
        setMpAlias(e.alias ?? '')
      })
      .catch(() => {})
  }, [canManageUsers])

  const guardarEmpresa = useCallback(async (datos = datosEmpresa()) => {
    if (!empresa || (
      empresa.nombre === datos.nombre &&
      empresa.direccion === datos.direccion &&
      empresa.telefono === datos.telefono &&
      empresa.mostrarTelefonoTicket === datos.mostrarTelefonoTicket &&
      empresa.documento === datos.documento
    )) return true

    if (!datos.nombre) {
      notifyError('El nombre de la empresa es requerido')
      return false
    }
    setSaving(true)
    try {
      const updated = await api.empresas.actualizar(datos)
      setEmpresa(updated)
      return true
    } catch {
      notifyError('Error al guardar empresa')
      return false
    } finally {
      setSaving(false)
    }
  }, [empresa, datosEmpresa, notifyError])

  const handleMailPrefChange = (value: string) => {
    const v = value as MailMethod | ''
    setMailPref(v)
    persistMailPref(v === '' ? null : v)
    notifySuccess(v === '' ? 'Ahora se preguntará cada vez' : 'Preferencia de mail guardada')
  }

  const handleWhatsAppPrefChange = (value: string) => {
    const v = value as WhatsAppMethod | ''
    setWhatsappPref(v)
    persistWhatsAppPref(v === '' ? null : v)
    notifySuccess(v === '' ? 'Ahora se preguntará cada vez' : 'Preferencia de WhatsApp guardada')
  }

  const handleGuardarAliasMp = async () => {
    setMpAliasGuardando(true)
    try {
      await api.mercadopago.setAlias(mpAlias)
      notifySuccess('Alias de MercadoPago guardado')
    } catch {
      notifyError('No se pudo guardar el alias')
    } finally {
      setMpAliasGuardando(false)
    }
  }

  const remoteSlugDisplay = remoteSlug.trim().toLowerCase()
  const remoteUrl = remoteStatus.hostname ? `https://${remoteStatus.hostname}` : ''
  const remoteView = remoteAccessView(remoteStatus)
  const activarAccesoRemoto = async () => {
    const slug = remoteSlugDisplay
    if (!/^[a-z0-9-]{3,40}$/.test(slug)) {
      notifyError('Usá entre 3 y 40 caracteres: letras, números y guiones.')
      return
    }
    setRemoteRequestInFlight(true)
    try {
      const remote = await api.remoteAccess.activate(slug)
      setRemoteSlug(slug)
      setRemoteStatus(remote)
      notifySuccess('Activación solicitada')
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'No se pudo activar el acceso remoto')
    } finally {
      setRemoteRequestInFlight(false)
    }
  }
  const desactivarAccesoRemoto = async () => {
    setRemoteRequestInFlight(true)
    try {
      await api.remoteAccess.deactivate()
      setRemoteStatus({ status: 'inactive' })
      notifySuccess('Acceso remoto desactivado')
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'No se pudo desactivar el acceso remoto')
    } finally {
      setRemoteRequestInFlight(false)
    }
  }
  const cambiarPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (passwordNueva !== passwordConfirmacion) {
      notifyError('La confirmación de la contraseña no coincide')
      return
    }
    setCambiandoPassword(true)
    try {
      await api.auth.cambiarPassword({ actual: passwordActual, nueva: passwordNueva })
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordConfirmacion('')
      notifySuccess('Contraseña actualizada')
    } catch (error) {
      notifyError(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña')
    } finally {
      setCambiandoPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
          <p className="mt-1 text-sm text-slate-500">Administrá usuarios, el perfil de tu empresa, márgenes, stock y cómo compartir.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/ayuda?key=${tab === 'usuarios' ? 'solapa-configuracion-usuarios' : tab === 'compartir' ? 'solapa-configuracion-compartir' : tab === 'respaldo' ? 'solapa-configuracion-respaldo' : HELP_KEYS.configuracion}`)}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[oklch(0.52_0.255_278)] hover:bg-gray-100 transition-colors"
          aria-label="Ayuda"
          title="Ayuda"
        >
          <HelpCircle size={17} />
        </button>
      </div>

      <div className="flex border-b border-slate-200">
        {canManageUsers && (
          <button type="button" onClick={() => setTab('usuarios')} className={tabStyle(tab === 'usuarios')}>
            Usuarios
          </button>
        )}
        <button type="button" onClick={() => setTab('perfil')} className={tabStyle(tab === 'perfil')}>
          Perfil
        </button>
        {canManageUsers && <button type="button" onClick={() => setTab('acceso-remoto')} className={tabStyle(tab === 'acceso-remoto')}>Acceso remoto</button>}
        {!esGratuito && (
          <button type="button" onClick={() => setTab('compartir')} className={tabStyle(tab === 'compartir')}>
            Compartir
          </button>
        )}
        {canManageUsers && (
          <button type="button" onClick={() => setTab('margenes')} className={tabStyle(tab === 'margenes')}>
            Márgenes
          </button>
        )}
        {canManageUsers && (
          <button type="button" onClick={() => setTab('stock')} className={tabStyle(tab === 'stock')}>
            Stock
          </button>
        )}
        {canManageUsers && !esGratuito && (
          <button type="button" onClick={() => setTab('respaldo')} className={tabStyle(tab === 'respaldo')}>
            Datos y respaldo
          </button>
        )}
      </div>

      {tab === 'usuarios' && canManageUsers && <AltaUsuarioTab />}

      {tab === 'respaldo' && canManageUsers && <RespaldoTab />}

      {tab === 'acceso-remoto' && canManageUsers && (
        <section className="max-w-2xl rounded-xl bg-white p-6 shadow-xl space-y-5">
          <div><h2 className="text-lg font-semibold text-slate-900">Acceso remoto</h2><p className="mt-1 text-sm text-slate-500">Conectá celulares a esta instalación de Vendeto.</p></div>
           <div><label htmlFor="remote-slug" className="block text-sm font-medium text-slate-700 mb-1">Subdominio del comercio</label><div className="flex items-center"><input id="remote-slug" value={remoteSlug} disabled={remoteUnavailable || !remoteView.canActivate || remoteRequestInFlight} onChange={e => setRemoteSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))} className="w-full rounded-l-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100" placeholder="kiosco-lopez"/><span className="rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">.vendetoweb.com.ar</span></div></div>
           {remoteUrl && remoteStatus.status === 'active' && <a href={remoteUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg bg-slate-50 p-3 text-sm text-indigo-700 break-all hover:underline">{remoteUrl}</a>}
           <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3"><p className="text-sm font-medium text-slate-800">{remoteView.label}</p>{remoteUnavailableMessage && <p role="alert" className="text-sm text-red-700">{remoteUnavailableMessage}</p>}{remoteView.steps.length > 0 && <ol className="space-y-2 text-sm">{remoteView.steps.map((step, index) => <li key={step} className={remoteStatus.status === 'active' || index === 0 ? 'text-emerald-700' : 'text-slate-500'}>{remoteStatus.status === 'active' || index === 0 ? '●' : '○'} {step}</li>)}</ol>}{remoteStatus.status === 'failed' && remoteStatus.lastError && <p role="alert" className="text-sm text-red-700">{remoteStatus.lastError}</p>}{remoteStatus.connector?.state === 'error' && remoteStatus.connector.error && <p role="alert" className="text-sm text-red-700">{remoteStatus.connector.error}</p>}</div>
           <div className="flex gap-3">{!remoteUnavailable && remoteView.canActivate && <button type="button" disabled={remoteRequestInFlight} onClick={() => void activarAccesoRemoto()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Activar acceso remoto</button>}{!remoteUnavailable && remoteView.canDeactivate && <button type="button" disabled={remoteRequestInFlight} onClick={() => void desactivarAccesoRemoto()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50">Desactivar</button>}{!remoteUnavailable && remoteStatus.status === 'active' && remoteUrl && <button type="button" onClick={() => navigator.clipboard.writeText(remoteUrl).then(() => notifySuccess('Enlace copiado'))} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">Copiar enlace</button>}</div>
        </section>
      )}

      {tab === 'perfil' && (
        <>
          <div className="grid gap-6 lg:grid-cols-2 items-start">
            <div className="bg-white rounded-xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Datos de la empresa</h2>
            {loading ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Cargando...
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={empresaNombre}
                    onChange={e => setEmpresaNombre(e.target.value)}
                    onBlur={() => { void guardarEmpresa() }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="Nombre de la empresa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={empresaDireccion}
                    onChange={e => setEmpresaDireccion(e.target.value)}
                    onBlur={() => { void guardarEmpresa() }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="Av. Rivadavia 1234, Castelar, Buenos Aires"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="tel"
                      value={empresaTelefono}
                      onChange={e => setEmpresaTelefono(e.target.value)}
                      onBlur={() => { void guardarEmpresa() }}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      placeholder="(011) 1234-5678"
                    />
                    <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={mostrarTelefonoTicket}
                        onChange={e => {
                          const mostrarTelefonoTicket = e.target.checked
                          setMostrarTelefonoTicket(mostrarTelefonoTicket)
                          void guardarEmpresa({ ...datosEmpresa(), mostrarTelefonoTicket })
                        }}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Mostrar en ticket
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Documento (CUIT/CUIL)</label>
                  <input
                    type="text"
                    value={empresaDoc}
                    onChange={e => setEmpresaDoc(e.target.value)}
                    onBlur={() => { void guardarEmpresa() }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="00000000000"
                  />
                </div>
                <p className="text-xs text-slate-500">{saving ? 'Guardando cambios...' : 'Los cambios se guardan al salir de cada campo.'}</p>
                {canManageUsers && !esGratuito && (
                  <div className="border-t border-slate-100 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de negocio</label>
                      <p className="text-xs text-slate-500 mb-2">Restaurante habilita el módulo de mesas en el menú. La venta de mesa se cobra sin descontar stock.</p>
                      <select
                        value={tipoNegocio}
                        onChange={e => {
                          const tipo = e.target.value as 'Tienda' | 'Restaurante'
                          setTipoNegocio(tipo)
                          api.restaurante.setConfig(tipo)
                            .then(() => window.location.reload())
                            .catch((err: unknown) => {
                              const msg = err instanceof Error ? err.message : String(err)
                              notifyError(`No se pudo guardar el tipo de negocio: ${msg}`)
                              setTipoNegocio(tipoNegocio)
                            })
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                      >
                        <option value="Tienda">Tienda</option>
                        <option value="Restaurante">Restaurante (con mesas)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

           <div className="space-y-6">
           <form onSubmit={cambiarPassword} className="bg-white rounded-xl p-6 shadow-xl space-y-4">
             <h2 className="text-lg font-semibold text-slate-900">Cambiar contraseña</h2>
             <div>
               <label htmlFor="password-actual" className="block text-sm font-medium text-slate-700 mb-1">Contraseña actual</label>
               <input id="password-actual" type="password" autoComplete="current-password" value={passwordActual} onChange={event => setPasswordActual(event.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
             </div>
             <div>
               <label htmlFor="password-nueva" className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña</label>
               <input id="password-nueva" type="password" autoComplete="new-password" value={passwordNueva} onChange={event => setPasswordNueva(event.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
             </div>
             <div>
               <label htmlFor="password-confirmacion" className="block text-sm font-medium text-slate-700 mb-1">Confirmar nueva contraseña</label>
               <input id="password-confirmacion" type="password" autoComplete="new-password" value={passwordConfirmacion} onChange={event => setPasswordConfirmacion(event.target.value)} required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />
             </div>
             <button type="submit" disabled={cambiandoPassword} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{cambiandoPassword ? 'Actualizando...' : 'Actualizar contraseña'}</button>
           </form>
           {canManageUsers && (
            <div className="bg-white rounded-xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">MercadoPago</h2>
              {!mpVinculado ? (
                <p className="text-sm text-slate-500">
                  No hay una cuenta de MercadoPago vinculada. Vinculala desde el panel lateral ("Vincular MP").
                </p>
              ) : (
                <div className="space-y-4">
                  {mpTitular && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 uppercase mb-1">Titular de la cuenta</label>
                      <p className="text-sm font-medium text-slate-700">{mpTitular}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alias de la cuenta</label>
                    <p className="text-xs text-slate-500 mb-2">
                      El alias que los clientes usan para transferirte. Como MercadoPago no lo expone, lo configurás acá y se muestra al cobrar por transferencia.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={mpAlias}
                        onChange={e => setMpAlias(e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Ej: ventas.mp"
                      />
                      <button
                        type="button"
                        onClick={() => { void handleGuardarAliasMp() }}
                        disabled={mpAliasGuardando}
                        className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                      >
                        {mpAliasGuardando ? 'Guardando...' : 'Guardar alias'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Licencia</h2>

            {!licencia ? (
              <p className="text-sm text-slate-500">Sin licencia configurada.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase">Plan</label>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{licencia.plan || '-'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase">Estado</label>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {licencia.estado === 'trial' ? 'Prueba gratuita' : licencia.estado || '-'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase">Vencimiento</label>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {licencia.nextBilling
                      ? new Date(licencia.nextBilling).toLocaleDateString('es-AR')
                      : '-'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase">Cuentas (total)</label>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {licencia.maxUsuarios >= 2000000000 ? 'Ilimitados' : licencia.maxUsuarios}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase">Productos</label>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {licencia.maxProductos >= 2000000000 ? 'Ilimitados' : licencia.maxProductos}
                  </p>
                </div>
              </div>
            )}
          </div>
          </div>
          </div>
        </>
      )}

      {tab === 'compartir' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Compartir pedidos por mail</h2>
            <p className="text-sm text-slate-500">Elegí cómo se abre el correo al compartir un pedido. Si dejás "Preguntar cada vez", se mostrará la opción al momento de compartir.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Abrir correo con</label>
              <select
                value={mailPref}
                onChange={e => handleMailPrefChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="">Preguntar cada vez</option>
                <option value="mailto">Outlook (mailto)</option>
                <option value="gmail">Navegador (Gmail)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Compartir pedidos por WhatsApp</h2>
            <p className="text-sm text-slate-500">Elegí cómo se abre WhatsApp al compartir un pedido. Si dejás "Preguntar cada vez", se mostrará la opción al momento de compartir.</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Abrir WhatsApp con</label>
              <select
                value={whatsappPref}
                onChange={e => handleWhatsAppPrefChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="">Preguntar cada vez</option>
                <option value="desktop">Escritorio (WhatsApp Desktop)</option>
                <option value="web">Navegador (WhatsApp Web)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === 'margenes' && canManageUsers && <MargenesTab notifyError={notifyError} />}

      {tab === 'stock' && canManageUsers && <StockTab notifyError={notifyError} />}
    </div>
  )
}
