import { useEffect, useMemo, useState } from 'react'
import { getSaldosFidelidade } from '../../api/api'
import { Product, SaldosFidelidade } from '../../types'
import { BarraPontos, LegendaPontos } from '../../components/BarraPontos'
import { dataBR } from '../../data'
import { Gift, Loader2, Search, Send, Clock, RefreshCw } from 'lucide-react'

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

/** Resumo dos pontos de cada cliente do estabelecimento principal (docs/fidelidade.md). */
export default function Pontos({ products }: { products: Product[] }) {
  const [dados, setDados] = useState<SaldosFidelidade | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  const carregar = () => {
    setErro(null)
    getSaldosFidelidade().then(setDados).catch((e: Error) => setErro(e.message))
  }
  useEffect(carregar, [])

  // cookies do mais barato ao mais caro, com o preco em pontos
  const cookies = useMemo(() => products
    .map((p) => ({ id: p.id, nome: p.name.replace('Cookie ', ''), preco: p.price, pontos: dados?.cookies.get(p.id) ?? 0 }))
    .filter((c) => c.pontos > 0)
    .sort((a, b) => a.pontos - b.pontos), [products, dados])

  const clientes = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return [...(dados?.clientes.values() ?? [])]
      .filter((c) => !q || c.nome.toLowerCase().includes(q))
      .sort((a, b) => b.pontos - a.pontos || b.aReceber - a.aReceber || a.nome.localeCompare(b.nome))
  }, [dados, busca])

  if (!dados) {
    return erro ? (
      <div className="bg-surface border border-line rounded-xl p-6 text-center text-sm text-ink-2">
        {erro} <button onClick={carregar} className="ml-2 font-semibold text-brand hover:underline">Tentar de novo</button>
      </div>
    ) : <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-brand" /></div>
  }

  const todos = [...dados.clientes.values()]
  const totalPontos = todos.reduce((s, c) => s + c.pontos, 0)
  const totalReceber = todos.reduce((s, c) => s + c.aReceber, 0)
  const podemTrocar = cookies.length ? todos.filter((c) => c.pontos >= cookies[0].pontos).length : 0
  // valor aproximado em cookies: o ponto vale ~ preco / pontos do cookie mais vendido (Nutella ~ R$ 0,09)
  const valorPonto = cookies.length ? cookies[cookies.length - 1].preco / cookies[cookies.length - 1].pontos : 0.09

  return (
    <div className="space-y-4">
      {/* ---------- Resumo ---------- */}
      <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-bold text-ink flex items-center gap-2"><Gift size={16} className="text-brand" /> Pontos das clientes</h3>
          <button onClick={carregar} title="Atualizar" aria-label="Atualizar pontos"
            className="w-8 h-8 rounded-full text-ink-3 hover:bg-surface-2 flex items-center justify-center"><RefreshCw size={14} /></button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
          {[
            { t: 'Pontos com elas', v: totalPontos.toLocaleString('pt-BR'), d: `≈ ${brl(totalPontos * valorPonto)} em cookies` },
            { t: 'Pendentes', v: totalReceber.toLocaleString('pt-BR'), d: 'entram quando pagarem' },
            { t: 'Já podem trocar', v: String(podemTrocar), d: cookies[0] ? `${cookies[0].pontos}+ pontos` : '' },
            { t: 'Com pontos', v: String(todos.filter((c) => c.pontos > 0).length), d: `de ${todos.length} clientes` },
          ].map((k) => (
            <div key={k.t} className="rounded-lg bg-surface-2 px-3 py-2">
              <p className="text-[11px] text-ink-3">{k.t}</p>
              <p className="font-display text-lg font-bold text-ink tabular-nums">{k.v}</p>
              <p className="text-[11px] text-ink-3">{k.d}</p>
            </div>
          ))}
        </div>
        {cookies.length > 0 && (
          <p className="text-[11px] text-ink-3 mt-3">
            Cookies em pontos: {cookies.map((c) => `${c.nome} ${c.pontos}`).join(' · ')}. Vencem com 90 dias sem comprar.
          </p>
        )}
      </div>

      {/* ---------- Por cliente ---------- */}
      <div className="bg-surface rounded-xl border border-line shadow-card">
        <div className="p-3 border-b border-line-soft">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente..."
              className="w-full border border-line rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand" />
          </div>
          <LegendaPontos seus="pontos" />
        </div>
        <div className="divide-y divide-line-soft">
          {clientes.map((c) => {
            const da = cookies.filter((k) => k.pontos <= c.pontos)
            const proximo = cookies.find((k) => k.pontos > c.pontos)
            return (
              <div key={c.customerId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{c.nome}</p>
                    <p className="text-[11px] text-ink-3 flex items-center gap-1 flex-wrap">
                      {c.temAcesso
                        ? <><Gift size={11} /> área ativa{c.ultimoAcesso ? ` · entrou ${new Date(c.ultimoAcesso).toLocaleDateString('pt-BR')}` : ''}</>
                        : c.conviteAte ? <><Clock size={11} /> convidada</> : <><Send size={11} /> sem acesso</>}
                      {c.venceEm && <span>· vence {dataBR(c.venceEm)}</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-ink tabular-nums">{c.pontos} pts</p>
                    {c.aReceber > 0 && <p className="text-[11px] text-ink-3 tabular-nums">+{c.aReceber} pendentes</p>}
                  </div>
                </div>
                {proximo && <BarraPontos valor={c.pontos} aReceber={c.aReceber} total={proximo.pontos} />}
                <p className={`text-[11px] mt-1 ${da.length ? 'text-success font-semibold' : 'text-ink-3'}`}>
                  {da.length
                    ? `Já pode trocar: ${da.map((k) => k.nome).join(', ')}`
                    : proximo ? `Faltam ${proximo.pontos - c.pontos} para um ${proximo.nome}` : ''}
                </p>
              </div>
            )
          })}
          {clientes.length === 0 && <p className="text-center text-ink-3 py-8 text-sm">Ninguém com esse nome.</p>}
        </div>
      </div>
    </div>
  )
}
