import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Tema, lerTema, aplicarTema } from '../theme'

/**
 * Botao de tema. `shell` e para as barras escuras (topo do painel, rodape);
 * `surface` e para o fundo claro das paginas.
 */
export default function ThemeToggle({ variant = 'surface' }: { variant?: 'shell' | 'surface' }) {
  const [tema, setTema] = useState<Tema>('light')

  useEffect(() => { setTema(lerTema()) }, [])

  const alternar = () => {
    const novo: Tema = tema === 'dark' ? 'light' : 'dark'
    setTema(novo)
    aplicarTema(novo)
  }

  const escuro = tema === 'dark'
  const estilo = variant === 'shell'
    ? 'text-shell-2 hover:text-shell-ink hover:bg-white/10'
    : 'text-ink-2 hover:text-brand hover:bg-brand-soft border border-line'

  return (
    <button
      onClick={alternar}
      role="switch"
      aria-checked={escuro}
      aria-label={escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${estilo}`}
    >
      <Sun
        size={16}
        className={`absolute transition-all duration-300 ease-out ${
          escuro ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
        }`}
      />
      <Moon
        size={16}
        className={`absolute transition-all duration-300 ease-out ${
          escuro ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
      />
    </button>
  )
}
