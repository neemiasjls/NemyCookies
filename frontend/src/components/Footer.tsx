import { MapPin, Store, Clock } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-cookie-dark text-white mt-10">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="NemyCookies" className="h-10 w-10 object-contain rounded-full" />
            <span className="font-display font-bold text-xl">NemyCookies</span>
          </div>
          <p className="text-orange-200/80 text-sm max-w-xs">
            Cookies artesanais feitos sob encomenda, com muito carinho.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-3 text-sm text-orange-200/70">
            <span className="flex items-center gap-1.5">
              <MapPin size={15} /> Herculândia, SP
            </span>
            <span className="flex items-center gap-1.5">
              <Store size={15} /> Retirada no local
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={15} /> Sob encomenda
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-xs text-orange-200/50">
          © {new Date().getFullYear()} NemyCookies · Todos os direitos reservados
        </div>
      </div>
    </footer>
  )
}
