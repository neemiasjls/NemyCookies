import {
  OrderResponse, OrderStatus, Product, Category,
  PixPaymentCreatedResponse, TabSale, TabSummaryRow, TabCustomer, ProductionSummary,
  AuditEntry,
} from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const REST = `${SUPABASE_URL}/rest/v1`
const FN = `${SUPABASE_URL}/functions/v1`

const baseHeaders = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_KEY,
}

/**
 * Chamada publica (cardapio e checkout).
 * IMPORTANTE: usa a chave anon do Supabase. Nunca envie aqui o token do admin —
 * ele nao e um JWT do Supabase e o banco recusaria com "No suitable key or wrong key type".
 */
async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  return send<T>(url, init, `Bearer ${SUPABASE_KEY}`)
}

/** Chamada autenticada do painel admin (Edge Function /admin). */
async function requestAdmin<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('admin_token')
  return send<T>(url, init, token ? `Bearer ${token}` : `Bearer ${SUPABASE_KEY}`)
}

async function send<T>(url: string, init: RequestInit, authorization: string): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...baseHeaders,
      Authorization: authorization,
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error(data?.error ?? data?.message ?? 'Erro na requisicao')
  return data as T
}

// ── Conversao snake_case (Postgres) -> camelCase (app) ──
/* eslint-disable @typescript-eslint/no-explicit-any */
const toProduct = (p: any): Product => ({
  id: p.id,
  name: p.name,
  description: p.description ?? '',
  price: Number(p.price),
  imageUrl: p.image_url ?? undefined,
  weight: p.weight ?? undefined,
  available: p.available,
  stock: p.stock,
  category: p.category
    ? { id: p.category.id, name: p.category.name, description: p.category.description ?? '', displayOrder: p.category.display_order }
    : { id: p.category_id, name: '', description: '', displayOrder: 1 },
})

const toOrder = (o: any): OrderResponse => ({
  id: o.id,
  customerName: o.customer_name,
  customerPhone: o.customer_phone,
  customerEmail: o.customer_email ?? undefined,
  paymentMethod: o.payment_method,
  paymentStatus: o.payment_status,
  status: o.status,
  totalAmount: Number(o.total_amount),
  deliveryFee: o.delivery_fee != null ? Number(o.delivery_fee) : undefined,
  deliveryMethod: o.delivery_method,
  changeAmount: o.change_amount != null ? Number(o.change_amount) : undefined,
  notes: o.notes ?? undefined,
  address: o.address ?? undefined,
  source: o.source ?? 'site',
  createdAt: o.created_at,
  items: (o.items ?? []).map((i: any) => ({
    productId: i.productId,
    productName: i.productName,
    quantity: i.quantity,
    unitPrice: Number(i.unitPrice),
    subtotal: Number(i.subtotal),
  })),
})
/* eslint-enable @typescript-eslint/no-explicit-any */

// ── Cardapio (leitura publica direto do Postgres via RLS) ──
export const getProducts = (): Promise<Product[]> =>
  request<unknown[]>(`${REST}/products?select=*,category:categories(*)&order=id.asc`)
    .then((rows) => rows.map(toProduct))

export const getCategories = (): Promise<Category[]> =>
  request<{ id: number; name: string; description: string; display_order: number }[]>(
    `${REST}/categories?select=*&order=display_order.asc`,
  ).then((rows) => rows.map((c) => ({
    id: c.id, name: c.name, description: c.description ?? '', displayOrder: c.display_order,
  })))

// ── Checkout ──
interface AddressFields {
  rua?: string
  numero?: string
  bairro?: string
  cep?: string
  deliveryMethod?: 'PICKUP' | 'DELIVERY'
}

export interface CreatePixPayload extends AddressFields {
  customerName: string
  customerPhone: string
  customerEmail: string
  customerCpf?: string
  notes?: string
  items: { productId: number; quantity: number }[]
}

export interface CreateCardPayload extends CreatePixPayload {
  token: string
  paymentMethodId: string
  installments?: number
  issuerId?: string
}

export interface CreateCashPayload extends AddressFields {
  customerName: string
  customerPhone: string
  notes?: string
  changeAmount?: number
  items: { productId: number; quantity: number }[]
}

const checkout = <T>(body: unknown): Promise<T> =>
  request<T>(`${FN}/checkout`, { method: 'POST', body: JSON.stringify(body) })

export const createPixPayment = (data: CreatePixPayload): Promise<PixPaymentCreatedResponse> =>
  checkout<PixPaymentCreatedResponse>({ ...data, paymentMethod: 'PIX' })

export const createCardPayment = (data: CreateCardPayload): Promise<{ status: string; orderId: number; message: string }> =>
  checkout({ ...data, paymentMethod: 'CARD' })

export const createCashOrder = (data: CreateCashPayload): Promise<OrderResponse> =>
  checkout<{ order: unknown }>({ ...data, paymentMethod: 'CASH' }).then((r) => toOrder(r.order))

export const getPixStatus = (paymentId: number): Promise<{ status: string; externalReference: string }> =>
  request<{ status: string; orderId: number | null }>(`${FN}/payment-status?paymentId=${paymentId}`)
    .then((r) => ({ status: r.status, externalReference: r.orderId ? String(r.orderId) : '' }))

// ── Admin ──
export const adminLogin = (username: string, password: string): Promise<{ token: string }> =>
  request(`${FN}/admin/login`, { method: 'POST', body: JSON.stringify({ username, password }) })

export const getAdminOrders = (status?: OrderStatus): Promise<OrderResponse[]> =>
  requestAdmin<unknown[]>(`${FN}/admin/orders${status ? `?status=${status}` : ''}`)
    .then((rows) => rows.map(toOrder))

/** Pedido anotado manualmente no painel (nao veio do site) */
export const createManualOrder = (data: {
  customerId: number
  items: { productId: number; quantity: number }[]
  notes?: string
}): Promise<OrderResponse> =>
  requestAdmin(`${FN}/admin/orders/manual`, { method: 'POST', body: JSON.stringify(data) })
    .then(toOrder)

/** Quantos cookies de cada sabor precisam ser feitos */
export const getProductionSummary = (): Promise<ProductionSummary> =>
  requestAdmin(`${FN}/admin/orders/production`)

export const updateOrderStatus = (id: number, status: OrderStatus): Promise<OrderResponse> =>
  requestAdmin(`${FN}/admin/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
    .then(toOrder)

export const getAdminProducts = (): Promise<Product[]> =>
  requestAdmin<unknown[]>(`${FN}/admin/products`).then((rows) => rows.map(toProduct))

export const updateProductStock = (id: number, stock: number): Promise<Product> =>
  requestAdmin(`${FN}/admin/products/${id}/stock`, { method: 'PATCH', body: JSON.stringify({ stock }) })
    .then(toProduct)

export const addProductStock = (id: number, quantity: number): Promise<Product> =>
  requestAdmin(`${FN}/admin/products/${id}/stock/add`, { method: 'PATCH', body: JSON.stringify({ quantity }) })
    .then(toProduct)

/** Soma ou subtrai unidades do estoque (botoes + e -) */
export const adjustProductStock = (id: number, delta: number): Promise<Product> =>
  requestAdmin(`${FN}/admin/products/${id}/stock/adjust`, { method: 'PATCH', body: JSON.stringify({ delta }) })
    .then(toProduct)

// ── Caderneta (fiado) ─────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
const toTabSale = (s: any): TabSale => ({
  id: s.id,
  customerId: s.customer_id,
  customerName: s.customer_name,
  soldAt: s.sold_at,
  total: Number(s.total),
  paid: s.paid,
  paidAt: s.paid_at ?? undefined,
  paidAmount: Number(s.paid_amount ?? 0),
  annotated: !!s.annotated,
  annotatedAt: s.annotated_at ?? undefined,
  notes: s.notes ?? undefined,
  items: (s.items ?? []).map((i: any) => ({
    productId: i.productId,
    productName: i.productName,
    quantity: i.quantity,
    unitPrice: Number(i.unitPrice),
    subtotal: Number(i.subtotal),
  })),
})
/* eslint-enable @typescript-eslint/no-explicit-any */

/** open = a receber · to_annotate = pago, falta anotar · annotated = pago e anotado */
export type TabStatus = 'open' | 'to_annotate' | 'annotated' | 'all'

export const getTabSales = (status: TabStatus = 'open'): Promise<TabSale[]> =>
  requestAdmin<unknown[]>(`${FN}/admin/tab${status !== 'all' ? `?status=${status}` : ''}`)
    .then((rows) => rows.map(toTabSale))

export const getTabSummary = (): Promise<TabSummaryRow[]> =>
  requestAdmin<{ customer_id: number; customer_name: string; nickname: string | null; phone: string | null; devendo: string; vendas_abertas: number; total_geral: string; ultima_compra: string; message: string | null }[]>(
    `${FN}/admin/tab/summary`,
  ).then((rows) => rows.map((r) => ({
    customerId: r.customer_id,
    customerName: r.customer_name,
    nickname: r.nickname ?? undefined,
    phone: r.phone ?? undefined,
    devendo: Number(r.devendo),
    vendasAbertas: r.vendas_abertas,
    totalGeral: Number(r.total_geral),
    ultimaCompra: r.ultima_compra,
    message: r.message ?? '',
  })))

// ── Pessoas da caderneta ──
export const getTabCustomers = (): Promise<TabCustomer[]> =>
  requestAdmin<{ id: number; name: string; nickname: string | null; phone: string | null; devendo: string; vendas_abertas: number; ultima_compra: string | null }[]>(
    `${FN}/admin/tab/customers`,
  ).then((rows) => rows.map((r) => ({
    id: r.id,
    name: r.name,
    nickname: r.nickname ?? undefined,
    phone: r.phone ?? undefined,
    devendo: Number(r.devendo),
    vendasAbertas: r.vendas_abertas,
    ultimaCompra: r.ultima_compra ?? undefined,
  })))

export const createTabCustomer = (name: string, nickname?: string, phone?: string): Promise<{ id: number; name: string }> =>
  requestAdmin(`${FN}/admin/tab/customers`, { method: 'POST', body: JSON.stringify({ name, nickname, phone }) })

/** Apelido usado so na mensagem de cobranca. Manda vazio para tirar. */
export const setTabCustomerNickname = (id: number, nickname: string): Promise<{ id: number; name: string }> =>
  requestAdmin(`${FN}/admin/tab/customers/${id}`, { method: 'PATCH', body: JSON.stringify({ nickname }) })

/** Telefone do WhatsApp. Manda vazio para tirar. */
export const setTabCustomerPhone = (id: number, phone: string): Promise<{ id: number; name: string }> =>
  requestAdmin(`${FN}/admin/tab/customers/${id}`, { method: 'PATCH', body: JSON.stringify({ phone }) })

/** Anota no historico que a cobranca foi mandada. */
export const markCharged = (customerId: number): Promise<{ ok: boolean }> =>
  requestAdmin(`${FN}/admin/tab/customers/${customerId}/charged`, { method: 'POST' })

export const renameTabCustomer = (id: number, name: string): Promise<{ id: number; name: string }> =>
  requestAdmin(`${FN}/admin/tab/customers/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) })

export const deleteTabCustomer = (id: number): Promise<{ message: string }> =>
  requestAdmin(`${FN}/admin/tab/customers/${id}`, { method: 'DELETE' })

export const mergeTabCustomers = (from: number, to: number): Promise<{ message: string }> =>
  requestAdmin(`${FN}/admin/tab/customers/merge`, { method: 'POST', body: JSON.stringify({ from, to }) })

export const createTabSale = (data: {
  customerId: number
  items: { productId: number; quantity: number }[]
  soldAt?: string
  notes?: string
  paid?: boolean
}): Promise<TabSale> =>
  requestAdmin(`${FN}/admin/tab`, { method: 'POST', body: JSON.stringify(data) }).then(toTabSale)

export const setTabSalePaid = (id: number, paid: boolean): Promise<TabSale> =>
  requestAdmin(`${FN}/admin/tab/${id}/paid`, { method: 'PATCH', body: JSON.stringify({ paid }) })
    .then(toTabSale)

/** Abate uma parte do valor: a pessoa pagou so um pedaco agora. */
export const addTabPayment = (id: number, amount: number): Promise<TabSale> =>
  requestAdmin(`${FN}/admin/tab/${id}/payment`, { method: 'PATCH', body: JSON.stringify({ amount }) })
    .then(toTabSale)

/** Marca que a venda ja foi lancada na planilha pessoal */
export const setTabSaleAnnotated = (id: number, annotated: boolean): Promise<TabSale> =>
  requestAdmin(`${FN}/admin/tab/${id}/annotated`, { method: 'PATCH', body: JSON.stringify({ annotated }) })
    .then(toTabSale)

/** Marca de uma vez todas as vendas pagas que ainda nao foram anotadas */
export const annotateAllTabSales = (): Promise<{ anotadas: number }> =>
  requestAdmin(`${FN}/admin/tab/annotate-all`, { method: 'POST' })

// ── Historico (auditoria) ─────────────────────────────
export const getHistory = (opts: { entity?: string; actor?: string; limit?: number } = {}): Promise<AuditEntry[]> => {
  const p = new URLSearchParams()
  if (opts.entity) p.set('entity', opts.entity)
  if (opts.actor) p.set('actor', opts.actor)
  p.set('limit', String(opts.limit ?? 150))
  return requestAdmin<{ id: number; actor: string; action: string; description: string; entity: string | null; entity_id: number | null; created_at: string }[]>(
    `${FN}/admin/history?${p}`,
  ).then((rows) => rows.map((r) => ({
    id: r.id,
    actor: r.actor,
    action: r.action,
    description: r.description,
    entity: r.entity ?? undefined,
    entityId: r.entity_id ?? undefined,
    createdAt: r.created_at,
  })))
}

export const getHistoryActors = (): Promise<string[]> =>
  requestAdmin<string[]>(`${FN}/admin/history/actors`)

export const deleteTabSale = (id: number): Promise<{ message: string }> =>
  requestAdmin(`${FN}/admin/tab/${id}`, { method: 'DELETE' })

export const payAllForCustomer = (customerId: number): Promise<{ quitadas: number }> =>
  requestAdmin(`${FN}/admin/tab/pay-all`, { method: 'POST', body: JSON.stringify({ customerId }) })
