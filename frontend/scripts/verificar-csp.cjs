/*
 * A CSP libera o script inline do tema por hash. Se alguem editar aquele
 * script e esquecer de atualizar o hash, o navegador passa a bloquear e o
 * tema escuro volta a piscar branco ao carregar — falha silenciosa, que so
 * aparece pra quem usa tema escuro.
 *
 * Este check roda antes do build e quebra a compilacao nesse caso, ja
 * dizendo o hash novo.
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const raiz = path.join(__dirname, '..')
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8')
const headers = fs.readFileSync(path.join(raiz, 'public', '_headers'), 'utf8')

const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
let faltando = []

for (const [, corpo] of inline) {
  const hash = 'sha256-' + crypto.createHash('sha256').update(corpo, 'utf8').digest('base64')
  if (!headers.includes(hash)) faltando.push(hash)
}

if (faltando.length) {
  console.error('\n  CSP desatualizada.')
  console.error('  O index.html tem script inline que a CSP nao libera.')
  console.error('  Coloque este hash no script-src de public/_headers:\n')
  faltando.forEach((h) => console.error("    '" + h + "'"))
  console.error('')
  process.exit(1)
}

console.log(`csp ok (${inline.length} script inline conferido)`)
