import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

type Variant = 'error' | 'success' | 'info'

interface PendingNotification {
  variant: Variant
  message: string
}

interface NotificationContextValue {
  current: PendingNotification | null
  hasNext: boolean
  notifyError: (message: string) => void
  notifySuccess: (message: string) => void
  notifyInfo: (message: string) => void
  dismiss: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<PendingNotification | null>(null)
  const [queue, setQueue] = useState<PendingNotification[]>([])

  const add = useCallback((variant: Variant, message: string) => {
    const item: PendingNotification = { variant, message }
    setQueue(prev => [...prev, item])
    setCurrent(prev => prev ?? item)
  }, [])

  const dismiss = useCallback(() => {
    setQueue(prev => {
      const next = prev.slice(1)
      setCurrent(next.length > 0 ? next[0] : null)
      return next
    })
  }, [])

  const notifyError = useCallback((message: string) => add('error', message), [add])
  const notifySuccess = useCallback((message: string) => add('success', message), [add])
  const notifyInfo = useCallback((message: string) => add('info', message), [add])

  return (
    <NotificationContext.Provider value={{
      current,
      hasNext: queue.length > 1,
      notifyError, notifySuccess, notifyInfo, dismiss,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return ctx
}
