import { useEffect, useMemo, useState } from 'react'
import {
  getTabSales, getTabSummary, getTabCustomers, createTabSale, createTabCustomer,
  setTabSalePaid, deleteTabSale, addTabPayment,
  payAllForCustomer, setTabSaleAnnotated, annotateAllTabSales, markCharged, TabStatus,
} from '../../api/api'
import { Product, TabSale, TabSummaryRow, TabCustomer } from '../../types'
import SeletorCliente from '../../components/SeletorCliente'
import WhatsAppIcon from '../../components/WhatsAppIcon'
import {
  Plus, Minus, Check, Trash2, Undo2, Loader2, CalendarDays,
  NotebookPen, ClipboardCopy, HandCoins, X, MessageCircle,
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

  const [copiado, setCopiado] = useState(false)

  /**
   * Formato da planilha: "cookie <nome>"  <TAB>  valor
   * Ordem: da baixa mais antiga para a mais recente, igual ao lancamento.
   */
  const copiarParaPlanilha = async () => {
    const linhas = [...sales]
      .sort((a, b) => (a.paidAt ?? '').localeCompare(b.paidAt ?? ''))
      .map((v) => `cookie ${v.customerName.toLowerCase()}\t${v.total.toFixed(2).replace('.', ',')}`)
      .join('\n')
    try {
      await navigator.clipboard.writeText(linhas)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      alert('Nao foi possivel copiar. Copie manualmente:\n\n' + linhas)
    }
  }

  const [anotandoTodas, setAnotandoTodas] = useState(false)

  /** Marca de uma vez todas as vendas pagas que faltam anotar */
  const anotarTodas = async () => {
    if (!confirm(`Marcar as ${sales.length} venda(s) desta lista como anotadas na planilha?`)) return
    setAnotandoTodas(true)
    try {
      const { anotadas } = await annotateAllTabSales()
      await carregar()
      alert(`${anotadas} venda(s) marcada(s) como anotadas.`)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao marcar')
    } finally { setAnotandoTodas(false) }
  }

  const totalAReceber = summary.reduce((s, r) => s + r.devendo, 0)

  return (
    <div className="space-y-4">
      {/* ---------- Registrar venda ---------- */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h3 className="font-display font-bold text-cookie-dark mb-3">Registrar venda</h3>

        {/* Pessoa */}
        <label className="block text-xs text-gray-500 mb-1">Pessoa</label>
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
                q > 0 ? 'border-cookie-brown bg-orange-50' : 'border-gray-200'
              }`}>
                <p className="text-xs font-semibold text-cookie-dark truncate">{p.name.replace('Cookie ', '')}</p>
                <p className="text-[11px] text-gray-400 mb-1.5">{brl(p.price)}</p>
                <div className="flex items-center justify-between">
                  <button onClick={() => mudarQtd(p.id, -1)} disabled={q === 0}
                    className="w-7 h-7 rounded-full bg-white border border-gray-200 text-cookie-brown flex items-center justify-center disabled:opacity-30"
                    aria-label={`Tirar 1 ${p.name}`}><Minus size={12} strokeWidth={2.5} /></button>
                  <span className="text-sm font-bold tabular-nums w-5 text-center">{q}</span>
                  <button onClick={() => mudarQtd(p.id, 1)}
                    className="w-7 h-7 rounded-full bg-cookie-brown text-white flex items-center justify-center"
                    aria-label={`Adicionar 1 ${p.name}`}><Plus size={12} strokeWidth={2.5} /></button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Data</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cookie-brown" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mt-5">
            <input type="checkbox" checked={jaPago} onChange={(e) => setJaPago(e.target.checked)}
              className="w-4 h-4 accent-green-600" />
            Já pagou
          </label>
          <div className="flex items-center gap-3 ml-auto mt-5">
            <span className="font-bold text-cookie-brown text-lg tabular-nums">{brl(totalCarrinho)}</span>
            <button onClick={registrar} disabled={salvando}
              className="bg-cookie-brown hover:bg-cookie-dark text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- A receber ---------- */}
      {summary.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-cookie-dark">A receber</h3>
            <span className="text-lg font-bold text-red-500 tabular-nums">{brl(totalAReceber)}</span>
          </div>
          <div className="space-y-1.5">
            {summary.map((r) => (
              <div key={r.customerId} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="text-sm text-cookie-dark truncate">{r.customerName}</span>
                  <span className="text-[11px] text-gray-400 flex-shrink-0">({r.vendasAbertas}x)</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold text-cookie-dark tabular-nums">{brl(r.devendo)}</span>
                  {r.phone ? (
                    <a
                      href={linkWhatsApp(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => { markCharged(r.customerId).catch(() => {}) }}
                      title={`Abrir a conversa de ${r.customerName} no WhatsApp com a cobrança`}
                      className="w-8 h-7 rounded-md border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 flex items-center justify-center transition-colors">
                      <WhatsAppIcon size={14} />
                    </a>
                  ) : (
                    <button
                      onClick={() => copiarCobranca(r)}
                      title={`${r.customerName} não tem WhatsApp cadastrado — copiar a mensagem`}
                      className={`w-8 h-7 rounded-md border flex items-center justify-center transition-colors ${
                        copiadoId === r.customerId
                          ? 'text-green-700 bg-green-50 border-green-200'
                          : 'text-cookie-brown bg-orange-50 hover:bg-orange-100 border-orange-200'
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
                    className="text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-2.5 py-1 rounded-md transition-colors">
                    Quitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Histórico ---------- */}
      <div>
        <div className="flex gap-2 mb-3">
          {([
            { v: 'open' as TabStatus, label: 'A receber' },
            { v: 'to_annotate' as TabStatus, label: 'Pagos a anotar' },
            { v: 'annotated' as TabStatus, label: 'Pagos e anotados' },
            { v: 'all' as TabStatus, label: 'Todos' },
          ]).map(({ v, label }) => (
            <button key={v} onClick={() => setFiltro(v)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filtro === v ? 'bg-cookie-brown text-white border-cookie-brown'
                             : 'bg-white text-gray-500 border-gray-200 hover:border-cookie-brown'
              }`}>{label}</button>
          ))}
        </div>

        {/* Copiar e marcar como anotadas */}
        {filtro === 'to_annotate' && sales.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
            <p className="text-xs text-blue-800 mb-2.5">
              Copie no formato da sua planilha (da baixa mais antiga para a mais recente),
              cole no Excel e depois marque todas como anotadas.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={copiarParaPlanilha}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
                <ClipboardCopy size={13} /> {copiado ? 'Copiado!' : `Copiar ${sales.length} linha(s)`}
              </button>
              <button onClick={anotarTodas} disabled={anotandoTodas}
                className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-50">
                <NotebookPen size={13} /> {anotandoTodas ? 'Salvando...' : 'Marcar todas como anotadas'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={26} className="animate-spin text-cookie-brown" /></div>
        ) : sales.length === 0 ? (
          <p className="text-center text-gray-400 py-10 text-sm">Nenhuma venda aqui.</p>
        ) : (
          <div className="space-y-2">
            {sales.map((v) => (
              <div key={v.id} className={`bg-white rounded-xl border p-3 shadow-sm ${v.paid ? 'border-green-100' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-cookie-dark text-sm">{v.customerName}</span>
                      {!v.paid ? (
                        <span className="text-[11px] font-bold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">A RECEBER</span>
                      ) : v.annotated ? (
                        <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          PAGO E ANOTADO
                        </span>
                      ) : (
                          <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                            PAGO - FALTA ANOTAR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {v.items.map((i) => `${i.quantity}x ${i.productName.replace('Cookie ', '')}`).join(', ')}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <CalendarDays size={11} /> {dataBR(v.soldAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className="text-right leading-tight">
                        <span className="font-bold text-cookie-brown tabular-nums">{brl(v.total)}</span>
                        {!v.paid && v.paidAmount > 0 && (
                          <p className="text-[10px] text-gray-400 tabular-nums mt-0.5">
                            pago {brl(v.paidAmount)} · falta{' '}
                            <span className="font-bold text-orange-600">{brl(v.total - v.paidAmount)}</span>
                          </p>
                        )}
                      </div>
                      {parcialId === v.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-gray-400">R$</span>
                          <input
                            type="number" step="0.01" min="0" inputMode="decimal" autoFocus
                            value={valorParcial}
                            onChange={(e) => setValorParcial(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') registrarParcial(v)
                              if (e.key === 'Escape') fecharParcial()
                            }}
                            placeholder={(v.total - v.paidAmount).toFixed(2)}
                            className="no-spinner w-20 border border-gray-200 rounded-md px-2 py-1 text-sm text-right tabular-nums focus:outline-none focus:border-cookie-brown" />
                          <button onClick={() => registrarParcial(v)} disabled={salvandoParcial}
                            title="Abater esse valor"
                            className="w-7 h-7 rounded-full bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center transition-colors disabled:opacity-50">
                            <Check size={14} strokeWidth={3} />
                          </button>
                          <button onClick={fecharParcial} title="Cancelar"
                            className="w-7 h-7 rounded-full text-gray-300 hover:bg-gray-100 flex items-center justify-center transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={async () => { await setTabSalePaid(v.id, !v.paid); await carregar() }}
                          title={v.paid ? 'Marcar como não pago' : 'Marcar como pago'}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                            v.paid ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}>
                          {v.paid ? <Undo2 size={13} /> : <Check size={14} strokeWidth={3} />}
                        </button>
                        {v.paid && (
                          <button onClick={async () => { await setTabSaleAnnotated(v.id, !v.annotated); await carregar() }}
                            title={v.annotated ? 'Desmarcar anotado' : 'Marcar como anotado na planilha'}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                              v.annotated ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}>
                            <NotebookPen size={13} />
                          </button>
                        )}
                        {!v.paid && (
                          <button onClick={() => { setParcialId(v.id); setValorParcial('') }}
                            title="Recebeu só uma parte"
                            className="w-7 h-7 rounded-full text-gray-300 hover:bg-orange-50 hover:text-cookie-brown flex items-center justify-center transition-colors">
                            <HandCoins size={13} />
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm(`Excluir a venda de ${v.customerName} (${brl(v.total)})?`)) return
                            await deleteTabSale(v.id); await carregar()
                          }}
                          title="Excluir"
                          className="w-7 h-7 rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 flex items-center justify-center transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
