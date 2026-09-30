# Vendas

Aba Vendas: vendas gerais lançadas à mão, vendas importadas da planilha e vendas da
Fiado já pagas. É a visão do dinheiro que entrou.

## O que entra

### Só venda paga do fiado aparece em Vendas
Venda em aberto na caderneta fica só lá. Ao dar baixa, ela aparece em Vendas sozinha,
com o selo do estabelecimento, e só pode ser editada ou apagada pela caderneta.
- Por quê: fiado ainda não é dinheiro. Isso já quebrou uma vez (vendas pagas que não
  apareciam) e não pode se repetir.
- Onde: view `sales_all` (`where s.paid`), `Vendas.tsx` (`apagar` recusa origem fiado)
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04

### A venda geral é registrada pelos sabores, não por um valor digitado
Escolhem-se os sabores e o valor se calcula. O valor continua editável; se ele fugir
da soma dos sabores, a tela avisa e respeita o digitado.
- Por quê: gera dado de qual sabor vende; às vezes se cobra diferente da tabela.
- Onde: `Vendas.tsx`, `general_sale_items`
- Antes: as 180 vendas importadas da planilha têm só o total, sem itens.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04

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

### Formas de pagamento: dinheiro, Pix, cartão débito, cartão crédito
Cartão abre a escolha débito/crédito porque a taxa é diferente.
- Onde: tabela `payment_methods`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

### Maquininha InfinitePay: crédito 4%, débito 2%
Os percentuais ficam em Precificação → Maquininha e podem mudar.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

### A venda guarda a taxa já calculada, não o percentual
Mudar o percentual vale só para vendas novas; o que já foi recebido não muda.
- Onde: `general_sales.payment_fee`
- Fonte: documentação (commit) · Status: inferido · Atualizado: 2026-09-04

### A taxa da maquininha incide sobre o total, inclusive a entrega
- Onde: cálculo em `Vendas.tsx`
- Fonte: código · Status: inferido · Atualizado: 2026-09-04

## Datas

### Em Vendas, a data de uma venda do fiado é a do pagamento
O cabeçalho do grupo mostra quando o dinheiro entrou ("pago dia", ou "último pgto"
quando a pessoa pagou em dias diferentes). Dentro do grupo, cada venda mostra o dia em
que o cookie saiu e, se diferente, "pago DD/MM".
- Onde: `sales_all.sold_at` = data do pagamento; `sales_all.sale_date` = data da venda;
  o detalhe usa `saleDate ?? soldAt`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04

### Datas sempre no horário de Brasília
Toda data "de hoje" vem de `hoje()`, fixo em America/Sao_Paulo, independente do aparelho.
- Por quê: `toISOString()` é UTC; lançamentos depois das 21h caíam no dia seguinte.
- Onde: `frontend/src/data.ts` (`hoje`, `dataBR`)
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

## Listas e "a anotar"

### As listas agrupam por pessoa
Uma linha por pessoa, que abre com as vendas dela (igual ao "A receber" do fiado).
Ordem: venda mais recente de cada pessoa em cima.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04

### "A anotar" cobre todas as vendas e gera uma linha por pessoa
Seção da aba Vendas com tudo que ainda não foi para a planilha: vendas gerais e vendas
do fiado já pagas. O botão copia uma linha por pessoa:
`cookie <nome em minúsculas>` + TAB + `<total com vírgula>`; o total soma cookies e
taxa de entrega.
- Por quê: é o formato da planilha pessoal; a taxa faz parte do que a pessoa pagou.
- Onde: `vendas_a_anotar()`, `copiarParaPlanilha` em `Vendas.tsx`
- Antes: as 180 vendas importadas nasceram marcadas como anotadas (já estavam na planilha).
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

### O nome na planilha leva o local do cliente
Cliente da caderneta com local (ex.: Outro Local) sai como `cookie <nome> (<local>)`.
- Onde: `tab_nome_com_local()` na view `sales_all` — ver fiado.md
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-10
