import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * Campo de texto com uma lista de sugestoes que abre na seta.
 *
 * Nao uso o <datalist> do navegador: ele nao desenha seta nenhuma e, em varios
 * navegadores, so mostra as opcoes depois que voce digita alguma coisa — ou
 * seja, quem nao sabe que a lista existe nunca a encontra. Aqui a seta e
 * visivel, a lista abre ao clicar, e digitar continua funcionando para
 * cadastrar um valor novo.
 */
export default function CampoComSugestoes({
  valor, aoMudar, sugestoes, placeholder, className = '',
}: {
  valor: string
  aoMudar: (v: string) => void
  sugestoes: string[]
  placeholder?: string
  className?: string
}) {
  const [aberto, setAberto] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)

  // fecha ao clicar fora
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberto])

  // enquanto voce digita, a lista filtra; com o campo vazio, mostra todas
  const filtradas = valor.trim()
    ? sugestoes.filter((s) => s.toLowerCase().includes(valor.trim().toLowerCase()))
    : sugestoes

  const escolher = (s: string) => { aoMudar(s); setAberto(false) }

  return (
    <div ref={caixa} className={`relative ${className}`}>
      <input
        value={valor}
        onChange={(e) => { aoMudar(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
        onKeyDown={(e) => { if (e.key === 'Escape') setAberto(false) }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full text-sm border border-line rounded-lg pl-3 pr-8 h-10 bg-surface text-ink" />

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? 'Fechar sugestões' : 'Ver sugestões'}
        aria-expanded={aberto}
        className="absolute right-0 top-0 h-10 w-8 flex items-center justify-center text-ink-3 hover:text-brand transition-colors">
        <ChevronDown size={15} className={`transition-transform ${aberto ? 'rotate-180' : ''}`} />
      </button>

      {aberto && filtradas.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-20 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-line bg-surface shadow-pop py-1">
          {filtradas.map((s) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => escolher(s)}
                className="w-full text-left text-sm px-3 py-1.5 text-ink-2 hover:bg-brand-soft hover:text-brand transition-colors flex items-center gap-2">
                {s === valor
                  ? <Check size={13} className="text-brand flex-shrink-0" />
                  : <span className="w-[13px] flex-shrink-0" />}
                <span className="truncate">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {aberto && filtradas.length === 0 && valor.trim() && (
        <p className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-line bg-surface shadow-pop px-3 py-2 text-[11px] text-ink-3">
          Nenhum parecido. Pode deixar assim que ele entra na lista.
        </p>
      )}
    </div>
  )
}
