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
 * Mostra uma data AAAA-MM-DD como DD/MM/AAAA.
 * Le ao meio-dia de proposito: assim nenhum fuso empurra a data um dia para
 * tras ou para frente na hora de exibir.
 */
export const dataBR = (iso?: string | null, vazio = 'sem data') =>
  iso ? new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR') : vazio
