import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Home from './pages/Home'
import Checkout from './pages/Checkout'
import PixPayment from './pages/PixPayment'
import OrderConfirmation from './pages/OrderConfirmation'
import Entrar from './pages/Entrar'
import Fidelidade from './pages/Fidelidade'
import PrimeiroAcesso from './pages/PrimeiroAcesso'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* a raiz e a area da cliente; o delivery ficou em /delivery, sem link no site */}
          <Route path="/" element={<Entrar />} />
          <Route path="/delivery" element={<Home />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pagamento/pix" element={<PixPayment />} />
          <Route path="/pedido/:id" element={<OrderConfirmation />} />
          <Route path="/entrar" element={<Navigate to="/" replace />} />
          <Route path="/fidelidade" element={<Fidelidade />} />
          <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  )
}
