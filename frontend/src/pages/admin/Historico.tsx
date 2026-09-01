import { useEffect, useMemo, useState } from 'react'
import { getHistory, getHistoryActors } from '../../api/api'
import { AuditEntry } from '../../types'
import {
  Loader2, RefreshCw, User, Globe, Search,
  Wallet, NotebookPen, ShoppingBag, Package, UserRound, LogIn, ShieldAlert, Trash2, HandCoins, MessageCircle,
} from 'lucide-react'

/** Aparencia de cada tipo de acao no historico */
const ESTILO: Record<string, { Icon: typeof Wallet; cor: string; fundo: string }> = {
  venda_criada:       { Icon: Wallet,       cor: 'text-cookie-brown', fundo: 'bg-orange-50' },
  venda_paga:         { Icon: Wallet,       cor: 'text-green-700',    fundo: 'bg-green-50' },
  venda_parcial:      { Icon: HandCoins,    cor: 'text-orange-700',   fundo: 'bg-orange-50' },
  venda_estornada:    { Icon: Wallet,       cor: 'text-yellow-700',   fundo: 'bg-yellow-50' },
  venda_anotada:      { Icon: NotebookPen,  cor: 'text-blue-700',     fundo: 'bg-blue-50' },
  venda_desanotada:   { Icon: NotebookPen,  cor: 'text-yellow-700',   fundo: 'bg-yellow-50' },
  anotou_todas:       { Icon: NotebookPen,  cor: 'text-blue-700',     fundo: 'bg-blue-50' },
  venda_excluida:     { Icon: Trash2,       cor: 'text-red-600',      fundo: 'bg-red-50' },
  quitou_tudo:        { Icon: Wallet,       cor: 'text-green-700',    fundo: 'bg-green-50' },
  pedido_site:        { Icon: ShoppingBag,  cor: 'text-purple-700',   fundo: 'bg-purple-50' },
  pedido_anotado:     { Icon: ShoppingBag,  cor: 'text-cookie-brown', fundo: 'bg-orange-50' },
  pedido_status:      { Icon: ShoppingBag,  cor: 'text-blue-700',     fundo: 'bg-blue-50' },
  pagamento_aprovado: { Icon: Wallet,       cor: 'text-green-700',    fundo: 'bg-green-50' },
  pagamento_recusado: { Icon: Wallet,       cor: 'text-red-600',      fundo: 'bg-red-50' },
  estoque_ajustado:   { Icon: Package,      cor: 'text-cookie-brown', fundo: 'bg-orange-50' },
  estoque_definido:   { Icon: Package,      cor: 'text-cookie-brown', fundo: 'bg-orange-50' },
  cliente_criado:     { Icon: UserRound,    cor: 'text-green-700',    fundo: 'bg-green-50' },
  cliente_renomeado:  { Icon: UserRound,    cor: 'text-blue-700',     fundo: 'bg-blue-50' },
  cliente_apelido:    { Icon: UserRound,    cor: 'text-blue-700',     fundo: 'bg-blue-50' },
  cobranca_aberta:    { Icon: MessageCircle, cor: 'text-green-700',    fundo: 'bg-green-50' },
  cliente_telefone:   { Icon: UserRound,    cor: 'text-blue-700',     fundo: 'bg-blue-50' },
  cliente_excluido:   { Icon: Trash2,       cor: 'text-red-600',      fundo: 'bg-red-50' },
  cliente_juntado:    { Icon: UserRound,    cor: 'text-blue-700',     fundo: 'bg-blue-50' },
  login:              { Icon: LogIn,        cor: 'text-gray-500',     fundo: 'bg-gray-100' },
  login_falha:        { Icon: ShieldAlert,  cor: 'text-red-600',      fundo: 'bg-red-50' },
}
const PADRAO = { Icon: Wallet, cor: 'text-gray-500', fundo: 'bg-gray-100' }

const FILTROS = [
  { v: '',         label: 'Tudo' },
  { v: 'venda',    label: 'Caderneta' },
  { v: 'pedido',   label: 'Pedidos' },
  { v: 'produto',  label: 'Estoque' },
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
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm space-y-3">
        <div className="flex flex-wrap gap-2">
          {FILTROS.map((f) => (
            <button key={f.v} onClick={() => setEntidade(f.v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                entidade === f.v ? 'bg-cookie-brown text-white border-cookie-brown'
                                 : 'bg-white text-gray-500 border-gray-200 hover:border-cookie-brown'
              }`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar no histórico..."
              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-cookie-brown" />
          </div>
          <select value={pessoa} onChange={(e) => setPessoa(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cookie-brown">
            <option value="">Todos</option>
            {pessoas.map((p) => <option key={p} value={p}>{p === 'site' ? 'Site (clientes)' : p}</option>)}
          </select>
          <button onClick={carregar} title="Atualizar"
            className="w-10 h-10 rounded-lg border border-gray-200 text-gray-500 hover:border-cookie-brown hover:text-cookie-brown flex items-center justify-center transition-colors">
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Linha do tempo */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 size={26} className="animate-spin text-cookie-brown" /></div>
      ) : porDia.length === 0 ? (
        <p className="text-center text-gray-400 py-10 text-sm">Nenhum registro encontrado.</p>
      ) : (
        porDia.map(({ dia, itens: doDia }) => (
          <div key={dia}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">{dia}</p>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {doDia.map((it) => {
                const { Icon, cor, fundo } = ESTILO[it.action] ?? PADRAO
                const doSite = it.actor === 'site'
                return (
                  <div key={it.id} className="flex items-start gap-3 p-3">
                    <div className={`w-8 h-8 rounded-full ${fundo} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={15} className={cor} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-cookie-dark leading-snug">{it.description}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
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
        <p className="text-center text-xs text-gray-400">
          Mostrando os 200 registros mais recentes.
        </p>
      )}
    </div>
  )
}
