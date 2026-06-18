import { useEffect, useState } from 'react'
import { getProducts, getCategories } from '../api/api'
import { Product, Category } from '../types'
import ProductCard from '../components/ProductCard'
import CartSidebar from '../components/CartSidebar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, MapPin, Store, Clock, Loader2 } from 'lucide-react'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { itemCount, total } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods)
        setCategories(cats)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  )

  const productsByCategory = categories.map((cat) => ({
    category: cat,
    products: filtered.filter((p) => p.category.id === cat.id),
  }))

  return (
    <div className="min-h-screen bg-cookie-cream flex flex-col">
      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-orange-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 py-2.5 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            aria-label="Voltar para a página inicial"
          >
            <img src="/logo.png" alt="NemyCookies" className="h-9 w-9 object-contain rounded-full" />
            <span className="font-display font-bold text-cookie-dark text-base hidden sm:block">NemyCookies</span>
          </button>

          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cookie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-orange-200 bg-white rounded-full pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-cookie-brown focus:ring-2 focus:ring-cookie-brown/10 transition-shadow"
            />
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="relative flex items-center gap-2 bg-cookie-brown text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-cookie-dark transition-colors flex-shrink-0"
          >
            <ShoppingBag size={16} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-cookie-gold text-cookie-dark text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shadow">
                {itemCount}
              </span>
            )}
            <span className="hidden sm:inline">Sacola</span>
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-cookie-dark via-[#3D2414] to-cookie-brown text-white overflow-hidden">
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-cookie-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-10 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 py-10 flex flex-col items-center text-center">
          <img src="/logo.png" alt="NemyCookies" className="h-32 w-32 object-contain mb-3 rounded-full" style={{mixBlendMode:'lighten'}} />
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">NemyCookies</h1>
          <p className="text-orange-200 mt-2 text-base">Cookies artesanais feitos sob encomenda</p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5 text-sm">
            <span className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 text-orange-100">
              <MapPin size={14} /> Herculândia, SP
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 text-orange-100">
              <Store size={14} /> Retirada no local
            </span>
            <span className="flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 text-orange-100">
              <Clock size={14} /> Sob encomenda
            </span>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto px-3 py-6 w-full flex-1">
        <div className="flex gap-4">
          {/* Cardápio */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 size={36} className="animate-spin text-cookie-brown" />
                <p className="text-gray-400 text-sm">Carregando cardápio...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center text-center py-16 gap-3">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
                  <Search size={24} className="text-cookie-brown" />
                </div>
                <p className="text-gray-400">Nenhum cookie encontrado para "{search}"</p>
              </div>
            ) : (
              productsByCategory
                .filter((g) => g.products.length > 0)
                .map(({ category, products: prods }) => (
                  <section key={category.id} className="mb-8">
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="w-1 h-5 bg-cookie-gold rounded-full" />
                      <h2 className="font-display text-lg font-bold text-cookie-dark">{category.name}</h2>
                    </div>
                    {category.description && (
                      <p className="text-gray-500 text-sm mb-3 leading-snug ml-3.5">{category.description}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {prods.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                ))
            )}
          </div>

          {/* Sidebar carrinho — só desktop */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <CartSidebar />
          </div>
        </div>
      </div>

      <Footer />

      {/* Botão flutuante sacola — mobile */}
      {itemCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center lg:hidden z-20 px-4">
          <button
            onClick={() => navigate('/checkout')}
            className="bg-cookie-brown text-white font-bold px-6 py-3.5 rounded-full shadow-xl flex items-center gap-3 hover:bg-cookie-dark transition-colors w-full max-w-sm justify-between"
          >
            <span className="bg-white text-cookie-brown text-xs font-bold px-2 py-0.5 rounded-full">
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </span>
            <span className="flex items-center gap-2"><ShoppingBag size={16} /> Ver Sacola</span>
            <span className="font-bold">R$ {total.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      )}

      {/* Espaço extra no mobile para o botão flutuante */}
      {itemCount > 0 && <div className="h-20 lg:hidden" />}
    </div>
  )
}
