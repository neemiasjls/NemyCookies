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
  createdAt: string
  items: OrderItemResponse[]
}

export interface PixPaymentCreatedResponse {
  orderId: number
  paymentId: number
  qrCodeBase64: string
  copyPasteCode: string
  totalAmount: number
  expiresAt: string
}
