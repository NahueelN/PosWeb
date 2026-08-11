import { useEffect, useRef, useState } from 'react'
import Dialog from './ui/Dialog'
import Button from './ui/Button'
import { Power } from 'lucide-react'

function isTauri(): boolean {
  const w = window as unknown as { __TAURI_INTERNALS__?: unknown; __TAURI__?: unknown }
  return !!(w.__TAURI_INTERNALS__ || w.__TAURI__)
}

export default function CloseConfirm() {
  const [open, setOpen] = useState(false)
  const confirmedRef = useRef(false)

  useEffect(() => {
    if (!isTauri()) return
    let unlisten: (() => void) | undefined
    let disposed = false

    import('@tauri-apps/api/event')
      .then(async ({ listen }) => {
        if (disposed) return
        const un = await listen('app-close-requested', () => {
          if (!disposed) setOpen(true)
        })
        if (disposed) un()
        else unlisten = un
      })
      .catch(() => {
        console.log('[CloseConfirm] Tauri event API not available (browser mode)')
      })

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [])

  const confirmClose = async () => {
    confirmedRef.current = true
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('confirm_exit')
    } catch (e) {
      console.error('[CloseConfirm] Failed to confirm exit:', e)
      setOpen(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      title="Cerrar aplicación"
      icon={<Power size={18} />}
      width="sm"
      closeOnBackdrop={false}
      footer={
        <>
          <Button variant="secondary" onClick={() => setOpen(false)} autoFocus>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmClose}>
            Cerrar
          </Button>
        </>
      }
    >
      <p className="text-base font-semibold text-gray-900">¿Desea cerrar PosWeb?</p>
    </Dialog>
  )
}
