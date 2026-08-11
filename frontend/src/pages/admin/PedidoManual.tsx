import { useEffect, useMemo, useState } from 'react'
import { getTabCustomers, createManualOrder, getProductionSummary } from '../../api/api'
import { Product, TabCustomer, ProductionSummary } from '../../types'
import SeletorCliente from '../../components/SeletorCliente'
import { Plus, Minus, X, ChefHat, ClipboardList } from 'lucide-react'

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

interface Props {
  products: Product[]
  onCriado: () => void
  recarregar: number
}

export default function PedidoManual({ products, onCriado, recarregar }: Props) {
  const [customers, setCustomers] = useState<TabCustomer[]>([])
  const [producao, setProducao] = useState<ProductionSummary | null>(null)
  const [aberto, setAberto] = useState(false)
  const [pessoaId, setPessoaId] = useState<number | null>(null)
  const [qtds, setQtds] = useState<Record<number, number>>({})
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => {
    const [pessoas, prod] = await Promise.all([getTabCustomers(), getProductionSummary()])
    setCustomers(pessoas)
    setProducao(prod)
  }

  useEffect(() => { carregar() }, [recarregar])

  const total = useMemo(
    () => Object.entries(qtds).reduce((s, [id, q]) => {
      const p = products.find((x) => x.id === Number(id))
      return s + (p ? p.price * q : 0)
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

  const salvar = async () => {
    const items = Object.entries(qtds).map(([id, q]) => ({ productId: Number(id), quantity: q }))
    if (!pessoaId) return alert('Selecione o cliente')
    if (!items.length) return alert('Selecione ao menos um cookie')
    setSalvando(true)
    try {
      await createManualOrder({ customerId: pessoaId, items })
      setPessoaId(null); setQtds({}); setAberto(false)
      await carregar()
      onCriado()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao salvar pedido')
    } finally { setSalvando(false) }
  }

  return (
    <div className="space-y-3 mb-4">
      {/* ---------- Resumo de produção ---------- */}
      {producao && producao.totalCookies > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h3 className="font-display font-bold text-cookie-dark flex items-center gap-2">
              <ChefHat size={17} className="text-cookie-brown" />
              Precisa assar
            </h3>
            <span className="text-xs text-gray-600">
              <strong className="text-cookie-dark">{producao.totalCookies}</strong> cookies ·{' '}
              <strong className="text-cookie-dark">{producao.totalPedidos}</strong> pedido(s)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {producao.porSabor.map((s) => (
              <div key={s.productId} className="bg-white rounded-lg border border-amber-100 px-2 py-2 text-center">
                <p className="text-2xl font-bold text-cookie-brown tabular-nums leading-none">{s.quantidade}</p>
                <p className="text-[11px] text-gray-500 mt-1 leading-tight truncate">
                  {s.productName.replace('Cookie ', '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Novo pedido manual ---------- */}
      {!aberto ? (
        <button
          onClick={() => setAberto(true)}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-cookie-brown text-cookie-dark font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <ClipboardList size={16} className="text-cookie-brown" />
          Anotar pedido
        </button>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-cookie-dark">Anotar pedido</h3>
            <button onClick={() => { setAberto(false); setPessoaId(null); setQtds({}) }}
              className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center" aria-label="Fechar">
              <X size={15} className="text-gray-500" />
            </button>
          </div>

          {/* Cliente */}
          <label className="block text-xs text-gray-500 mb-1">Cliente</label>
          <div className="mb-3">
            <SeletorCliente
              customers={customers}
              value={pessoaId}
              onChange={setPessoaId}
              placeholder="Buscar cliente cadastrado..."
              vazioTexto="Ninguém com esse nome. Cadastre na aba Clientes."
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

          <div className="flex items-center justify-end gap-3">
            <span className="font-bold text-cookie-brown text-lg tabular-nums">{brl(total)}</span>
            <button onClick={salvar} disabled={salvando}
              className="bg-cookie-brown hover:bg-cookie-dark text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50">
              {salvando ? 'Salvando...' : 'Salvar pedido'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
