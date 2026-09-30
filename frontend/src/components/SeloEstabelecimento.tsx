import { Store } from 'lucide-react'

/**
 * Selo de uma venda de fiado ja quitada: diz de qual estabelecimento ela veio.
 * O nome chega do banco — o codigo nunca guarda nome de estabelecimento.
 */
export default function SeloEstabelecimento({ nome }: { nome?: string }) {
  if (!nome) return null
  return (
    <span
      title={`Venda de fiado (${nome}), já quitada`}
      className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-fiado-line bg-fiado-bg text-fiado inline-flex items-center gap-1">
      <Store size={10} strokeWidth={2.5} />
      {nome}
    </span>
  )
}
