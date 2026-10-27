import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

/*
 * Folha de etiquetas de sabor igual ao documento original do dono
 * (Etiquetas_Cookies_Sabores.docx): etiqueta Colacril CA4348 / Pimaco A4348,
 * A4, 7 colunas x 18 linhas = 126 etiquetas de 26 x 15 mm.
 * Medidas em pontos (1 pt = 20 twips do Word), copiadas do .docx:
 *   pagina 11906 x 16838 twips, margem superior 765, esquerda 454,
 *   coluna 1474 com espaco de 113 entre colunas, linha exata de 850.
 * Texto: Cooper Black 11, centralizado. A linha de base fica a 24,99 pt do
 * topo de cada etiqueta (medido no PDF que o proprio Word gera do documento).
 */
const PAGINA = { largura: 11906 / 20, altura: 16838 / 20 }
const MARGEM = { topo: 765 / 20, esquerda: 454 / 20 }
const COLUNA = 1474 / 20
const ESPACO = 113 / 20
const LINHA = 850 / 20
const COLUNAS = 7
const LINHAS = 18
const TAMANHO = 11
const BASE_NO_TOPO = 24.99   // pt, para a fonte de 11
const FOLGA_LATERAL = 1.5    // pt de cada lado antes de reduzir a fonte

export const ETIQUETAS_POR_FOLHA = COLUNAS * LINHAS

/** Gera o PDF de uma folha inteira com o mesmo sabor nas 126 etiquetas. */
export async function gerarFolhaEtiquetas(nome: string, fonte: ArrayBuffer): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const cooper = await pdf.embedFont(fonte, { subset: true })
  pdf.setTitle(`Etiquetas ${nome}`)

  // nome comprido demais para 26 mm: reduz a fonte so o necessario (no documento todos cabem em 11)
  const largura11 = cooper.widthOfTextAtSize(nome, TAMANHO)
  const tamanho = Math.min(TAMANHO, TAMANHO * (COLUNA - 2 * FOLGA_LATERAL) / largura11)
  const largura = cooper.widthOfTextAtSize(nome, tamanho)
  // mantem o texto no meio da etiqueta quando a fonte diminui
  const base = BASE_NO_TOPO + (LINHA / 2 - BASE_NO_TOPO) * (1 - tamanho / TAMANHO)

  const pagina = pdf.addPage([PAGINA.largura, PAGINA.altura])
  for (let l = 0; l < LINHAS; l++) {
    const yTopo = MARGEM.topo + l * LINHA
    for (let c = 0; c < COLUNAS; c++) {
      const x = MARGEM.esquerda + c * (COLUNA + ESPACO) + (COLUNA - largura) / 2
      pagina.drawText(nome, { x, y: PAGINA.altura - (yTopo + base), size: tamanho, font: cooper, color: rgb(0, 0, 0) })
    }
  }
  return pdf.save()
}

/* ---------- A fonte Cooper Black vem do computador do dono ---------- */
// A licenca deixa embutir a fonte no PDF, mas nao publicar o arquivo no site:
// por isso ela e lida do proprio computador e guardada so neste navegador.
const BANCO = 'nemy-etiquetas'

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((ok, erro) => {
    const r = indexedDB.open(BANCO, 1)
    r.onupgradeneeded = () => r.result.createObjectStore('fontes')
    r.onsuccess = () => ok(r.result)
    r.onerror = () => erro(r.error)
  })
}

export async function fonteGuardada(): Promise<ArrayBuffer | null> {
  try {
    const db = await abrirBanco()
    return await new Promise((ok) => {
      const r = db.transaction('fontes').objectStore('fontes').get('cooper')
      r.onsuccess = () => ok((r.result as ArrayBuffer) ?? null)
      r.onerror = () => ok(null)
    })
  } catch { return null }
}

export async function guardarFonte(bytes: ArrayBuffer) {
  try {
    const db = await abrirBanco()
    db.transaction('fontes', 'readwrite').objectStore('fontes').put(bytes, 'cooper')
  } catch { /* sem armazenamento: pede o arquivo de novo da proxima vez */ }
}

type FonteLocal = { family: string; fullName: string; style: string; blob: () => Promise<Blob> }

/** Chrome/Edge no computador: le a Cooper Black instalada (pede permissao uma vez). */
export async function buscarFonteInstalada(): Promise<ArrayBuffer | null> {
  const consultar = (window as unknown as { queryLocalFonts?: () => Promise<FonteLocal[]> }).queryLocalFonts
  if (!consultar) return null
  try {
    const fontes = await consultar()
    const cooper = fontes.find((f) => /cooper black/i.test(f.fullName) || (/cooper black/i.test(f.family) && /regular|normal/i.test(f.style)))
    return cooper ? await (await cooper.blob()).arrayBuffer() : null
  } catch { return null }
}

/** Confere se o arquivo escolhido e mesmo a Cooper Black (o nome vem dentro da fonte). */
export async function ehCooperBlack(bytes: ArrayBuffer): Promise<boolean> {
  try {
    const f = fontkit.create(new Uint8Array(bytes)) as unknown as { familyName?: string; fullName?: string }
    return /cooper/i.test(`${f.familyName ?? ''} ${f.fullName ?? ''}`)
  } catch { return false }
}

export function baixar(bytes: Uint8Array, arquivo: string) {
  const url = URL.createObjectURL(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url; a.download = arquivo
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
