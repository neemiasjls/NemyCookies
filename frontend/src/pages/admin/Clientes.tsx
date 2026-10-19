import { useEffect, useMemo, useState } from 'react'
import {
  getTabCustomers, createTabCustomer, renameTabCustomer, setTabCustomerNickname, setTabCustomerPhone,
  deleteTabCustomer, mergeTabCustomers, getSaldosFidelidade, gerarConviteCliente,
} from '../../api/api'
import { TabCustomer, SaldosFidelidade, ConviteCliente } from '../../types'
import { useEstabelecimento } from '../../hooks/useEstabelecimento'
import SeletorEstabelecimento from '../../components/SeletorEstabelecimento'
import { UserPlus, Pencil, Trash2, Search, Loader2, Users, Merge, Send, Copy, Check, X, Gift, Clock } from 'lucide-react'
import WhatsAppIcon from '../../components/WhatsAppIcon'

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

/** 5514912345678 -> (14) 91234-5678 */
const fone = (v?: string) => {
  if (!v) return ''
  const d = v.replace(/[^0-9]/g, '').replace(/^55/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return v
}

/** Clientes do estabelecimento de fiado escolhido. */
export default function Clientes() {
  const estab = useEstabelecimento()
  const [customers, setCustomers] = useState<TabCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [novo, setNovo] = useState('')
  const [apelido, setApelido] = useState('')
  const [telefone, setTelefone] = useState('')
  const [busca, setBusca] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [juntarDe, setJuntarDe] = useState<number | null>(null)
  // area da cliente: pontos e convite (so clientes do principal participam)
  const [fidelidade, setFidelidade] = useState<SaldosFidelidade | null>(null)
  const [convite, setConvite] = useState<ConviteCliente | null>(null)
  const [copiado, setCopiado] = useState(false)

  const carregar = async () => {
    if (!estab.id) return
    setLoading(true)
    getSaldosFidelidade().then(setFidelidade).catch(() => setFidelidade(null))
    try { setCustomers(await getTabCustomers(estab.id)) } finally { setLoading(false) }
  }

  /**
   * Convite para a area de pontos: ela abre o link, confirma o telefone e cria a senha.
   * Serve tambem para senha esquecida. O link so aparece agora; quem envia e o dono.
   */
  const convidar = async (c: TabCustomer) => {
    const f = fidelidade?.clientes.get(c.id)
    if (!c.phone) return alert(`Cadastre o WhatsApp de ${c.name} antes: ele é o login dela.`)
    const pergunta = f?.temAcesso
      ? `${c.name} já criou a senha. Mandar um convite novo (para quando ela esquecer a senha)?`
      : f?.conviteAte
        ? `Já tem um convite aberto para ${c.name}. Gerar outro? O anterior para de valer.`
        : `Convidar ${c.name} para a área de pontos?`
    if (!confirm(pergunta)) return
    try {
      setConvite(await gerarConviteCliente(c.id)); setCopiado(false)
      getSaldosFidelidade().then(setFidelidade).catch(() => {})
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro ao gerar o convite') }
  }

  const linkConvite = (v: ConviteCliente) => `${window.location.origin}/primeiro-acesso?c=${v.codigo}`

  const textoConvite = (v: ConviteCliente) => {
    const c = customers.find((x) => x.id === v.customerId)
    const jaTinha = fidelidade?.clientes.get(v.customerId)?.temAcesso
    return `Oii ${c?.nickname || v.nome.split(' ')[0]}! 🍪 ` +
      (jaTinha
        ? `Aqui está o link para criar uma senha nova na sua área de pontos da NemyCookies:\n\n`
        : `Agora a NemyCookies tem programa de pontos: cada R$ 1 em cookies vira 1 ponto, e os pontos viram cookie grátis. ` +
          `Lá você também vê seu fiado.\n\nCrie sua senha por este link:\n`) +
      `${linkConvite(v)}\n\nO link vale por 7 dias. Seu login é este número de telefone.`
  }

  const copiarConvite = async (v: ConviteCliente) => {
    try { await navigator.clipboard.writeText(textoConvite(v)); setCopiado(true) }
    catch { alert(textoConvite(v)) }
  }

  useEffect(() => { setJuntarDe(null); carregar() }, [estab.id])

  const jaExiste = customers.some(
    (c) => c.name.toLowerCase() === novo.trim().toLowerCase(),
  )

  const adicionar = async () => {
    const nome = novo.trim()
    if (!nome) return
    if (jaExiste) return alert(`"${nome}" já está cadastrado.`)
    setSalvando(true)
    try {
      await createTabCustomer(nome, apelido.trim() || undefined, telefone.trim() || undefined, estab.id ?? undefined)
      setNovo(''); setApelido(''); setTelefone('')
      await carregar()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao cadastrar')
    } finally { setSalvando(false) }
  }

  const renomear = async (c: TabCustomer) => {
    const nome = prompt('Novo nome:', c.name)
    if (!nome || nome.trim() === c.name) return
    try { await renameTabCustomer(c.id, nome.trim()); await carregar() }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao renomear') }
  }

  /** Apelido so serve para a mensagem de cobranca; vazio remove. */
  const editarApelido = async (c: TabCustomer) => {
    const novoApelido = prompt(`Apelido de ${c.name} (usado na mensagem de cobrança):`, c.nickname ?? '')
    if (novoApelido === null) return
    try { await setTabCustomerNickname(c.id, novoApelido.trim()); await carregar() }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao salvar o apelido') }
  }

  /** Numero para onde vai a cobranca; vazio remove. */
  const editarTelefone = async (c: TabCustomer) => {
    const novoFone = prompt(`WhatsApp de ${c.name} (com DDD):`, fone(c.phone))
    if (novoFone === null) return
    try { await setTabCustomerPhone(c.id, novoFone.trim()); await carregar() }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao salvar o telefone') }
  }

  const excluir = async (c: TabCustomer) => {
    if (!confirm(`Excluir ${c.name} do cadastro?`)) return
    try { await deleteTabCustomer(c.id); await carregar() }
    catch (e) { alert(e instanceof Error ? e.message : 'Erro ao excluir') }
  }

  const juntar = async (destino: TabCustomer) => {
    const origem = customers.find((c) => c.id === juntarDe)
    if (!origem) return
    if (!confirm(`Juntar "${origem.name}" em "${destino.name}"?\n\nTodas as vendas de ${origem.name} passam para ${destino.name}, e ${origem.name} é removido.`)) {
      return
    }
    try {
      await mergeTabCustomers(origem.id, destino.id)
      setJuntarDe(null)
      await carregar()
    } catch (e) { alert(e instanceof Error ? e.message : 'Erro ao juntar') }
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const lista = q ? customers.filter((c) => c.name.toLowerCase().includes(q)) : customers
    return lista
  }, [busca, customers])

  const totalDevendo = customers.reduce((s, c) => s + c.devendo, 0)

  return (
    <div className="space-y-4">
      <SeletorEstabelecimento
        lista={estab.lista}
        id={estab.id}
        onEscolher={estab.escolher}
        onMudou={async (novoId) => {
          await estab.recarregar()
          if (novoId) estab.escolher(novoId)
        }}
      />

      {/* Cadastrar */}
      <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
        <h3 className="font-display font-bold text-ink mb-1">Cadastrar cliente</h3>
        <p className="text-xs text-ink-2 mb-3">
          Cadastre uma vez e depois é só selecionar na venda — assim o nome nunca fica repetido.
          O apelido é opcional e só aparece na mensagem de cobrança.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') adicionar() }}
            placeholder="Nome completo"
            className="flex-1 min-w-0 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
          />
          <div className="flex gap-2">
            <input
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') adicionar() }}
              placeholder="Apelido"
              className="flex-1 min-w-0 sm:w-36 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            />
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') adicionar() }}
              placeholder="WhatsApp"
              inputMode="tel"
              className="flex-1 min-w-0 sm:w-40 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <button
            onClick={adicionar}
            disabled={salvando || !novo.trim()}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-brand-ink font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <UserPlus size={15} /> Adicionar
          </button>
        </div>
        {novo.trim() && jaExiste && (
          <p className="text-xs text-brand mt-2">Esse nome já está cadastrado.</p>
        )}
      </div>

      {/* Lista */}
      <div className="bg-surface rounded-xl border border-line shadow-card">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-line flex-wrap">
          <h3 className="font-display font-bold text-ink flex items-center gap-2">
            <Users size={16} className="text-brand" />
            {customers.length} cliente{customers.length === 1 ? '' : 's'}
          </h3>
          {totalDevendo > 0 && (
            <span className="text-sm text-ink-2">
              devendo <strong className="text-danger">{brl(totalDevendo)}</strong>
            </span>
          )}
        </div>

        <div className="p-3 border-b border-line-soft">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full border border-line rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {convite && (
          <div className="bg-brand-soft border-b border-brand-line px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 text-sm text-ink">
                <p className="font-semibold flex items-center gap-1.5"><Send size={14} className="text-brand" /> Convite de {convite.nome}</p>
                <p className="mt-1 text-ink-2">Código: <b className="text-ink font-mono tracking-widest select-all">{convite.codigo}</b></p>
                <p className="text-[11px] text-ink-3 mt-1">
                  Vale até {new Date(convite.expiraEm).toLocaleDateString('pt-BR')}. Ela abre o link, confirma o telefone e cria a senha.
                </p>
              </div>
              <button onClick={() => setConvite(null)} title="Fechar"
                className="w-7 h-7 rounded-full text-ink-3 hover:bg-surface flex items-center justify-center flex-shrink-0">
                <X size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2.5">
              <a href={`https://wa.me/${convite.telefone}?text=${encodeURIComponent(textoConvite(convite))}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-success bg-success-bg border border-success-line px-3 py-1.5 rounded-lg">
                <WhatsAppIcon size={13} /> Mandar no WhatsApp
              </a>
              <button onClick={() => copiarConvite(convite)}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand bg-surface border border-brand-line px-3 py-1.5 rounded-lg">
                {copiado ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />} {copiado ? 'Copiado' : 'Copiar mensagem'}
              </button>
            </div>
          </div>
        )}

        {juntarDe !== null && (
          <div className="bg-info-bg border-b border-info-line px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-info">
              Juntando <strong>{customers.find((c) => c.id === juntarDe)?.name}</strong> —
              clique em quem deve ficar com as vendas.
            </p>
            <button onClick={() => setJuntarDe(null)}
              className="text-xs font-semibold text-info hover:underline">
              cancelar
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-brand" /></div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-ink-3 py-8 text-sm">
            {busca ? 'Ninguém com esse nome.' : 'Nenhum cliente cadastrado ainda.'}
          </p>
        ) : (
          <div className="divide-y divide-line-soft">
            {filtrados.map((c) => (
              <div key={c.id}
                onClick={() => { if (juntarDe !== null && juntarDe !== c.id) juntar(c) }}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 ${
                  juntarDe !== null && juntarDe !== c.id ? 'cursor-pointer hover:bg-info-bg' : ''
                } ${juntarDe === c.id ? 'bg-info-bg' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); editarApelido(c) }}
                      title="Apelido usado na mensagem de cobrança"
                      className={`text-[11px] leading-none px-1.5 py-1 rounded-full border transition-colors ${
                        c.nickname
                          ? 'bg-brand-soft border-brand-line text-brand'
                          : 'border-dashed border-line text-ink-4 hover:text-brand hover:border-brand'
                      }`}>
                      {c.nickname ?? '+ apelido'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); editarTelefone(c) }}
                      title="WhatsApp usado para mandar a cobrança"
                      className={`text-[11px] leading-none px-1.5 py-1 rounded-full border transition-colors ${
                        c.phone
                          ? 'bg-success-bg border-success-line text-success'
                          : 'border-dashed border-line text-ink-4 hover:text-success hover:border-success'
                      }`}>
                      {c.phone ? fone(c.phone) : '+ whatsapp'}
                    </button>
                    {fidelidade?.clientes.has(c.id) && (() => {
                      const f = fidelidade.clientes.get(c.id)!
                      const estilo = f.temAcesso
                        ? 'bg-brand-soft border-brand-line text-brand'
                        : f.conviteAte
                          ? 'bg-info-bg border-info-line text-info'
                          : 'border-dashed border-line text-ink-4 hover:text-brand hover:border-brand'
                      return (
                        <button onClick={(e) => { e.stopPropagation(); convidar(c) }}
                          title={f.temAcesso
                            ? `Área de pontos ativa${f.ultimoAcesso ? ` · último acesso ${new Date(f.ultimoAcesso).toLocaleDateString('pt-BR')}` : ''} — clique para mandar um convite novo (senha esquecida)`
                            : f.conviteAte
                              ? `Convite enviado, vale até ${new Date(f.conviteAte).toLocaleDateString('pt-BR')} — clique para gerar outro`
                              : 'Convidar para a área de pontos'}
                          className={`flex items-center gap-1 text-[11px] leading-none px-1.5 py-1 rounded-full border transition-colors ${estilo}`}>
                          {f.temAcesso
                            ? <><Gift size={11} /> {f.pontos} pts</>
                            : f.conviteAte
                              ? <><Clock size={11} /> convidada</>
                              : <><Send size={11} /> convidar</>}
                        </button>
                      )
                    })()}
                  </div>
                  {c.devendo > 0 ? (
                    <p className="text-xs text-danger">
                      deve {brl(c.devendo)} · {c.vendasAbertas} venda{c.vendasAbertas === 1 ? '' : 's'}
                    </p>
                  ) : (
                    <p className="text-xs text-ink-3">em dia</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setJuntarDe(c.id) }}
                    title="Juntar com outro cliente (nome duplicado)"
                    className="w-8 h-8 rounded-full text-ink-3 hover:bg-info-bg hover:text-info flex items-center justify-center transition-colors">
                    <Merge size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); renomear(c) }} title="Renomear"
                    className="w-8 h-8 rounded-full text-ink-3 hover:bg-surface-2 flex items-center justify-center transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); excluir(c) }} title="Excluir"
                    className="w-8 h-8 rounded-full text-ink-4 hover:bg-danger-bg hover:text-danger flex items-center justify-center transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
