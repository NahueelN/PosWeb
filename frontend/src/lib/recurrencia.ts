export const DIAS = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'] as const

export function estaVigenteHoy(
  fechaInicio: string | null | undefined,
  fechaFin: string | null | undefined,
  diasSemana: string | null | undefined,
  activo: boolean
): boolean {
  if (!activo) return false
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  if (fechaInicio && hoy < new Date(fechaInicio)) return false
  if (fechaFin && hoy > new Date(fechaFin)) return false
  if (diasSemana && diasSemana.trim()) {
    const diaActual = DIAS[hoy.getDay()]
    const diasOferta = diasSemana.split(',').map(d => d.trim().toUpperCase())
    if (!diasOferta.includes(diaActual)) return false
  }
  return true
}
