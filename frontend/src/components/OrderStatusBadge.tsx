import { OrderStatus } from '../types'

const CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  PENDING:   { label: 'Pendente',    color: 'bg-yellow-100 text-yellow-800' },
  PREPARING: { label: 'Preparando',  color: 'bg-blue-100 text-blue-800' },
  READY:     { label: 'Pronto',      color: 'bg-green-100 text-green-800' },
  DELIVERED: { label: 'Entregue',    color: 'bg-gray-100 text-gray-600' },
  CANCELLED: { label: 'Cancelado',   color: 'bg-red-100 text-red-700' },
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, color } = CONFIG[status]
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>
      {label}
    </span>
  )
}
