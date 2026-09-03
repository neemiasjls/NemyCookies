import { useEffect, useState } from 'react'
import {
  getAdminOrders, updateOrderStatus,
  getAdminProducts, updateProductStock, adjustProductStock, excluirPedido,
} from '../../api/api'
import { OrderResponse, OrderStatus, Product } from '../../types'
import OrderStatusBadge from '../../components/OrderStatusBadge'
import Caderneta from './Caderneta'
import Clientes from './Clientes'
import Historico from './Historico'
import PedidoManual from './PedidoManual'
import Vendas from './Vendas'
import Custos from './Custos'
import Compras from './Compras'
import { useNavigate } from 'react-router-dom'
import {
  RefreshCw, LogOut, Info, MapPin, FileText, QrCode, CreditCard, Banknote,
  Truck, Store, Plus, Minus, ShoppingBag, Package, Wallet, History, Users, Inbox,
  TrendingUp, Calculator, ShoppingCart, Trash2,
} from 'lucide-react'
import ThemeToggle from '../../components/ThemeToggle'

/* A acao final ("entregue") e neutra de proposito: nao disputa atencao
   com as acoes que ainda exigem decisao. */
const STATUS_ACTIONS: Record<OrderStatus, { next: OrderStatus; label: string; color: string }[]> = {
  PENDING:   [
    { next: 'PREPARING', label: 'Iniciar preparo', color: 'bg-info-solid hover:bg-info-solid/85 text-white' },
    { next: 'CANCELLED', label: 'Cancelar', color: 'bg-danger-bg text-danger border border-danger-line hover:border-danger' },
  ],
  PREPARING: [{ next: 'READY', label: 'Marcar pronto', color: 'bg-success-solid hover:bg-success-solid/85 text-white' }],
  READY:     [{ next: 'DELIVERED', label: 'Marcar entregue', color: 'bg-surface-2 text-ink border border-line hover:border-ink-4' }],
  DELIVERED: [],
  CANCELLED: [],
}

type Tab = 'orders' | 'stock' | 'caderneta' | 'clientes' | 'historico'
  | 'vendas' | 'custos' | 'compras'

/* Dois grupos: em cima a Orvalho e os clientes dela (o controle do dia a dia),
   embaixo o resto do negocio. */
const ABAS: { id: Tab; label: string; Icon: typeof ShoppingBag; grupo: 1 | 2 }[] = [
  { id: 'caderneta', label: 'Orvalho',   Icon: Wallet,       grupo: 1 },
  { id: 'clientes',  label: 'Clientes',  Icon: Users,        grupo: 1 },
  { id: 'orders',    label: 'Pedidos',   Icon: ShoppingBag,  grupo: 2 },
  { id: 'stock',     label: 'Estoque',   Icon: Package,      grupo: 2 },
  { id: 'vendas',    label: 'Vendas',    Icon: TrendingUp,   grupo: 2 },
  { id: 'custos',    label: 'Precificação', Icon: Calculator, grupo: 2 },
  { id: 'compras',   label: 'Compras/Gastos', Icon: ShoppingCart, grupo: 2 },
  { id: 'historico', label: 'Histórico', Icon: History,      grupo: 2 },
]
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

  /** Apaga o pedido. O banco devolve o estoque so quando o pedido ainda valia. */
  const handleDeleteOrder = async (id: number, nome: string, total: number) => {
    const valor = `R$ ${total.toFixed(2).replace('.', ',')}`
    if (!confirm(`Excluir o pedido #${id} de ${nome} (${valor})?

Isso apaga de vez, nao da para desfazer.`)) return
    try {
      const r = await excluirPedido(id)
      setOrders((prev) => prev.filter((o) => o.id !== id))
      setRecarregarProducao((n) => n + 1)
      if (r?.estoque_devolvido) alert('Pedido excluido. As unidades voltaram para o estoque.')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Nao deu para excluir')
    }
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
    approved: { label: 'Pago', color: 'text-success' },
    pending:  { label: 'Aguardando', color: 'text-warn' },
    rejected: { label: 'Recusado', color: 'text-danger' },
    cash:     { label: 'Na retirada', color: 'text-info' },
  }

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-shell text-shell-ink border-b border-shell-line px-3 sm:px-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/logo.png" alt="" className="h-9 w-9 rounded-full object-contain flex-shrink-0 ring-1 ring-white/10" />
            <div className="min-w-0 leading-tight">
              <h1 className="font-display font-bold text-[15px] sm:text-base truncate">NemyCookies</h1>
              <p className="text-shell-2 text-[11px] tracking-wide">Painel</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {pendingCount > 0 && (
              <span className="bg-gold text-shell text-[11px] font-bold px-2 py-1 rounded-full mr-1 tabular-nums">
                {pendingCount}
                <span className="hidden sm:inline"> pendente{pendingCount > 1 ? 's' : ''}</span>
              </span>
            )}
            <ThemeToggle variant="shell" />
            <button onClick={loadData} title="Atualizar" aria-label="Atualizar"
              className="text-shell-2 hover:text-shell-ink hover:bg-white/10 w-9 h-9 sm:w-auto sm:px-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5">
              <RefreshCw size={15} className={loading ? 'animate-spin' : undefined} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button onClick={handleLogout} title="Sair" aria-label="Sair"
              className="text-shell-2 hover:text-shell-ink hover:bg-white/10 w-9 h-9 sm:w-auto sm:px-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5">
              <LogOut size={15} /> <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Tabs */}
        {/* Abas em dois grupos: em cima o controle da Orvalho, embaixo o negocio */}
        <div className="mb-5 space-y-2">
          {([1, 2] as const).map((grupo) => (
            <nav key={grupo}
              aria-label={grupo === 1 ? 'Orvalho' : 'Negócio'}
              className={`flex flex-wrap gap-1.5 ${grupo === 2 ? 'pt-2.5 border-t border-line-soft' : ''}`}>
              {ABAS.filter((a) => a.grupo === grupo).map(({ id, label, Icon }) => {
                const ativa = tab === id
                return (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    aria-current={ativa ? 'page' : undefined}
                    className={`inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-full text-[13px] font-semibold transition-colors ${
                      ativa
                        ? 'bg-brand text-brand-ink shadow-card'
                        : 'text-ink-2 hover:text-brand hover:bg-brand-soft'
                    }`}
                  >
                    <Icon size={15} className={ativa ? undefined : 'text-ink-3'} />
                    {label}
                    {id === 'orders' && pendingCount > 0 && (
                      <span
                        className={`text-[11px] font-bold px-1.5 rounded-full tabular-nums ${
                          ativa ? 'bg-black/15 text-brand-ink' : 'bg-gold text-shell'
                        }`}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          ))}
        </div>
        {/* ── ABA CADERNETA (fiado) ── */}
        {tab === 'caderneta' && <Caderneta products={products} />}

        {/* ── ABA CLIENTES ── */}
        {tab === 'clientes' && <Clientes />}

        {/* ── ABA HISTORICO ── */}
        {tab === 'historico' && <Historico />}

        {/* ── ABAS DO SISTEMA DA PLANILHA ── */}
        {tab === 'vendas'  && <Vendas />}
        {tab === 'custos'  && <Custos />}
        {tab === 'compras' && <Compras />}

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
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filter === s ? 'bg-brand text-brand-ink border-brand' : 'bg-surface text-ink-2 border-line hover:border-brand'}`}
                  >
                    {labels[s]}
                  </button>
                )
              })}
            </div>

            {loading ? (
              <div className="space-y-3" aria-busy="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bg-surface rounded-2xl border border-line p-4 shadow-card">
                    <div className="animate-pulse space-y-3">
                      <div className="flex justify-between gap-4">
                        <div className="h-3.5 w-32 rounded bg-line" />
                        <div className="h-3.5 w-16 rounded bg-line" />
                      </div>
                      <div className="h-2.5 w-44 rounded bg-line-soft" />
                      <div className="h-14 rounded-xl bg-line-soft" />
                    </div>
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-line py-12 px-6 text-center shadow-card">
                <div className="w-12 h-12 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mx-auto mb-3">
                  <Inbox size={22} />
                </div>
                <p className="font-display font-bold text-ink">Nenhum pedido por aqui</p>
                <p className="text-sm text-ink-2 mt-1 max-w-xs mx-auto">
                  {filter === 'ALL'
                    ? 'Os pedidos do site aparecem aqui assim que chegam. Você também pode anotar um pedido acima.'
                    : 'Nenhum pedido com esse status. Tente outro filtro.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const ps = paymentStatusLabel[order.paymentStatus] ?? { label: order.paymentStatus, color: 'text-ink-2' }
                  return (
                    <div key={order.id} className="bg-surface rounded-2xl border border-line p-3.5 sm:p-4 shadow-card transition-shadow hover:shadow-card-hover">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-ink">Pedido #{order.id}</span>
                            <OrderStatusBadge status={order.status} />
                            {order.source === 'manual' ? (
                              <span className="text-[11px] font-bold text-accent bg-accent-bg px-2 py-0.5 rounded-full">
                                ANOTADO
                              </span>
                            ) : (
                              <span className={`text-xs font-semibold ${ps.color}`}>{ps.label}</span>
                            )}
                          </div>
                          <p className="text-sm text-ink-2 mt-0.5">
                            {order.customerName}
                            {order.customerPhone ? ` · ${order.customerPhone}` : ''}
                          </p>
                          <p className="text-xs text-ink-3">
                            {new Date(order.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-brand text-base whitespace-nowrap">
                            R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                          </p>
                          {order.paymentMethod && (
                            <p className="text-xs text-ink-3">{paymentLabel[order.paymentMethod]}</p>
                          )}
                          {order.paymentMethod === 'CASH' && order.changeAmount && (
                            <p className="text-xs text-success">
                              Troco p/ R$ {order.changeAmount.toFixed(2).replace('.', ',')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="bg-surface-2 rounded-xl p-3 mb-3 space-y-1.5 border border-line-soft">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-ink-2">{item.quantity}× {item.productName}</span>
                            <span className="text-ink font-medium">
                              R$ {item.subtotal.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.deliveryMethod === 'DELIVERY' ? (
                        <p className="text-xs font-semibold text-brand mb-1 flex items-center gap-1">
                          <Truck size={12} className="flex-shrink-0" />
                          Entrega{order.deliveryFee && order.deliveryFee > 0
                            ? ` · taxa R$ ${order.deliveryFee.toFixed(2).replace('.', ',')}`
                            : ' · frete grátis'}
                        </p>
                      ) : (
                        <p className="text-xs font-semibold text-ink-2 mb-1 flex items-center gap-1">
                          <Store size={12} className="flex-shrink-0" /> Retirada no local
                        </p>
                      )}
                      {order.address && (
                        <p className="text-xs text-info mb-1 flex items-center gap-1">
                          <MapPin size={12} className="flex-shrink-0" /> {order.address}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-xs text-ink-2 italic mb-3 flex items-center gap-1">
                          <FileText size={12} className="flex-shrink-0" /> {order.notes}
                        </p>
                      )}

                      <div className="flex gap-2 flex-wrap items-center">
                        {STATUS_ACTIONS[order.status]?.map((action) => (
                          <button
                            key={action.next}
                            onClick={() => handleStatusUpdate(order.id, action.next)}
                            className={`text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors ${action.color}`}
                          >
                            {action.label}
                          </button>
                        ))}
                        {/* discreto e no canto: apagar e raro e nao tem volta */}
                        <button
                          onClick={() => handleDeleteOrder(order.id, order.customerName, order.totalAmount)}
                          title={`Excluir o pedido #${order.id}`}
                          aria-label={`Excluir o pedido #${order.id}`}
                          className="ml-auto w-7 h-7 rounded-full text-ink-4 hover:bg-danger-bg hover:text-danger flex items-center justify-center transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
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
            <div className="bg-info-bg rounded-xl p-3 text-sm text-info flex items-start gap-2">
              <Info size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                Aqui você controla quantos cookies de cada sabor estão disponíveis para venda.
                Quando o estoque chega a 0, o produto aparece como <strong>Esgotado</strong> no site automaticamente.
              </span>
            </div>

            {products.map((product) => (
              <div key={product.id} className="bg-surface rounded-2xl border border-line p-4 shadow-card">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Produto */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-ink truncate">{product.name}</p>
                      <p className="text-sm text-brand">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                        {product.stock === 0 && (
                          <span className="ml-2 text-xs text-danger font-semibold">Esgotado</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* -1 / valor / +1 */}
                  <div className="flex items-center justify-center gap-1 flex-shrink-0 w-fit mx-auto sm:mx-0 rounded-2xl border border-line bg-surface-2 p-1">
                    <button
                      onClick={() => handleAdjust(product.id, -1)}
                      disabled={product.stock === 0 || busy === product.id}
                      className="w-10 h-10 rounded-xl text-danger hover:bg-danger-bg flex items-center justify-center transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                      aria-label={`Tirar 1 de ${product.name}`}
                    >
                      <Minus size={18} strokeWidth={2.5} />
                    </button>

                    <div className="w-16 text-center">
                      <p className={`text-2xl font-bold tabular-nums leading-none ${
                        product.stock === 0 ? 'text-danger' : product.stock <= 5 ? 'text-warn' : 'text-success'
                      }`}>
                        {product.stock}
                      </p>
                      <p className="text-[10px] text-ink-3 mt-1 whitespace-nowrap uppercase tracking-wide">em estoque</p>
                    </div>

                    <button
                      onClick={() => handleAdjust(product.id, 1)}
                      disabled={busy === product.id}
                      className="w-10 h-10 rounded-xl text-success hover:bg-success-bg flex items-center justify-center transition-colors disabled:opacity-25"
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
                      className="no-spinner flex-1 sm:flex-none sm:w-20 min-w-0 border border-line rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-brand"
                    />
                    <button
                      onClick={() => handleSetStock(product.id)}
                      disabled={busy === product.id}
                      className="border border-line bg-surface text-ink text-xs font-bold px-3.5 py-2.5 rounded-lg transition-colors hover:border-brand hover:text-brand disabled:opacity-50 flex-shrink-0"
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
