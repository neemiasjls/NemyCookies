import { useEffect, useState } from 'react'
import { getProducts, getCategories } from '../api/api'
import { Product, Category } from '../types'
import ProductCard from '../components/ProductCard'
import CartSidebar from '../components/CartSidebar'
import Footer from '../components/Footer'
import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, MapPin, Loader2, Truck, Cookie, CreditCard, WifiOff } from 'lucide-react'

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const { itemCount, total } = useCart()
  const navigate = useNavigate()

  const carregar = () => {
    setLoading(true)
    setErro(null)
    Promise.all([getProducts(), getCategories()])
      .then(([prods, cats]) => {
        setProducts(prods)
        setCategories(cats)
      })
      .catch((e) => setErro(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }

  useEffect(carregar, [])

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
      <div className="relative bg-gradient-to-b from-cookie-dark via-[#43270F] to-cookie-brown text-white overflow-hidden">
        {/* brilho quente no topo */}
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(232,160,32,0.20), transparent 70%)' }} />
        <div className="absolute -bottom-24 -right-20 w-80 h-80 bg-cookie-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 pt-7 pb-9 flex flex-col items-center text-center">
          <img src="/logo.png" alt="NemyCookies"
               className="h-24 w-24 sm:h-28 sm:w-28 object-contain rounded-full"
               style={{ mixBlendMode: 'lighten' }} />

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 drop-shadow-sm">
            NemyCookies
          </h1>

          {/* separador decorativo */}
          <div className="flex items-center gap-2.5 mt-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-cookie-gold/60" />
            <Cookie size={13} className="text-cookie-gold" />
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-cookie-gold/60" />
          </div>

          <p className="text-orange-100/90 mt-3 text-[15px]">Cookies artesanais assados na hora</p>
          <p className="flex items-center gap-1.5 text-orange-200/60 text-[13px] mt-1.5">
            <MapPin size={12} /> Herculândia, SP
          </p>

          {/* Destaque principal */}
          <div className="mt-5 flex items-center gap-2.5 rounded-full pl-2 pr-4 py-2
                          bg-gradient-to-r from-cookie-gold/30 to-amber-500/20
                          border border-cookie-gold/60 shadow-lg shadow-black/25">
            <span className="w-6 h-6 rounded-full bg-cookie-gold flex items-center justify-center flex-shrink-0">
              <Truck size={13} className="text-cookie-dark" />
            </span>
            <span className="text-sm font-bold tracking-tight">Entrega grátis acima de R$ 50</span>
          </div>

          {/* Demais informacoes, no mesmo estilo */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {[
              { Icon: Cookie, texto: 'Assados na hora' },
              { Icon: Truck, texto: 'Entrega R$ 4,00' },
              { Icon: CreditCard, texto: 'Pix, dinheiro ou cartão (aproximação)' },
            ].map(({ Icon, texto }) => (
              <span key={texto}
                className="flex items-center gap-2 rounded-full pl-1.5 pr-3.5 py-1.5
                           bg-white/[0.07] border border-cookie-gold/25 backdrop-blur-sm">
                <span className="w-5 h-5 rounded-full bg-cookie-gold/20 flex items-center justify-center flex-shrink-0">
                  <Icon size={11} className="text-cookie-gold" />
                </span>
                <span className="text-[13px] font-semibold text-orange-50/90">{texto}</span>
              </span>
            ))}
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
            ) : erro ? (
              <div className="flex flex-col items-center text-center py-16 gap-3">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                  <WifiOff size={24} className="text-red-400" />
                </div>
                <p className="text-gray-500 font-semibold">Não conseguimos carregar o cardápio</p>
                <p className="text-gray-400 text-sm">Verifique sua conexão e tente de novo.</p>
                <button
                  onClick={carregar}
                  className="mt-1 bg-cookie-brown text-white font-bold px-6 py-2.5 rounded-full text-sm active:bg-cookie-dark transition-colors"
                >
                  Tentar novamente
                </button>
                <details className="mt-3 max-w-md">
                  <summary className="text-xs text-gray-400 cursor-pointer">Detalhes técnicos</summary>
                  <p className="mt-1.5 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 break-words text-left font-mono">
                    {erro}
                  </p>
                </details>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center text-center py-16 gap-3">
                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
                  <Cookie size={24} className="text-cookie-brown" />
                </div>
                <p className="text-gray-500 font-semibold">Estamos sem cookies no momento</p>
                <p className="text-gray-400 text-sm">Volte em breve — tem fornada nova saindo!</p>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 mt-3">
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
