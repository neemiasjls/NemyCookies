import { useState } from 'react'
import { useCart } from '../context/CartContext'
import ThemeToggle from '../components/ThemeToggle'
import { createPixPayment, createCardPayment, createCashOrder } from '../api/api'
import { useNavigate } from 'react-router-dom'
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'
import {
  maskPhone, maskCPF, maskCEP, maskName,
  isValidPhone, isValidEmail, isValidCPF, isValidCEP, isValidName,
} from '../utils/masks'
import {
  ArrowLeft, ArrowRight, AlertCircle, Check, CheckCircle2,
  Cookie, MapPin, QrCode, CreditCard as CreditCardIcon, Banknote, ShieldCheck,
  Store, Truck,
} from 'lucide-react'

import { TAXA_ENTREGA as DELIVERY_FEE, FRETE_GRATIS_A_PARTIR_DE as FREE_DELIVERY_THRESHOLD } from '../entrega'

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY
initMercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' })

type PaymentMethod = 'PIX' | 'CARD' | 'CASH'
type DeliveryMethod = 'PICKUP' | 'DELIVERY'

interface FieldErrors {
  name?: string
  phone?: string
  email?: string
  cpf?: string
  cep?: string
  rua?: string
  numero?: string
  bairro?: string
}

export default function Checkout() {
  const { items, total, clearCart } = useCart()
  const navigate = useNavigate()

  const [step, setStep] = useState<'info' | 'payment'>('info')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [cpf, setCpf] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cep, setCep] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('PIX')
  const [delivery, setDelivery] = useState<DeliveryMethod>('PICKUP')
  const [change, setChange] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-brand-line flex items-center justify-center">
          <Cookie size={30} className="text-brand" />
        </div>
        <p className="text-ink-2 text-center">Sua sacola está vazia</p>
        <button onClick={() => navigate('/')} className="bg-brand text-brand-ink px-8 py-3 rounded-full font-semibold text-base">
          Ver Cardápio
        </button>
      </div>
    )
  }

  const orderItems = items.map((i) => ({ productId: i.product.id, quantity: i.quantity }))

  const isDelivery = delivery === 'DELIVERY'
  const deliveryFee = isDelivery && total < FREE_DELIVERY_THRESHOLD ? DELIVERY_FEE : 0
  const grandTotal = total + deliveryFee
  const missingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - total)

  const validate = (): FieldErrors => {
    const e: FieldErrors = {}
    if (!isValidName(name)) e.name = 'Digite seu nome completo (mínimo 3 letras)'
    if (!isValidPhone(phone)) e.phone = 'Telefone inválido — informe com DDD'
    if (email && !isValidEmail(email)) e.email = 'E-mail inválido'
    if (cpf && !isValidCPF(cpf)) e.cpf = 'CPF incompleto (11 dígitos)'
    if (cep && !isValidCEP(cep)) e.cep = 'CEP incompleto (8 dígitos)'
    if (isDelivery) {
      if (!rua.trim()) e.rua = 'Informe a rua'
      if (!numero.trim()) e.numero = 'Nº obrigatório'
      if (!bairro.trim()) e.bairro = 'Informe o bairro'
    }
    return e
  }

  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }))

  const handleContinue = () => {
    const allTouched = {
      name: true, phone: true, email: true, cpf: true,
      cep: true, rua: true, numero: true, bairro: true,
    }
    setTouched(allTouched)
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length === 0) setStep('payment')
  }

  const handleBlur = (field: keyof FieldErrors) => {
    touch(field)
    setErrors(validate())
  }

  const inputClass = (field: keyof FieldErrors) =>
    `w-full border rounded-xl px-4 py-3 text-base focus:outline-none transition-colors ${
      touched[field] && errors[field]
        ? 'border-danger-line focus:border-danger bg-danger-bg'
        : 'border-brand-line focus:border-brand'
    }`

  const handlePixPayment = async () => {
    setError('')
    setLoading(true)
    try {
      const response = await createPixPayment({
        customerName: name, customerPhone: phone, customerEmail: email,
        customerCpf: cpf || undefined, deliveryMethod: delivery,
        ...(isDelivery ? { rua: rua || undefined, numero: numero || undefined, bairro: bairro || undefined, cep: cep || undefined } : {}),
        notes: notes || undefined, items: orderItems,
      })
      clearCart()
      navigate('/pagamento/pix', { state: response })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao gerar PIX')
    } finally {
      setLoading(false)
    }
  }

  const handleCashOrder = async () => {
    setError('')
    setLoading(true)
    try {
      const order = await createCashOrder({
        customerName: name, customerPhone: phone, deliveryMethod: delivery,
        ...(isDelivery ? { rua: rua || undefined, numero: numero || undefined, bairro: bairro || undefined, cep: cep || undefined } : {}),
        notes: notes || undefined, changeAmount: change ? parseFloat(change) : undefined,
        items: orderItems,
      })
      clearCart()
      navigate(`/pedido/${order.id}?method=cash`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  const handleCardSubmit = async (formData: {
    token: string; payment_method_id: string; installments: number;
    issuer_id?: string; payer: { email?: string }
  }) => {
    setError('')
    setLoading(true)
    try {
      const response = await createCardPayment({
        customerName: name, customerPhone: phone, customerEmail: email,
        deliveryMethod: delivery,
        ...(isDelivery ? { rua: rua || undefined, numero: numero || undefined, bairro: bairro || undefined, cep: cep || undefined } : {}),
        notes: notes || undefined, items: orderItems,
        token: formData.token, paymentMethodId: formData.payment_method_id,
        installments: formData.installments, issuerId: formData.issuer_id?.toString(),
      })
      clearCart()
      if (response.status === 'approved') {
        navigate(`/pedido/${response.orderId}?method=card&status=approved`)
      } else {
        setError(response.message || 'Pagamento não aprovado.')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao processar pagamento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas pb-6">
      {/* Header */}
      <div className="bg-shell text-shell-ink border-b border-shell-line py-3 px-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => step === 'payment' ? setStep('info') : navigate('/')}
            className="text-shell-2 hover:text-shell-ink p-1 rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-lg">
            {step === 'info' ? 'Seus dados' : 'Pagamento'}
          </h1>
          <div className="ml-auto">
            <ThemeToggle variant="shell" />
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            aria-label="Voltar para a página inicial"
          >
            <span className="font-display font-bold text-sm hidden sm:block">NemyCookies</span>
            <img src="/logo.png" alt="NemyCookies" className="h-8 w-8 object-contain rounded-full" />
          </button>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="bg-surface border-b border-brand-line">
        <div className="max-w-lg mx-auto px-4 py-2 flex items-center gap-2 text-sm">
          <div className={`flex items-center gap-1.5 ${step === 'info' ? 'text-brand font-bold' : 'text-ink-3'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'info' ? 'bg-brand text-brand-ink' : 'bg-success-solid text-brand-ink'}`}>
              {step === 'payment' ? <Check size={13} strokeWidth={3} /> : '1'}
            </span>
            Dados
          </div>
          <div className="flex-1 h-px bg-brand-line" />
          <div className={`flex items-center gap-1.5 ${step === 'payment' ? 'text-brand font-bold' : 'text-ink-3'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'payment' ? 'bg-brand text-brand-ink' : 'bg-brand-line text-ink-2'}`}>
              2
            </span>
            Pagamento
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Resumo sempre visível */}
        <div className="bg-surface rounded-2xl border border-brand-line shadow-card p-4">
          <h2 className="font-bold mb-2 text-sm uppercase tracking-wide text-ink-2">Resumo</h2>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between text-sm">
                <span className="text-ink-2">{item.quantity}× {item.product.name}</span>
                <span className="font-semibold text-ink">
                  R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-brand-line mt-3 pt-2 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-ink-2">Subtotal</span>
              <span className="text-ink font-medium">R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink-2 flex items-center gap-1">
                {isDelivery ? <><Truck size={13} /> Entrega</> : <><Store size={13} /> Retirada</>}
              </span>
              <span className={`font-medium ${deliveryFee === 0 ? 'text-success' : 'text-ink'}`}>
                {deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2).replace('.', ',')}`}
              </span>
            </div>
            <div className="flex justify-between font-bold pt-1">
              <span className="text-ink">Total</span>
              <span className="text-brand text-lg">R$ {grandTotal.toFixed(2).replace('.', ',')}</span>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-ink-2 pt-1">
              <Cookie size={12} className="flex-shrink-0" /> Assados na hora, feitos sob encomenda
            </p>
          </div>
        </div>

        {/* STEP 1: Dados */}
        {step === 'info' && (
          <div className="bg-surface rounded-2xl border border-brand-line shadow-card p-4 space-y-4">

            {/* Retirada ou Entrega */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Como você quer receber?</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { v: 'PICKUP' as DeliveryMethod, Icon: Store, label: 'Retirada', sub: 'Grátis · horário a combinar' },
                  { v: 'DELIVERY' as DeliveryMethod, Icon: Truck, label: 'Entrega', sub: 'R$ 4 · grátis acima de R$ 50' },
                ]).map(({ v, Icon, label, sub }) => {
                  const active = delivery === v
                  return (
                    <button key={v} type="button" onClick={() => setDelivery(v)}
                      className={`py-3 px-3 rounded-xl border-2 transition-all text-left active:scale-95 ${
                        active ? 'border-brand bg-brand-soft' : 'border-brand-line'
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          active ? 'bg-brand text-brand-ink' : 'bg-brand-soft text-brand'
                        }`}>
                          <Icon size={16} />
                        </div>
                        <span className={`text-sm font-bold ${active ? 'text-brand' : 'text-ink-2'}`}>{label}</span>
                      </div>
                      <p className="text-xs text-ink-3 mt-1 leading-tight">{sub}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(maskName(e.target.value))}
                onBlur={() => handleBlur('name')}
                placeholder="Seu nome"
                className={inputClass('name')}
              />
              {touched.name && errors.name && (
                <p className="text-danger text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={13} className="flex-shrink-0" /> {errors.name}
                </p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                onBlur={() => handleBlur('phone')}
                placeholder="(17) 99999-9999"
                className={inputClass('phone')}
              />
              {touched.phone && errors.phone && (
                <p className="text-danger text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={13} className="flex-shrink-0" /> {errors.phone}
                </p>
              )}
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                E-mail <span className="text-ink-3 font-normal text-xs">(para Pix e Cartão)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="seu@email.com"
                className={inputClass('email')}
              />
              {touched.email && errors.email && (
                <p className="text-danger text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={13} className="flex-shrink-0" /> {errors.email}
                </p>
              )}
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                CPF <span className="text-ink-3 font-normal text-xs">(para Pix)</span>
              </label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                onBlur={() => handleBlur('cpf')}
                placeholder="000.000.000-00"
                maxLength={14}
                className={inputClass('cpf')}
              />
              {touched.cpf && errors.cpf && (
                <p className="text-danger text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={13} className="flex-shrink-0" /> {errors.cpf}
                </p>
              )}
            </div>

            {/* Endereço — só para entrega */}
            {isDelivery && (
            <div className="border-t border-brand-line pt-4">
              <p className="text-sm font-bold text-ink mb-3 flex items-center gap-1.5">
                <MapPin size={15} className="text-brand" /> Endereço de entrega
              </p>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-ink mb-1.5">Rua</label>
                    <input
                      type="text"
                      value={rua}
                      onChange={(e) => setRua(maskName(e.target.value))}
                      onBlur={() => handleBlur('rua')}
                      placeholder="Nome da rua"
                      className={inputClass('rua')}
                    />
                    {touched.rua && errors.rua && (
                      <p className="text-danger text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={13} className="flex-shrink-0" /> {errors.rua}
                      </p>
                    )}
                  </div>
                  <div className="w-24">
                    <label className="block text-sm font-semibold text-ink mb-1.5">Nº</label>
                    <input
                      type="text"
                      value={numero}
                      onChange={(e) => setNumero(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onBlur={() => handleBlur('numero')}
                      placeholder="123"
                      inputMode="numeric"
                      className={`w-full border rounded-xl px-3 py-3 text-base focus:outline-none transition-colors ${
                        touched.numero && errors.numero
                          ? 'border-danger-line focus:border-danger bg-danger-bg'
                          : 'border-brand-line focus:border-brand'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-ink mb-1.5">Bairro</label>
                    <input
                      type="text"
                      value={bairro}
                      onChange={(e) => setBairro(maskName(e.target.value))}
                      onBlur={() => handleBlur('bairro')}
                      placeholder="Seu bairro"
                      className={inputClass('bairro')}
                    />
                    {touched.bairro && errors.bairro && (
                      <p className="text-danger text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={13} className="flex-shrink-0" /> {errors.bairro}
                      </p>
                    )}
                  </div>
                  <div className="w-36">
                    <label className="block text-sm font-semibold text-ink mb-1.5">
                      CEP <span className="text-ink-3 font-normal text-xs">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={cep}
                      onChange={(e) => setCep(maskCEP(e.target.value))}
                      onBlur={() => handleBlur('cep')}
                      placeholder="00000-000"
                      maxLength={9}
                      className={`w-full border rounded-xl px-3 py-3 text-base focus:outline-none transition-colors ${
                        touched.cep && errors.cep
                          ? 'border-danger-line focus:border-danger bg-danger-bg'
                          : 'border-brand-line focus:border-brand'
                      }`}
                    />
                    {touched.cep && errors.cep && (
                      <p className="text-danger text-xs mt-1 flex items-center gap-1">
                        <AlertCircle size={13} className="flex-shrink-0" /> {errors.cep}
                      </p>
                    )}
                  </div>
                </div>
                {deliveryFee > 0 && missingForFree > 0 && (
                  <p className="text-xs text-brand bg-brand-soft rounded-lg px-3 py-2">
                    Faltam <strong>R$ {missingForFree.toFixed(2).replace('.', ',')}</strong> em cookies para a entrega sair de graça.
                  </p>
                )}
              </div>
            </div>
            )}

            {/* Observações */}
            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">
                Observações <span className="text-ink-3 font-normal text-xs">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma observação?"
                rows={2}
                className="w-full border border-brand-line rounded-xl px-4 py-3 text-base focus:outline-none focus:border-brand resize-none"
              />
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-brand text-brand-ink font-bold py-4 rounded-xl text-base active:bg-brand-strong transition-colors flex items-center justify-center gap-2"
            >
              Continuar para pagamento <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: Pagamento */}
        {step === 'payment' && (
          <>
            {/* Seleção método */}
            <div className="bg-surface rounded-2xl border border-brand-line shadow-card p-4">
              <h2 className="font-display font-bold text-ink mb-3">Forma de Pagamento</h2>
              <div className="grid grid-cols-3 gap-2">
                {(['PIX', 'CARD', 'CASH'] as PaymentMethod[]).map((method) => {
                  const config = {
                    PIX:  { Icon: QrCode, label: 'Pix', sub: 'Instantâneo' },
                    CARD: { Icon: CreditCardIcon, label: 'Cartão', sub: 'Crédito/Débito' },
                    CASH: { Icon: Banknote, label: 'Dinheiro', sub: isDelivery ? 'Na entrega' : 'Na retirada' },
                  }[method]
                  const active = payment === method
                  return (
                    <button key={method} type="button" onClick={() => setPayment(method)}
                      className={`py-3 px-2 rounded-xl border-2 transition-all text-center active:scale-95 ${
                        active ? 'border-brand bg-brand-soft' : 'border-brand-line'
                      }`}>
                      <div className={`w-10 h-10 mx-auto mb-1.5 rounded-full flex items-center justify-center ${
                        active ? 'bg-brand text-brand-ink' : 'bg-brand-soft text-brand'
                      }`}>
                        <config.Icon size={19} />
                      </div>
                      <div className={`text-sm font-bold ${active ? 'text-brand' : 'text-ink-2'}`}>{config.label}</div>
                      <div className="text-xs text-ink-3 mt-0.5 leading-tight">{config.sub}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* PIX */}
            {payment === 'PIX' && (
              <div className="bg-surface rounded-2xl border border-brand-line shadow-card p-4 space-y-3">
                <div className="bg-success-bg rounded-xl p-3 flex gap-3">
                  <QrCode size={22} className="text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-success text-sm">Como funciona</p>
                    <p className="text-xs text-success mt-0.5">
                      Você receberá um QR Code. Pague pelo app do seu banco e o pedido é confirmado automaticamente.
                    </p>
                  </div>
                </div>
                {error && <p className="text-danger text-sm bg-danger-bg px-3 py-2 rounded-xl">{error}</p>}
                <button onClick={handlePixPayment} disabled={loading}
                  className="w-full bg-success-solid text-white font-bold py-4 rounded-xl text-base disabled:opacity-60 active:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <QrCode size={18} /> {loading ? 'Gerando QR Code...' : 'Gerar QR Code Pix'}
                </button>
              </div>
            )}

            {/* CARTÃO */}
            {payment === 'CARD' && (
              <div className="bg-surface rounded-2xl border border-brand-line shadow-card p-4">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-full bg-brand-soft flex items-center justify-center">
                    <ShieldCheck size={18} className="text-brand" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm">Pagamento seguro</p>
                    <p className="text-xs text-ink-3">Mercado Pago · SSL</p>
                  </div>
                </div>
                <CardPayment
                  initialization={{ amount: grandTotal, payer: { email } }}
                  customization={{
                    paymentMethods: { types: { included: ['credit_card', 'debit_card'] } },
                    visual: { style: { theme: 'default' }, hideFormTitle: true },
                  }}
                  onSubmit={handleCardSubmit}
                  onError={(err) => setError('Erro no cartão: ' + err.message)}
                />
                {error && <p className="text-danger text-sm bg-danger-bg px-3 py-2 rounded-xl mt-3">{error}</p>}
                {loading && <div className="text-center py-3 text-ink-2 text-sm">Processando...</div>}
              </div>
            )}

            {/* DINHEIRO */}
            {payment === 'CASH' && (
              <div className="bg-surface rounded-2xl border border-brand-line shadow-card p-4 space-y-3">
                <div className="bg-warn-bg rounded-xl p-3 flex gap-3">
                  <Banknote size={22} className="text-warn flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-warn text-sm">Pagamento em dinheiro</p>
                    <p className="text-xs text-warn mt-0.5">
                      {isDelivery ? 'Você paga em dinheiro na entrega.' : 'Você paga em dinheiro quando for buscar os cookies.'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    Vai precisar de troco? Informe o valor que vai pagar:
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3 font-medium">R$</span>
                    <input type="number" min={grandTotal} step="0.01" value={change}
                      onChange={(e) => setChange(e.target.value)}
                      placeholder={String((Math.ceil(grandTotal / 10) * 10).toFixed(2))}
                      className="w-full border border-brand-line rounded-xl pl-10 pr-4 py-3 text-base focus:outline-none focus:border-brand" />
                  </div>
                  {change && parseFloat(change) >= grandTotal && (
                    <p className="text-sm text-success mt-1.5 font-semibold">
                      Troco: R$ {(parseFloat(change) - grandTotal).toFixed(2).replace('.', ',')}
                    </p>
                  )}
                </div>
                {error && <p className="text-danger text-sm bg-danger-bg px-3 py-2 rounded-xl">{error}</p>}
                <button onClick={handleCashOrder} disabled={loading}
                  className="w-full bg-brand text-brand-ink font-bold py-4 rounded-xl text-base disabled:opacity-60 active:bg-brand-strong transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 size={18} /> {loading ? 'Confirmando...' : 'Confirmar Pedido'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
