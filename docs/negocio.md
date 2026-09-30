# Negócio e glossário

## Visão geral

### É um delivery de cookies, feito por uma pessoa
Cookies artesanais assados na hora, vendidos em Herculândia/SP. O dono produz, entrega
e controla tudo sozinho; o painel substituiu a planilha onde ele anotava entradas e saídas.
- Por quê: a descrição certa é "delivery", não "e-commerce".
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-29

### As vendas chegam por quatro canais
1. **Site** — pedido online, entrega ou retirada.
2. **Fiado** — estabelecimento parceira: o dono deixa cookies lá, o estabelecimento vende e as
   pessoas pagam depois (fiado, anotado na caderneta).
3. **Outro Local** — outro ponto onde há clientes que compram no mesmo esquema de fiado.
4. **Venda direta** — levada para outra cidade no fim de semana, encomenda ou
   entrega avulsa; lançada à mão em Vendas.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-29

### Nem todo cookie produzido é venda
Parte da produção é consumo próprio ou brinde (ex.: para a família). Isso também é
registrado, para saber quanto custa o que se produz, mesmo sem receita.
- Onde: `general_sales.kind` = `venda` | `consumo_proprio` | `brinde`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-29

### O painel é pensado primeiro para celular
O dono usa o painel principalmente pelo celular. Layout que não cabe deve quebrar
linha ("descer um degrau"), nunca cortar.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-29

### Sabores atuais
Tradicional, Galak, Nutella, KitKat, Ovomaltine e Kinder. Preço de venda e estoque
ficam na tabela `products` (aba Estoque).
- Fonte: banco · Status: inferido · Atualizado: 2026-09-29

## Glossário

- **Fiado** — estabelecimento parceira; também o nome da aba da caderneta (antes "Caderneta").
- **Caderneta** — controle de fiado: quem comprou, o quê, quanto deve, quando pagou.
- **Dar baixa / quitar** — marcar venda da caderneta como paga. A data da baixa é a
  data de pagamento.
- **Local** — onde um cliente da caderneta compra, quando não é o fiado (ex.: Outro Local).
- **Planilha** — planilha pessoal que o dono ainda mantém; o painel gera as linhas para
  colar nela ("a anotar").
- **Anotada** — venda que já foi copiada para a planilha.
- **Venda geral** — venda lançada em Vendas (fora da caderneta).
- **Lote de produção** — cookies levados para vender; as vendas descontam dele.
- **Taxa de entrega** — o que o cliente paga pela entrega. Não confundir com
  **gasto de entrega** (combustível do dono).
- **Taxa da maquininha** — o que o cartão desconta do dono.

## Organização do painel

### Abas em dois grupos
Primeiro grupo: Fiado e Clientes (o fiado do estabelecimento). Segundo grupo: Estoque,
Pedidos, Produção, Vendas, Compras/Gastos, Precificação e Histórico.
- Por quê: a caderneta do estabelecimento é um controle separado e não se mistura com o resto.
- Onde: `frontend/src/pages/admin/AdminDashboard.tsx`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-02

### O Histórico registra tudo, com quem fez
Toda alteração no painel (baixa, compra, cliente novo, pedido, estoque…) fica no
histórico com usuário, dia e hora.
- Onde: tabela `audit_log`; cada rota que altera dados na Edge Function `admin` chama `log()`
- Fonte: dono · Status: confirmado · Atualizado: 2026-08-25

### Busca e listas de sugestão fecham ao clicar fora
A lista abre só ao clicar no campo ou no ícone; clicar fora fecha.
- Fonte: dono · Status: confirmado · Atualizado: 2026-08-11
