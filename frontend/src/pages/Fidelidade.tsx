import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Cookie, Gift, Loader2, LogOut, Sparkles, CalendarClock, Hourglass, WifiOff, Copy, Check, NotebookText } from 'lucide-react'
import { FIDELIDADE_TOKEN, getPainelFidelidade, sairFidelidade } from '../api/api'
import { PainelFidelidade, MovimentoPontos } from '../types'
import { dataBR } from '../data'
import { WHATSAPP } from '../contato'
import ThemeToggle from '../components/ThemeToggle'
import WhatsAppIcon from '../components/WhatsAppIcon'
import { BarraPontos, LegendaPontos } from '../components/BarraPontos'

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`
const pts = (n: number) => `${n.toLocaleString('pt-BR')} ${Math.abs(n) === 1 ? 'ponto' : 'pontos'}`

/**
 * Area da cliente: pontos (nunca reais de cashback), o que ela tem a pagar e o Pix.
 * Para ela o site nunca escreve "fiado": e "a pagar" (docs/fidelidade.md).
 * Cada cookie tem um preco em pontos; a troca e feita pela loja na hora da compra.
 */
export default function Fidelidade() {
  const [painel, setPainel] = useState<PainelFidelidade | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [sessaoAcabou, setSessaoAcabou] = useState(false)
  const navigate = useNavigate()

  const carregar = () => {
    setErro(null)
    getPainelFidelidade()
      .then(setPainel)
      .catch((e: Error) => {
        if (/sess/i.test(e.message)) {
          localStorage.removeItem(FIDELIDADE_TOKEN)
          setSessaoAcabou(true)
        } else setErro(e.message)
      })
  }
  useEffect(carregar, [])

  if (!localStorage.getItem(FIDELIDADE_TOKEN) || sessaoAcabou) return <Navigate to="/" replace />

  const sair = async () => {
    try { await sairFidelidade() } catch { /* o token sai do navegador de qualquer jeito */ }
    localStorage.removeItem(FIDELIDADE_TOKEN)
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <nav className="bg-surface/85 backdrop-blur-md border-b border-line sticky top-0 z-30 shadow-card">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center gap-3">
          <img src="/logo.png" alt="" className="h-9 w-9 object-contain rounded-full" />
          <span className="font-display font-bold text-ink text-base flex-1">NemyCookies</span>
          <ThemeToggle />
          <button onClick={sair}
            className="flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-brand px-2 py-1.5 rounded-lg transition-colors">
            <LogOut size={16} /> Sair
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-5 space-y-4">
        {!painel ? (
          erro ? (
            <div className="bg-surface border border-line rounded-2xl p-6 text-center shadow-card">
              <WifiOff size={22} className="mx-auto text-ink-3" />
              <p className="text-sm text-ink-2 mt-2">{erro}</p>
              <button onClick={carregar} className="mt-4 text-sm font-semibold text-brand hover:underline">Tentar de novo</button>
            </div>
          ) : (
            <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-brand" /></div>
          )
        ) : (
          <Conteudo p={painel} />
        )}
      </main>
    </div>
  )
}

function Conteudo({ p }: { p: PainelFidelidade }) {
  const primeiroNome = p.nome.split(' ')[0]
  // o cookie mais barato que ainda falta: o proximo objetivo dela
  const proximo = p.cookies.find((c) => c.pontos > p.pontos)
  const podeTrocar = p.cookies.filter((c) => c.pontos <= p.pontos)
  const porReal = p.pontosPorReal === 1 ? '1 ponto' : `${p.pontosPorReal.toLocaleString('pt-BR')} pontos`

  return (
    <>
      {/* ---------- Saldo ---------- */}
      <section className="relative overflow-hidden rounded-3xl text-white shadow-pop
                          bg-gradient-to-br from-cookie-dark via-[#43270F] to-cookie-brown p-6">
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse 70% 60% at 85% 0%, rgba(232,160,32,0.28), transparent 70%)' }} />
        <div className="relative">
          <p className="text-orange-100/80 text-sm">Oi, {primeiroNome}!</p>
          <p className="text-orange-200/70 text-xs font-semibold uppercase tracking-wider mt-4">Seus pontos</p>
          <p className="flex items-center gap-2 mt-1">
            <Sparkles size={26} className="text-gold" />
            <span className="font-display text-5xl font-extrabold tabular-nums tracking-tight">
              {p.pontos.toLocaleString('pt-BR')}
            </span>
          </p>

          {proximo ? (
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-orange-50/90">
                  Faltam <b className="text-gold">{pts(proximo.pontos - p.pontos)}</b> para um {proximo.nome}
                </span>
                <span className="text-orange-200/60 text-xs tabular-nums flex-shrink-0">{p.pontos}/{proximo.pontos}</span>
              </div>
              <BarraPontos valor={p.pontos} aReceber={p.aLiberar} total={proximo.pontos} escura />
              {p.aLiberar > 0 && <LegendaPontos escura />}
              {p.aLiberar > 0 && p.pontos + p.aLiberar >= proximo.pontos && (
                <p className="mt-2 text-[13px] font-semibold text-gold">
                  Pagando o que está em aberto, você já garante um {proximo.nome}!
                </p>
              )}
            </div>
          ) : p.cookies.length > 0 && (
            <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-gold">
              <Gift size={16} /> Seus pontos já trocam por qualquer cookie!
            </p>
          )}

          {p.aLiberar > 0 && (
            <p className="mt-4 flex items-start gap-2 text-[13px] text-orange-100/85">
              <Hourglass size={14} className="flex-shrink-0 mt-0.5 text-gold" />
              <span>+{pts(p.aLiberar)} a receber: entram quando você pagar o que está em aberto.</span>
            </p>
          )}
          {p.venceEm && (
            <p className="mt-2 flex items-start gap-2 text-[13px] text-orange-100/70">
              <CalendarClock size={14} className="flex-shrink-0 mt-0.5" />
              <span>Seus pontos valem até {dataBR(p.venceEm)}. Comprando até lá, o prazo renova.</span>
            </p>
          )}
        </div>
      </section>

      <APagar p={p} />

      {/* ---------- Cookies em pontos ---------- */}
      <section className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 pt-4 pb-2">
          <h2 className="font-display font-bold text-ink">Troque por cookies</h2>
          {podeTrocar.length > 0 ? (
            <p className="text-xs text-success font-semibold mt-0.5">
              Você já pode trocar por {podeTrocar.length === 1 ? 'um' : 'qualquer um destes'}: {podeTrocar.map((c) => c.nome).join(', ')}
            </p>
          ) : (
            <p className="text-xs text-ink-3 mt-0.5">Quanto custa cada sabor</p>
          )}
          {p.aLiberar > 0 && <LegendaPontos />}
        </div>
        <ul className="divide-y divide-line">
          {p.cookies.map((c) => {
            const pronto = p.pontos >= c.pontos
            return (
              <li key={c.productId} className="flex items-center gap-3 px-4 py-3">
                {c.imagem ? (
                  <img src={c.imagem} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0 bg-surface-2" />
                ) : (
                  <span className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center flex-shrink-0">
                    <Cookie size={18} className="text-brand" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-sm text-ink truncate">{c.nome}</span>
                    <span className="text-sm font-bold text-ink tabular-nums flex-shrink-0">{c.pontos} pts</span>
                  </div>
                  <BarraPontos valor={p.pontos} aReceber={p.aLiberar} total={c.pontos} />
                  <p className={`text-[11px] mt-1 ${pronto ? 'text-success font-semibold' : 'text-ink-3'}`}>
                    {pronto
                      ? 'Já dá para trocar'
                      : p.pontos + p.aLiberar >= c.pontos
                        ? 'Pagando o que está em aberto, já dá para trocar'
                        : `Faltam ${pts(c.pontos - p.pontos)}`}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ---------- Como funciona ---------- */}
      <section className="bg-surface border border-line rounded-2xl shadow-card p-4">
        <h2 className="font-display font-bold text-ink">Como funciona</h2>
        <ul className="mt-3 space-y-2.5 text-sm text-ink-2">
          <li className="flex gap-2.5"><Num n={1} /> Cada R$ 1 em cookies vale {porReal}. Os pontos entram quando a compra é paga.</li>
          <li className="flex gap-2.5"><Num n={2} /> Juntou o suficiente? Na hora de pegar seu cookie, avise que quer usar os pontos: ele sai de graça.</li>
          <li className="flex gap-2.5"><Num n={3} /> Os pontos vencem em {p.validadeDias} dias. Cada compra renova o prazo: comprando pelo menos uma vez a cada {p.validadeDias} dias, você não perde nada.</li>
        </ul>
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
           className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
          <WhatsAppIcon size={15} /> Dúvidas? Chama no WhatsApp
        </a>
      </section>

      {/* ---------- Extrato ---------- */}
      <section className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
        <h2 className="font-display font-bold text-ink px-4 pt-4 pb-2">Extrato</h2>
        {p.extrato.length === 0 ? (
          <p className="px-4 pb-5 text-sm text-ink-3">Seus pontos aparecem aqui a partir da primeira compra paga.</p>
        ) : (
          <ul className="divide-y divide-line">
            {p.extrato.map((m, i) => <LinhaExtrato key={i} m={m} />)}
          </ul>
        )}
      </section>
    </>
  )
}

/** O que ela tem a pagar: quanto, o que pegou em cada dia e o Pix. */
function APagar({ p }: { p: PainelFidelidade }) {
  const [copiado, setCopiado] = useState(false)

  if (p.devendo <= 0) {
    return (
      <section className="bg-surface border border-line rounded-2xl shadow-card px-4 py-3.5 flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-success-bg flex items-center justify-center flex-shrink-0">
          <Check size={17} strokeWidth={3} className="text-success" />
        </span>
        <div>
          <p className="font-semibold text-sm text-ink">Pagamento em dia</p>
          <p className="text-xs text-ink-3">Nada em aberto. Obrigado!</p>
        </div>
      </section>
    )
  }

  const copiarPix = async () => {
    if (!p.pix) return
    try { await navigator.clipboard.writeText(p.pix.chave); setCopiado(true); setTimeout(() => setCopiado(false), 2500) }
    catch { alert(`Chave Pix: ${p.pix.chave}`) }
  }

  return (
    <section className="bg-surface border border-line rounded-2xl shadow-card overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-baseline justify-between gap-3">
        <h2 className="font-display font-bold text-ink flex items-center gap-2">
          <NotebookText size={17} className="text-brand" /> A pagar
        </h2>
        <span className="text-right">
          <span className="block text-[11px] text-ink-3">em aberto</span>
          <span className="font-display text-xl font-extrabold text-ink tabular-nums">{brl(p.devendo)}</span>
        </span>
      </div>
      <ul className="divide-y divide-line">
        {p.emAberto.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm text-ink">{c.itens}</p>
              <p className="text-[11px] text-ink-3 mt-0.5">{dataBR(c.data)}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-ink tabular-nums">{brl(c.total - c.pago)}</p>
              {c.pago > 0 && (
                <p className="text-[11px] text-ink-3 tabular-nums">pagou {brl(c.pago)} de {brl(c.total)}</p>
              )}
              {c.conta && c.pontos > 0 ? (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-ink-2 bg-surface-2 border border-line px-1.5 py-0.5 rounded-full tabular-nums"
                   title="Pontos pendentes: entram quando essa compra for paga">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-4" /> {c.pontos} {c.pontos === 1 ? 'ponto pendente' : 'pontos pendentes'}
                </p>
              ) : !c.conta && (
                <p className="text-[11px] text-ink-4 mt-0.5">antes do programa de pontos</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {p.pix && (
        <div className="border-t border-line bg-surface-2/60 px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0 text-xs">
            <p className="text-ink-3">Pague pelo Pix</p>
            <p className="font-semibold text-ink break-all">{p.pix.chave}</p>
            {p.pix.nome && <p className="text-ink-3">{p.pix.nome}</p>}
          </div>
          <button onClick={copiarPix}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand bg-surface border border-brand-line px-3 py-2 rounded-lg flex-shrink-0">
            {copiado ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />} {copiado ? 'Copiado' : 'Copiar chave'}
          </button>
        </div>
      )}
    </section>
  )
}

function LinhaExtrato({ m }: { m: MovimentoPontos }) {
  const entra = m.pontos > 0
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm text-ink">{m.descricao}</p>
        <p className="text-[11px] text-ink-3 mt-0.5">{dataBR(m.data)}</p>
      </div>
      <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${entra ? 'text-success' : 'text-ink-3'}`}>
        {entra ? '+' : '−'}{Math.abs(m.pontos).toLocaleString('pt-BR')}
      </span>
    </li>
  )
}

const Num = ({ n }: { n: number }) => (
  <span className="w-5 h-5 rounded-full bg-brand-soft text-brand text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-px">{n}</span>
)
