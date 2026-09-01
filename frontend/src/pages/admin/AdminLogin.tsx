import { useState } from 'react'
import { adminLogin } from '../../api/api'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'
import ThemeToggle from '../../components/ThemeToggle'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await adminLogin(username, password)
      localStorage.setItem('admin_token', token)
      navigate('/admin/dashboard')
    } catch {
      setError('Usuário ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-shell flex items-center justify-center px-4 py-10 overflow-hidden">
      {/* brilho quente atras do cartao, para a tela nao ser um retangulo preto */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[680px] h-[680px] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(224,150,79,0.28), transparent)' }}
      />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle variant="shell" />
      </div>

      <div className="relative w-full max-w-sm bg-surface border border-line rounded-3xl p-7 sm:p-8 shadow-pop animate-fade-up">
        <div className="text-center mb-7">
          <img
            src="/logo.png"
            alt=""
            className="h-16 w-16 object-contain mx-auto mb-4 rounded-full ring-1 ring-line"
          />
          <h1 className="font-display text-[22px] font-bold text-ink leading-tight">Painel Admin</h1>
          <p className="text-ink-3 text-sm mt-1">NemyCookies</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="usuario" className="block text-[13px] font-semibold text-ink-2 mb-1.5">Usuário</label>
            <input
              id="usuario"
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {error && (
            <p className="flex items-start gap-2 text-danger text-sm bg-danger-bg border border-danger-line px-3 py-2.5 rounded-xl">
              <ShieldAlert size={16} className="flex-shrink-0 mt-px" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand hover:bg-brand-strong text-brand-ink font-bold py-3 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
