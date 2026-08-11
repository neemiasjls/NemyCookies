import { useEffect, useState } from 'react'
import {
  getAdminOrders, updateOrderStatus,
  getAdminProducts, updateProductStock, adjustProductStock,
} from '../../api/api'
import { OrderResponse, OrderStatus, Product } from '../../types'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import Caderneta from './Caderneta'
import Clientes from './Clientes'
import PedidoManual from './PedidoManual'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, LogOut, Info, MapPin, FileText, QrCode, CreditCard, Banknote, Truck, Store, Plus, Minus } from 'lucide-react'

const STATUS_ACTIONS: Record<OrderStatus, { next: OrderStatus; label: string; color: string }[]> = {
  PENDING:   [
    { next: 'PREPARING', label: 'Iniciar preparo', color: 'bg-blue-500 hover:bg-blue-600' },
    { next: 'CANCELLED', label: 'Cancelar', color: 'bg-red-500 hover:bg-red-600' },
  ],
  PREPARING: [{ next: 'READY', label: 'Marcar pronto', color: 'bg-green-500 hover:bg-green-600' }],
  READY:     [{ next: 'DELIVERED', label: 'Marcar entregue', color: 'bg-gray-500 hover:bg-gray-600' }],
  DELIVERED: [],
  CANCELLED: [],
}

type Tab = 'orders' | 'stock' | 'caderneta' | 'clientes'
type FilterStatus = 'ALL' | OrderStatus

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [filter, setFilter] = useState<FilterStatus>('ALL')
  const [tab, setTab] = useState<Tab>('orders')
  const [loading, setLoading] = useState(true)
  const [stockInputs, setStockInputs] = useState<Record<number, string>>({})
  const [busy, setBusy] = useState<number | null>(null)
  const [recarregarProducao, setRecarregarProducao] = useState(0)
  const navigate = useNavigate()

  const loadData = async () => {
    setLoading(true)
    try {
      const [ordersData, productsData] = await Promise.all([
        getAdminOrders(filter === 'ALL' ? undefined : filter),
        getAdminProducts(),
      ])
      setOrders(ordersData)
      setProducts(productsData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [filter])

  const handleStatusUpdate = async (id: number, status: OrderStatus) => {
    const updated = await updateOrderStatus(id, status)
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    setRecarregarProducao((n) => n + 1)   // o resumo do que assar muda junto
  }

  const handleSetStock = async (id: number) => {
    const val = parseInt(stockInputs[id] ?? '')
    if (isNaN(val) || val < 0) return
    setBusy(id)
    try {
      const updated = await updateProductStock(id, val)
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      setStockInputs((prev) => ({ ...prev, [id]: '' }))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao definir estoque')
    } finally {
      setBusy(null)
    }
  }

  /** Botoes - e + (soma/subtrai 1 unidade) */
  const handleAdjust = async (id: number, delta: number) => {
    setBusy(id)
    try {
      const updated = await adjustProductStock(id, delta)
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao ajustar estoque')
    } finally {
      setBusy(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    navigate('/admin')
  }

  const paymentLabel: Record<string, JSX.Element> = {
    PIX:  <span className="inline-flex items-center gap-1"><QrCode size={12} /> Pix</span>,
    CARD: <span className="inline-flex items-center gap-1"><CreditCard size={12} /> Cartão</span>,
    CASH: <span className="inline-flex items-center gap-1"><Banknote size={12} /> Dinheiro</span>,
  }

  const paymentStatusLabel: Record<string, { label: string; color: string }> = {
    approved: { label: 'Pago', color: 'text-green-600' },
    pending:  { label: 'Aguardando', color: 'text-yellow-600' },
    rejected: { label: 'Recusado', color: 'text-red-600' },
    cash:     { label: 'Na retirada', color: 'text-blue-600' },
  }

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-cookie-dark text-white px-3 sm:px-4 py-3 sm:py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="NemyCookies" className="h-8 w-8 sm:h-9 sm:w-9 object-contain flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold text-base sm:text-lg leading-tight truncate">NemyCookies</h1>
              <p className="text-orange-300 text-[11px] sm:text-xs">Painel Admin</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {pendingCount > 0 && (
              <span className="bg-yellow-400 text-yellow-900 text-[11px] font-bold px-2 py-1 rounded-full mr-1">
                {pendingCount}
                <span className="hidden sm:inline"> pendente{pendingCount > 1 ? 's' : ''}</span>
              </span>
            )}
            <button onClick={loadData} title="Atualizar" aria-label="Atualizar"
              className="text-orange-300 hover:text-white hover:bg-white/10 w-9 h-9 sm:w-auto sm:px-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5">
              <RefreshCw size={15} /> <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button onClick={handleLogout} title="Sair" aria-label="Sair"
              className="text-orange-300 hover:text-white hover:bg-white/10 w-9 h-9 sm:w-auto sm:px-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5">
              <LogOut size={15} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setTab('orders')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[13px] sm:text-sm font-semibold transition-colors ${tab === 'orders' ? 'bg-cookie-brown text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-cookie-brown'}`}
          >
            Pedidos {pendingCount > 0 && <span className="ml-1 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
          <button
            onClick={() => setTab('stock')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[13px] sm:text-sm font-semibold transition-colors ${tab === 'stock' ? 'bg-cookie-brown text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-cookie-brown'}`}
          >
            Estoque
          </button>
          <button
            onClick={() => setTab('caderneta')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[13px] sm:text-sm font-semibold transition-colors ${tab === 'caderneta' ? 'bg-cookie-brown text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-cookie-brown'}`}
          >
            Caderneta
          </button>
          <button
            onClick={() => setTab('clientes')}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[13px] sm:text-sm font-semibold transition-colors ${tab === 'clientes' ? 'bg-cookie-brown text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-cookie-brown'}`}
          >
            Clientes
          </button>
        </div>

        {/* ── ABA CADERNETA (fiado) ── */}
        {tab === 'caderneta' && <Caderneta products={products} />}

        {/* ── ABA CLIENTES ── */}
        {tab === 'clientes' && <Clientes />}

        {/* ── ABA PEDIDOS ── */}
        {tab === 'orders' && (
          <>
            <PedidoManual
              products={products}
              onCriado={loadData}
              recarregar={recarregarProducao}
            />

            <div className="flex gap-2 flex-wrap mb-4">
              {(['ALL', 'PENDING', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'] as FilterStatus[]).map((s) => {
                const labels: Record<FilterStatus, string> = {
                  ALL: 'Todos', PENDING: 'Pendentes', PREPARING: 'Preparando',
                  READY: 'Prontos', DELIVERED: 'Entregues', CANCELLED: 'Cancelados',
                }
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === s ? 'bg-cookie-brown text-white border-cookie-brown' : 'bg-white text-gray-500 border-gray-200 hover:border-cookie-brown'}`}
                  >
                    {labels[s]}
                  </button>
                )
              })}
            </div>

            {loading ? (
              <div className="text-center py-10 text-gray-400">Carregando...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10 text-gray-400">Nenhum pedido encontrado</div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const ps = paymentStatusLabel[order.paymentStatus] ?? { label: order.paymentStatus, color: 'text-gray-500' }
                  return (
                    <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-cookie-dark">Pedido #{order.id}</span>
                            <OrderStatusBadge status={order.status} />
                            {order.source === 'manual' ? (
                              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                                ANOTADO
                              </span>
                            ) : (
                              <span className={`text-xs font-semibold ${ps.color}`}>{ps.label}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {order.customerName}
                            {order.customerPhone ? ` · ${order.customerPhone}` : ''}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-cookie-brown text-base whitespace-nowrap">
                            R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                          </p>
                          {order.paymentMethod && (
                            <p className="text-xs text-gray-400">{paymentLabel[order.paymentMethod]}</p>
                          )}
                          {order.paymentMethod === 'CASH' && order.changeAmount && (
                            <p className="text-xs text-green-600">
                              Troco p/ R$ {order.changeAmount.toFixed(2).replace('.', ',')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-orange-50 rounded-lg p-3 mb-3 space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-600">{item.quantity}× {item.productName}</span>
                            <span className="text-cookie-dark font-medium">
                              R$ {item.subtotal.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.deliveryMethod === 'DELIVERY' ? (
                        <p className="text-xs font-semibold text-orange-600 mb-1 flex items-center gap-1">
                          <Truck size={12} className="flex-shrink-0" />
                          Entrega{order.deliveryFee && order.deliveryFee > 0
                            ? ` · taxa R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}`
                            : ' · frete grátis'}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                          <Store size={12} className="flex-shrink-0" /> Retirada no local
                        </p>
                      )}
                      {order.address && (
                        <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                          <MapPin size={12} className="flex-shrink-0" /> {order.address}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-xs text-gray-500 italic mb-3 flex items-center gap-1">
                          <FileText size={12} className="flex-shrink-0" /> {order.notes}
                        </p>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {STATUS_ACTIONS[order.status]?.map((action) => (
                          <button
                            key={action.next}
                            onClick={() => handleStatusUpdate(order.id, action.next)}
                            className={`text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors ${action.color}`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── ABA ESTOQUE ── */}
        {tab === 'stock' && (
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 flex items-start gap-2">
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                Aqui você controla quantos cookies de cada sabor estão disponíveis para venda.
                Quando o estoque chega a 0, o produto aparece como <strong>Esgotado</strong> no site automaticamente.
              </span>
            </div>

            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Produto */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-cookie-dark truncate">{product.name}</p>
                      <p className="text-sm text-cookie-brown">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                        {product.stock === 0 && (
                          <span className="ml-2 text-xs text-red-500 font-semibold">Esgotado</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* -1 / valor / +1 */}
                  <div className="flex items-center justify-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAdjust(product.id, -1)}
                      disabled={product.stock === 0 || busy === product.id}
                      className="w-10 h-10 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={`Tirar 1 de ${product.name}`}
                    >
                      <Minus size={18} strokeWidth={2.5} />
                    </button>

                    <div className="w-14 text-center">
                      <p className={`text-2xl font-bold tabular-nums leading-none ${
                        product.stock === 0 ? 'text-red-500' : product.stock <= 5 ? 'text-yellow-500' : 'text-green-600'
                      }`}>
                        {product.stock}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">em estoque</p>
                    </div>

                    <button
                      onClick={() => handleAdjust(product.id, 1)}
                      disabled={busy === product.id}
                      className="w-10 h-10 rounded-full bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition-colors disabled:opacity-30"
                      aria-label={`Adicionar 1 de ${product.name}`}
                    >
                      <Plus size={18} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Definir valor exato */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <input
                      type="number"
                      min="0"
                      placeholder="Definir"
                      value={stockInputs[product.id] ?? ''}
                      onChange={(e) => setStockInputs((prev) => ({ ...prev, [product.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSetStock(product.id) }}
                      className="no-spinner flex-1 sm:flex-none sm:w-20 min-w-0 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-cookie-brown"
                    />
                    <button
                      onClick={() => handleSetStock(product.id)}
                      disabled={busy === product.id}
                      className="bg-cookie-brown hover:bg-cookie-dark text-white text-xs font-bold px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
