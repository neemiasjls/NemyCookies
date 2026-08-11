import { useEffect, useMemo, useRef, useState } from 'react'
import { TabCustomer } from '../types'
import { Search, X, UserPlus } from 'lucide-react'

interface Props {
  customers: TabCustomer[]
  value: number | null
  onChange: (id: number | null) => void
  /** Se informado, mostra a opcao de cadastrar quando o nome nao existe */
  onCreate?: (nome: string) => Promise<void> | void
  placeholder?: string
  /** Texto exibido quando a busca nao encontra ninguem */
  vazioTexto?: string
}

export default function SeletorCliente({
  customers, value, onChange, onCreate,
  placeholder = 'Buscar cliente pelo nome...',
  vazioTexto = 'Ninguém com esse nome.',
}: Props) {
  const [busca, setBusca] = useState('')
  const [aberto, setAberto] = useState(false)
  const caixaRef = useRef<HTMLDivElement>(null)

  const selecionado = customers.find((c) => c.id === value)

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return
    const cliqueFora = (e: MouseEvent) => {
      if (caixaRef.current && !caixaRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    const tecla = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('mousedown', cliqueFora)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', cliqueFora)
      document.removeEventListener('keydown', tecla)
    }
  }, [aberto])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? customers.filter((c) => c.name.toLowerCase().includes(q)) : customers
  }, [busca, customers])

  const nomeNovo = busca.trim()
  const podeCadastrar = !!onCreate && nomeNovo &&
    !customers.some((c) => c.name.toLowerCase() === nomeNovo.toLowerCase())

  if (selecionado) {
    return (
      <div className="flex items-center gap-2 bg-orange-50 border border-cookie-brown rounded-lg px-3 py-2">
        <span className="flex-1 text-sm font-semibold text-cookie-dark truncate">{selecionado.name}</span>
        <button
          onClick={() => { onChange(null); setBusca(''); setAberto(false) }}
          aria-label="Trocar cliente"
          className="w-6 h-6 rounded-full hover:bg-orange-100 flex items-center justify-center flex-shrink-0"
        >
          <X size={14} className="text-gray-500" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={caixaRef}>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-label="Abrir busca"
        className="absolute left-0 top-0 h-full w-9 flex items-center justify-center text-gray-400 hover:text-cookie-brown transition-colors"
      >
        <Search size={15} />
      </button>
      <input
        value={busca}
        onChange={(e) => { setBusca(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-cookie-brown"
      />

      {aberto && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
          <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
            {filtrados.map((c) => (
              <button
                key={c.id}
                onClick={() => { onChange(c.id); setBusca(''); setAberto(false) }}
                className="w-full px-3 py-2 hover:bg-orange-50 text-left text-sm text-cookie-dark truncate transition-colors"
              >
                {c.name}
              </button>
            ))}
            {filtrados.length === 0 && (
              <p className="px-3 py-2.5 text-xs text-gray-400">{vazioTexto}</p>
            )}
          </div>

          {podeCadastrar && (
            <button
              onClick={async () => { await onCreate!(nomeNovo); setBusca(''); setAberto(false) }}
              className="w-full flex items-center gap-1.5 border-t border-gray-100 px-3 py-2.5 text-xs font-semibold text-cookie-brown hover:bg-orange-50 transition-colors"
            >
              <UserPlus size={13} /> Cadastrar "{nomeNovo}"
            </button>
          )}
        </div>
      )}
    </div>
  )
}
