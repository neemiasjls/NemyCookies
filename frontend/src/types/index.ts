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

/* =====================================================================
   Sistema que veio da planilha: custos, compras e vendas gerais.
   Nao se mistura com a caderneta da Orvalho nem com os clientes dela.
   ===================================================================== */

export type UnidadeIngrediente = 'g' | 'ml' | 'un'

/** Um preco do mesmo ingrediente num mercado. Um deles e a referencia do custo. */
export interface PrecoIngrediente {
  id: number
  packageQty: number
  packagePrice: number
  market?: string
  isReference: boolean
  unitCost: number
}

export interface Ingrediente {
  id: number
  name: string
  unit: UnidadeIngrediente
  notes?: string
  /** custo por g/ml/un vindo do preco de referencia; null se nao tem preco */
  unitCost: number | null
  precos: PrecoIngrediente[]
}

export interface ItemReceita {
  id: number
  ingredientId: number
  label: string
  ingredientName: string
  quantity: number
  unit: UnidadeIngrediente
  note?: string
  unitCost: number
  totalCost: number
  costPerCookie: number
}

export interface Receita {
  id: number
  name: string
  /** quantos cookies saem de uma receita */
  yield: number
  totalCost: number
  costPerCookie: number
  itens: ItemReceita[]
}

export interface Embalagem {
  id: number
  name: string
  unitCost: number
  note?: string
  active: boolean
}

export type ComponenteSabor = 'chocolate' | 'recheio' | 'topo' | 'extra'

export interface ItemSabor {
  id: number
  component: ComponenteSabor
  ingredientId: number
  ingredientName: string
  quantity: number
  unit: UnidadeIngrediente
  note?: string
  unitCost: number
  totalCost: number
}

export interface CustoSabor {
  productId: number
  name: string
  salePrice: number
  ingredientsCost: number
  doughCost: number
  packagingCost: number
  totalCost: number
  margin: number
  itens: ItemSabor[]
}

export interface Custos {
  ingredientes: Ingrediente[]
  receita: Receita | null
  embalagem: Embalagem[]
  embalagemTotal: number
  sabores: CustoSabor[]
}

export type CategoriaCompra =
  | 'ingrediente' | 'embalagem' | 'descartavel' | 'equipamento' | 'marketing' | 'outro'

export interface Compra {
  id: number
  boughtAt?: string
  item: string
  quantity?: string
  unit?: string
  amount: number
  market?: string
  category: CategoriaCompra
  notes?: string
}

export interface ListaCompras {
  itens: Compra[]
  quantas: number
  /** so as linhas de compra */
  total: number
  /** combustivel das entregas; mora nas vendas e aparece aqui somado */
  combustivel: number
  entregasComGasto: number
  /** total + combustivel: o que realmente saiu do bolso */
  totalGeral: number
  porCategoria: { category: CategoriaCompra; linhas: number; total: number }[]
}

export type TipoVenda = 'venda' | 'consumo_proprio' | 'brinde'
export type ModoEntrega = 'entrega' | 'retirada'

/** Um sabor dentro de uma venda geral. */
export interface ItemVenda {
  productId: number | null
  productName: string
  quantity: number
  unitPrice: number
}

export interface VendaGeral {
  /** de onde veio: lancada aqui ou uma venda ja quitada da Orvalho */
  origin: 'geral' | 'orvalho'
  id: number
  soldAt?: string
  customerName: string
  amount: number
  /** taxa cobrada do cliente */
  deliveryFee: number
  /** combustivel que voce gastou para entregar */
  deliveryCost: number
  /** retirada nao tem taxa nem gasto */
  deliveryMode: ModoEntrega
  kind: TipoVenda
  notes?: string
  /** os cookies da venda; vazio nas 180 que vieram da planilha, que so tinham o total */
  produtos: ItemVenda[]
}

export interface ListaVendas {
  itens: VendaGeral[]
  quantas: number
  cookies: number
  taxas: number
  combustivel: number
  consumo: number
  retiradas: number
  porOrigem: { origin: string; vendas: number; total: number }[]
}

export interface ResumoFinanceiro {
  receita: number
  cookies: number
  taxas: number
  combustivel: number
  compras: number
  saldo: number
  /** ainda em aberto na caderneta da Orvalho */
  aReceber: number
}
