import { Product } from '../types'

/**
 * Estoque na hora de escolher os cookies de uma venda (aba Vendas e Fiado).
 * A venda desconta do estoque no banco; o estoque nunca fica negativo:
 * vendendo mais do que tem, a venda e registrada e o sabor vai a 0.
 *
 * `jaTirado`: na edicao, o que a propria venda ja tinha tirado volta antes
 * de descontar de novo, entao conta como disponivel.
 */
export const disponivel = (p: Product, jaTirado = 0) => Math.max(0, p.stock) + jaTirado

/** Linha curta embaixo do sabor: quantos tem, ou que vai faltar. */
export function EstoqueDoSabor({ p, qtd, jaTirado = 0 }: { p: Product; qtd: number; jaTirado?: number }) {
  const tem = disponivel(p, jaTirado)
  if (qtd > tem) {
    return <p className="text-[10px] font-semibold text-warn leading-tight">só {tem} em estoque</p>
  }
  return (
    <p className={`text-[10px] leading-tight ${tem === 0 ? 'text-danger' : 'text-ink-4'}`}>
      {tem === 0 ? 'sem estoque' : `${tem} em estoque`}
    </p>
  )
}

/** Aviso geral, perto do botao de salvar, quando algum sabor passa do estoque. */
export function AvisoEstoque({ products, qtds, jaTirado = {} }: {
  products: Product[]
  qtds: Record<number, number>
  jaTirado?: Record<number, number>
}) {
  const faltando = products
    .map((p) => ({ p, q: qtds[p.id] ?? 0, tem: disponivel(p, jaTirado[p.id] ?? 0) }))
    .filter((x) => x.q > x.tem)
  if (!faltando.length) return null
  return (
    <p className="text-[11px] text-warn bg-warn-bg border border-warn-line rounded-lg px-3 py-2 mt-2">
      Mais cookies do que o estoque:{' '}
      {faltando.map((x) => `${x.p.name.replace('Cookie ', '')} (tem ${x.tem})`).join(', ')}.
      {' '}A venda é registrada mesmo assim e o estoque desse sabor fica em 0.
    </p>
  )
}
