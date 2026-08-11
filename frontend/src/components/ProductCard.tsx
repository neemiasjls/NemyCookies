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
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col relative ${
      outOfStock
        ? 'opacity-60 border-gray-100'
        : 'border-orange-100 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 active:scale-[0.99]'
    }`}>
      {outOfStock && (
        <div className="absolute top-2 right-2 bg-gray-700/90 text-white text-xs font-bold px-2.5 py-1 rounded-full z-10">
          Esgotado
        </div>
      )}

      {/* Foto no topo, proporcao 3:2 igual as fotos (object-cover sem corte) */}
      <div className="relative w-full aspect-[3/2] bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <Cookie size={48} className="text-cookie-brown/60" strokeWidth={1.5} />
        )}
        {product.weight && (
          <span className="absolute bottom-1.5 right-1.5 bg-cookie-dark/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">
            {product.weight}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-3 flex flex-col">
        <div className="flex-1">
          <h3 className="font-display font-bold text-cookie-dark text-sm leading-tight truncate">
            {product.name}
          </h3>
          <p className="text-gray-500 text-xs mt-1 leading-snug line-clamp-2">{product.description}</p>
        </div>

        <div className="flex items-center justify-between mt-3 gap-2">
          <span className="font-bold text-cookie-brown text-base">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>

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
                className="w-9 h-9 rounded-full bg-cookie-brown active:bg-cookie-dark text-white flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Adicionar ao carrinho"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
