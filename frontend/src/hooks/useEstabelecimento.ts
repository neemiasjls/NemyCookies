import { useCallback, useEffect, useState } from 'react'
import { getEstabelecimentos } from '../api/api'
import { Estabelecimento } from '../types'

const CHAVE = 'fiado_estabelecimento'

const lerSalvo = () => {
  try {
    const v = Number(localStorage.getItem(CHAVE))
    return v > 0 ? v : null
  } catch { return null }
}

/**
 * Qual estabelecimento de fiado esta aberto no painel. Fica salvo no
 * navegador, entao as abas Fiado e Clientes abrem no mesmo lugar e a escolha
 * sobrevive a recarga. Sem escolha salva (ou se ela sumiu), abre o principal.
 */
export function useEstabelecimento() {
  const [lista, setLista] = useState<Estabelecimento[]>([])
  const [id, setId] = useState<number | null>(lerSalvo)

  const recarregar = useCallback(async () => {
    const l = await getEstabelecimentos()
    setLista(l)
    setId((atual) => (atual && l.some((e) => e.id === atual)
      ? atual
      : (l.find((e) => e.principal) ?? l[0])?.id ?? null))
    return l
  }, [])

  useEffect(() => { recarregar().catch(() => {}) }, [recarregar])

  const escolher = (novo: number) => {
    setId(novo)
    try { localStorage.setItem(CHAVE, String(novo)) } catch { /* sem armazenamento: so nao lembra */ }
  }

  // so devolve o id depois de a lista chegar, para ninguem buscar com um id velho
  const atual = lista.find((e) => e.id === id)
  return { lista, id: atual?.id ?? null, atual, escolher, recarregar }
}
