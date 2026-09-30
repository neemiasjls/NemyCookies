# NemyCookies — documentação do projeto

Delivery de cookies artesanais em Herculândia/SP. O site público recebe pedidos; o
painel admin (`/admin/dashboard`) controla o fiado dos estabelecimentos parceiros, vendas,
pedidos, estoque, produção, compras e custo de cada sabor. Frontend React/Vite no
Cloudflare Pages; banco, regras e API no Supabase (Postgres + Edge Functions).

Aqui fica o que o código não conta sozinho: regras de negócio, o motivo delas,
exceções e decisões. Leia só o arquivo do assunto em que vai mexer.

## Mapa

| Assunto | Arquivo | Palavras-chave |
|---|---|---|
| Visão geral e glossário | [negocio.md](negocio.md) | fiado, estabelecimento, planilha, canais |
| Vendas | [vendas.md](vendas.md) | `Vendas.tsx`, `entrega.ts`, `sales_all`, `vendas_a_anotar`, `general_sales`, `payment_methods`, Edge Function `planilha` |
| Fiado (estabelecimentos, clientes, caderneta) | [fiado.md](fiado.md) | `Caderneta.tsx`, `Clientes.tsx`, `SeletorEstabelecimento.tsx`, `useEstabelecimento.ts`, `fiado_*`, `tab_*`, Edge Function `admin` |
| Pedidos, estoque e produção | [pedidos.md](pedidos.md) | `Checkout.tsx`, `PedidoManual.tsx`, `AdminDashboard.tsx`, `Producao.tsx`, `orders`, `pedido_*`, `producao_*`, Edge Functions `checkout`, `payment-status`, `mp-webhook` |
| Plataforma | [plataforma.md](plataforma.md) | deploy, Supabase, Cloudflare, `_headers`, CSP, `data.ts`, fuso, views, `revoke` |
| Pendências e divergências | [pendencias.md](pendencias.md) | dúvidas em aberto, regras a confirmar |

Precificação (`Custos.tsx`, `ingredients`, `recipes`, `flavor_cost*`, `packaging_items`)
e compras (`Compras.tsx`, `purchases`) têm documentação interna, fora deste
repositório, porque envolvem custos e margens.

## Status de cada regra

- **confirmado** — definido ou confirmado pelo dono do negócio.
- **inferido** — lido no código ou no banco; pode ser bug ou regra antiga.
- **a confirmar** — hipótese, ainda sem confirmação.

## Como manter esta documentação

1. Regra nova, correção, exceção ou decisão durável vai para o arquivo do assunto.
2. Antes de criar, procure (`grep -ril "<termo>" docs/`): se já existe, edite no lugar.
3. Cada regra descreve o estado atual. Linha "Antes:" só quando dados antigos ainda
   seguem a regra velha.
4. Código não confirma regra: o que vem só do código é "inferido".
5. Duas versões que não dá para decidir vão para "Divergências" em pendencias.md.
6. Sem senhas, chaves, CPF, telefones, endereços, nomes de clientes ou de
   estabelecimentos: descreva o mecanismo, não a pessoa ou o lugar. Para segredos,
   registre só onde são configurados.
7. Formato de cada regra:

```
### <afirmação curta no presente>
<a regra, em 1–3 linhas>
- Por quê: <motivo>
- Onde: <arquivo, função, view>
- Fonte: dono | documentação | código | banco · Status: confirmado | inferido | a confirmar · Atualizado: AAAA-MM-DD
```
