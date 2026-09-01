/**
 * Tema claro/escuro.
 * A escolha fica num cookie (um ano), lido tambem pelo script inline do
 * index.html para a pagina ja nascer na cor certa, sem piscar.
 */
export type Tema = 'light' | 'dark'

const COOKIE = 'nemy_tema'
const UM_ANO = 60 * 60 * 24 * 365

export function lerTema(): Tema {
  const par = document.cookie.split('; ').find((c) => c.startsWith(COOKIE + '='))
  const salvo = par ? par.slice(COOKIE.length + 1) : ''
  if (salvo === 'light' || salvo === 'dark') return salvo
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement

  /* Sem isto, quem tem transition-colors fica preso na cor do tema anterior:
     o navegador nao reavalia a transicao quando so a variavel CSS muda. */
  raiz.classList.add('trocando-tema')
  raiz.setAttribute('data-theme', tema)
  void raiz.offsetHeight
  requestAnimationFrame(() => requestAnimationFrame(() => raiz.classList.remove('trocando-tema')))
  document.cookie = `${COOKIE}=${tema}; path=/; max-age=${UM_ANO}; samesite=lax`

  // Barra do navegador no celular acompanha o tema
  const meta = document.querySelector('meta[name=theme-color]')
  if (meta) meta.setAttribute('content', tema === 'dark' ? '#120D0A' : '#2C1A0E')
}
