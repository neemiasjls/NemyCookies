import { Plus, Pencil, Store } from 'lucide-react'
import { criarEstabelecimento, renomearEstabelecimento } from '../api/api'
import { Estabelecimento } from '../types'

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

/**
 * Chips com os estabelecimentos de fiado. Cada um tem os proprios clientes e o
 * proprio "A receber". Os nomes vem do banco; cadastrar e renomear e por aqui.
 */
export default function SeletorEstabelecimento({
  lista, id, onEscolher, onMudou,
}: {
  lista: Estabelecimento[]
  id: number | null
  onEscolher: (id: number) => void
  /** depois de criar ou renomear: recarrega a lista e, se veio id, abre ele */
  onMudou: (novoId?: number) => void
}) {
  const atual = lista.find((e) => e.id === id)

  const novo = async () => {
    const nome = prompt('Nome do novo estabelecimento de fiado:')
    if (!nome?.trim()) return
    try {
      const e = await criarEstabelecimento(nome.trim())
      onMudou(e.id)
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro ao cadastrar') }
  }

  const renomear = async () => {
    if (!atual) return
    const nome = prompt('Novo nome do estabelecimento:', atual.nome)
    if (!nome?.trim() || nome.trim() === atual.nome) return
    try {
      await renomearEstabelecimento(atual.id, nome.trim())
      onMudou()
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro ao renomear') }
  }

  return (
    <div className="bg-surface rounded-xl border border-line p-3 shadow-card">
      <div className="flex items-center gap-1.5 mb-2">
        <Store size={14} className="text-fiado" />
        <span className="text-xs font-semibold text-ink-2">Estabelecimento</span>
        {atual && (
          <button onClick={renomear} title="Renomear este estabelecimento"
            className="ml-auto text-ink-3 hover:text-brand p-1 transition-colors">
            <Pencil size={12} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {lista.map((e) => {
          const ativo = e.id === id
          return (
            <button key={e.id} onClick={() => onEscolher(e.id)}
              aria-pressed={ativo}
              className={`h-8 px-3 rounded-full text-xs font-semibold border transition-colors inline-flex items-center gap-1.5 ${
                ativo ? 'bg-fiado text-surface border-fiado' : 'text-ink-2 border-line hover:border-fiado'
              }`}>
              {e.nome}
              {e.aReceber > 0 && (
                <span className={`tabular-nums font-bold ${ativo ? 'opacity-80' : 'text-warn'}`}>
                  {brl(e.aReceber)}
                </span>
              )}
            </button>
          )
        })}
        <button onClick={novo}
          className="h-8 px-3 rounded-full text-xs font-semibold border border-dashed border-line text-ink-3 hover:text-brand hover:border-brand transition-colors inline-flex items-center gap-1">
          <Plus size={12} /> Novo
        </button>
      </div>
    </div>
  )
}
