import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Cookie, Minus, Plus, Trash2, Truck } from 'lucide-react'

import { FRETE_GRATIS_A_PARTIR_DE as FRETE_GRATIS } from '../entrega'

export default function CartSidebar() {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart()
  const navigate = useNavigate()
  const falta = FRETE_GRATIS - total

  return (
    <div className="bg-surface rounded-2xl border border-brand-line shadow-card sticky top-4 overflow-hidden">
      {/* Cabecalho */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-brand-line">
        <ShoppingBag size={16} className="text-brand flex-shrink-0" />
        <h2 className="font-display font-bold text-ink text-[15px] flex-1">Sua Sacola</h2>
        {itemCount > 0 && (
          <span className="bg-brand text-brand-ink text-xs font-bold px-2 py-0.5 rounded-full">
            {itemCount}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center text-center px-4 py-7">
          <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center mb-2.5">
            <Cookie size={22} className="text-brand/50" />
          </div>
          <p className="text-ink-2 text-sm font-medium">Sua sacola está vazia</p>
          <p className="text-ink-3 text-xs mt-0.5">Adicione cookies para começar!</p>
        </div>
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto divide-y divide-brand-line">
            {items.map((item) => (
              <div key={item.product.id} className="p-3">
                <div className="flex items-start gap-2.5">
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt=""
                      className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-brand-soft flex items-center justify-center flex-shrink-0">
                      <Cookie size={18} className="text-brand/50" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink leading-tight truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-ink-3 mt-0.5">
                      R$ {item.product.price.toFixed(2).replace('.', ',')} cada
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="w-7 h-7 rounded-full text-ink-4 hover:bg-danger-bg hover:text-danger flex items-center justify-center flex-shrink-0 transition-colors"
                    aria-label={`Remover ${item.product.name}`}
                  ><Trash2 size={13} /></button>
                </div>

                <div className="flex items-center justify-between mt-2 pl-[54px]">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-full bg-brand-line hover:bg-brand-line text-brand flex items-center justify-center transition-colors"
                      aria-label="Diminuir quantidade"
                    ><Minus size={12} strokeWidth={2.5} /></button>
                    <span className="text-sm font-bold w-5 text-center text-ink tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="w-7 h-7 rounded-full bg-brand-line hover:bg-brand-line text-brand flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Aumentar quantidade"
                    ><Plus size={12} strokeWidth={2.5} /></button>
                  </div>
                  <span className="text-sm font-bold text-ink tabular-nums">
                    R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-brand-line p-4">
            {/* Aviso de frete */}
            <div className={`flex items-center gap-2 rounded-lg px-2.5 py-2 mb-3 ${
              falta <= 0 ? 'bg-success-bg text-success' : 'bg-brand-soft text-brand'
            }`}>
              <Truck size={14} className="flex-shrink-0" />
              <span className="text-xs font-medium leading-tight">
                {falta <= 0
                  ? 'Você ganhou entrega grátis!'
                  : <>Faltam <strong>R$ {falta.toFixed(2).replace('.', ',')}</strong> para entrega grátis</>}
              </span>
            </div>

            <div className="flex justify-between items-baseline mb-3">
              <span className="font-semibold text-ink text-sm">Total</span>
              <span className="font-bold text-brand text-xl tabular-nums">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-brand hover:bg-brand-strong text-brand-ink font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              Fazer Pedido
            </button>
          </div>
        </>
      )}
    </div>
  )
}
