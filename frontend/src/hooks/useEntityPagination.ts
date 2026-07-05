import { useState, useCallback } from 'react'

interface UseEntityPaginationReturn {
  page: number
  totalPages: number
  setPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
}

export function useEntityPagination(totalPages: number): UseEntityPaginationReturn {
  const [page, setPage] = useState(1)

  const nextPage = useCallback(() => {
    setPage(p => Math.min(p + 1, totalPages))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1))
  }, [])

  return { page, totalPages, setPage, nextPage, prevPage }
}
