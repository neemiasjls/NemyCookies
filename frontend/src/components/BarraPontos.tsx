const limite = (n: number) => Math.max(0, Math.min(100, n))
/** Listras do trecho "a receber": deixa claro que esses pontos ainda nao entraram. */
const LISTRAS = 'repeating-linear-gradient(135deg, transparent 0 3px, rgba(255,255,255,0.22) 3px 6px)'

/**
 * Progresso ate um cookie: dourado = pontos que ela ja tem; cinza listrado = pontos
 * a receber (compras em aberto). Usada na pagina da cliente e na aba Pontos do painel.
 */
export function BarraPontos({ valor, total, aReceber = 0, escura }: {
  valor: number; total: number; aReceber?: number; escura?: boolean
}) {
  const pct = limite(total > 0 ? (valor / total) * 100 : 0)
  const pctReceber = limite(total > 0 ? ((valor + aReceber) / total) * 100 : 0) - pct
  return (
    <div className={`mt-1.5 h-2 rounded-full overflow-hidden flex ${escura ? 'bg-white/15' : 'bg-surface-2'}`}
         role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(valor, total)}>
      <div className={`h-full transition-[width] duration-700 ${pct >= 100 ? 'bg-success-solid' : 'bg-gold'}`}
           style={{ width: `${pct}%` }} />
      {pctReceber > 0 && (
        <div className={`h-full transition-[width] duration-700 ${escura ? 'bg-white/35' : 'bg-ink-4/60'}`}
             style={{ width: `${pctReceber}%`, backgroundImage: LISTRAS }} />
      )}
    </div>
  )
}

export function LegendaPontos({ escura, seus = 'seus pontos' }: { escura?: boolean; seus?: string }) {
  return (
    <p className={`mt-1.5 flex items-center gap-3 text-[11px] ${escura ? 'text-orange-100/70' : 'text-ink-3'}`}>
      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold" /> {seus}</span>
      <span className="flex items-center gap-1">
        <span className={`w-2 h-2 rounded-full ${escura ? 'bg-white/35' : 'bg-ink-4/60'}`} style={{ backgroundImage: LISTRAS }} />
        a receber
      </span>
    </p>
  )
}
