import { useEffect, useState } from 'react'
import { getCompras, salvarCompra, excluirCompra } from '../../api/api'
import { ListaCompras, Compra, CategoriaCompra } from '../../types'
import { Loader2, Plus, Trash2, Pencil, ShoppingCart } from 'lucide-react'

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`
const dataBR = (iso?: string) => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR') : '—')
const hoje = () => new Date().toISOString().slice(0, 10)

const CATEGORIAS: { v: CategoriaCompra; label: string; cor: string }[] = [
  { v: 'ingrediente', label: 'Ingrediente', cor: 'text-brand bg-brand-soft border-brand-line' },
  { v: 'embalagem',   label: 'Embalagem',   cor: 'text-info bg-info-bg border-info-line' },
  { v: 'descartavel', label: 'Descartável', cor: 'text-ink-2 bg-surface-2 border-line' },
  { v: 'equipamento', label: 'Equipamento', cor: 'text-accent bg-accent-bg border-accent-line' },
  { v: 'marketing',   label: 'Marketing',   cor: 'text-warn bg-warn-bg border-warn-line' },
  { v: 'outro',       label: 'Outro',       cor: 'text-ink-2 bg-surface-2 border-line' },
]
const catDe = (v: string) => CATEGORIAS.find((c) => c.v === v) ?? CATEGORIAS[5]

type Rascunho = {
  id?: number; boughtAt: string; item: string; quantity: string
  unit: string; amount: string; market: string; category: CategoriaCompra
}
const vazio = (): Rascunho => ({
  id: undefined, boughtAt: hoje(), item: '', quantity: '', unit: '',
  amount: '', market: '', category: 'ingrediente',
})

/**
 * Tudo que sai do bolso: ingrediente, embalagem, descartavel, equipamento e anuncio.
 * A categoria importa: so ingrediente e embalagem viram custo do cookie;
 * anuncio e equipamento entram no lucro, mas nao no preco de venda.
 */
export default function Compras() {
  const [d, setD] = useState<ListaCompras | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState<CategoriaCompra | null>(null)
  const [form, setForm] = useState<Rascunho | null>(null)
  const [salvando, setSalvando] = useState(false)

  const carregar = async (cat = filtro) => {
    setCarregando(true)
    try { setD(await getCompras(cat ?? undefined)) } finally { setCarregando(false) }
  }
  useEffect(() => { carregar(filtro) }, [filtro])

  const gravar = async () => {
    if (!form) return
    const v = Number(form.amount.replace(',', '.'))
    if (!form.item.trim()) return alert('Diga o que foi comprado')
    if (!Number.isFinite(v) || v < 0) return alert('Valor inválido')
    setSalvando(true)
    try {
      await salvarCompra({
        id: form.id, boughtAt: form.boughtAt || undefined, item: form.item,
        quantity: form.quantity || undefined, unit: form.unit || undefined,
        amount: v, market: form.market || undefined, category: form.category,
      })
      setForm(null); await carregar()
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro ao salvar') }
    finally { setSalvando(false) }
  }

  const editar = (c: Compra) => setForm({
    id: c.id, boughtAt: c.boughtAt ?? '', item: c.item, quantity: c.quantity ?? '',
    unit: c.unit ?? '', amount: String(c.amount).replace('.', ','),
    market: c.market ?? '', category: c.category,
  })

  const apagar = async (c: Compra) => {
    if (!confirm(`Excluir "${c.item}" de ${brl(c.amount)}?`)) return
    try { await excluirCompra(c.id); await carregar() }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao excluir') }
  }

  return (
    <div className="space-y-4">
      {/* Total e quebra por categoria */}
      <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-ink flex items-center gap-2">
            <ShoppingCart size={17} className="text-brand" /> Compras
          </h3>
          <div className="text-right">
            <p className="text-lg font-bold text-ink tabular-nums">{brl(d?.total ?? 0)}</p>
            <p className="text-[11px] text-ink-3 tabular-nums">{d?.quantas ?? 0} lançamentos</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFiltro(null)}
            className={`h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
              filtro === null ? 'bg-brand text-brand-ink border-brand' : 'text-ink-2 border-line hover:border-brand'
            }`}>
            Tudo
          </button>
          {(d?.porCategoria ?? []).map((c) => (
            <button key={c.category} onClick={() => setFiltro(filtro === c.category ? null : c.category)}
              className={`h-8 px-3 rounded-full text-xs font-semibold border transition-colors ${
                filtro === c.category ? 'bg-brand text-brand-ink border-brand' : `${catDe(c.category).cor} hover:opacity-80`
              }`}>
              {catDe(c.category).label}
              <span className="ml-1.5 tabular-nums opacity-70">{brl(c.total)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Formulario */}
      {form ? (
        <div className="bg-surface rounded-xl border border-brand-line p-4 shadow-card animate-fade-up">
          <h4 className="font-display font-bold text-ink text-sm mb-3">
            {form.id ? 'Editar compra' : 'Nova compra'}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input type="date" value={form.boughtAt} onChange={(e) => setForm({ ...form, boughtAt: e.target.value })}
              className="col-span-1 text-sm border border-line rounded-lg px-2 h-10 bg-surface text-ink" />
            <input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })}
              placeholder="o que comprou"
              className="col-span-1 sm:col-span-3 text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink" />
            <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="qtd"
              className="text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink" />
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="unid. (500g)"
              className="text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink" />
            <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="R$ pago" inputMode="decimal"
              className="text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink" />
            <input value={form.market} onChange={(e) => setForm({ ...form, market: e.target.value })}
              placeholder="mercado"
              className="text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CategoriaCompra })}
              className="col-span-2 sm:col-span-4 text-sm border border-line rounded-lg px-3 h-10 bg-surface text-ink">
              {CATEGORIAS.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
            </select>
          </div>
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
        <button onClick={() => setForm(vazio())}
          className="w-full bg-surface hover:bg-surface-2 border border-dashed border-line hover:border-brand rounded-xl py-3 text-sm font-semibold text-ink-2 hover:text-brand transition-colors flex items-center justify-center gap-1.5">
          <Plus size={15} /> Registrar compra
        </button>
      )}

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-brand" /></div>
      ) : (
        <div className="bg-surface rounded-xl border border-line shadow-card divide-y divide-line-soft overflow-hidden">
          {(d?.itens ?? []).map((c) => (
            <div key={c.id} className="flex items-center gap-2.5 px-3 py-2.5 group">
              <span className="text-[11px] text-ink-3 tabular-nums w-[68px] flex-shrink-0">{dataBR(c.boughtAt)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink truncate">{c.item}</p>
                <p className="text-[11px] text-ink-3 truncate">
                  {[c.quantity && `${c.quantity}${c.unit ? ` · ${c.unit}` : ''}`, c.market, c.notes]
                    .filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 hidden sm:block ${catDe(c.category).cor}`}>
                {catDe(c.category).label}
              </span>
              <span className="text-sm font-bold text-ink tabular-nums flex-shrink-0 w-20 text-right">{brl(c.amount)}</span>
              <div className="flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button onClick={() => editar(c)} title="Editar"
                  className="text-ink-3 hover:text-brand transition-colors p-1"><Pencil size={13} /></button>
                <button onClick={() => apagar(c)} title="Excluir"
                  className="text-ink-3 hover:text-danger transition-colors p-1"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
          {(d?.itens ?? []).length === 0 && (
            <p className="text-sm text-ink-3 text-center py-8">Nenhuma compra por aqui.</p>
          )}
        </div>
      )}
    </div>
  )
}
