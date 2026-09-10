import { MapPin } from 'lucide-react'

/**
 * Quase todo mundo da caderneta compra no fiado, entao "Fiado" nao precisa
 * de selo nenhum: e o padrao. Quem compra em outro lugar leva este selo, para
 * a venda nao ser lida como se fosse do estabelecimento.
 *
 * O mesmo local entra entre parenteses no nome que vai para a planilha
 * ("cliente b (outro local)") — quem monta isso e a view sales_all, no banco.
 */
export default function SeloLocal({ local }: { local?: string }) {
  if (!local) return null
  return (
    <span
      title={`Compra na ${local}, não no fiado`}
      className="text-[10px] font-bold uppercase tracking-wide text-info bg-info-bg border border-info-line px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 flex-shrink-0">
      <MapPin size={10} strokeWidth={2.5} />
      {local}
    </span>
  )
}
