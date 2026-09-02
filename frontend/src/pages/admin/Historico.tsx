import { useEffect, useMemo, useState } from 'react'
import { getHistory, getHistoryActors } from '../../api/api'
import { AuditEntry } from '../../types'
import {
  Loader2, RefreshCw, User, Globe, Search,
  Wallet, NotebookPen, ShoppingBag, Package, UserRound, LogIn, ShieldAlert, Trash2, HandCoins, MessageCircle,
  PackageCheck,
} from 'lucide-react'

/** Aparencia de cada tipo de acao no historico */
const ESTILO: Record<string, { Icon: typeof Wallet; cor: string; fundo: string }> = {
  venda_criada:       { Icon: Wallet,       cor: 'text-brand', fundo: 'bg-brand-soft' },
  venda_paga:         { Icon: Wallet,       cor: 'text-success',    fundo: 'bg-success-bg' },
  venda_parcial:      { Icon: HandCoins,    cor: 'text-brand',   fundo: 'bg-brand-soft' },
  venda_estornada:    { Icon: Wallet,       cor: 'text-warn',   fundo: 'bg-warn-bg' },
  venda_anotada:      { Icon: NotebookPen,  cor: 'text-info',     fundo: 'bg-info-bg' },
  venda_desanotada:   { Icon: NotebookPen,  cor: 'text-warn',   fundo: 'bg-warn-bg' },
  anotou_todas:       { Icon: NotebookPen,  cor: 'text-info',     fundo: 'bg-info-bg' },
  venda_excluida:     { Icon: Trash2,       cor: 'text-danger',      fundo: 'bg-danger-bg' },
  quitou_tudo:        { Icon: Wallet,       cor: 'text-success',    fundo: 'bg-success-bg' },
  pedido_site:        { Icon: ShoppingBag,  cor: 'text-accent',   fundo: 'bg-accent-bg' },
  pedido_anotado:     { Icon: ShoppingBag,  cor: 'text-brand', fundo: 'bg-brand-soft' },
  pedido_status:      { Icon: ShoppingBag,  cor: 'text-info',     fundo: 'bg-info-bg' },
  pagamento_aprovado: { Icon: Wallet,       cor: 'text-success',    fundo: 'bg-success-bg' },
  pagamento_recusado: { Icon: Wallet,       cor: 'text-danger',      fundo: 'bg-danger-bg' },
  producao_aberta:    { Icon: PackageCheck, cor: 'text-brand',   fundo: 'bg-brand-soft' },
  producao_ajustada:  { Icon: PackageCheck, cor: 'text-info',    fundo: 'bg-info-bg' },
  producao_fechada:   { Icon: PackageCheck, cor: 'text-success', fundo: 'bg-success-bg' },
  estoque_ajustado:   { Icon: Package,      cor: 'text-brand', fundo: 'bg-brand-soft' },
  estoque_definido:   { Icon: Package,      cor: 'text-brand', fundo: 'bg-brand-soft' },
  cliente_criado:     { Icon: UserRound,    cor: 'text-success',    fundo: 'bg-success-bg' },
  cliente_renomeado:  { Icon: UserRound,    cor: 'text-info',     fundo: 'bg-info-bg' },
  cliente_apelido:    { Icon: UserRound,    cor: 'text-info',     fundo: 'bg-info-bg' },
  cobranca_aberta:    { Icon: MessageCircle, cor: 'text-success',    fundo: 'bg-success-bg' },
  cliente_telefone:   { Icon: UserRound,    cor: 'text-info',     fundo: 'bg-info-bg' },
  cliente_excluido:   { Icon: Trash2,       cor: 'text-danger',      fundo: 'bg-danger-bg' },
  cliente_juntado:    { Icon: UserRound,    cor: 'text-info',     fundo: 'bg-info-bg' },
  login:              { Icon: LogIn,        cor: 'text-ink-2',     fundo: 'bg-surface-2' },
  login_falha:        { Icon: ShieldAlert,  cor: 'text-danger',      fundo: 'bg-danger-bg' },
}
const PADRAO = { Icon: Wallet, cor: 'text-ink-2', fundo: 'bg-surface-2' }

const FILTROS = [
  { v: '',         label: 'Tudo' },
  { v: 'venda',    label: 'Caderneta' },
  { v: 'pedido',   label: 'Pedidos' },
  { v: 'produto',  label: 'Estoque' },
  { v: 'producao', label: 'Produção' },
  { v: 'cliente',  label: 'Clientes' },
  { v: 'acesso',   label: 'Acessos' },
]

/** "hoje", "ontem" ou a data */
function grupoDoDia(iso: string) {
  const d = new Date(iso)
  const hoje = new Date()
  const ontem = new Date(); ontem.setDate(hoje.getDate() - 1)
  const mesmoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (mesmoDia(d, hoje)) return 'Hoje'
  if (mesmoDia(d, ontem)) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

export default function Historico() {
  const [itens, setItens] = useState<AuditEntry[]>([])
  const [pessoas, setPessoas] = useState<string[]>([])
  const [entidade, setEntidade] = useState('')
  const [pessoa, setPessoa] = useState('')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  const carregar = async () => {
    setLoading(true)
    try {
      const [lista, atores] = await Promise.all([
        getHistory({ entity: entidade || undefined, actor: pessoa || undefined, limit: 200 }),
        getHistoryActors(),
      ])
      setItens(lista)
      setPessoas(atores)
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [entidade, pessoa])

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return q ? itens.filter((i) => i.description.toLowerCase().includes(q)) : itens
  }, [busca, itens])

  // agrupa por dia, mantendo a ordem (mais recente primeiro)
  const porDia = useMemo(() => {
    const grupos: { dia: string; itens: AuditEntry[] }[] = []
    for (const item of filtrados) {
      const dia = grupoDoDia(item.createdAt)
      const ultimo = grupos[grupos.length - 1]
      if (ultimo && ultimo.dia === dia) ultimo.itens.push(item)
      else grupos.push({ dia, itens: [item] })
    }
    return grupos
  }, [filtrados])

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-surface rounded-xl border border-line p-3 shadow-card space-y-3">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button key={f.v} onClick={() => setEntidade(f.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                entidade === f.v ? 'bg-brand text-brand-ink border-brand'
                                 : 'bg-surface text-ink-2 border-line hover:border-brand'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no histórico..."
              className="w-full bg-surface border border-line rounded-xl pl-8 pr-3 h-10 text-sm text-ink transition-colors focus:outline-none focus:border-brand" />
          </div>
          <div className="flex gap-2">
            <select value={pessoa} onChange={(e) => setPessoa(e.target.value)}
              aria-label="Filtrar por pessoa"
              className="flex-1 sm:flex-none bg-surface border border-line rounded-xl px-3 h-10 text-sm text-ink transition-colors focus:outline-none focus:border-brand">
              <option value="">Todos</option>
              {pessoas.map((p) => <option key={p} value={p}>{p === 'site' ? 'Site (clientes)' : p}</option>)}
            </select>
            <button onClick={carregar} title="Atualizar" aria-label="Atualizar histórico"
              className="w-10 h-10 flex-shrink-0 rounded-xl border border-line text-ink-2 hover:border-brand hover:text-brand flex items-center justify-center transition-colors">
              <RefreshCw size={15} className={loading ? 'animate-spin' : undefined} />
            </button>
          </div>
        </div>
      </div>

      {/* Linha do tempo */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={26} className="animate-spin text-brand" /></div>
      ) : porDia.length === 0 ? (
        <p className="text-center text-ink-3 py-10 text-sm">Nenhum registro encontrado.</p>
      ) : (
        porDia.map(({ dia, itens: doDia }) => (
          <div key={dia}>
            <p className="text-xs font-bold text-ink-3 uppercase tracking-wide mb-2 px-1">{dia}</p>
            <div className="bg-surface rounded-xl border border-line shadow-card divide-y divide-line-soft">
              {doDia.map((it) => {
                const { Icon, cor, fundo } = ESTILO[it.action] ?? PADRAO
                const doSite = it.actor === 'site'
                return (
                  <div key={it.id} className="flex items-start gap-3 p-3">
                    <div className={`w-8 h-8 rounded-full ${fundo} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={15} className={cor} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink leading-snug">{it.description}</p>
                      <p className="text-[11px] text-ink-3 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          {doSite ? <Globe size={10} /> : <User size={10} />}
                          {doSite ? 'site' : it.actor}
                        </span>
                        <span>·</span>
                        <span>{hora(it.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      {!loading && filtrados.length >= 200 && (
        <p className="text-center text-xs text-ink-3">
          Mostrando os 200 registros mais recentes.
        </p>
      )}
    </div>
  )
}
