import { useState, useCallback } from 'react'

interface UseEntityListOptions<T, TParams = void> {
  fetchFn: (params: TParams) => Promise<T[] | { items: T[]; totalCount: number; totalPages: number }>
}

interface UseEntityListReturn<T, TParams = void> {
  data: T[]
  totalCount: number
  totalPages: number
  loading: boolean
  error: string
  load: (params: TParams) => Promise<void>
  clearError: () => void
}

export function useEntityList<T, TParams = void>({ fetchFn }: UseEntityListOptions<T, TParams>): UseEntityListReturn<T, TParams> {
  const [data, setData] = useState<T[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (params: TParams) => {
    setLoading(true)
    setError('')
    try {
      const result = await fetchFn(params)
      if (Array.isArray(result)) {
        setData(result)
        setTotalCount(result.length)
        setTotalPages(0)
      } else {
        setData(result.items)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  const clearError = useCallback(() => setError(''), [])

  return { data, totalCount, totalPages, loading, error, load, clearError }
}
