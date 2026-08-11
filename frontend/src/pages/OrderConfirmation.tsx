import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Bell, Cookie, Store } from 'lucide-react'

const STEPS = [
  { Icon: Cookie, text: 'Seus cookies serão assados na hora' },
  { Icon: Bell, text: 'Você será avisado quando estiverem prontos' },
  { Icon: Store, text: 'Combinamos a entrega ou a retirada' },
]

export default function OrderConfirmation() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-cookie-cream flex flex-col items-center justify-center px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
        aria-label="Voltar para a página inicial"
      >
        <img src="/logo.png" alt="NemyCookies" className="h-9 w-9 object-contain rounded-full" />
        <span className="font-display font-bold text-cookie-dark text-lg">NemyCookies</span>
      </button>
      <div className="bg-white rounded-2xl border border-orange-100 p-6 max-w-sm w-full text-center shadow-card">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={34} className="text-green-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-cookie-dark mb-2">Pedido Confirmado!</h1>
        <p className="text-gray-500 text-sm mb-1">
          Pedido <span className="font-bold text-cookie-brown">#{id}</span>
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Seu pedido foi registrado com sucesso!
        </p>

        <div className="bg-orange-50 rounded-xl p-4 mb-6 text-left space-y-3">
          {STEPS.map(({ Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
              <span className="w-8 h-8 rounded-full bg-white border border-orange-200 flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-cookie-brown" />
              </span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/')}
          className="w-full bg-cookie-brown text-white font-bold py-4 rounded-xl text-base active:bg-cookie-dark transition-colors">
          Ver mais cookies
        </button>
      </div>
    </div>
  )
}
