/**
 * Datas do painel, sempre no horario de Brasilia.
 *
 * O jeito obvio — new Date().toISOString().slice(0,10) — devolve a data em UTC.
 * Como o Brasil e UTC-3, depois das 21h isso ja e o dia seguinte: uma venda
 * lancada as 22h de 04/09 nascia com data 05/09. Foi exatamente o que
 * aconteceu. Fixar o fuso tambem cobre o caso de abrir o painel pelo celular
 * em viagem, ou de o relogio do computador estar em outro fuso.
 */
const FUSO = 'America/Sao_Paulo'

/** Hoje em Brasilia, no formato AAAA-MM-DD que o <input type="date"> espera. */
export const hoje = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

/**
 * Dia (AAAA-MM-DD) de um instante gravado com hora, como o paid_at do fiado.
 * Cortar o texto (slice(0, 10)) pegaria o dia em UTC: uma baixa dada as 22h
 * apareceria no dia seguinte.
 */
export const diaEmBrasilia = (instante?: string | null) => {
  if (!instante) return undefined
  const d = new Date(instante)
  if (Number.isNaN(d.getTime())) return undefined
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d)
}

/**
 * Mostra uma data AAAA-MM-DD como DD/MM/AAAA.
 * Le ao meio-dia de proposito: assim nenhum fuso empurra a data um dia para
 * tras ou para frente na hora de exibir.
 */
export const dataBR = (iso?: string | null, vazio = 'sem data') =>
  iso ? new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR') : vazio
