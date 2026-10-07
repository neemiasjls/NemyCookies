# Pedidos, estoque e produção

## Site

### A home informa: assado na hora, entrega, retirada e formas de pagamento
Informações em caixinhas na paleta marrom: cookies assados na hora; entrega R$ 4,
grátis a partir de R$ 50; retirada em horário a combinar; Pix, dinheiro e cartão
(aproximação). Não prometer prazo ("pronto em 1 hora" foi retirado).
- Onde: `frontend/src/pages/Home.tsx`
- Fonte: dono · Status: confirmado · Atualizado: 2026-08-11

### A logo e o nome no topo voltam para a home
- Fonte: dono · Status: confirmado · Atualizado: 2026-06-18

### O checkout aceita entrega ou retirada, e Pix, cartão ou dinheiro
Dinheiro é pago na entrega ou na retirada. Pix e cartão passam pelo Mercado Pago.
- Onde: `Checkout.tsx`, `PixPayment.tsx`, Edge Functions `checkout`, `payment-status`, `mp-webhook`
- Situação atual: ver pendencias.md (Mercado Pago).
- Fonte: código · Status: inferido · Atualizado: 2026-09-29

## Pedido manual

### O pedido manual é, na prática, o que vai para o fiado
Anotado na aba de pedidos. Ao ficar Pronto ou Entregue, vira venda no fiado do
estabelecimento do cliente, sozinho; dali segue o caminho normal (fiado até quitar,
depois Vendas). Na escolha do cliente, quem não é do principal aparece com o
estabelecimento ao lado.
- Por quê: os pedidos manuais são os cookies que o dono leva para o estabelecimento.
- Onde: `PedidoManual.tsx`, `update_order_status()`, `pedido_para_caderneta()`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

### Mudar o status de ida e volta não duplica a venda
O pedido guarda o vínculo com a venda criada na caderneta.
- Fonte: documentação (commit) · Status: inferido · Atualizado: 2026-09-04

### A data do pedido manual é escolhida ao anotar
Padrão é hoje. Pedido de hoje guarda a hora real; data passada entra ao meio-dia,
para o fuso não empurrar para o dia vizinho.
- Onde: `create_manual_order(p_sold_at)`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

### Pedido pode ser editado e excluído
Editar abre os sabores atuais e a observação; o total se refaz. Pedido cancelado não
se edita (reabrir antes).
- Onde: `AdminDashboard.tsx`, `pedido_editar()`, `pedido_excluir()`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

## Estoque

### Venda e fiado descontam do estoque de cookies
Registrar uma venda na aba Vendas ou uma venda no fiado já tira os cookies do estoque
do sabor; editar a venda ajusta pela diferença e excluir devolve. Vale também para
consumo próprio e brinde. As vendas registradas antes de 2026-10-07 não foram
reprocessadas: editar ou excluir uma delas não mexe no estoque.
- Por quê: controle de estoque sem lançar a baixa à mão.
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-07

### A baixa da venda é feita no banco, item por item
Cada item de venda guarda quanto tirou de fato (`estoque_baixado`); só desconta se a
venda estiver marcada (`baixa_estoque`, falso nas antigas). Inserir item desconta,
trocar sabor ou quantidade devolve o antigo e desconta o novo, apagar devolve o que
tirou. Vale para qualquer tela, porque fica em trigger.
- Onde: `general_sale_items`/`tab_sale_items` (`estoque_baixado`),
  `general_sales`/`tab_sales` (`baixa_estoque`), `venda_item_estoque()`,
  `estoque_baixar()`, `estoque_devolver()`
- Fonte: código · Status: inferido · Atualizado: 2026-10-07

### O estoque nunca fica negativo
Vender mais do que o estoque registra a venda e deixa o sabor em 0 (esgotado no site);
a tela da venda avisa antes de salvar. A venda guarda só o que tirou, e é isso que
volta ao editar ou excluir. Igual aos pedidos do site (`deduct_stock`).
- Onde: `products.stock` (CHECK `stock >= 0`), `estoque_baixar()`, `AvisoEstoque.tsx`
- Fonte: código · Status: inferido · Atualizado: 2026-10-07

### Venda que nasce de pedido não desconta duas vezes
Pedido manual não desconta; ao ficar Pronto/Entregue vira venda no fiado, e é essa
venda que desconta, uma vez. Se o pedido já tinha descontado (pagamento aprovado ou
dinheiro), a venda do fiado criada dele nasce sem baixa.
- Onde: `pedido_para_caderneta()` (`stock_was_deducted`)
- Fonte: código · Status: inferido · Atualizado: 2026-10-07

### Estoque só é devolvido uma vez
Cancelar já devolve o estoque. Excluir ou editar só devolve se o pedido ainda tinha
descontado. Pedido manual nasce pendente e nunca desconta; pedido do site desconta
quando o pagamento é aprovado.
- Por quê: devolver duas vezes infla o estoque.
- Onde: `stock_was_deducted()`, `restore_stock()`, `deduct_stock()`
- Fonte: código · Status: inferido · Atualizado: 2026-09-02

## Produção

### O lote de produção acompanha o que foi levado para vender
Sem pedidos fixos: o dono produz uma quantidade (geralmente no fim de semana), leva
para vender e registra o lote. Cada venda da caderneta desconta do lote aberto, para
saber quantos faltam vender. Fechar o lote mostra vendido × levado × sobra.
- Onde: `Producao.tsx`, `producao_abrir/ajustar/atual/fechar()`
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-01
