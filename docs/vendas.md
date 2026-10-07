# Vendas

Aba Vendas: vendas gerais lançadas à mão, vendas importadas da planilha e vendas da
de fiado já pagas. É a visão do dinheiro que entrou.

## O que entra

### Só venda paga do fiado aparece em Vendas
Venda em aberto no fiado fica só lá. Ao dar baixa, ela aparece em Vendas sozinha,
com o selo do estabelecimento, e só pode ser editada ou apagada pela aba Fiado.
- Por quê: fiado ainda não é dinheiro. Isso já quebrou uma vez (vendas pagas que não
  apareciam) e não pode se repetir.
- Onde: view `sales_all` (`where s.paid`), `Vendas.tsx` (`apagar` recusa origem `fiado`)
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04

### A venda geral é registrada pelos sabores, não por um valor digitado
Escolhem-se os sabores e o valor se calcula. O valor continua editável; se ele fugir
da soma dos sabores, a tela avisa e respeita o digitado.
Ao editar uma venda já registrada, o valor salvo fica como está até mexer nos sabores;
mexeu, ele passa a ser a soma deles (digitar no campo volta a travar, como na venda nova).
- Por quê: gera dado de qual sabor vende; às vezes se cobra diferente da tabela.
- Onde: `Vendas.tsx`, `general_sale_items`; `editar` abre com `valorManual: false`
- Antes: as 180 vendas importadas da planilha têm só o total, sem itens.
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-01

## Entrega

### Taxa de entrega: R$ 4, grátis a partir de R$ 50
Pedido com cookies abaixo de R$ 50 paga R$ 4; de R$ 50 para cima, entrega grátis.
A taxa sugerida é editável por venda: às vezes não se cobra (lugar que já estava no caminho).
- Onde: `frontend/src/entrega.ts` (fonte única, usada no carrinho, checkout, home e Vendas)
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-02

### Retirada não tem taxa nem gasto
Escolher retirada zera a taxa e o combustível; voltar para entrega sugere os dois de novo.
- Onde: `Vendas.tsx`, `general_sales.delivery_mode` (`entrega` | `retirada`)
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-02

### O gasto de combustível é uma média, ajustável por venda
Cada entrega guarda quanto custou em combustível. A sugestão é R$ 1,50 (carro a
etanol, trajetos curtos dentro de Herculândia); o dono aumenta ou diminui conforme a
distância.
- Onde: `GASTO_MEDIO_ENTREGA` em `entrega.ts`, `general_sales.delivery_cost`
- Fonte: dono (média ajustável) / código (valor 1,50) · Status: confirmado / inferido · Atualizado: 2026-09-02

### O combustível aparece em Compras/Gastos, mas mora na venda
Não é lançado como compra: a aba Compras/Gastos soma o gasto de cada venda e mostra à
parte, sem edição ali.
- Por quê: o dono anota o gasto na venda; somar evita lançar duas vezes.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-03

## Pagamento

### Formas de pagamento: dinheiro, Pix e cartão (débito, crédito ou outro)
Cartão abre a escolha débito/crédito/outro porque a taxa é diferente.
- Onde: tabela `payment_methods`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

### Maquininha InfinitePay: crédito 3,26%, débito 1,39%
Numa venda de R$ 100, a taxa é R$ 3,26 no crédito e R$ 1,39 no débito (percentual
simples sobre o valor). Os percentuais ficam em Precificação → Maquininha
(`payment_methods.fee_percent`) e podem mudar.
- Por quê: valores que a maquininha mostra com a opção de repassar a taxa ligada.
- Onde: `payment_methods`; editados por `forma_pagamento_taxa`
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-06

### Com cartão, quem paga a taxa é o dono
O cliente paga o valor da venda e a taxa sai do que o dono recebe: venda de R$ 100 no
crédito rende R$ 96,74. Por isso a taxa é descontada do recebido, não somada ao cobrado.
- Onde: `venda_salvar` (`payment_fee`), `taxaPrevista` em `Vendas.tsx`
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-06

### Escolher cartão na venda desconta a taxa sozinho
Ao marcar débito ou crédito, a tela mostra quanto a maquininha fica e quanto se recebe,
e a venda grava a taxa calculada, sem digitar nada.
- Onde: `taxaPrevista` em `Vendas.tsx` (prévia); `venda_salvar` grava `payment_fee`
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-06

### Venda no cartão vale pelo líquido, já sem a taxa
Venda em débito, crédito ou outro aparece e é anotada pelo valor que caiu (total menos a
taxa da maquininha): na lista de Vendas, no total do grupo e no "A anotar". Logo depois de
salvar, a venda nova já mostra o líquido. Ex.: R$ 18,00 no débito vira R$ 17,75.
- Por quê: o que interessa é o dinheiro que de fato entrou.
- Onde: `liquidoDa` em `Vendas.tsx` (`vendas_listar` manda o bruto); `vendas_a_anotar()`
  devolve `valor`/`total` já sem `payment_fee` e a chave `taxaCartao`. O resumo
  financeiro segue bruto em "Entrou", com a maquininha em "Saiu".
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-07

### Cartão "Outro": digita-se o líquido que caiu
Além de débito e crédito, o cartão tem "Outro": digita-se quanto caiu na conta e a taxa
é o total da venda (cookies + entrega) menos esse valor. Não pode cair mais que o total.
- Por quê: casos fora dos percentuais (parcelado, outra maquininha, repasse).
- Onde: `Vendas.tsx` (campo `liquido`, botão só aparece se `payment_methods` tiver
  `cartao_outro`); `venda_salvar(p_payment_fee)`; Edge Function `planilha` (`PAGAMENTOS`)
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-06

### A venda guarda a taxa já calculada, não o percentual
Mudar o percentual vale só para vendas novas; o que já foi recebido não muda.
- Onde: `general_sales.payment_fee`
- Fonte: documentação (commit) · Status: inferido · Atualizado: 2026-09-04

### A taxa da maquininha incide sobre o total, inclusive a entrega
- Onde: cálculo em `Vendas.tsx`
- Fonte: código · Status: inferido · Atualizado: 2026-09-04

## Datas

### Em Vendas, a data de uma venda de fiado é a do pagamento
O cabeçalho do grupo mostra quando o dinheiro entrou ("pago dia", ou "último pgto"
quando a pessoa pagou em dias diferentes). Dentro do grupo, cada venda mostra o dia em
que o cookie saiu e, se diferente, "pago DD/MM".
- Onde: `sales_all.sold_at` = data do pagamento; `sales_all.sale_date` = data da venda;
  o detalhe usa `saleDate ?? soldAt`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04

### O dia do pagamento de uma venda do fiado se corrige aqui também
A linha do fiado em Vendas continua só de leitura, exceto o dia do pagamento (ícone de
calendário). Venda lançada aqui não tem data de pagamento à parte: a data é a da venda,
editada no lápis.
- Onde: `salvarDiaPgto` em `Vendas.tsx`; regra completa em fiado.md
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-06

### Datas sempre no horário de Brasília
Toda data "de hoje" vem de `hoje()`, fixo em America/Sao_Paulo, independente do aparelho.
- Por quê: `toISOString()` é UTC; lançamentos depois das 21h caíam no dia seguinte.
- Onde: `frontend/src/data.ts` (`hoje`, `dataBR`); no banco, `sales_all` tira o dia do
  pagamento do fiado de `paid_at` em America/Sao_Paulo
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-06

## Listas e "a anotar"

### As listas agrupam por pessoa
Uma linha por pessoa, que abre com as vendas dela (igual ao "A receber" do fiado).
Ordem: venda mais recente de cada pessoa em cima.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04

### "A anotar" cobre todas as vendas e gera uma linha por pessoa
Seção da aba Vendas com tudo que ainda não foi para a planilha: vendas gerais e vendas
de fiado já pagas. O botão copia uma linha por pessoa:
`cookie <nome em minúsculas>` + TAB + `<total com vírgula>`; o total soma cookies e
taxa de entrega, menos a taxa do cartão quando houver.
- Por quê: é o formato da planilha pessoal; a taxa de entrega faz parte do que a pessoa
  pagou, e a do cartão não chega ao dono.
- Onde: `vendas_a_anotar()`, `copiarParaPlanilha` em `Vendas.tsx`
- Antes: as 180 vendas importadas nasceram marcadas como anotadas (já estavam na planilha).
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-07

### O nome na planilha leva o estabelecimento, exceto no principal
Cliente de fiado do principal sai como `cookie <nome>`; dos outros estabelecimentos,
`cookie <nome> (<estabelecimento>)`.
- Onde: `fiado_nome_planilha()` na view `sales_all` — ver fiado.md
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-30
