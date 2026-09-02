import { useEffect, useState } from 'react'
import { getProducao, abrirProducao, ajustarProducao, fecharProducao } from '../../api/api'
import { Producao as Lote, Product } from '../../types'
import { Plus, Minus, Loader2, PackageCheck, SlidersHorizontal, Check, X } from 'lucide-react'

/**
 * O que foi produzido e levado para vender.
 * Cada venda registrada na caderneta desconta sozinha do lote aberto.
 */
export default function Producao({ products, recarregar }: { products: Product[]; recarregar: number }) {
  const [lote, setLote] = useState<Lote | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [abrindo, setAbrindo] = useState(false)      // formulario de abertura visivel
  const [salvando, setSalvando] = useState(false)
  const [ajustando, setAjustando] = useState(false)  // modo de edicao das quantidades
  const [qtds, setQtds] = useState<Record<number, number>>({})

  const carregar = async () => {
    try { setLote(await getProducao()) } finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [recarregar])

  const mudarQtd = (id: number, delta: number) =>
    setQtds((prev) => {
      const nova = Math.max(0, (prev[id] ?? 0) + delta)
      const copia = { ...prev }
      if (nova === 0) delete copia[id]; else copia[id] = nova
      return copia
    })

  const totalNovo = Object.values(qtds).reduce((s, q) => s + q, 0)

  const comecar = async () => {
    const items = Object.entries(qtds).map(([id, q]) => ({ productId: Number(id), quantity: q }))
    if (!items.length) return alert('Diga quantos cookies de cada sabor você levou')
    setSalvando(true)
    try {
      setLote(await abrirProducao(items))
      setQtds({}); setAbrindo(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao registrar a produção')
    } finally { setSalvando(false) }
  }

  const ajustar = async (productId: number, delta: number) => {
    try { setLote(await ajustarProducao(productId, delta)) }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao ajustar') }
  }

  const fechar = async () => {
    if (!lote) return
    if (!confirm(`Fechar a produção?\n\nVendidos: ${lote.vendido} de ${lote.levado}\nSobraram: ${lote.restante}`)) return
    try { await fecharProducao(); setLote(null); setAjustando(false) }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao fechar') }
  }

  if (carregando) {
    return (
      <div className="bg-surface rounded-2xl border border-line p-4 shadow-card flex justify-center">
        <Loader2 size={20} className="animate-spin text-brand" />
      </div>
    )
  }

  // ---------- Nenhum lote aberto ----------
  if (!lote) {
    return (
      <div className="bg-surface rounded-2xl border border-line p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-ink flex items-center gap-2">
              <PackageCheck size={17} className="text-brand" /> Levei para vender
            </h3>
            <p className="text-xs text-ink-2 mt-1 max-w-md">
              Anote quantos cookies você produziu e levou. Cada venda registrada aqui embaixo
              desconta sozinha, e você vê quantos ainda faltam vender.
            </p>
          </div>
          {!abrindo && (
            <button onClick={() => setAbrindo(true)}
              className="flex-shrink-0 bg-brand hover:bg-brand-strong text-brand-ink font-bold text-sm px-4 py-2.5 rounded-xl transition-colors">
              Registrar
            </button>
          )}
        </div>

        {abrindo && (
          <div className="mt-4 animate-fade-up">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {products.map((p) => {
                const q = qtds[p.id] ?? 0
                return (
                  <div key={p.id} className={`rounded-xl border p-2 transition-colors ${
                    q > 0 ? 'border-brand bg-brand-soft' : 'border-line'
                  }`}>
                    <p className="text-xs font-semibold text-ink truncate">{p.name.replace('Cookie ', '')}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <button onClick={() => mudarQtd(p.id, -1)} disabled={q === 0}
                        className="w-7 h-7 rounded-full border border-line text-brand flex items-center justify-center disabled:opacity-30"
                        aria-label={`Tirar 1 ${p.name}`}><Minus size={12} strokeWidth={2.5} /></button>
                      <span className="text-sm font-bold tabular-nums text-ink w-6 text-center">{q}</span>
                      <button onClick={() => mudarQtd(p.id, 1)}
                        className="w-7 h-7 rounded-full bg-brand text-brand-ink flex items-center justify-center"
                        aria-label={`Adicionar 1 ${p.name}`}><Plus size={12} strokeWidth={2.5} /></button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-end gap-3 mt-3">
              <span className="text-sm text-ink-2 mr-auto tabular-nums">
                {totalNovo} cookie{totalNovo === 1 ? '' : 's'}
              </span>
              <button onClick={() => { setAbrindo(false); setQtds({}) }}
                className="text-sm font-semibold text-ink-2 hover:text-ink px-3 py-2 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={comecar} disabled={salvando || totalNovo === 0}
                className="bg-brand hover:bg-brand-strong text-brand-ink font-bold text-sm px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40">
                {salvando ? 'Salvando...' : 'Começar'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ---------- Lote aberto ----------
  const pct = lote.levado > 0 ? Math.min(100, Math.round((lote.vendido / lote.levado) * 100)) : 0

  return (
    <div className="bg-surface rounded-2xl border border-line shadow-card overflow-hidden">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-display font-bold text-ink flex items-center gap-2">
              <PackageCheck size={17} className="text-brand" /> Levei para vender
            </h3>
            <p className="text-xs text-ink-2 mt-0.5 tabular-nums">
              {lote.vendido} de {lote.levado} vendidos ·{' '}
              <strong className={lote.restante > 0 ? 'text-brand' : 'text-success'}>
                {lote.restante > 0 ? `faltam ${lote.restante}` : 'acabou tudo'}
              </strong>
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setAjustando((v) => !v)}
              title={ajustando ? 'Concluir ajuste' : 'Levei mais alguns / tirei'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                ajustando ? 'bg-brand text-brand-ink' : 'text-ink-2 hover:text-brand hover:bg-brand-soft border border-line'
              }`}>
              {ajustando ? <Check size={15} strokeWidth={3} /> : <SlidersHorizontal size={15} />}
            </button>
            <button onClick={fechar} title="Fechar a produção"
              className="h-9 px-3 rounded-xl border border-line text-ink-2 text-sm font-semibold hover:border-danger hover:text-danger transition-colors flex items-center gap-1.5">
              <X size={14} /> Fechar
            </button>
          </div>
        </div>

        <div className="h-2 rounded-full bg-line overflow-hidden" role="progressbar"
          aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
          aria-label="Quanto já foi vendido">
          <div className="h-full bg-brand rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="divide-y divide-line-soft border-t border-line-soft">
        {lote.itens.map((i) => (
          <div key={i.productId} className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink truncate">
                {i.productName.replace('Cookie ', '')}
              </p>
              <p className="text-[11px] text-ink-3 tabular-nums">
                {i.levado} levados · {i.vendido} vendidos
              </p>
            </div>

            {ajustando ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => ajustar(i.productId, -1)}
                  className="w-8 h-8 rounded-lg border border-line text-brand flex items-center justify-center hover:bg-brand-soft transition-colors"
                  aria-label={`Tirar 1 ${i.productName}`}><Minus size={13} strokeWidth={2.5} /></button>
                <span className="w-8 text-center text-sm font-bold tabular-nums text-ink">{i.levado}</span>
                <button onClick={() => ajustar(i.productId, 1)}
                  className="w-8 h-8 rounded-lg bg-brand text-brand-ink flex items-center justify-center"
                  aria-label={`Adicionar 1 ${i.productName}`}><Plus size={13} strokeWidth={2.5} /></button>
              </div>
            ) : (
              <span className={`text-sm font-bold tabular-nums flex-shrink-0 px-2.5 py-1 rounded-full ${
                i.restante > 0 ? 'text-brand bg-brand-soft'
                  : i.restante === 0 ? 'text-success bg-success-bg'
                  : 'text-danger bg-danger-bg'
              }`}>
                {i.restante > 0 ? `faltam ${i.restante}`
                  : i.restante === 0 ? 'acabou'
                  : `${-i.restante} a mais`}
              </span>
            )}
          </div>
        ))}
      </div>

      {ajustando && (
        <p className="px-4 py-2.5 text-[11px] text-ink-2 bg-surface-2 border-t border-line-soft">
          Ajuste quantos você levou. Para incluir um sabor que não está na lista, feche e abra outra produção.
        </p>
      )}
    </div>
  )
}
