import { useEffect, useState } from 'react'
import { getVendas, salvarVenda, excluirVenda, getResumoFinanceiro } from '../../api/api'
import { ListaVendas, VendaGeral, TipoVenda, ModoEntrega, ResumoFinanceiro, Product } from '../../types'
import { taxaDoPedido, FRETE_GRATIS_A_PARTIR_DE, GASTO_MEDIO_ENTREGA } from '../../entrega'
import { Loader2, Plus, Minus, Trash2, Pencil, Truck, Store } from 'lucide-react'

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`
const dec = (v: number) => String(v).replace('.', ',')
const dataBR = (iso?: string) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR') : 'sem data')
const hoje = () => new Date().toISOString().slice(0, 10)
const paraNumero = (s: string) => Number(s.replace(',', '.')) || 0

const TIPOS: { v: TipoVenda; label: string }[] = [
  { v: 'venda',           label: 'Venda' },
  { v: 'consumo_proprio', label: 'Consumo próprio' },
  { v: 'brinde',          label: 'Brinde' },
]

type Rascunho = {
  id?: number; soldAt: string; customerName: string; amount: string
  deliveryFee: string; deliveryCost: string; deliveryMode: ModoEntrega
  kind: TipoVenda; notes: string
  /** quantos de cada sabor, por id do produto */
  qtds: Record<number, number>
  /** true quando voce digitou o valor na mao, e ele para de seguir os sabores */
  valorManual: boolean
}
const vazio = (): Rascunho => ({
  id: undefined, soldAt: hoje(), customerName: '', amount: '',
  deliveryFee: '', deliveryCost: dec(GASTO_MEDIO_ENTREGA),
  deliveryMode: 'entrega', kind: 'venda', notes: '',
  qtds: {}, valorManual: false,
})

/**
 * Venda geral: o que veio da planilha mais o que voce lancar aqui.
 * A Orvalho entra sozinha, mas so depois de quitada — fiado ainda nao e dinheiro.
 * Essas linhas levam o selo da farmacia e sao editadas la, na caderneta.
 */
export default function Vendas({ products }: { products: Product[] }) {
  const [d, setD] = useState<ListaVendas | null>(null)
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [origem, setOrigem] = useState<'geral' | 'orvalho' | null>(null)
  const [form, setForm] = useState<Rascunho | null>(null)
  // enquanto voce nao mexer na taxa, ela acompanha o valor do pedido sozinha
  const [taxaManual, setTaxaManual] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const carregar = async (o = origem) => {
    setCarregando(true)
    try {
      const [lista, r] = await Promise.all([getVendas(o ?? undefined), getResumoFinanceiro()])
      setD(lista); setResumo(r)
    } finally { setCarregando(false) }
  }
  useEffect(() => { carregar(origem) }, [origem])

  const abrir = (r: Rascunho, manual: boolean) => { setForm(r); setTaxaManual(manual) }

  const somaDosSabores = (qtds: Record<number, number>) =>
    Object.entries(qtds).reduce((soma, [id, q]) => {
      const p = products.find((x) => x.id === Number(id))
      return soma + (p ? p.price * q : 0)
    }, 0)

  /** Muda um sabor: o valor acompanha, a nao ser que voce ja tenha digitado na mao. */
  const mudarSabor = (produtoId: number, delta: number) => {
    if (!form) return
    const nova = Math.max(0, (form.qtds[produtoId] ?? 0) + delta)
    const qtds = { ...form.qtds }
    if (nova === 0) delete qtds[produtoId]; else qtds[produtoId] = nova
    const total = somaDosSabores(qtds)
    const amount = form.valorManual ? form.amount : (total > 0 ? dec(total) : '')
    const taxa = form.deliveryMode === 'retirada' || taxaManual
      ? form.deliveryFee
      : dec(taxaDoPedido(paraNumero(amount)))
    setForm({ ...form, qtds, amount, deliveryFee: taxa })
  }

  /** Muda o valor dos cookies e, se voce ainda nao mexeu na taxa, refaz a taxa. */
  const mudarValor = (txt: string) => {
    if (!form) return
    const taxa = form.deliveryMode === 'retirada' || taxaManual
      ? form.deliveryFee
      : dec(taxaDoPedido(paraNumero(txt)))
    setForm({ ...form, amount: txt, deliveryFee: taxa, valorManual: true })
  }

  /** Retirada zera taxa e combustivel; entrega volta a sugerir os dois. */
  const mudarModo = (modo: ModoEntrega) => {
    if (!form) return
    if (modo === 'retirada') {
      setForm({ ...form, deliveryMode: modo, deliveryFee: '0', deliveryCost: '0' })
    } else {
      setForm({
        ...form, deliveryMode: modo,
        deliveryFee: taxaManual ? form.deliveryFee : dec(taxaDoPedido(paraNumero(form.amount))),
        deliveryCost: dec(GASTO_MEDIO_ENTREGA),
      })
    }
  }

  const gravar = async () => {
    if (!form) return
    const v = paraNumero(form.amount)
    if (!form.customerName.trim()) return alert('Diga para quem foi')
    if (!form.amount.trim() || v < 0) return alert('Valor inválido')
    setSalvando(true)
    try {
      await salvarVenda({
        id: form.id, soldAt: form.soldAt || null, customerName: form.customerName, amount: v,
        deliveryFee: paraNumero(form.deliveryFee), deliveryCost: paraNumero(form.deliveryCost),
        deliveryMode: form.deliveryMode, kind: form.kind, notes: form.notes || null,
        items: Object.entries(form.qtds).map(([id, q]) => ({ productId: Number(id), quantity: q })),
      })
      setForm(null); await carregar()
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro ao salvar') }
    finally { setSalvando(false) }
  }

  const editar = (v: VendaGeral) => {
    if (v.origin === 'orvalho') { alert('Essa venda é da Orvalho. Edite pela caderneta.'); return }
    abrir({
      id: v.id, soldAt: v.soldAt ?? '', customerName: v.customerName,
      amount: dec(v.amount),
      deliveryFee: v.deliveryFee ? dec(v.deliveryFee) : '0',
      deliveryCost: v.deliveryCost ? dec(v.deliveryCost) : '0',
      deliveryMode: v.deliveryMode, kind: v.kind, notes: v.notes ?? '',
      qtds: Object.fromEntries(
        v.produtos.filter((i) => i.productId !== null)
          .map((i) => [i.productId as number, i.quantity])),
      valorManual: true,   // venda que ja existe: respeita o valor que voce escolheu
    }, true)   // venda que ja existe: nao mexe na taxa que voce escolheu
  }

  const apagar = async (v: VendaGeral) => {
    if (v.origin === 'orvalho') { alert('Essa venda é da Orvalho. Apague pela caderneta.'); return }
    if (!confirm(`Excluir a venda de ${v.customerName} (${brl(v.amount)})?`)) return
    try { await excluirVenda(v.id); await carregar() }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao excluir') }
  }

  const retirada = form?.deliveryMode === 'retirada'
  const valorForm = paraNumero(form?.amount ?? '')
  const somaSabores = form ? somaDosSabores(form.qtds) : 0

  return (
    <div className="space-y-4">
      {resumo && (
        <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Numero titulo="Entrou" valor={resumo.receita} tom="text-success" />
            <Numero titulo="Saiu" valor={resumo.compras + resumo.combustivel} tom="text-danger" />
            <Numero titulo="Saldo" valor={resumo.saldo} forte
              tom={resumo.saldo >= 0 ? 'text-brand' : 'text-danger'} />
            <Numero titulo="A receber" valor={resumo.aReceber} tom="text-warn" nota="fiado na Orvalho" />
          </div>
          <p className="text-[11px] text-ink-3 mt-3 pt-3 border-t border-line-soft">
            Entrou = {brl(resumo.cookies)} em cookies + {brl(resumo.taxas)} de taxa de entrega.
            Saiu = {brl(resumo.compras)} de compras + {brl(resumo.combustivel)} de combustível.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {([null, 'geral', 'orvalho'] as const).map((o) => (
          <button key={String(o)} onClick={() => setOrigem(o)}
            className={`h-8 px-3.5 rounded-full text-xs font-semibold border transition-colors ${
              origem === o ? 'bg-brand text-brand-ink border-brand' : 'text-ink-2 border-line hover:border-brand'
            }`}>
            {o === null ? 'Todas' : o === 'geral' ? 'Lançadas aqui' : 'Vindas da Orvalho'}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-ink-3 tabular-nums">
          {d?.quantas ?? 0} vendas{d?.retiradas ? ` · ${d.retiradas} retiradas` : ''}
        </span>
      </div>

      {form ? (
        <div className="bg-surface rounded-xl border border-brand-line p-4 shadow-card animate-fade-up">
          <h4 className="font-display font-bold text-ink text-sm mb-3">
            {form.id ? 'Editar venda' : 'Nova venda'}
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input type="date" value={form.soldAt} onChange={(e) => setForm({ ...form, soldAt: e.target.value })}
              className="text-sm border border-line rounded-lg px-2 h-10 bg-surface text-ink" />
            <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="para quem"
              className="col-span-1 sm:col-span-3 text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink" />
          </div>

          {/* Quais cookies sairam. O valor abaixo acompanha sozinho,
              mas continua editavel para quando voce cobra diferente. */}
          <div className="mt-2">
            <p className="text-[11px] text-ink-3 mb-1.5">Cookies vendidos</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {products.map((p) => {
                const q = form.qtds[p.id] ?? 0
                return (
                  <div key={p.id}
                    className={`rounded-lg border p-1.5 transition-colors ${
                      q > 0 ? 'border-brand bg-brand-soft' : 'border-line'
                    }`}>
                    <p className="text-[11px] font-semibold text-ink truncate">
                      {p.name.replace('Cookie ', '')}
                      <span className="text-ink-3 font-normal"> · {brl(p.price)}</span>
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <button onClick={() => mudarSabor(p.id, -1)} disabled={q === 0}
                        aria-label={`Tirar 1 ${p.name}`}
                        className="w-6 h-6 rounded-full border border-line text-brand flex items-center justify-center disabled:opacity-30">
                        <Minus size={11} strokeWidth={2.5} />
                      </button>
                      <span className="text-sm font-bold tabular-nums text-ink w-5 text-center">{q}</span>
                      <button onClick={() => mudarSabor(p.id, 1)}
                        aria-label={`Adicionar 1 ${p.name}`}
                        className="w-6 h-6 rounded-full bg-brand text-brand-ink flex items-center justify-center">
                        <Plus size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Entrega ou retirada — muda o que o resto do formulario cobra */}
          <div className="flex gap-1.5 mt-2">
            {([
              { v: 'entrega' as ModoEntrega,  label: 'Entrega',  Icon: Truck },
              { v: 'retirada' as ModoEntrega, label: 'Retirada', Icon: Store },
            ]).map(({ v, label, Icon }) => (
              <button key={v} onClick={() => mudarModo(v)}
                aria-pressed={form.deliveryMode === v}
                className={`flex-1 h-10 rounded-lg border text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                  form.deliveryMode === v
                    ? 'bg-brand text-brand-ink border-brand'
                    : 'text-ink-2 border-line hover:border-brand hover:text-brand'
                }`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            <label className="text-[11px] text-ink-3 flex flex-col gap-1">
              Valor dos cookies
              <input value={form.amount} onChange={(e) => mudarValor(e.target.value)}
                placeholder="R$" inputMode="decimal"
                className="text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink" />
            </label>
            <label className={`text-[11px] flex flex-col gap-1 ${retirada ? 'text-ink-4' : 'text-ink-3'}`}>
              Taxa cobrada
              <input value={form.deliveryFee} disabled={retirada}
                onChange={(e) => { setTaxaManual(true); setForm({ ...form, deliveryFee: e.target.value }) }}
                placeholder="R$" inputMode="decimal"
                className="text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink disabled:opacity-40 disabled:cursor-not-allowed" />
            </label>
            <label className={`text-[11px] flex flex-col gap-1 ${retirada ? 'text-ink-4' : 'text-ink-3'}`}>
              Gasto p/ entregar
              <input value={form.deliveryCost} disabled={retirada}
                onChange={(e) => setForm({ ...form, deliveryCost: e.target.value })}
                placeholder="R$" inputMode="decimal"
                className="text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink disabled:opacity-40 disabled:cursor-not-allowed" />
            </label>
            <label className="text-[11px] text-ink-3 flex flex-col gap-1">
              Tipo
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as TipoVenda })}
                className="text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink">
                {TIPOS.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
              </select>
            </label>
          </div>

          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="observação (opcional)"
            className="w-full mt-2 text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink" />

          {somaSabores > 0 && Math.abs(somaSabores - valorForm) > 0.009 && (
            <p className="text-[11px] text-warn mt-2">
              Os sabores somam {brl(somaSabores)}, mas você pôs {brl(valorForm)}.
              Tudo bem — vale o que você digitou.
            </p>
          )}

          <p className="text-[11px] text-ink-3 mt-2">
            {retirada
              ? 'Retirada não tem taxa nem gasto de combustível — os dois ficam zerados.'
              : valorForm >= FRETE_GRATIS_A_PARTIR_DE
                ? `Acima de ${brl(FRETE_GRATIS_A_PARTIR_DE)} a entrega sai grátis, então a taxa veio zerada. Dá para mudar.`
                : `A taxa vem preenchida sozinha pelo valor do pedido — se você não quis cobrar, é só zerar.`}
            {' '}Deixe a data em branco se não lembrar.
          </p>

          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setForm(null)}
              className="text-sm font-semibold text-ink-2 hover:text-ink px-3 py-2 rounded-lg transition-colors">
              Cancelar
            </button>
            <button onClick={gravar} disabled={salvando}
              className="bg-brand hover:bg-brand-strong text-brand-ink font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40">
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => abrir(vazio(), false)}
          className="w-full bg-surface hover:bg-surface-2 border border-dashed border-line hover:border-brand rounded-xl py-3 text-sm font-semibold text-ink-2 hover:text-brand transition-colors flex items-center justify-center gap-1.5">
          <Plus size={15} /> Registrar venda
        </button>
      )}

      {carregando ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-brand" /></div>
      ) : (
        <div className="bg-surface rounded-xl border border-line shadow-card divide-y divide-line-soft overflow-hidden">
          {(d?.itens ?? []).map((v) => (
            <div key={`${v.origin}-${v.id}`} className="flex items-center gap-2.5 px-3 py-2.5 group">
              <span className="text-[11px] text-ink-3 tabular-nums w-[68px] flex-shrink-0">{dataBR(v.soldAt)}</span>

              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink truncate flex items-center gap-1.5">
                  {v.origin === 'orvalho' && (
                    <span title="Venda da farmácia Orvalho, já quitada na caderneta"
                      className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-orvalho-line bg-orvalho-bg text-orvalho">
                      Orvalho
                    </span>
                  )}
                  <span className="truncate">{v.customerName}</span>
                  {v.kind !== 'venda' && (
                    <span className="flex-shrink-0 text-[10px] font-semibold text-warn bg-warn-bg border border-warn-line px-1.5 rounded-full">
                      {v.kind === 'brinde' ? 'brinde' : 'consumo'}
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-ink-3 truncate flex items-center gap-1.5">
                  {v.produtos.length > 0 && (
                    <span className="text-ink-2">
                      {v.produtos.map((i) => `${i.quantity} ${i.productName.replace('Cookie ', '')}`).join(', ')}
                    </span>
                  )}
                  {v.deliveryMode === 'retirada' ? (
                    <span className="inline-flex items-center gap-0.5"><Store size={10} /> retirada</span>
                  ) : v.deliveryFee > 0 ? (
                    <span className="inline-flex items-center gap-0.5">
                      <Truck size={10} /> {brl(v.deliveryFee)}
                      {v.deliveryCost > 0 && <span className="text-ink-4">(gastou {brl(v.deliveryCost)})</span>}
                    </span>
                  ) : v.deliveryCost > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-ink-4">
                      <Truck size={10} /> sem taxa (gastou {brl(v.deliveryCost)})
                    </span>
                  ) : null}
                  {v.notes}
                </p>
              </div>

              <span className="text-sm font-bold text-ink tabular-nums flex-shrink-0 w-20 text-right">{brl(v.amount)}</span>
              <div className="flex items-center gap-1 flex-shrink-0 w-[52px] justify-end">
                {v.origin === 'geral' && (
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => editar(v)} title="Editar"
                      className="text-ink-3 hover:text-brand transition-colors p-1"><Pencil size={13} /></button>
                    <button onClick={() => apagar(v)} title="Excluir"
                      className="text-ink-3 hover:text-danger transition-colors p-1"><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {(d?.itens ?? []).length === 0 && (
            <p className="text-sm text-ink-3 text-center py-8">Nenhuma venda por aqui.</p>
          )}
        </div>
      )}
    </div>
  )
}

function Numero({ titulo, valor, tom, forte, nota }: {
  titulo: string; valor: number; tom: string; forte?: boolean; nota?: string
}) {
  return (
    <div>
      <p className="text-[11px] text-ink-3 uppercase tracking-wide">{titulo}</p>
      <p className={`${forte ? 'text-xl' : 'text-lg'} font-bold tabular-nums ${tom}`}>{brl(valor)}</p>
      {nota && <p className="text-[10px] text-ink-4">{nota}</p>}
    </div>
  )
}
