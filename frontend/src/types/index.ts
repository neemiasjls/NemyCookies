export interface Category {
  id: number
  name: string
  description: string
  displayOrder: number
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  imageUrl?: string
  weight?: string
  available: boolean
  stock: number
  category: Category
}

export type PaymentMethod = 'PIX' | 'CARD' | 'CASH'
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'

export interface CartItem {
  product: Product
  quantity: number
}

export interface OrderItemResponse {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface OrderResponse {
  id: number
  customerName: string
  customerPhone: string
  customerEmail?: string
  paymentMethod: PaymentMethod
  paymentStatus: string
  status: OrderStatus
  totalAmount: number
  changeAmount?: number
  notes?: string
  address?: string
  deliveryMethod?: 'PICKUP' | 'DELIVERY'
  deliveryFee?: number
  /** 'site' = veio do site · 'manual' = anotado no painel */
  source?: 'site' | 'manual'
  createdAt: string
  items: OrderItemResponse[]
}

/** Registro do historico: quem fez o que e quando */
export interface AuditEntry {
  id: number
  actor: string
  action: string
  description: string
  entity?: string
  entityId?: number
  createdAt: string
}

/** Um item do lote levado para vender */
export interface ProducaoItem {
  productId: number
  productName: string
  levado: number
  vendido: number
  restante: number
}

/** Lote aberto: o que foi produzido e quanto ja saiu */
export interface Producao {
  id: number
  label?: string
  startedAt: string
  itens: ProducaoItem[]
  levado: number
  vendido: number
  restante: number
}

/** Quantos cookies de cada sabor precisam ser feitos */
export interface ProductionSummary {
  porSabor: { productId: number; productName: string; quantidade: number }[]
  totalCookies: number
  totalPedidos: number
}

/** Caderneta: venda presencial com pagamento posterior */
export interface TabSaleItem {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface TabSale {
  id: number
  customerId: number
  customerName: string
  soldAt: string
  total: number
  paid: boolean
  paidAt?: string
  /** quanto ja foi recebido; igual ao total quando a venda esta quitada */
  paidAmount: number
  /** ja lancado na planilha pessoal */
  annotated: boolean
  annotatedAt?: string
  notes?: string
  items: TabSaleItem[]
}

export interface TabSummaryRow {
  customerId: number
  customerName: string
  nickname?: string
  /** so digitos, no formato 55 + DDD + numero */
  phone?: string
  /** cobranca pronta, montada no servidor */
  message: string
  devendo: number
  vendasAbertas: number
  totalGeral: number
  ultimaCompra: string
}

/** Pessoa cadastrada na caderneta */
export interface TabCustomer {
  id: number
  name: string
  /** apelido, usado so na mensagem de cobranca */
  nickname?: string
  phone?: string
  devendo: number
  vendasAbertas: number
  ultimaCompra?: string
}

export interface PixPaymentCreatedResponse {
  orderId: number
  paymentId: number
  qrCodeBase64: string
  copyPasteCode: string
  totalAmount: number
  expiresAt: string
}
