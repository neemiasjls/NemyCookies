# Fiado — estabelecimentos, clientes e caderneta

Abas Fiado e Clientes. Controle de quem comprou fiado, o quê, quanto deve e quando
pagou, separado por estabelecimento. Dados da planilha não se misturam aqui.

## Estabelecimentos

### O fiado é separado por estabelecimento
Cada estabelecimento (ponto onde os cookies ficam para vender fiado) tem os próprios
clientes, o próprio "A receber" e a própria lista de vendas. Um deles é o principal.
Novos estabelecimentos são cadastrados e renomeados pelo painel.
- Onde: tabela `fiado_estabelecimentos`, `tab_customers.estabelecimento_id`,
  `SeletorEstabelecimento.tsx`, `useEstabelecimento.ts`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-30

### Nomes de estabelecimento existem só no banco
O código, a documentação e o repositório nunca citam o nome de um estabelecimento:
falam em "estabelecimento" e "fiado". O nome aparece na tela porque vem do banco.
- Por quê: é informação pessoal; o repositório é público.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-30

### Cada cliente pertence a um único estabelecimento
Se a mesma pessoa compra em dois lugares, é cadastrada duas vezes. Nome repetido só é
barrado dentro do mesmo estabelecimento; juntar clientes só entre o mesmo estabelecimento.
- Onde: `tab_customer_create()`, `tab_customer_merge()`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-30

### O estabelecimento escolhido fica lembrado no navegador
As abas Fiado e Clientes abrem no mesmo estabelecimento, o último escolhido; sem
escolha salva, abre o principal.
- Onde: `useEstabelecimento.ts` (localStorage `fiado_estabelecimento`)
- Fonte: código · Status: inferido · Atualizado: 2026-09-30

## Clientes

### Todo cliente é cadastrado antes de vender
A venda escolhe o cliente por busca, em vez de digitar o nome.
- Por quê: nome digitado à mão sai com grafias diferentes e não agrupa.
- Onde: `Clientes.tsx`, `SeletorCliente.tsx`, tabela `tab_customers`
- Fonte: dono · Status: confirmado · Atualizado: 2026-08-11

### Apelido serve só para a mensagem de cobrança
- Onde: `tab_customers.nickname`
- Fonte: dono · Status: confirmado · Atualizado: 2026-08-31

## Vendas do fiado

### Data da venda é o dia em que a pessoa anotou
Os cookies ficam no estabelecimento; quem compra anota na hora. Essa é a data da
venda (`tab_sales.sold_at`). A data de pagamento é o dia em que o dono dá baixa
no fiado (`paid_at`), podendo ser corrigida para o dia em que recebeu o pagamento.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04

### O dia do pagamento de uma venda quitada pode ser corrigido
Na aba Fiado (cartão da venda paga, "Pago em … · editar") e na aba Vendas (ícone de
calendário nas linhas do fiado) dá para trocar o dia do pagamento, sem mexer na data
da venda, nos cookies, nos valores nem no "anotada". Aceita do dia da venda até hoje.
- Por quê: às vezes a baixa é dada dias depois de receber.
- Onde: `tab_set_payment_date()` (grava meio-dia de Brasília em `paid_at`), rota
  `tab/:id/payment-date` da Edge Function `admin`, `setTabSalePaymentDate` em `api.ts`
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-06

### A lista segue a data e a ordem de registro
Data mais nova em cima; dentro do mesmo dia, o último registrado em cima.
- Onde: `tab_list()` (`order by sold_at desc, id desc` quando não filtra pagos)
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-01

### Venda de fiado é entrega, sem taxa
Quase todas são entregues no estabelecimento, sem cobrar taxa. Em Vendas aparecem como
"entrega no estabelecimento", com taxa e gasto zerados.
- Onde: view `sales_all` (`delivery_mode = 'entrega'`, `delivery_fee = 0`)
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

### Paga, a venda vai para Vendas; em aberto, fica só aqui
- Ver vendas.md → "Só venda paga do fiado aparece em Vendas".

### O nome na planilha leva o estabelecimento, exceto no principal
Cliente do principal sai só com o nome; dos outros, `Nome (Estabelecimento)`.
- Onde: `fiado_nome_planilha()` na view `sales_all`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-30

## A receber

### Cada pessoa do "A receber" abre com todas as vendas dela
Clicar no nome abre um dropdown com as vendas e todas as ações: dar baixa, pagamento
parcial, marcar como anotada e excluir. A lista de baixo também agrupa por pessoa.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-02

### Pagamento parcial existe, mas escondido
Abater parte de uma venda (ex.: pagou 25 de 34) fica atrás de um ícone discreto no
cartão da venda.
- Por quê: vai ser usado raramente.
- Onde: `tab_add_payment()`, `tab_sales.paid_amount` (entre 0 e o total)
- Fonte: dono · Status: confirmado · Atualizado: 2026-08-31

### A cobrança abre o WhatsApp da pessoa com o texto pronto
Mensagem gerada no servidor com o apelido, os cookies em aberto, o total e os dados do
Pix. Sem WhatsApp cadastrado, o botão copia o texto.
- Formato: "Oiii (apelido), segue o valor do cookie 🍪🤎", lista de cookies, "Total: R$",
  chave e nome do Pix.
- Onde: `tab_collection_message()`; chave e nome do Pix em `app_settings` (nunca no
  código do site); abrir a conversa é registrado no Histórico
- Os emojis aparecem quebrados só no WhatsApp do computador; no celular estão certos.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-02

## Filtros

### O fiado tem só dois filtros: "A receber" e "Todas"
O filtro "pagos a anotar" saiu daqui: anotar na planilha é na aba Vendas.
- Onde: `Caderneta.tsx`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04
