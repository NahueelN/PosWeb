import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import type { VentaResultadoDto, UsuarioInfo } from '../../types'
import type { TicketData } from '../../lib/ticket'
import TicketModal from '../../components/ticket/TicketModal'

interface ItemEmitido {
  producto: { id: number; nombre: string; precio: number }
  cantidad: number
}

interface TicketResultadoProps {
  resultado: VentaResultadoDto
  ultimosItems: ItemEmitido[]
  user: UsuarioInfo | null
  onNuevaVenta: () => void
}

export default function TicketResultado({ resultado, ultimosItems, user, onNuevaVenta }: TicketResultadoProps) {
  const [empresa, setEmpresa] = useState<{
    direccion?: string
    documento?: string
    telefono?: string
    mostrarTelefonoTicket?: boolean
  }>({})

  useEffect(() => {
    api.empresas.obtener()
      .then(e => setEmpresa({
        direccion: e.direccion,
        documento: e.documento,
        telefono: e.telefono,
        mostrarTelefonoTicket: e.mostrarTelefonoTicket,
      }))
      .catch(() => {})
  }, [])

  const data: TicketData = {
    empresaNombre: resultado.empresaNombre,
    empresaDireccion: empresa.direccion ?? resultado.empresaDireccion,
    empresaDocumento: empresa.documento ?? resultado.empresaDocumento,
    empresaTelefono: empresa.telefono ?? resultado.empresaTelefono,
    mostrarTelefonoTicket: empresa.mostrarTelefonoTicket ?? resultado.mostrarTelefonoTicket,
    ventaId: resultado.ventaId,
    fecha: resultado.fecha,
    vendedor: user?.nombre,
    items: ultimosItems.map(i => ({ nombre: i.producto.nombre, cantidad: i.cantidad, precio: i.producto.precio })),
    total: resultado.total,
    pagos: resultado.pagos.map(p => ({ nombre: p.medioPagoNombre, monto: p.monto })),
    cambio: resultado.cambio,
  }

  return (
    <TicketModal
      data={data}
      title="Ticket de venta"
      onClose={onNuevaVenta}
    />
  )
}
