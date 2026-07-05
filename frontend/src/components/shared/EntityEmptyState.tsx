interface EntityEmptyStateProps {
  hasSearch: boolean
  emptyMessage?: string
  searchMessage?: string
}

export default function EntityEmptyState({
  hasSearch,
  emptyMessage = 'No hay elementos',
  searchMessage = 'Sin resultados',
}: EntityEmptyStateProps) {
  return (
    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
      <p className="text-gray-400 text-sm">{hasSearch ? searchMessage : emptyMessage}</p>
    </div>
  )
}
