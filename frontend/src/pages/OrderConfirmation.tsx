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
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center px-4 py-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
        aria-label="Voltar para a página inicial"
      >
        <img src="/logo.png" alt="NemyCookies" className="h-9 w-9 object-contain rounded-full" />
        <span className="font-display font-bold text-ink text-lg">NemyCookies</span>
      </button>
      <div className="bg-surface rounded-2xl border border-brand-line p-6 max-w-sm w-full text-center shadow-card">
        <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={34} className="text-success" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">Pedido Confirmado!</h1>
        <p className="text-ink-2 text-sm mb-1">
          Pedido <span className="font-bold text-brand">#{id}</span>
        </p>
        <p className="text-ink-2 text-sm mb-6">
          Seu pedido foi registrado com sucesso!
        </p>

        <div className="bg-brand-soft rounded-xl p-4 mb-6 text-left space-y-3">
          {STEPS.map(({ Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-ink-2">
              <span className="w-8 h-8 rounded-full bg-surface border border-brand-line flex items-center justify-center flex-shrink-0">
                <Icon size={15} className="text-brand" />
              </span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        <button onClick={() => navigate('/')}
          className="w-full bg-brand text-brand-ink font-bold py-4 rounded-xl text-base active:bg-brand-strong transition-colors">
          Ver mais cookies
        </button>
      </div>
    </div>
  )
}
