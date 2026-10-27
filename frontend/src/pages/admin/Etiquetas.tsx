import { useEffect, useState } from 'react'
import { Download, Loader2, Plus, Tag, Trash2, Type, Upload, Check } from 'lucide-react'
import { getEtiquetas, criarEtiqueta, excluirEtiqueta, Etiqueta } from '../../api/api'
import {
  gerarFolhaEtiquetas, baixar, fonteGuardada, guardarFonte, buscarFonteInstalada, ehCooperBlack, ETIQUETAS_POR_FOLHA,
} from '../../etiquetas'

/**
 * Folhas de etiqueta de sabor (Colacril CA4348 = Pimaco A4348), iguais ao
 * documento original: um PDF por sabor, 126 etiquetas por folha. O PDF e montado
 * aqui no navegador com a Cooper Black do computador do dono (docs/etiquetas.md).
 */
export default function Etiquetas() {
  const [lista, setLista] = useState<Etiqueta[] | null>(null)
  const [fonte, setFonte] = useState<ArrayBuffer | null>(null)
  const [novo, setNovo] = useState('')
  const [ocupado, setOcupado] = useState<number | 'novo' | 'fonte' | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    getEtiquetas().then(setLista).catch((e: Error) => setErro(e.message))
    fonteGuardada().then((f) => f && usarFonte(f, false))
  }, [])

  /** Guarda a fonte neste navegador e mostra os nomes com ela, como sai no PDF. */
  const usarFonte = async (bytes: ArrayBuffer, guardar = true) => {
    setFonte(bytes)
    if (guardar) await guardarFonte(bytes)
    try {
      const face = new FontFace('CooperEtiqueta', bytes.slice(0))
      await face.load(); document.fonts.add(face)
    } catch { /* so a amostra fica sem a fonte; o PDF continua certo */ }
  }

  const pegarDoComputador = async () => {
    setOcupado('fonte'); setErro(null)
    const bytes = await buscarFonteInstalada()
    setOcupado(null)
    if (bytes) usarFonte(bytes)
    else setErro('Não deu para ler a fonte instalada. Escolha o arquivo COOPBL.TTF (fica em C:\\Windows\\Fonts).')
  }

  const escolherArquivo = async (arquivo?: File) => {
    if (!arquivo) return
    const bytes = await arquivo.arrayBuffer()
    if (!(await ehCooperBlack(bytes))) return setErro('Esse arquivo não é a fonte Cooper Black.')
    setErro(null); usarFonte(bytes)
  }

  const baixarFolha = async (e: Etiqueta) => {
    if (!fonte) return setErro('Carregue a fonte Cooper Black primeiro (logo acima).')
    setOcupado(e.id)
    try { baixar(await gerarFolhaEtiquetas(e.nome, fonte), `Etiquetas ${e.nome}.pdf`) }
    catch (x) { setErro(x instanceof Error ? x.message : 'Erro ao gerar o PDF') }
    finally { setOcupado(null) }
  }

  const adicionar = async () => {
    const nome = novo.trim()
    if (!nome) return
    setOcupado('novo'); setErro(null)
    try {
      const e = await criarEtiqueta(nome)
      setLista((l) => [...(l ?? []), e]); setNovo('')
      if (fonte) await baixarFolha(e)
    } catch (x) { setErro(x instanceof Error ? x.message : 'Erro ao criar a etiqueta') }
    finally { setOcupado(null) }
  }

  const remover = async (e: Etiqueta) => {
    if (!confirm(`Excluir a etiqueta ${e.nome}?`)) return
    try { await excluirEtiqueta(e.id); setLista((l) => (l ?? []).filter((x) => x.id !== e.id)) }
    catch (x) { setErro(x instanceof Error ? x.message : 'Erro ao excluir') }
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-xl border border-line p-4 shadow-card">
        <h3 className="font-display font-bold text-ink flex items-center gap-2"><Tag size={16} className="text-brand" /> Etiquetas de sabor</h3>
        <p className="text-xs text-ink-2 mt-1">
          Folha Colacril CA4348 (igual Pimaco A4348): A4, {ETIQUETAS_POR_FOLHA} etiquetas de 26 × 15 mm, Cooper Black 11 —
          igual ao documento original. Um PDF por sabor, a folha inteira com o mesmo sabor.
        </p>
        <p className="text-xs text-ink-3 mt-1">Na hora de imprimir: tamanho real (100%), sem “ajustar à página”.</p>

        {/* fonte */}
        <div className={`mt-3 rounded-lg border px-3 py-2.5 ${fonte ? 'border-success-line bg-success-bg' : 'border-brand-line bg-brand-soft'}`}>
          {fonte ? (
            <p className="text-sm text-success font-semibold flex items-center gap-1.5"><Check size={15} strokeWidth={3} /> Fonte Cooper Black pronta neste navegador</p>
          ) : (
            <>
              <p className="text-sm text-ink flex items-center gap-1.5"><Type size={15} className="text-brand" /> Para gerar o PDF, carregue a fonte Cooper Black (uma vez por navegador).</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button onClick={pegarDoComputador} disabled={ocupado === 'fonte'}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-brand text-brand-ink px-3 py-1.5 rounded-lg disabled:opacity-50">
                  {ocupado === 'fonte' ? <Loader2 size={13} className="animate-spin" /> : <Type size={13} />} Usar a fonte do computador
                </button>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-brand bg-surface border border-brand-line px-3 py-1.5 rounded-lg cursor-pointer">
                  <Upload size={13} /> Escolher o arquivo COOPBL.TTF
                  <input type="file" accept=".ttf,.otf" className="hidden" onChange={(e) => escolherArquivo(e.target.files?.[0])} />
                </label>
              </div>
              <p className="text-[11px] text-ink-3 mt-1.5">A fonte vem com o Office. Ela não vai para o site: fica só neste navegador.</p>
            </>
          )}
        </div>
        {erro && <p className="text-xs text-danger mt-2">{erro}</p>}
      </div>

      {/* sabores */}
      <div className="bg-surface rounded-xl border border-line shadow-card">
        {!lista ? (
          <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-brand" /></div>
        ) : (
          <div className="divide-y divide-line-soft">
            {lista.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <span className="text-base text-ink truncate" style={fonte ? { fontFamily: 'CooperEtiqueta, serif' } : undefined}>{e.nome}</span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => baixarFolha(e)} disabled={!fonte || ocupado === e.id}
                    className="flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand-soft border border-brand-line px-3 py-1.5 rounded-lg disabled:opacity-40">
                    {ocupado === e.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Baixar PDF
                  </button>
                  <button onClick={() => remover(e)} title="Excluir etiqueta"
                    className="w-8 h-8 rounded-full text-ink-4 hover:bg-danger-bg hover:text-danger flex items-center justify-center"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 p-3 border-t border-line-soft">
          <input value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') adicionar() }}
            placeholder="Novo sabor (ex.: Doce de Leite)" maxLength={40}
            className="flex-1 min-w-0 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
          <button onClick={adicionar} disabled={!novo.trim() || ocupado === 'novo'}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-strong text-brand-ink font-bold px-4 py-2 rounded-lg text-sm disabled:opacity-40">
            {ocupado === 'novo' ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}
