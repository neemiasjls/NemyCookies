# Fiado — caderneta de fiado e clientes

Abas Fiado e Clientes. Controle de quem comprou fiado, o quê, quanto deve e quando
pagou. É separado do resto do painel: dados da planilha não se misturam aqui.

## Clientes

### Todo cliente da caderneta é cadastrado antes de vender
A venda escolhe o cliente por busca, em vez de digitar o nome.
- Por quê: nome digitado à mão sai com grafias diferentes e não agrupa.
- Onde: `Clientes.tsx`, `SeletorCliente.tsx`, tabela `tab_customers`; clientes
  duplicados podem ser juntados (`tab_customer_merge`)
- Fonte: dono · Status: confirmado · Atualizado: 2026-08-11

### Apelido serve só para a mensagem de cobrança
- Onde: `tab_customers.nickname`
- Fonte: dono · Status: confirmado · Atualizado: 2026-08-31

### Cliente pode ser de outro local, sem sair da caderneta
Quem compra fiado fora do fiado (ex.: Outro Local) fica no mesmo painel, com o mesmo
controle, mas marcado com o local. Local vazio = Fiado.
- Efeito: selo com o local ao lado do nome (A receber, lista de vendas, Clientes) e
  nome na planilha como `Nome (Local)`.
- Onde: `tab_customers.local`, `tab_nome_com_local()`, view `sales_all`, `SeloLocal.tsx`
- Ainda não há tela para editar o local; hoje é ajustado direto no banco.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-10

## Vendas da caderneta

### Data da venda é o dia em que a pessoa anotou
Os cookies ficam no ponto de venda; quem compra anota na hora. Essa é a data da venda
(`tab_sales.sold_at`). A data de pagamento é o dia em que o dono dá baixa na aba
Fiado (`paid_at`).
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04

### A lista segue a data e a ordem de registro
Data mais nova em cima; dentro do mesmo dia, o último registrado em cima.
- Onde: `tab_list()` (`order by sold_at desc, id desc` quando não filtra pagos)
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-01

### Venda do fiado é entrega, sem taxa
Quase todas são entregues no ponto, sem cobrar taxa. Em Vendas aparecem como
"entrega no fiado", com taxa zero e gasto zero.
- Onde: view `sales_all` (`delivery_mode = 'entrega'`, `delivery_fee = 0`)
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

### Paga, a venda vai para Vendas; em aberto, fica só aqui
- Ver vendas.md → "Só venda paga do fiado aparece em Vendas".

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

### A caderneta tem só dois filtros: "A receber" e "Todas"
O filtro "pagos a anotar" saiu daqui: anotar na planilha agora é na aba Vendas.
- Onde: `Caderneta.tsx`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04
