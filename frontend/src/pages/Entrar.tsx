import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { entrarFidelidade, FIDELIDADE_TOKEN } from '../api/api'
import { maskPhone } from '../utils/masks'
import { WHATSAPP } from '../contato'
import ThemeToggle from '../components/ThemeToggle'
import WhatsAppIcon from '../components/WhatsAppIcon'

/** Login da area da cliente: telefone e a senha que ela criou pelo convite (nao ha cadastro aberto). */
export default function Entrar() {
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)
  const navigate = useNavigate()

  if (localStorage.getItem(FIDELIDADE_TOKEN)) return <Navigate to="/fidelidade" replace />

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setEntrando(true)
    try {
      const { token } = await entrarFidelidade(telefone.replace(/\D/g, ''), senha)
      localStorage.setItem(FIDELIDADE_TOKEN, token)
      navigate('/fidelidade', { replace: true })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível entrar')
    } finally {
      setEntrando(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-shell flex items-center justify-center px-4 py-10 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(224,150,79,0.28), transparent)' }}
      />

      <Link to="/" className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-sm text-ink-3 hover:text-brand transition-colors">
        <ArrowLeft size={16} /> Cardápio
      </Link>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle variant="shell" />
      </div>

      <div className="relative w-full max-w-sm bg-surface border border-line rounded-3xl p-7 sm:p-8 shadow-pop animate-fade-up">
        <div className="text-center mb-7">
          <img src="/logo.png" alt="" className="h-16 w-16 object-contain mx-auto mb-4 rounded-full ring-1 ring-line" />
          <h1 className="font-display text-[22px] font-bold text-ink leading-tight">Área da cliente</h1>
          <p className="text-ink-3 text-sm mt-1">Seus pontos NemyCookies</p>
        </div>

        <form onSubmit={entrar} className="space-y-4">
          <div>
            <label htmlFor="telefone" className="block text-[13px] font-semibold text-ink-2 mb-1.5">Telefone</label>
            <input
              id="telefone"
              type="tel"
              inputMode="numeric"
              required
              autoComplete="username"
              placeholder="(14) 99999-9999"
              value={telefone}
              onChange={(e) => setTelefone(maskPhone(e.target.value))}
              className="w-full bg-surface border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink transition-colors focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="senha" className="block text-[13px] font-semibold text-ink-2 mb-1.5">Senha</label>
            <div className="relative">
              <input
                id="senha"
                type={verSenha ? 'text' : 'password'}
                required
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-surface border border-line rounded-xl pl-3.5 pr-11 py-2.5 text-sm text-ink transition-colors focus:outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() => setVerSenha((v) => !v)}
                aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                title={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center
                           text-ink-3 hover:text-brand rounded-lg transition-colors"
              >
                {verSenha ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {erro && (
            <p className="flex items-start gap-2 text-danger text-sm bg-danger-bg border border-danger-line px-3 py-2.5 rounded-xl">
              <ShieldAlert size={16} className="flex-shrink-0 mt-px" />
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={entrando}
            className="w-full bg-brand hover:bg-brand-strong text-brand-ink font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="text-center text-xs text-ink-3 mt-6 leading-relaxed space-y-1.5">
          <p>
            Primeiro acesso?{' '}
            <Link to="/primeiro-acesso" className="font-semibold text-brand hover:underline">Crie sua senha com o código</Link>
          </p>
          <p>
            Esqueceu a senha?{' '}
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
              <WhatsAppIcon size={12} /> Peça um convite novo
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
