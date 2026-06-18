import axios from 'axios'
import {
  OrderResponse, OrderStatus, Product, Category,
  PixPaymentCreatedResponse,
} from '../types'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Produtos ──────────────────────────────────────────
export const getProducts = (): Promise<Product[]> =>
  api.get('/products').then((r) => r.data)

export const getCategories = (): Promise<Category[]> =>
  api.get('/products/categories').then((r) => r.data)

// ── Pagamentos ────────────────────────────────────────
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

export const createPixPayment = (data: CreatePixPayload): Promise<PixPaymentCreatedResponse> =>
  api.post('/payments/pix', data).then((r) => r.data)

export const createCardPayment = (data: CreateCardPayload): Promise<{ status: string; orderId: number; message: string }> =>
  api.post('/payments/card', data).then((r) => r.data)

export const createCashOrder = (data: CreateCashPayload): Promise<OrderResponse> =>
  api.post('/payments/cash', data).then((r) => r.data)

export const getPixStatus = (paymentId: number): Promise<{ status: string; externalReference: string }> =>
  api.get(`/payments/${paymentId}/status`).then((r) => r.data)

// ── Admin ─────────────────────────────────────────────
export const adminLogin = (username: string, password: string): Promise<{ token: string }> =>
  api.post('/admin/login', { username, password }).then((r) => r.data)

export const getAdminOrders = (status?: OrderStatus): Promise<OrderResponse[]> =>
  api.get('/admin/orders', { params: status ? { status } : undefined }).then((r) => r.data)

export const updateOrderStatus = (id: number, status: OrderStatus): Promise<OrderResponse> =>
  api.patch(`/admin/orders/${id}/status`, { status }).then((r) => r.data)

export const getAdminProducts = (): Promise<Product[]> =>
  api.get('/admin/products').then((r) => r.data)

export const updateProductAvailability = (id: number, available: boolean): Promise<Product> =>
  api.patch(`/admin/products/${id}/availability`, { available }).then((r) => r.data)

export const updateProductStock = (id: number, stock: number): Promise<Product> =>
  api.patch(`/admin/products/${id}/stock`, { stock }).then((r) => r.data)

export const addProductStock = (id: number, quantity: number): Promise<Product> =>
  api.patch(`/admin/products/${id}/stock/add`, { quantity }).then((r) => r.data)
