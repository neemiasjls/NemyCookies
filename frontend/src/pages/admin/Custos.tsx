import { useEffect, useState } from 'react'
import {
  getCustos, salvarPreco, usarPrecoDeReferencia, excluirPreco,
  definirRendimento, salvarItemReceita, excluirItemReceita,
  salvarEmbalagem, excluirEmbalagem, salvarItemSabor, excluirItemSabor,
  salvarIngrediente, excluirIngrediente, getFormasPagamento, definirTaxaPagamento,
} from '../../api/api'
import {
  Custos as DadosCustos, CustoSabor, Ingrediente, PrecoIngrediente,
  MetodoPagamento, FormaPagamento,
} from '../../types'
import {
  Loader2, ChevronRight, Check, X, Plus, Trash2, Star, Pencil,
  Cookie, Wheat, Box, Carrot, CreditCard,
} from 'lucide-react'

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`
/** custo por grama e centavo de centavo: precisa de mais casas para nao virar 0,00 */
const brlFino = (v: number) => `R$ ${v.toFixed(4).replace('.', ',')}`
const num = (v: number) => String(v).replace('.', ',')

type Secao = 'sabores' | 'massa' | 'embalagem' | 'ingredientes' | 'maquininha'

const SECOES: { id: Secao; label: string; Icon: typeof Cookie }[] = [
  { id: 'sabores',     label: 'Sabores',     Icon: Cookie },
  { id: 'massa',       label: 'Massa',       Icon: Wheat },
  { id: 'embalagem',   label: 'Embalagem',   Icon: Box },
  { id: 'ingredientes',label: 'Ingredientes',Icon: Carrot },
  { id: 'maquininha', label: 'Maquininha', Icon: CreditCard },
]

const COMPONENTES: Record<string, string> = {
  chocolate: '🍫 Chocolate', recheio: '🧊 Recheio', topo: '🎂 Topo', extra: 'Extra',
}

/**
 * Custo de producao, vindo da planilha de precificacao.
 * A conta e em cadeia: preco do ingrediente -> receita da massa -> custo do sabor.
 * Mexer num preco recalcula os seis sabores sozinho.
 */
export default function Custos() {
  const [d, setD] = useState<DadosCustos | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [secao, setSecao] = useState<Secao>('sabores')
  const [erro, setErro] = useState('')

  const carregar = async () => {
    try { setD(await getCustos()); setErro('') }
    catch (e) { setErro(e instanceof Error ? e.message : 'Erro ao carregar') }
    finally { setCarregando(false) }
  }
  useEffect(() => { carregar() }, [])

  /** Executa a acao e recarrega tudo: o custo de um sabor depende de quase tudo. */
  const acao = async (fn: () => Promise<unknown>) => {
    try { await fn(); await carregar() }
    catch (e) { alert(e instanceof Error ? e.message : 'Nao deu certo') }
  }

  if (carregando) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={22} className="animate-spin text-brand" />
      </div>
    )
  }
  if (erro || !d) {
    return <p className="text-sm text-danger bg-danger-bg border border-danger-line rounded-xl p-4">{erro || 'Sem dados'}</p>
  }

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap gap-1.5" aria-label="Partes do custo">
        {SECOES.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setSecao(id)}
            aria-current={secao === id ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[13px] font-semibold transition-colors ${
              secao === id ? 'bg-brand text-brand-ink shadow-card' : 'text-ink-2 hover:text-brand hover:bg-brand-soft'
            }`}>
            <Icon size={14} className={secao === id ? undefined : 'text-ink-3'} />
            {label}
          </button>
        ))}
      </nav>

      {secao === 'sabores'     && <Sabores d={d} acao={acao} />}
      {secao === 'massa'       && <Massa d={d} acao={acao} />}
      {secao === 'embalagem'   && <Embalagens d={d} acao={acao} />}
      {secao === 'ingredientes'&& <Ingredientes d={d} acao={acao} />}
      {secao === 'maquininha'  && <Maquininha acao={acao} />}
    </div>
  )
}

type Props = { d: DadosCustos; acao: (fn: () => Promise<unknown>) => Promise<void> }

/* ============================ SABORES ============================ */
function Sabores({ d, acao }: Props) {
  const [aberto, setAberto] = useState<number | null>(null)

  return (
    <div className="space-y-2">
      {d.sabores.map((s) => (
        <SaborLinha key={s.productId} s={s} d={d} acao={acao}
          aberto={aberto === s.productId}
          alternar={() => setAberto(aberto === s.productId ? null : s.productId)} />
      ))}
      <p className="text-[11px] text-ink-3 px-1">
        Cada sabor soma os ingredientes dele + a massa ({brl(d.receita?.costPerCookie ?? 0)})
        + a embalagem ({brl(d.embalagemTotal)}).
      </p>
    </div>
  )
}

function SaborLinha({ s, d, acao, aberto, alternar }: {
  s: CustoSabor; d: DadosCustos; acao: Props['acao']; aberto: boolean; alternar: () => void
}) {
  const pctMargem = s.salePrice > 0 ? (s.margin / s.salePrice) * 100 : 0
  // proporcao de cada parte no custo, para a barra
  const fatia = (v: number) => (s.totalCost > 0 ? (v / s.totalCost) * 100 : 0)

  return (
    <div className="bg-surface rounded-xl border border-line shadow-card overflow-hidden">
      <button onClick={alternar} aria-expanded={aberto}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-2 transition-colors">
        <ChevronRight size={14}
          className={`flex-shrink-0 text-ink-3 transition-transform ${aberto ? 'rotate-90 text-brand' : ''}`} />
        <span className="font-display font-bold text-ink flex-1 min-w-0 truncate">
          {s.name.replace('Cookie ', '')}
        </span>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-ink tabular-nums">{brl(s.totalCost)}</p>
          <p className="text-[11px] text-ink-3 tabular-nums">custo</p>
        </div>
        <div className="text-right flex-shrink-0 w-20">
          <p className="text-sm font-bold text-success tabular-nums">{brl(s.margin)}</p>
          <p className="text-[11px] text-ink-3 tabular-nums">{pctMargem.toFixed(0)}% de {brl(s.salePrice)}</p>
        </div>
      </button>

      <div className="h-1.5 flex" title="ingredientes · massa · embalagem">
        <div className="bg-brand"        style={{ width: `${fatia(s.ingredientsCost)}%` }} />
        <div className="bg-gold"         style={{ width: `${fatia(s.doughCost)}%` }} />
        <div className="bg-ink-4 opacity-40" style={{ width: `${fatia(s.packagingCost)}%` }} />
      </div>

      {aberto && (
        <div className="p-3 pt-2.5 border-t border-line-soft bg-surface-2 animate-fade-up space-y-1">
          {s.itens.map((i) => (
            <div key={i.id} className="flex items-center gap-2 text-xs py-1">
              <span className="text-ink-3 w-[86px] flex-shrink-0 truncate">{COMPONENTES[i.component]}</span>
              <span className="text-ink-2 flex-1 min-w-0 truncate">{i.ingredientName}</span>
              <QuantidadeEditavel
                valor={i.quantity} sufixo={i.unit}
                salvar={(q) => acao(() => salvarItemSabor({ id: i.id, component: i.component, quantity: q }))} />
              <span className="text-ink font-semibold tabular-nums w-16 text-right">{brl(i.totalCost)}</span>
              <button onClick={() => { if (confirm(`Tirar ${i.ingredientName} do ${s.name}?`)) acao(() => excluirItemSabor(i.id)) }}
                title="Tirar do sabor"
                className="text-ink-3 hover:text-danger transition-colors flex-shrink-0"><Trash2 size={12} /></button>
            </div>
          ))}

          <div className="flex items-center gap-2 text-xs py-1 border-t border-line-soft mt-1 pt-2">
            <span className="text-ink-3 w-[86px] flex-shrink-0">🥣 Massa</span>
            <span className="text-ink-2 flex-1 min-w-0 truncate">
              rateio da receita ÷ {d.receita?.yield ?? 0}
            </span>
            <span className="text-ink font-semibold tabular-nums w-16 text-right">{brl(s.doughCost)}</span>
            <span className="w-3" />
          </div>
          <div className="flex items-center gap-2 text-xs py-1">
            <span className="text-ink-3 w-[86px] flex-shrink-0">📦 Embalagem</span>
            <span className="text-ink-2 flex-1 min-w-0 truncate">
              {d.embalagem.filter((e) => e.active).map((e) => e.name).join(' + ')}
            </span>
            <span className="text-ink font-semibold tabular-nums w-16 text-right">{brl(s.packagingCost)}</span>
            <span className="w-3" />
          </div>

          <NovoItemSabor produtoId={s.productId} ingredientes={d.ingredientes} acao={acao} />
        </div>
      )}
    </div>
  )
}

function NovoItemSabor({ produtoId, ingredientes, acao }: {
  produtoId: number; ingredientes: Ingrediente[]; acao: Props['acao']
}) {
  const [abrindo, setAbrindo] = useState(false)
  const [ing, setIng] = useState('')
  const [comp, setComp] = useState('chocolate')
  const [qtd, setQtd] = useState('')

  if (!abrindo) {
    return (
      <button onClick={() => setAbrindo(true)}
        className="text-[11px] font-semibold text-brand hover:text-brand-strong flex items-center gap-1 pt-1.5 transition-colors">
        <Plus size={12} /> Adicionar ingrediente
      </button>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line-soft mt-1">
      <select value={comp} onChange={(e) => setComp(e.target.value)}
        className="text-xs border border-line rounded-lg px-2 h-8 bg-surface text-ink">
        {Object.entries(COMPONENTES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <select value={ing} onChange={(e) => setIng(e.target.value)}
        className="text-xs border border-line rounded-lg px-2 h-8 bg-surface text-ink flex-1 min-w-[140px]">
        <option value="">escolha o ingrediente</option>
        {ingredientes.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
      </select>
      <input value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder="qtd" inputMode="decimal"
        className="text-xs border border-line rounded-lg px-2 h-8 w-16 bg-surface text-ink" />
      <button
        onClick={async () => {
          const q = Number(qtd.replace(',', '.'))
          if (!ing || !Number.isFinite(q) || q <= 0) return alert('Escolha o ingrediente e a quantidade')
          await acao(() => salvarItemSabor({ productId: produtoId, component: comp, ingredientId: Number(ing), quantity: q }))
          setAbrindo(false); setIng(''); setQtd('')
        }}
        className="h-8 px-2.5 rounded-lg bg-brand text-brand-ink text-xs font-bold">
        <Check size={13} strokeWidth={3} />
      </button>
      <button onClick={() => setAbrindo(false)} className="h-8 px-2 text-ink-3 hover:text-ink transition-colors">
        <X size={13} />
      </button>
    </div>
  )
}

/* ============================ MASSA ============================ */
function Massa({ d, acao }: Props) {
  const r = d.receita
  const [novo, setNovo] = useState(false)
  const [ing, setIng] = useState(''); const [qtd, setQtd] = useState(''); const [rot, setRot] = useState('')
  if (!r) return <p className="text-sm text-ink-2">Nenhuma receita cadastrada.</p>

  return (
    <div className="bg-surface rounded-xl border border-line shadow-card overflow-hidden">
      <div className="p-4 flex flex-wrap items-end justify-between gap-3 border-b border-line-soft">
        <div>
          <h3 className="font-display font-bold text-ink">{r.name}</h3>
          <p className="text-xs text-ink-2 mt-0.5">
            Uma receita custa <strong className="text-ink">{brl(r.totalCost)}</strong> e rende
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuantidadeEditavel valor={r.yield} sufixo="cookies" largura="w-14"
            salvar={(v) => acao(() => definirRendimento(Math.round(v)))} />
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-brand tabular-nums">{brl(r.costPerCookie)}</p>
          <p className="text-[11px] text-ink-3">por cookie</p>
        </div>
      </div>

      <div className="divide-y divide-line-soft">
        {r.itens.map((i) => (
          <div key={i.id} className="flex items-center gap-2 px-4 py-2 text-xs">
            <div className="flex-1 min-w-0">
              <p className="text-ink font-semibold truncate">{i.label}</p>
              {i.note && <p className="text-[10px] text-ink-3 truncate">{i.note}</p>}
            </div>
            <span className="text-ink-3 tabular-nums hidden sm:block w-24 text-right">
              {brlFino(i.unitCost)}/{i.unit}
            </span>
            <QuantidadeEditavel valor={i.quantity} sufixo={i.unit}
              salvar={(q) => acao(() => salvarItemReceita({ id: i.id, quantity: q }))} />
            <span className="text-ink font-semibold tabular-nums w-16 text-right">{brl(i.totalCost)}</span>
            <button onClick={() => { if (confirm(`Tirar ${i.label} da receita?`)) acao(() => excluirItemReceita(i.id)) }}
              className="text-ink-3 hover:text-danger transition-colors"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-line-soft bg-surface-2">
        {novo ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <select value={ing} onChange={(e) => setIng(e.target.value)}
              className="text-xs border border-line rounded-lg px-2 h-8 bg-surface text-ink flex-1 min-w-[140px]">
              <option value="">escolha o ingrediente</option>
              {d.ingredientes.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <input value={rot} onChange={(e) => setRot(e.target.value)} placeholder="como chamar (opcional)"
              className="text-xs border border-line rounded-lg px-2 h-8 bg-surface text-ink flex-1 min-w-[120px]" />
            <input value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder="qtd" inputMode="decimal"
              className="text-xs border border-line rounded-lg px-2 h-8 w-16 bg-surface text-ink" />
            <button onClick={async () => {
              const q = Number(qtd.replace(',', '.'))
              if (!ing || !Number.isFinite(q) || q <= 0) return alert('Escolha o ingrediente e a quantidade')
              await acao(() => salvarItemReceita({ ingredientId: Number(ing), label: rot || null, quantity: q }))
              setNovo(false); setIng(''); setQtd(''); setRot('')
            }} className="h-8 px-2.5 rounded-lg bg-brand text-brand-ink"><Check size={13} strokeWidth={3} /></button>
            <button onClick={() => setNovo(false)} className="h-8 px-2 text-ink-3 hover:text-ink"><X size={13} /></button>
          </div>
        ) : (
          <button onClick={() => setNovo(true)}
            className="text-[11px] font-semibold text-brand hover:text-brand-strong flex items-center gap-1 transition-colors">
            <Plus size={12} /> Adicionar ingrediente na massa
          </button>
        )}
      </div>
    </div>
  )
}

/* ============================ EMBALAGEM ============================ */
function Embalagens({ d, acao }: Props) {
  const [novo, setNovo] = useState(false)
  const [nome, setNome] = useState(''); const [custo, setCusto] = useState('')

  return (
    <div className="bg-surface rounded-xl border border-line shadow-card overflow-hidden">
      <div className="p-4 flex items-center justify-between border-b border-line-soft">
        <div>
          <h3 className="font-display font-bold text-ink">Embalagem</h3>
          <p className="text-xs text-ink-2 mt-0.5">Cobrada em todo cookie, para ter ideia da margem.</p>
        </div>
        <p className="text-lg font-bold text-brand tabular-nums">{brl(d.embalagemTotal)}</p>
      </div>

      <div className="divide-y divide-line-soft">
        {d.embalagem.map((e) => (
          <div key={e.id} className="flex items-center gap-2 px-4 py-2.5 text-xs">
            <button
              onClick={() => acao(() => salvarEmbalagem({ id: e.id, name: e.name, unitCost: e.unitCost, active: !e.active }))}
              title={e.active ? 'Tirar da conta' : 'Colocar na conta'}
              className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                e.active ? 'bg-brand border-brand text-brand-ink' : 'border-line text-transparent hover:border-brand'
              }`}>
              <Check size={12} strokeWidth={3} />
            </button>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${e.active ? 'text-ink' : 'text-ink-3 line-through'}`}>{e.name}</p>
              {e.note && <p className="text-[10px] text-ink-3 truncate">{e.note}</p>}
            </div>
            <QuantidadeEditavel valor={e.unitCost} prefixo="R$" casas={4} largura="w-20"
              salvar={(v) => acao(() => salvarEmbalagem({ id: e.id, name: e.name, unitCost: v }))} />
            <button onClick={() => { if (confirm(`Remover ${e.name}?`)) acao(() => excluirEmbalagem(e.id)) }}
              className="text-ink-3 hover:text-danger transition-colors"><Trash2 size={12} /></button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-line-soft bg-surface-2">
        {novo ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="nome"
              className="text-xs border border-line rounded-lg px-2 h-8 bg-surface text-ink flex-1 min-w-[120px]" />
            <input value={custo} onChange={(e) => setCusto(e.target.value)} placeholder="custo por cookie" inputMode="decimal"
              className="text-xs border border-line rounded-lg px-2 h-8 w-32 bg-surface text-ink" />
            <button onClick={async () => {
              const v = Number(custo.replace(',', '.'))
              if (!nome.trim() || !Number.isFinite(v)) return alert('Preencha nome e custo')
              await acao(() => salvarEmbalagem({ name: nome, unitCost: v }))
              setNovo(false); setNome(''); setCusto('')
            }} className="h-8 px-2.5 rounded-lg bg-brand text-brand-ink"><Check size={13} strokeWidth={3} /></button>
            <button onClick={() => setNovo(false)} className="h-8 px-2 text-ink-3 hover:text-ink"><X size={13} /></button>
          </div>
        ) : (
          <button onClick={() => setNovo(true)}
            className="text-[11px] font-semibold text-brand hover:text-brand-strong flex items-center gap-1 transition-colors">
            <Plus size={12} /> Adicionar embalagem
          </button>
        )}
      </div>
    </div>
  )
}

/* ============================ INGREDIENTES ============================ */
function Ingredientes({ d, acao }: Props) {
  const [aberto, setAberto] = useState<number | null>(null)
  const [novo, setNovo] = useState(false)
  const [nome, setNome] = useState(''); const [un, setUn] = useState('g')

  return (
    <div className="space-y-2">
      <div className="bg-surface rounded-xl border border-line shadow-card divide-y divide-line-soft">
        {d.ingredientes.map((i) => (
          <div key={i.id}>
            <button onClick={() => setAberto(aberto === i.id ? null : i.id)} aria-expanded={aberto === i.id}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-surface-2 transition-colors">
              <ChevronRight size={13}
                className={`flex-shrink-0 text-ink-3 transition-transform ${aberto === i.id ? 'rotate-90 text-brand' : ''}`} />
              <span className="text-sm text-ink flex-1 min-w-0 truncate">{i.name}</span>
              <span className="text-[11px] text-ink-3 flex-shrink-0">{i.precos.length} preço{i.precos.length === 1 ? '' : 's'}</span>
              <span className="text-xs font-bold text-ink tabular-nums flex-shrink-0 w-24 text-right">
                {i.unitCost === null ? '—' : `${brlFino(i.unitCost)}/${i.unit}`}
              </span>
            </button>

            {aberto === i.id && (
              <div className="px-3 pb-3 pl-8 animate-fade-up space-y-1">
                {i.precos.map((p) => (
                  <LinhaPreco key={p.id} p={p} unidade={i.unit} acao={acao} />
                ))}
                <NovoPreco ingredienteId={i.id} unidade={i.unit} acao={acao} />
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={async () => {
                      const nome = prompt('Nome do ingrediente:', i.name)
                      if (nome && nome.trim() && nome !== i.name) {
                        await acao(() => salvarIngrediente({ id: i.id, name: nome.trim(), unit: i.unit }))
                      }
                    }}
                    className="text-[11px] text-ink-3 hover:text-brand transition-colors flex items-center gap-1">
                    <Pencil size={11} /> Renomear
                  </button>
                  <button
                    onClick={() => { if (confirm(`Excluir o ingrediente ${i.name}?`)) acao(() => excluirIngrediente(i.id)) }}
                    className="text-[11px] text-ink-3 hover:text-danger transition-colors flex items-center gap-1">
                    <Trash2 size={11} /> Excluir o ingrediente
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-surface rounded-xl border border-line p-3 shadow-card">
        {novo ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="nome do ingrediente"
              className="text-xs border border-line rounded-lg px-2 h-8 bg-surface text-ink flex-1 min-w-[160px]" />
            <select value={un} onChange={(e) => setUn(e.target.value)}
              className="text-xs border border-line rounded-lg px-2 h-8 bg-surface text-ink">
              <option value="g">gramas</option><option value="ml">ml</option><option value="un">unidade</option>
            </select>
            <button onClick={async () => {
              if (!nome.trim()) return alert('Diga o nome')
              await acao(() => salvarIngrediente({ name: nome, unit: un }))
              setNovo(false); setNome('')
            }} className="h-8 px-2.5 rounded-lg bg-brand text-brand-ink"><Check size={13} strokeWidth={3} /></button>
            <button onClick={() => setNovo(false)} className="h-8 px-2 text-ink-3 hover:text-ink"><X size={13} /></button>
          </div>
        ) : (
          <button onClick={() => setNovo(true)}
            className="text-[11px] font-semibold text-brand hover:text-brand-strong flex items-center gap-1 transition-colors">
            <Plus size={12} /> Cadastrar ingrediente
          </button>
        )}
      </div>
    </div>
  )
}

/** Uma linha de preco: mostra, marca como referencia, edita ou apaga. */
function LinhaPreco({ p, unidade, acao }: {
  p: PrecoIngrediente; unidade: string; acao: Props['acao']
}) {
  const [editando, setEditando] = useState(false)
  const [mkt, setMkt] = useState(p.market ?? '')
  const [preco, setPreco] = useState(String(p.packagePrice).replace('.', ','))
  const [qtd, setQtd] = useState(String(p.packageQty).replace('.', ','))

  const gravar = async () => {
    const q = Number(qtd.replace(',', '.')); const v = Number(preco.replace(',', '.'))
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(v) || v < 0) {
      return alert('Confira a quantidade da embalagem e o preço')
    }
    setEditando(false)
    await acao(() => salvarPreco({ id: p.id, packageQty: q, packagePrice: v, market: mkt || null }))
  }

  if (editando) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg px-2 py-1.5 border border-brand bg-surface">
        <input autoFocus value={mkt} onChange={(e) => setMkt(e.target.value)} placeholder="mercado"
          className="text-xs border border-line rounded px-2 h-7 bg-surface text-ink flex-1 min-w-[90px]" />
        <input value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="R$" inputMode="decimal"
          onKeyDown={(e) => e.key === 'Enter' && gravar()}
          className="text-xs border border-line rounded px-2 h-7 w-20 bg-surface text-ink" />
        <span className="text-xs text-ink-3">/</span>
        <input value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder={unidade} inputMode="decimal"
          onKeyDown={(e) => e.key === 'Enter' && gravar()}
          className="text-xs border border-line rounded px-2 h-7 w-16 bg-surface text-ink" />
        <button onClick={gravar} className="h-7 px-2 rounded bg-brand text-brand-ink">
          <Check size={12} strokeWidth={3} />
        </button>
        <button onClick={() => setEditando(false)} className="h-7 px-1.5 text-ink-3 hover:text-ink">
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 border ${
      p.isReference ? 'border-brand-line bg-brand-soft' : 'border-line-soft bg-surface-2'
    }`}>
      <button onClick={() => !p.isReference && acao(() => usarPrecoDeReferencia(p.id))}
        title={p.isReference ? 'É este preço que entra no custo' : 'Passar a usar este preço no custo'}
        disabled={p.isReference}
        className={`flex-shrink-0 transition-colors ${p.isReference ? 'text-gold' : 'text-ink-3 hover:text-gold'}`}>
        <Star size={13} fill={p.isReference ? 'currentColor' : 'none'} />
      </button>
      <span className="text-ink-2 flex-1 min-w-0 truncate">{p.market || 'sem mercado'}</span>
      <span className="text-ink tabular-nums">{brl(p.packagePrice)} / {num(p.packageQty)}{unidade}</span>
      <span className="text-ink-3 tabular-nums w-24 text-right hidden sm:block">
        {brlFino(p.unitCost)}/{unidade}
      </span>
      <button onClick={() => setEditando(true)} title="Editar este preço"
        className="text-ink-3 hover:text-brand transition-colors flex-shrink-0"><Pencil size={12} /></button>
      <button onClick={() => { if (confirm(`Apagar o preço de ${p.market || 'sem mercado'}?`)) acao(() => excluirPreco(p.id)) }}
        title="Apagar este preço"
        className="text-ink-3 hover:text-danger transition-colors flex-shrink-0"><Trash2 size={12} /></button>
    </div>
  )
}

function NovoPreco({ ingredienteId, unidade, acao }: {
  ingredienteId: number; unidade: string; acao: Props['acao']
}) {
  const [abrindo, setAbrindo] = useState(false)
  const [qtd, setQtd] = useState(''); const [preco, setPreco] = useState(''); const [mkt, setMkt] = useState('')

  if (!abrindo) {
    return (
      <button onClick={() => setAbrindo(true)}
        className="text-[11px] font-semibold text-brand hover:text-brand-strong flex items-center gap-1 pt-0.5 transition-colors">
        <Plus size={12} /> Anotar preço de outro mercado
      </button>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <input value={mkt} onChange={(e) => setMkt(e.target.value)} placeholder="mercado"
        className="text-xs border border-line rounded-lg px-2 h-8 bg-surface text-ink flex-1 min-w-[100px]" />
      <input value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="R$ pago" inputMode="decimal"
        className="text-xs border border-line rounded-lg px-2 h-8 w-20 bg-surface text-ink" />
      <input value={qtd} onChange={(e) => setQtd(e.target.value)} placeholder={unidade} inputMode="decimal"
        className="text-xs border border-line rounded-lg px-2 h-8 w-20 bg-surface text-ink" />
      <button onClick={async () => {
        const q = Number(qtd.replace(',', '.')); const p = Number(preco.replace(',', '.'))
        if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(p)) return alert('Preencha quanto vem na embalagem e quanto custou')
        await acao(() => salvarPreco({ ingredientId: ingredienteId, packageQty: q, packagePrice: p, market: mkt || null }))
        setAbrindo(false); setQtd(''); setPreco(''); setMkt('')
      }} className="h-8 px-2.5 rounded-lg bg-brand text-brand-ink"><Check size={13} strokeWidth={3} /></button>
      <button onClick={() => setAbrindo(false)} className="h-8 px-2 text-ink-3 hover:text-ink"><X size={13} /></button>
    </div>
  )
}

/* ============================ campo numerico ============================ */
/** Clica no numero, digita, Enter salva. Esc cancela. */
function QuantidadeEditavel({ valor, sufixo, prefixo, casas = 2, largura = 'w-[70px]', salvar }: {
  valor: number; sufixo?: string; prefixo?: string; casas?: number
  largura?: string; salvar: (v: number) => void | Promise<void>
}) {
  const [editando, setEditando] = useState(false)
  const [txt, setTxt] = useState('')

  if (!editando) {
    return (
      <button
        onClick={() => { setTxt(String(valor).replace('.', ',')); setEditando(true) }}
        title="Clique para mudar"
        className={`${largura} flex-shrink-0 text-right text-xs tabular-nums text-ink-2 hover:text-brand transition-colors group inline-flex items-center justify-end gap-1`}>
        <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        {prefixo ? `${prefixo} ` : ''}{casas === 4 ? valor.toFixed(4).replace('.', ',') : num(valor)}{sufixo ? ` ${sufixo}` : ''}
      </button>
    )
  }
  const confirmar = async () => {
    const v = Number(txt.replace(',', '.'))
    setEditando(false)
    if (Number.isFinite(v) && v !== valor) await salvar(v)
  }
  return (
    <input
      autoFocus value={txt}
      onChange={(e) => setTxt(e.target.value)}
      onBlur={confirmar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') confirmar()
        if (e.key === 'Escape') setEditando(false)
      }}
      inputMode="decimal"
      className={`${largura} flex-shrink-0 text-right text-xs tabular-nums border border-brand rounded px-1.5 h-6 bg-surface text-ink`}
    />
  )
}

/* ============================ MAQUININHA ============================ */
/**
 * A taxa que cada forma de pagamento cobra. Mexer aqui vale so para vendas
 * novas: cada venda guarda a taxa que valia no dia, para nao reescrever o
 * que voce ja recebeu.
 */
function Maquininha({ acao }: { acao: Props['acao'] }) {
  const [formas, setFormas] = useState<MetodoPagamento[]>([])

  const carregar = () => getFormasPagamento().then(setFormas).catch(() => {})
  useEffect(() => { carregar() }, [])

  const salvar = async (code: string, pct: number, fixo: number) => {
    await acao(() => definirTaxaPagamento(code as FormaPagamento, pct, fixo))
    await carregar()
  }

  return (
    <div className="bg-surface rounded-xl border border-line shadow-card overflow-hidden">
      <div className="p-4 border-b border-line-soft">
        <h3 className="font-display font-bold text-ink flex items-center gap-2">
          <CreditCard size={17} className="text-brand" /> Taxa da maquininha
        </h3>
        <p className="text-xs text-ink-2 mt-1 max-w-lg">
          Quanto cada forma de pagamento fica com você. Dinheiro e Pix costumam
          ser zero. Coloque aqui os percentuais da InfinitePay e a taxa entra
          sozinha em toda venda nova.
        </p>
      </div>

      <div className="divide-y divide-line-soft">
        {formas.map((f) => (
          <div key={f.code} className="flex items-center gap-2 px-4 py-2.5 text-xs">
            <span className="text-ink font-semibold flex-1 min-w-0 truncate">{f.label}</span>
            <QuantidadeEditavel
              valor={f.feePercent} sufixo="%" largura="w-[72px]"
              salvar={(v) => salvar(f.code, v, f.feeFixed)} />
            <span className="text-ink-3">+</span>
            <QuantidadeEditavel
              valor={f.feeFixed} prefixo="R$" largura="w-20"
              salvar={(v) => salvar(f.code, f.feePercent, v)} />
            <span className="text-ink-3 w-16 text-right hidden sm:block">por venda</span>
          </div>
        ))}
      </div>

      <p className="px-4 py-2.5 text-[11px] text-ink-2 bg-surface-2 border-t border-line-soft">
        Mudar a taxa só vale daqui pra frente. As vendas já registradas guardam
        a taxa que valia no dia, para o histórico não mudar sozinho.
      </p>
    </div>
  )
}
