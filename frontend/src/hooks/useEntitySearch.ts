import { useState, useEffect } from 'react'

interface UseEntitySearchOptions {
  debounceMs?: number
}

interface UseEntitySearchReturn {
  search: string
  setSearch: (value: string) => void
  debouncedSearch: string
}

export function useEntitySearch({ debounceMs = 300 }: UseEntitySearchOptions = {}): UseEntitySearchReturn {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), debounceMs)
    return () => clearTimeout(timer)
  }, [search, debounceMs])

  return { search, setSearch, debouncedSearch }
}
