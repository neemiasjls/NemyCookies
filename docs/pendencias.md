# Pendências

Dúvidas em aberto, regras a confirmar e divergências. Resolvido: vira regra no arquivo
do assunto e sai daqui.

## Em aberto

### Edge Functions e migrações fora do git
Versionar numa pasta `supabase/` para não depender só do Supabase. Ver plataforma.md.
- Atualizado: 2026-09-29

### Não há como trocar um cliente de estabelecimento pelo painel
Hoje `tab_customers.estabelecimento_id` só muda direto no banco. Ver fiado.md.
- Atualizado: 2026-09-30

### Não há como mudar qual estabelecimento é o principal pelo painel
`fiado_estabelecimentos.principal` só muda direto no banco.
- Atualizado: 2026-09-30

### Vendas da caderneta de 11/08 registradas no dia 10/08
Nove vendas foram lançadas quando o painel ainda gravava datas em UTC. Foram mantidas
como estão, de propósito, até o dono decidir.
- Atualizado: 2026-09-05

## Divergências

### Ordem da cópia do "a anotar": data da venda ou do pagamento?
Em 2026-08-11 o dono pediu a cópia "do mais antigo para o mais recente, na ordem de
pagamento (quando dei baixa)". Hoje o código ordena cada pessoa pela venda mais antiga
(`saleDate ?? soldAt` em `Vendas.tsx`), e a função `vendas_a_anotar()` ordena pela data
de pagamento. Confirmar qual vale.
- Atualizado: 2026-09-29

## A confirmar

### O gasto médio de R$ 1,50 por entrega está bom?
Valor sugerido a partir do consumo informado (carro a etanol, trajetos curtos). Ver vendas.md.
- Atualizado: 2026-09-02
