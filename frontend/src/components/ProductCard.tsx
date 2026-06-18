import { Product } from '../types'
import { useCart } from '../context/CartContext'
import { Cookie, Minus, Plus } from 'lucide-react'

interface Props {
  product: Product
}

export default function ProductCard({ product }: Props) {
  const { addItem, items, updateQuantity } = useCart()
  const cartItem = items.find((i) => i.product.id === product.id)
  const outOfStock = !product.available || product.stock === 0

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 flex relative ${
      outOfStock
        ? 'opacity-60 border-gray-100'
        : 'border-orange-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]'
    }`}>
      {outOfStock && (
        <div className="absolute top-0 right-0 bg-gray-700 text-white text-xs font-bold px-2.5 py-1 rounded-bl-xl rounded-tr-2xl z-10">
          Esgotado
        </div>
      )}

      {/* Foto */}
      <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Cookie size={44} className="text-cookie-brown/60" strokeWidth={1.5} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="font-display font-bold text-cookie-dark text-sm leading-tight">{product.name}</h3>
          <p className="text-gray-500 text-xs mt-1 leading-snug line-clamp-2">{product.description}</p>
        </div>

        <div className="flex items-center justify-between mt-2 gap-2">
          <div>
            <span className="font-bold text-cookie-brown text-base">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {!outOfStock && (
            cartItem ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(cartItem.product.id, cartItem.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-orange-100 active:bg-orange-200 text-cookie-brown flex items-center justify-center transition-colors"
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={15} strokeWidth={2.5} />
                </button>
                <span className="text-sm font-bold w-5 text-center text-cookie-dark">{cartItem.quantity}</span>
                <button
                  onClick={() => {
                    if (cartItem.quantity < product.stock) {
                      updateQuantity(cartItem.product.id, cartItem.quantity + 1)
                    }
                  }}
                  disabled={cartItem.quantity >= product.stock}
                  className="w-8 h-8 rounded-full bg-orange-100 active:bg-orange-200 text-cookie-brown flex items-center justify-center transition-colors disabled:opacity-40"
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={15} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => addItem(product)}
                className="bg-cookie-brown active:bg-cookie-dark text-white text-sm font-bold px-4 py-2 rounded-full transition-colors"
              >
                Adicionar
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
