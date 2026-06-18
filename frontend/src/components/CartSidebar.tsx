import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Cookie, Minus, Plus, Trash2 } from 'lucide-react'

export default function CartSidebar() {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart()
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-card p-4 sticky top-4">
      <h2 className="font-display font-bold text-cookie-dark text-base mb-3 flex items-center gap-2">
        <ShoppingBag size={17} className="text-cookie-brown" />
        Sua Sacola
        {itemCount > 0 && (
          <span className="bg-cookie-brown text-white text-xs px-2 py-0.5 rounded-full">
            {itemCount}
          </span>
        )}
      </h2>

      {items.length === 0 ? (
        <div className="flex flex-col items-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-2">
            <Cookie size={22} className="text-cookie-brown/60" />
          </div>
          <p className="text-gray-400 text-sm">Sua sacola está vazia</p>
          <p className="text-gray-400 text-xs mt-1">Adicione cookies para começar!</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
            {items.map((item) => (
              <div key={item.product.id} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-cookie-dark truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-400">
                    R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full bg-orange-100 hover:bg-orange-200 text-cookie-brown flex items-center justify-center transition-colors"
                    aria-label="Diminuir quantidade"
                  ><Minus size={13} strokeWidth={2.5} /></button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock}
                    className="w-7 h-7 rounded-full bg-orange-100 hover:bg-orange-200 text-cookie-brown flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Aumentar quantidade"
                  ><Plus size={13} strokeWidth={2.5} /></button>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-red-400 flex items-center justify-center ml-1 transition-colors"
                    aria-label="Remover item"
                  ><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-orange-100 pt-3">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-cookie-dark text-sm">Total</span>
              <span className="font-bold text-cookie-brown text-lg">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-cookie-brown hover:bg-cookie-dark text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              Fazer Pedido
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">Retirada ou entrega · Sob encomenda</p>
          </div>
        </>
      )}
    </div>
  )
}
