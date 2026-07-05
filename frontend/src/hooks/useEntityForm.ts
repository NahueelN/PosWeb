import { useState, useCallback } from 'react'

interface UseEntityFormOptions<TForm> {
  emptyForm: TForm
}

interface UseEntityFormReturn<TForm, TItem> {
  showForm: boolean
  editingId: number | null
  form: TForm
  saving: boolean
  openCreate: () => void
  openEdit: (item: TItem, mapFn: (item: TItem) => TForm) => void
  closeForm: (onClosed?: () => void) => void
  setForm: (form: TForm) => void
  setSaving: (saving: boolean) => void
}

export function useEntityForm<TForm, TItem = any>({ emptyForm }: UseEntityFormOptions<TForm>): UseEntityFormReturn<TForm, TItem> {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<TForm>({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const openCreate = useCallback(() => {
    setForm({ ...emptyForm })
    setEditingId(null)
    setShowForm(true)
  }, [emptyForm])

  const openEdit = useCallback((item: TItem, mapFn: (item: TItem) => TForm) => {
    setForm(mapFn(item))
    setEditingId((item as any).id ?? null)
    setShowForm(true)
  }, [])

  const closeForm = useCallback((onClosed?: () => void) => {
    setShowForm(false)
    setEditingId(null)
    onClosed?.()
  }, [])

  return { showForm, editingId, form, saving, openCreate, openEdit, closeForm, setForm, setSaving }
}
