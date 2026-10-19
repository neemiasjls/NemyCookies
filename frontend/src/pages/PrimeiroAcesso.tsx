import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, ShieldAlert, Loader2 } from 'lucide-react'
import { criarSenhaPeloConvite, getConvite, FIDELIDADE_TOKEN } from '../api/api'
import { maskPhone } from '../utils/masks'
import { WHATSAPP } from '../contato'
import ThemeToggle from '../components/ThemeToggle'
import WhatsAppIcon from '../components/WhatsAppIcon'

const campo = 'w-full bg-surface border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink transition-colors focus:outline-none focus:border-brand'

/**
 * Convite de primeiro acesso (ou de senha esquecida): o link chega pelo WhatsApp da loja,
 * ela confirma o telefone e cria a propria senha. Sem o link, da para digitar o codigo.
 */
export default function PrimeiroAcesso() {
  const [params] = useSearchParams()
  const [codigo, setCodigo] = useState(params.get('c') ?? '')
  const [nome, setNome] = useState<string | null>(null)
  const [conferindo, setConferindo] = useState(!!params.get('c'))
  const [telefone, setTelefone] = useState('')
  const [senha, setSenha] = useState('')
  const [repetir, setRepetir] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const navigate = useNavigate()

  // veio pelo link: confere o convite e cumprimenta pelo nome
  useEffect(() => {
    const c = params.get('c')
    if (!c) return
    getConvite(c)
      .then((r) => setNome(r.nome))
      .catch((e: Error) => setErro(e.message))
      .finally(() => setConferindo(false))
  }, [params])

  const criar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.')
    if (senha !== repetir) return setErro('As duas senhas não estão iguais.')
    setSalvando(true)
    try {
      const { token } = await criarSenhaPeloConvite(codigo, telefone.replace(/\D/g, ''), senha)
      localStorage.setItem(FIDELIDADE_TOKEN, token)
      navigate('/fidelidade', { replace: true })
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível criar a senha')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-shell flex items-center justify-center px-4 py-10 overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(224,150,79,0.28), transparent)' }}
      />

      <Link to="/entrar" className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-sm text-ink-3 hover:text-brand transition-colors">
        <ArrowLeft size={16} /> Entrar
      </Link>
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle variant="shell" />
      </div>

      <div className="relative w-full max-w-sm bg-surface border border-line rounded-3xl p-7 sm:p-8 shadow-pop animate-fade-up">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="" className="h-16 w-16 object-contain mx-auto mb-4 rounded-full ring-1 ring-line" />
          <h1 className="font-display text-[22px] font-bold text-ink leading-tight">
            {nome ? `Oi, ${nome}!` : 'Crie sua senha'}
          </h1>
          <p className="text-ink-3 text-sm mt-1">
            {nome ? 'Crie sua senha para ver seus pontos' : 'Use o código que a NemyCookies te mandou'}
          </p>
        </div>

        {conferindo ? (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-brand" /></div>
        ) : (
          <form onSubmit={criar} className="space-y-4">
            {/* veio pelo link e o convite valeu: o codigo nao precisa aparecer */}
            {!nome && (
              <div>
                <label htmlFor="codigo" className="block text-[13px] font-semibold text-ink-2 mb-1.5">Código do convite</label>
                <input id="codigo" required autoCapitalize="characters" autoComplete="one-time-code" spellCheck={false}
                  placeholder="ABCD-1234" value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className={`${campo} tracking-widest font-mono`} />
              </div>
            )}
            <div>
              <label htmlFor="telefone" className="block text-[13px] font-semibold text-ink-2 mb-1.5">Seu telefone</label>
              <input id="telefone" type="tel" inputMode="numeric" required autoComplete="username"
                placeholder="(14) 99999-9999" value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))} className={campo} />
              <p className="text-[11px] text-ink-3 mt-1">O número em que você recebeu a mensagem. Ele vai ser o seu login.</p>
            </div>
            <div>
              <label htmlFor="senha" className="block text-[13px] font-semibold text-ink-2 mb-1.5">Nova senha</label>
              <div className="relative">
                <input id="senha" type={verSenha ? 'text' : 'password'} required minLength={6} autoComplete="new-password"
                  autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  value={senha} onChange={(e) => setSenha(e.target.value)} className={`${campo} pr-11`} />
                <button type="button" onClick={() => setVerSenha((v) => !v)}
                  aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'} title={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-ink-3 hover:text-brand rounded-lg transition-colors">
                  {verSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="text-[11px] text-ink-3 mt-1">Pelo menos 6 caracteres.</p>
            </div>
            <div>
              <label htmlFor="repetir" className="block text-[13px] font-semibold text-ink-2 mb-1.5">Repita a senha</label>
              <input id="repetir" type={verSenha ? 'text' : 'password'} required autoComplete="new-password"
                autoCapitalize="none" autoCorrect="off" spellCheck={false}
                value={repetir} onChange={(e) => setRepetir(e.target.value)} className={campo} />
            </div>

            {erro && (
              <p className="flex items-start gap-2 text-danger text-sm bg-danger-bg border border-danger-line px-3 py-2.5 rounded-xl">
                <ShieldAlert size={16} className="flex-shrink-0 mt-px" />
                {erro}
              </p>
            )}

            <button type="submit" disabled={salvando}
              className="w-full bg-brand hover:bg-brand-strong text-brand-ink font-bold py-3 rounded-xl transition-colors disabled:opacity-60">
              {salvando ? 'Salvando...' : 'Criar senha e entrar'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-ink-3 mt-6 leading-relaxed">
          O convite vale por 7 dias. Venceu?{' '}
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
             className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
            <WhatsAppIcon size={12} /> Peça outro
          </a>
        </p>
      </div>
    </div>
  )
}
