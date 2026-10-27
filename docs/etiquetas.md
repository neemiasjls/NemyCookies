# Etiquetas de sabor

Aba Etiquetas do painel (depois de Compras/Gastos). Um PDF por sabor, a folha inteira
com o mesmo sabor, para imprimir na etiqueta adesiva.

### A folha é igual ao documento original de etiquetas
Etiqueta Colacril CA4348 (equivale à Pimaco A4348): A4, papel acetinado, 126 etiquetas
por folha (7 colunas x 18 linhas) de 26 x 15 mm. Margem superior 13,5 mm, laterais
8 mm, 2 mm entre colunas e nenhum espaço entre linhas. Texto Cooper Black 11,
centralizado. Conferido contra o PDF que o Word gera do documento: diferença de 0,14 mm.
- Onde: `frontend/src/etiquetas.ts` (medidas em twips do .docx), `Etiquetas.tsx`
- Fonte: dono (documento) · Status: confirmado · Atualizado: 2026-10-26

### O PDF é montado no navegador com a Cooper Black do computador
A licença da Cooper Black (vem com o Office) deixa embutir a fonte no PDF, mas não
publicar o arquivo da fonte no site. Por isso a fonte é lida do computador (Chrome/Edge
pedem permissão) ou escolhida como arquivo (COOPBL.TTF) e fica guardada só naquele
navegador. Sem a fonte, a aba não gera PDF.
- Onde: `etiquetas.ts` (`buscarFonteInstalada`, `guardarFonte`), pdf-lib carregado só nessa aba
- Fonte: código · Status: inferido · Atualizado: 2026-10-26

### Os sabores das etiquetas ficam numa lista própria
Começa com Tradicional, Ovomaltine, KitKat, Nutella, Galak e Kinder; o dono adiciona e
exclui pela aba. Não depende dos produtos do site. Nome comprido demais para 26 mm sai
com a fonte reduzida só o necessário.
- Onde: tabela `etiquetas`, `etiquetas_listar()`, `etiqueta_salvar()`, `etiqueta_excluir()`,
  rotas `etiquetas` da Edge Function `admin`
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-26
