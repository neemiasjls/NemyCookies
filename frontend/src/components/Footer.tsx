import { MapPin } from 'lucide-react'
import WhatsAppIcon from './WhatsAppIcon'

const INSTAGRAM = 'https://instagram.com/nemycookies'
const WHATSAPP = 'https://wa.me/5514998218858'

/* O lucide nao inclui icones de marca */
function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}


export default function Footer() {
  return (
    <footer className="bg-shell text-white mt-10">
      <div className="max-w-6xl mx-auto px-4 py-9">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="NemyCookies" className="h-10 w-10 object-contain rounded-full" />
            <span className="font-display font-bold text-xl">NemyCookies</span>
          </div>

          <p className="flex items-center gap-1.5 text-orange-200/70 text-sm">
            <MapPin size={14} /> Herculândia, SP
          </p>

          {/* Redes sociais */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram do NemyCookies"
              className="flex items-center gap-2 rounded-full px-4 py-2 bg-white/[0.07]
                         border border-cookie-gold/25 hover:bg-white/[0.14] transition-colors"
            >
              <span className="text-gold flex items-center"><InstagramIcon /></span>
              <span className="text-sm font-semibold text-orange-50/90">@nemycookies</span>
            </a>
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp do NemyCookies"
              className="flex items-center gap-2 rounded-full px-4 py-2 bg-white/[0.07]
                         border border-cookie-gold/25 hover:bg-white/[0.14] transition-colors"
            >
              <span className="text-gold flex items-center"><WhatsAppIcon /></span>
              <span className="text-sm font-semibold text-orange-50/90">WhatsApp</span>
            </a>
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
