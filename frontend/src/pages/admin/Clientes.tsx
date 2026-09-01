import { useEffect, useMemo, useState } from 'react'
import {
  getTabCustomers, createTabCustomer, renameTabCustomer, setTabCustomerNickname, setTabCustomerPhone,
  deleteTabCustomer, mergeTabCustomers,
} from '../../api/api'
import { TabCustomer } from '../../types'
import { UserPlus, Pencil, Trash2, Search, Loader2, Users, Merge } from 'lucide-react'

const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

/** 5514998218858 -> (14) 99821-8858 */
const fone = (v?: string) => {
  if (!v) return ''
  const d = v.replace(/[^0-9]/g, '').replace(/^55/, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return v
}

export default function Clientes() {
  const [customers, setCustomers] = useState<TabCustomer[]>([])
  const [loading, setLoading] = useState(true)
  const [novo, setNovo] = useState('')
  const [apelido, setApelido] = useState('')
  const [telefone, setTelefone] = useState('')
  const [busca, setBusca] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [juntarDe, setJuntarDe] = useState<number | null>(null)

  const carregar = async () => {
    setLoading(true)
    try { setCustomers(await getTabCustomers()) } finally { setLoading(false) }
  }

  useEffect(() => { carregar() }, [])

  const jaExiste = customers.some(
    (c) => c.name.toLowerCase() === novo.trim().toLowerCase(),
  )

  const adicionar = async () => {
    const nome = novo.trim()
    if (!nome) return
    if (jaExiste) return alert(`"${nome}" já está cadastrado.`)
    setSalvando(true)
    try {
      await createTabCustomer(nome, apelido.trim() || undefined, telefone.trim() || undefined)
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
      {/* Cadastrar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <h3 className="font-display font-bold text-cookie-dark mb-1">Cadastrar cliente</h3>
        <p className="text-xs text-gray-500 mb-3">
          Cadastre uma vez e depois é só selecionar na venda — assim o nome nunca fica repetido.
          O apelido é opcional e só aparece na mensagem de cobrança.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') adicionar() }}
            placeholder="Nome completo"
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cookie-brown"
          />
          <div className="flex gap-2">
            <input
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') adicionar() }}
              placeholder="Apelido"
              className="flex-1 min-w-0 sm:w-36 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cookie-brown"
            />
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') adicionar() }}
              placeholder="WhatsApp"
              inputMode="tel"
              className="flex-1 min-w-0 sm:w-40 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cookie-brown"
            />
          </div>
          <button
            onClick={adicionar}
            disabled={salvando || !novo.trim()}
            className="flex items-center gap-1.5 bg-cookie-brown hover:bg-cookie-dark text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <UserPlus size={15} /> Adicionar
          </button>
        </div>
        {novo.trim() && jaExiste && (
          <p className="text-xs text-orange-600 mt-2">Esse nome já está cadastrado.</p>
        )}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 flex-wrap">
          <h3 className="font-display font-bold text-cookie-dark flex items-center gap-2">
            <Users size={16} className="text-cookie-brown" />
            {customers.length} cliente{customers.length === 1 ? '' : 's'}
          </h3>
          {totalDevendo > 0 && (
            <span className="text-sm text-gray-500">
              devendo <strong className="text-red-500">{brl(totalDevendo)}</strong>
            </span>
          )}
        </div>

        <div className="p-3 border-b border-gray-50">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-cookie-brown"
            />
          </div>
        </div>

        {juntarDe !== null && (
          <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-blue-800">
              Juntando <strong>{customers.find((c) => c.id === juntarDe)?.name}</strong> —
              clique em quem deve ficar com as vendas.
            </p>
            <button onClick={() => setJuntarDe(null)}
              className="text-xs font-semibold text-blue-700 hover:underline">
              cancelar
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-cookie-brown" /></div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            {busca ? 'Ninguém com esse nome.' : 'Nenhum cliente cadastrado ainda.'}
          </p>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtrados.map((c) => (
              <div key={c.id}
                onClick={() => { if (juntarDe !== null && juntarDe !== c.id) juntar(c) }}
                className={`flex items-center justify-between gap-2 px-4 py-2.5 ${
                  juntarDe !== null && juntarDe !== c.id ? 'cursor-pointer hover:bg-blue-50' : ''
                } ${juntarDe === c.id ? 'bg-blue-50' : ''}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-medium text-cookie-dark truncate">{c.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); editarApelido(c) }}
                      title="Apelido usado na mensagem de cobrança"
                      className={`text-[11px] leading-none px-1.5 py-1 rounded-full border transition-colors ${
                        c.nickname
                          ? 'bg-orange-50 border-orange-100 text-cookie-brown'
                          : 'border-dashed border-gray-200 text-gray-300 hover:text-cookie-brown hover:border-cookie-brown'
                      }`}>
                      {c.nickname ?? '+ apelido'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); editarTelefone(c) }}
                      title="WhatsApp usado para mandar a cobrança"
                      className={`text-[11px] leading-none px-1.5 py-1 rounded-full border transition-colors ${
                        c.phone
                          ? 'bg-green-50 border-green-100 text-green-700'
                          : 'border-dashed border-gray-200 text-gray-300 hover:text-green-700 hover:border-green-400'
                      }`}>
                      {c.phone ? fone(c.phone) : '+ whatsapp'}
                    </button>
                  </div>
                  {c.devendo > 0 ? (
                    <p className="text-xs text-red-500">
                      deve {brl(c.devendo)} · {c.vendasAbertas} venda{c.vendasAbertas === 1 ? '' : 's'}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">em dia</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); setJuntarDe(c.id) }}
                    title="Juntar com outro cliente (nome duplicado)"
                    className="w-8 h-8 rounded-full text-gray-400 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors">
                    <Merge size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); renomear(c) }} title="Renomear"
                    className="w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); excluir(c) }} title="Excluir"
                    className="w-8 h-8 rounded-full text-gray-300 hover:bg-red-50 hover:text-red-400 flex items-center justify-center transition-colors">
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
