import { OrderStatus } from '../types'

const CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  PENDING:   { label: 'Pendente',    color: 'bg-warn-bg text-warn' },
  PREPARING: { label: 'Preparando',  color: 'bg-info-bg text-info' },
  READY:     { label: 'Pronto',      color: 'bg-success-bg text-success' },
  DELIVERED: { label: 'Entregue',    color: 'bg-surface-2 text-ink-2' },
  CANCELLED: { label: 'Cancelado',   color: 'bg-danger-bg text-danger' },
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, color } = CONFIG[status]
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>
      {label}
    </span>
  )
}
