/**
 * Regra da entrega, num lugar so.
 * Estava copiada no carrinho, no checkout e na home; agora todos apontam para ca,
 * para nao acontecer de mudar o valor num lugar e esquecer do outro.
 */
export const TAXA_ENTREGA = 4
export const FRETE_GRATIS_A_PARTIR_DE = 50

/** Quanto custa a entrega para um pedido desse valor. Acima do limite, sai de graca. */
export const taxaDoPedido = (total: number) =>
  total < FRETE_GRATIS_A_PARTIR_DE ? TAXA_ENTREGA : 0

/** Quanto falta para o frete sair de graca (0 quando ja e gratis). */
export const faltaParaFreteGratis = (total: number) =>
  Math.max(0, FRETE_GRATIS_A_PARTIR_DE - total)

/**
 * Combustivel medio de uma entrega em Herculandia.
 * Base: 2 a 4 km de ida e volta, alcool a ~R$ 3,40, e um Onix 1.0 turbo fazendo
 * uns 6 km/l em trajeto curto (motor frio gasta bem mais que o numero da tabela).
 * Bate com a media historica: R$ 100,00 em 69 entregas anotadas = R$ 1,45.
 */
export const GASTO_MEDIO_ENTREGA = 1.5
