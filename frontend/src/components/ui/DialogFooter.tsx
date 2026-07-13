import Button from './Button'

interface DialogFooterProps {
  onCancel: () => void
  onConfirm: () => void
  confirmText?: string
  cancelText?: string
  confirmDisabled?: boolean
  confirmLoading?: boolean
}

export default function DialogFooter({
  onCancel,
  onConfirm,
  confirmText = 'Guardar',
  cancelText = 'Cancelar',
  confirmDisabled = false,
  confirmLoading = false,
}: DialogFooterProps) {
  return (
    <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0">
      <Button variant="secondary" size="md" className="min-w-[128px]" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button variant="primary" size="md" className="min-w-[128px]" onClick={onConfirm} disabled={confirmDisabled} loading={confirmLoading}>
        {confirmText}
      </Button>
    </footer>
  )
}
