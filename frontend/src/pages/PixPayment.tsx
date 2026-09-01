import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getPixStatus } from '../api/api'
import { PixPaymentCreatedResponse } from '../types'
import { ArrowLeft, CheckCircle2, XCircle, Copy, Check } from 'lucide-react'

const POLL_INTERVAL = 3000

export default function PixPayment() {
  const location = useLocation()
  const navigate = useNavigate()
  const pixData = location.state as PixPaymentCreatedResponse | null

  const [copied, setCopied] = useState(false)
  const [status, setStatus] = useState<'waiting' | 'approved' | 'rejected'>('waiting')
  const [secondsLeft, setSecondsLeft] = useState(30 * 60)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!pixData) { navigate('/'); return }

    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => { if (s <= 1) { clearInterval(timerRef.current!); return 0 } return s - 1 })
    }, 1000)

    intervalRef.current = setInterval(async () => {
      try {
        const result = await getPixStatus(pixData.paymentId)
        if (result.status === 'approved') {
          clearAll(); setStatus('approved')
          setTimeout(() => navigate(`/pedido/${pixData.orderId}?method=pix`), 2000)
        } else if (result.status === 'rejected' || result.status === 'cancelled') {
          clearAll(); setStatus('rejected')
        }
      } catch { /* retry */ }
    }, POLL_INTERVAL)

    return () => clearAll()
  }, [])

  const clearAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const handleCopy = () => {
    if (!pixData) return
    navigator.clipboard.writeText(pixData.copyPasteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60

  if (!pixData) return null

  if (status === 'approved') return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-4">
      <CheckCircle2 size={72} className="text-success animate-confirma" strokeWidth={1.5} />
      <h1 className="font-display text-2xl font-bold text-success">Pagamento confirmado!</h1>
      <p className="text-ink-2">Redirecionando...</p>
    </div>
  )

  if (status === 'rejected') return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-4 px-4">
      <XCircle size={72} className="text-danger" strokeWidth={1.5} />
      <h1 className="font-display text-xl font-bold text-danger">Pagamento não realizado</h1>
      <button onClick={() => navigate('/')} className="bg-brand text-brand-ink px-8 py-3 rounded-full font-semibold text-base">
        Voltar ao cardápio
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-canvas pb-6">
      <div className="bg-shell text-white py-3.5 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/checkout')} className="text-shell-2 hover:text-white p-1 transition-colors" aria-label="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-lg">Pagamento via Pix</h1>
          <button
            onClick={() => navigate('/')}
            className="ml-auto flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Voltar para a página inicial"
          >
            <span className="font-display font-bold text-sm hidden sm:block">NemyCookies</span>
            <img src="/logo.png" alt="NemyCookies" className="h-8 w-8 object-contain rounded-full" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Timer */}
        <div className="bg-surface rounded-2xl border border-brand-line p-4 text-center">
          <p className="text-sm text-ink-2 mb-1">QR Code expira em</p>
          <p className={`text-4xl font-bold tabular-nums ${secondsLeft < 120 ? 'text-danger' : 'text-brand'}`}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-surface rounded-2xl border border-brand-line p-5 flex flex-col items-center gap-4">
          <p className="font-semibold text-ink text-center">Escaneie com o app do seu banco</p>

          {pixData.qrCodeBase64 ? (
            <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX"
              className="w-56 h-56 rounded-xl" />
          ) : (
            <div className="w-56 h-56 bg-surface-2 rounded-xl flex items-center justify-center text-ink-3 text-sm">
              QR Code indisponível
            </div>
          )}

          <div className="w-full">
            <p className="text-xs text-ink-2 mb-2 text-center font-medium">Pix Copia e Cola:</p>
            <div className="bg-brand-soft rounded-xl p-3 flex items-center gap-2">
              <p className="text-xs font-mono text-ink-2 flex-1 break-all line-clamp-2 leading-relaxed">
                {pixData.copyPasteCode}
              </p>
              <button onClick={handleCopy}
                className={`flex-shrink-0 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors min-w-[80px] flex items-center justify-center gap-1.5 ${
                  copied ? 'bg-success-bg text-success' : 'bg-brand text-brand-ink active:bg-brand-strong'
                }`}>
                {copied ? <><Check size={14} strokeWidth={3} /> Copiado</> : <><Copy size={14} /> Copiar</>}
              </button>
            </div>
          </div>
        </div>

        {/* Valor */}
        <div className="bg-surface rounded-2xl border border-brand-line p-4 flex justify-between items-center">
          <span className="text-ink-2 font-medium">Valor a pagar</span>
          <span className="text-2xl font-bold text-brand">
            R$ {pixData.totalAmount.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Status */}
        <div className="bg-info-bg rounded-2xl border border-info-line p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-info mb-1">
            <div className="w-2.5 h-2.5 bg-info-solid rounded-full animate-pulse" />
            <span className="text-sm font-semibold">Aguardando pagamento...</span>
          </div>
          <p className="text-xs text-info">Esta página atualiza automaticamente</p>
        </div>

        <p className="text-center text-xs text-ink-3">Pedido #{pixData.orderId}</p>
      </div>
    </div>
  )
}
