import { useEffect, useMemo, useState } from 'react'
import {
  getTabSales, getTabSummary, getTabCustomers, createTabSale, createTabCustomer,
  setTabSalePaid, deleteTabSale, addTabPayment,
  payAllForCustomer, setTabSaleAnnotated, markCharged, TabStatus,
} from '../../api/api'
import { Product, TabSale, TabSummaryRow, TabCustomer } from '../../types'
import SeletorCliente from '../../components/SeletorCliente'
import Producao from './Producao'
import WhatsAppIcon from '../../components/WhatsAppIcon'
import {
  Plus, Minus, Check, Trash2, Undo2, Loader2, CalendarDays,
  NotebookPen, HandCoins, X, MessageCircle, ChevronRight,
} from 'lucide-react'

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`
const dataBR = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
const hoje = () => new Date().toISOString().slice(0, 10)

export default function Caderneta({ products }: { products: Product[] }) {
  const [sales, setSales] = useState<TabSale[]>([])
  const [summary, setSummary] = useState<TabSummaryRow[]>([])
  const [customers, setCustomers] = useState<TabCustomer[]>([])
  const [filtro, setFiltro] = useState<TabStatus>('open')
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  // sobe a cada recarga para o painel de producao acompanhar as vendas novas
  const [versao, setVersao] = useState(0)
  // qual cliente do "A receber" esta com a lista de vendas aberta
  const [abertoId, setAbertoId] = useState<number | null>(null)
  // vendas em aberto, guardadas a parte: o filtro da tela pode estar em outra aba
  const [abertas, setAbertas] = useState<TabSale[] | null>(null)
  const [buscandoVendas, setBuscandoVendas] = useState(false)

  // formulario de venda
  const [pessoaId, setPessoaId] = useState<number | null>(null)
  const [data, setData] = useState(hoje())
  const [jaPago, setJaPago] = useState(false)
  const [qtds, setQtds] = useState<Record<number, number>>({})

  const carregar = async (status: TabStatus = filtro) => {
    setLoading(true)
    try {
      const [lista, resumo, pessoas] = await Promise.all([
        getTabSales(status), getTabSummary(), getTabCustomers(),
      ])
      setSales(lista); setSummary(resumo); setCustomers(pessoas)
      // as vendas em aberto alimentam os dropdowns do "A receber".
      // Se voce esta numa aba de pagos com um dropdown aberto, busca elas a parte,
      // senao o cartao sumiria da tela logo depois de voce mexer nele.
      if (status === 'open') setAbertas(lista)
      else if (abertoId !== null) setAbertas(await getTabSales('open'))
      else setAbertas(null)
      setVersao((n) => n + 1)
    } finally { setLoading(false) }
  }

  useEffect(() => { carregar(filtro) }, [filtro])

  const totalCarrinho = useMemo(
    () => Object.entries(qtds).reduce((soma, [id, q]) => {
      const p = products.find((x) => x.id === Number(id))
      return soma + (p ? p.price * q : 0)
    }, 0),
    [qtds, products],
  )

  const mudarQtd = (id: number, delta: number) =>
    setQtds((prev) => {
      const nova = Math.max(0, (prev[id] ?? 0) + delta)
      const copia = { ...prev }
      if (nova === 0) delete copia[id]; else copia[id] = nova
      return copia
    })

  const registrar = async () => {
    const items = Object.entries(qtds).map(([id, q]) => ({ productId: Number(id), quantity: q }))
    if (!pessoaId) return alert('Selecione a pessoa')
    if (!items.length) return alert('Selecione ao menos um cookie')
    setSalvando(true)
    try {
      await createTabSale({ customerId: pessoaId, items, soldAt: data, paid: jaPago })
      setPessoaId(null); setQtds({}); setJaPago(false); setData(hoje())
      await carregar()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao registrar')
    } finally { setSalvando(false) }
  }

  // Pagamento parcial: a pessoa pagou so um pedaco de uma venda.
  // Fica escondido atras do icone de moedas, no card da venda.
  const [parcialId, setParcialId] = useState<number | null>(null)
  const [valorParcial, setValorParcial] = useState('')
  const [salvandoParcial, setSalvandoParcial] = useState(false)

  const fecharParcial = () => { setParcialId(null); setValorParcial('') }

  const registrarParcial = async (v: TabSale) => {
    const falta = v.total - v.paidAmount
    const valor = Number(valorParcial.replace(',', '.'))
    if (!Number.isFinite(valor) || valor <= 0) return alert('Informe um valor maior que zero')
    if (valor > falta + 0.001) return alert(`Falta so ${brl(falta)} nessa venda.`)
    setSalvandoParcial(true)
    try {
      await addTabPayment(v.id, Number(valor.toFixed(2)))
      fecharParcial()
      await carregar()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao registrar o pagamento')
    } finally { setSalvandoParcial(false) }
  }

  // Cobranca: o texto ja vem pronto do servidor junto do resumo
  // (a chave Pix nunca fica no codigo do site).
  const [copiadoId, setCopiadoId] = useState<number | null>(null)

  const linkWhatsApp = (r: TabSummaryRow) =>
    `https://wa.me/${r.phone}?text=${encodeURIComponent(r.message)}`

  /** Usado quando a pessoa ainda nao tem WhatsApp cadastrado. */
  const copiarCobranca = async (r: TabSummaryRow) => {
    try {
      await navigator.clipboard.writeText(r.message)
      setCopiadoId(r.customerId)
      setTimeout(() => setCopiadoId(null), 2500)
    } catch {
      alert('Copie a mensagem:\n\n' + r.message)
    }
  }

  /** Abre/fecha a lista de vendas da pessoa no "A receber". */
  const alternarVendas = async (customerId: number) => {
    if (abertoId === customerId) { setAbertoId(null); return }
    setAbertoId(customerId)
    if (abertas) return
    setBuscandoVendas(true)
    try { setAbertas(await getTabSales('open')) }
    catch { setAbertas([]) }
    finally { setBuscandoVendas(false) }
  }

  const vendasDe = (customerId: number) =>
    (abertas ?? []).filter((v) => v.customerId === customerId && !v.paid)

  // Copiar para a planilha e marcar como anotada agora vivem na aba Vendas,
  // onde a lista cobre todas as vendas e nao so as da Orvalho.

  const totalAReceber = summary.reduce((s, r) => s + r.devendo, 0)

  /**
   * Cartao de uma venda com todas as acoes: dar baixa, anotar na planilha,
   * abater um valor parcial e excluir. Fica dentro do dropdown de cada pessoa
   * em "A receber", e tambem nas abas de pagos.
   * E funcao comum (nao componente) de proposito: assim o React nao remonta
   * o cartao a cada tecla digitada no campo de valor parcial.
   */
  const cartaoVenda = (v: TabSale) => (
              <div key={v.id} className={`bg-surface rounded-xl border p-3 shadow-card ${v.paid ? 'border-success-line' : 'border-line'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-ink text-sm">{v.customerName}</span>
                      {!v.paid ? (
                        <span className="text-[11px] font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-full">A RECEBER</span>
                      ) : v.annotated ? (
                        <span className="text-[11px] font-bold text-ink-2 bg-surface-2 px-2 py-0.5 rounded-full">
                          PAGO E ANOTADO
                        </span>
                      ) : (
                          <span className="text-[11px] font-bold text-info bg-info-bg px-2 py-0.5 rounded-full">
                            PAGO - FALTA ANOTAR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-2 mt-1">
                        {v.items.map((i) => `${i.quantity}x ${i.productName.replace('Cookie ', '')}`).join(', ')}
                      </p>
                      <p className="text-[11px] text-ink-3 mt-0.5 flex items-center gap-1">
                        <CalendarDays size={11} /> {dataBR(v.soldAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="text-right leading-tight">
                        <span className="font-bold text-brand tabular-nums">{brl(v.total)}</span>
                        {!v.paid && v.paidAmount > 0 && (
                          <p className="text-[10px] text-ink-3 tabular-nums mt-0.5">
                            pago {brl(v.paidAmount)} · falta{' '}
                            <span className="font-bold text-brand">{brl(v.total - v.paidAmount)}</span>
                          </p>
                        )}
                      </div>
                      {parcialId === v.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-ink-3">R$</span>
                          <input
                            type="number" step="0.01" min="0" inputMode="decimal" autoFocus
                            value={valorParcial}
                            onChange={(e) => setValorParcial(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') registrarParcial(v)
                              if (e.key === 'Escape') fecharParcial()
                            }}
                            placeholder={(v.total - v.paidAmount).toFixed(2)}
                            className="no-spinner w-20 border border-line rounded-md px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:border-brand" />
                          <button onClick={() => registrarParcial(v)} disabled={salvandoParcial}
                            title="Abater esse valor"
                            className="w-7 h-7 rounded-full bg-success-bg text-success hover:bg-success-line flex items-center justify-center transition-colors disabled:opacity-50">
                            <Check size={14} strokeWidth={3} />
                          </button>
                          <button onClick={fecharParcial} title="Cancelar"
                            className="w-7 h-7 rounded-full text-ink-4 hover:bg-surface-2 flex items-center justify-center transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={async () => { await setTabSalePaid(v.id, !v.paid); await carregar() }}
                          title={v.paid ? 'Marcar como não pago' : 'Marcar como pago'}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            v.paid ? 'bg-surface-2 text-ink-2 hover:bg-line' : 'bg-success-bg text-success hover:bg-success-line'
                          }`}>
                          {v.paid ? <Undo2 size={13} /> : <Check size={14} strokeWidth={3} />}
                        </button>
                        {v.paid && (
                          <button onClick={async () => { await setTabSaleAnnotated(v.id, !v.annotated); await carregar() }}
                            title={v.annotated ? 'Desmarcar anotado' : 'Marcar como anotado na planilha'}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                              v.annotated ? 'bg-surface-2 text-ink-2 hover:bg-line'
                                          : 'bg-info-bg text-info hover:bg-info-line'
                            }`}>
                            <NotebookPen size={13} />
                          </button>
                        )}
                        {!v.paid && (
                          <button onClick={() => { setParcialId(v.id); setValorParcial('') }}
                            title="Recebeu só uma parte"
                            className="w-7 h-7 rounded-full text-ink-4 hover:bg-brand-soft hover:text-brand flex items-center justify-center transition-colors">
                            <HandCoins size={13} />
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm(`Excluir a venda de ${v.customerName} (${brl(v.total)})?`)) return
                            await deleteTabSale(v.id); await carregar()
                          }}
                          title="Excluir"
                          className="w-7 h-7 rounded-full text-ink-4 hover:bg-danger-bg hover:text-danger flex items-center justify-center transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
  )

  return (
    <div className="space-y-4">
      {/* ---------- Produção levada para vender ---------- */}
      <Producao products={products} recarregar={versao} />

      {/* ---------- Registrar venda ---------- */}
      <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
        <h3 className="font-display font-bold text-ink mb-3">Registrar venda</h3>

        {/* Pessoa */}
        <label className="block text-xs text-ink-2 mb-1">Pessoa</label>
        <div className="mb-3">
          <SeletorCliente
            customers={customers}
            value={pessoaId}
            onChange={setPessoaId}
            onCreate={async (nome) => {
              const nova = await createTabCustomer(nome)
              await carregar()
              setPessoaId(nova.id)
            }}
            placeholder="Buscar pessoa pelo nome..."
          />
        </div>

        {/* Cookies */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {products.map((p) => {
            const q = qtds[p.id] ?? 0
            return (
              <div key={p.id} className={`rounded-lg border p-2 transition-colors ${
                q > 0 ? 'border-brand bg-brand-soft' : 'border-line'
              }`}>
                <p className="text-xs font-semibold text-ink truncate">{p.name.replace('Cookie ', '')}</p>
                <p className="text-[11px] text-ink-3 mb-1.5">{brl(p.price)}</p>
                <div className="flex items-center justify-between">
                  <button onClick={() => mudarQtd(p.id, -1)} disabled={q === 0}
                    className="w-7 h-7 rounded-full bg-surface border border-line text-brand flex items-center justify-center disabled:opacity-30"
                    aria-label={`Tirar 1 ${p.name}`}><Minus size={12} strokeWidth={2.5} /></button>
                  <span className="text-sm font-bold tabular-nums w-5 text-center">{q}</span>
                  <button onClick={() => mudarQtd(p.id, 1)}
                    className="w-7 h-7 rounded-full bg-brand text-brand-ink flex items-center justify-center"
                    aria-label={`Adicionar 1 ${p.name}`}><Plus size={12} strokeWidth={2.5} /></button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs text-ink-2 mb-1">Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)}
              className="border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-2 cursor-pointer mt-5">
            <input type="checkbox" checked={jaPago} onChange={(e) => setJaPago(e.target.checked)}
              className="w-4 h-4 accent-success-solid" />
            Já pagou
          </label>
          <div className="flex items-center gap-3 ml-auto mt-5">
            <span className="font-bold text-brand text-lg tabular-nums">{brl(totalCarrinho)}</span>
            <button onClick={registrar} disabled={salvando}
              className="bg-brand hover:bg-brand-strong text-brand-ink font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- A receber ---------- */}
      {summary.length > 0 && (
        <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-ink">A receber</h3>
            <span className="text-lg font-bold text-danger tabular-nums">{brl(totalAReceber)}</span>
          </div>
          <div className="space-y-1.5">
            {summary.map((r) => {
              const aberto = abertoId === r.customerId
              const vendas = vendasDe(r.customerId)
              return (
              <div key={r.customerId} className="border-b border-line-soft last:border-0">
                <div className="flex items-center justify-between gap-2 py-1.5">
                  <button
                    onClick={() => alternarVendas(r.customerId)}
                    aria-expanded={aberto}
                    title={`Ver as vendas de ${r.customerName}`}
                    className="group min-w-0 flex items-center gap-1.5 text-left -ml-1 px-1 py-0.5 rounded-md hover:bg-surface-2 transition-colors">
                    <ChevronRight
                      size={13}
                      className={`flex-shrink-0 text-ink-3 transition-transform duration-200 ${aberto ? 'rotate-90 text-brand' : ''}`} />
                    <span className="text-sm text-ink truncate group-hover:text-brand transition-colors">{r.customerName}</span>
                    <span className="text-[11px] text-ink-3 flex-shrink-0">({r.vendasAbertas}x)</span>
                  </button>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-ink tabular-nums">{brl(r.devendo)}</span>
                    {r.phone ? (
                      <a
                        href={linkWhatsApp(r)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => { markCharged(r.customerId).catch(() => {}) }}
                        title={`Abrir a conversa de ${r.customerName} no WhatsApp com a cobrança`}
                        className="w-8 h-7 rounded-md border border-success-line bg-success-bg text-success hover:bg-success-bg flex items-center justify-center transition-colors">
                        <WhatsAppIcon size={14} />
                      </a>
                    ) : (
                      <button
                        onClick={() => copiarCobranca(r)}
                        title={`${r.customerName} não tem WhatsApp cadastrado — copiar a mensagem`}
                        className={`w-8 h-7 rounded-md border flex items-center justify-center transition-colors ${
                          copiadoId === r.customerId
                            ? 'text-success bg-success-bg border-success-line'
                            : 'text-brand bg-brand-soft hover:bg-brand-line border-brand-line'
                        }`}>
                        {copiadoId === r.customerId
                          ? <Check size={14} strokeWidth={3} />
                          : <MessageCircle size={14} />}
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (!confirm(`Marcar tudo de ${r.customerName} como pago (${brl(r.devendo)})?`)) return
                        await payAllForCustomer(r.customerId); await carregar()
                      }}
                      className="text-xs font-semibold text-success bg-success-bg hover:bg-success-bg border border-success-line px-2.5 py-1 rounded-md transition-colors">
                      Quitar
                    </button>
                  </div>
                </div>

                {aberto && (
                  <div className="pb-2 pl-[18px] animate-fade-up">
                    {buscandoVendas ? (
                      <div className="py-2 flex justify-center">
                        <Loader2 size={14} className="animate-spin text-brand" />
                      </div>
                    ) : vendas.length === 0 ? (
                      <p className="text-[11px] text-ink-3 py-1.5">Nenhuma venda em aberto.</p>
                    ) : (
                      <div className="space-y-2">
                        {vendas.map((v) => cartaoVenda(v))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ---------- Histórico ---------- */}
      <div>
        <div className="flex gap-2 mb-3">
          {([
            { v: 'open' as TabStatus, label: 'A receber' },
            { v: 'all' as TabStatus, label: 'Todas' },
          ]).map(({ v, label }) => (
            <button key={v} onClick={() => setFiltro(v)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filtro === v ? 'bg-brand text-brand-ink border-brand'
                             : 'bg-surface text-ink-2 border-line hover:border-brand'
              }`}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={26} className="animate-spin text-brand" /></div>
        ) : filtro === 'open' ? (
          <p className="text-center text-ink-3 py-8 text-sm">
            As vendas em aberto ficam dentro de cada pessoa, ali em cima no “A receber”.
          </p>
        ) : sales.length === 0 ? (
          <p className="text-center text-ink-3 py-10 text-sm">Nenhuma venda aqui.</p>
        ) : (
          <div className="space-y-2">
            {sales.map((v) => cartaoVenda(v))}
          </div>
        )}
      </div>
    </div>
  )
}
