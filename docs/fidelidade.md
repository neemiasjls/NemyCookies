# Fidelidade — área da cliente e pontos

Clientes do fiado entram no site com telefone e senha e veem os pontos delas.
Elas não fazem pedidos pelo site: a área da cliente é só o programa de fidelidade.

## Acesso

### Login é telefone e senha; a cliente cria a senha pelo convite
Não existe cadastro aberto. O dono convida cada cliente do estabelecimento principal: o
painel gera um código (link) de primeiro acesso, válido por 7 dias, e abre o WhatsApp
dele com a mensagem pronta. Ela abre o link, confirma o telefone e cria a própria senha.
"Esqueci a senha" é o mesmo caminho: o dono manda um convite novo. Depois de entrar,
ela vai direto para a página da fidelidade.
- Por quê: o programa é só para as clientes do fiado; SMS ou WhatsApp automático custam
  ou arriscam banir o número do dono, e com poucas clientes o envio manual basta.
- Onde: aba Clientes (chip "convidar" / "convidada" / pontos), `fidelidade_convidar()`,
  `fidelidade_primeiro_acesso()`, tabela `fidelidade_convites`, `PrimeiroAcesso.tsx`
  (`/primeiro-acesso?c=CODIGO`), rota `tab/customers/:id/convite` da Edge Function `admin`.
  Código de 8 letras/números sem 0/O/1/I/L; só o último convite vale; senha mínima de 6.
  O painel do convite abre dentro da caixinha da própria cliente, não no topo da lista.
- Mensagem (formato do dono): "Agora a NemyCookies tem programa de pontos: a cada 1 real
  você ganha 1 ponto, e os pontos podem ser trocados por cookies grátis." / "Acesse o site
  e crie sua senha por este link:" + link / "O link vale por 7 dias. Seu login é o seu
  número de telefone." Senha esquecida usa a mesma linha final.
- Antes: as senhas eram geradas pelo dono (Nome + símbolo + dígitos); as 23 criadas
  nunca foram entregues e foram desativadas.
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-19

### A página da cliente mostra o fiado em aberto
Quanto ela deve, cada compra em aberto (dia, cookies, valor, quanto já pagou) e a chave
Pix para pagar. Mostra todo o fiado em aberto, inclusive o de antes do lançamento.
Cada compra em aberto mostra "N pontos pendentes" (ou "antes do programa de pontos"), e as
barras de progresso mostram esses pontos a receber num trecho cinza listrado depois do
dourado (os que ela já tem). Eles só entram no saldo quando a compra é paga.
- Onde: `fidelidade_painel()` (`devendo`, `em_aberto` com `pontos`/`conta`, `a_liberar`, `pix` de
  `app_settings`), `Fidelidade.tsx` (`Barra`, `Legenda`)

### Para a cliente nunca se escreve "fiado"
Na página dela e nas mensagens que ela recebe, é "a pagar", "o que está em aberto" e
"pagamento em dia". "Fiado" é só o jeito de falar do dono e do painel.
- Por quê: elas pagam todo mês, no dia do pagamento, e algumas pagam antes.
- Onde: `Fidelidade.tsx` (seção "A pagar"), mensagem do convite em `Clientes.tsx`
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-19
- Fonte: dono (fiado) / código (Pix) · Status: confirmado / a confirmar · Atualizado: 2026-10-19

### A senha nunca fica guardada
No banco fica só o hash (bcrypt) da senha e do código do convite. Usar um convite novo
derruba quem estava logado. A sessão da cliente é própria
(token aleatório, hash no banco, 60 dias) e não abre o painel admin.
- Por quê: o login da cliente nunca pode abrir o painel; por isso não reaproveita o
  token do admin.
- Onde: `fidelidade_contas`, `fidelidade_sessoes`, `fidelidade_login()`, Edge Function
  `fidelidade` (limite de tentativas: `login_bloqueado()` com usuário `fidelidade:<telefone>`)
- Fonte: código · Status: inferido · Atualizado: 2026-10-19

### A entrada do site é o login da cliente; o delivery fica escondido em /delivery
Quem abre o site cai direto no login da área da cliente. O cardápio de pedidos saiu da
raiz e ficou em `/delivery`, sem link no site; checkout e pagamento voltam para ele.
`/entrar` redireciona para a raiz.
- Por quê: o dono não usa mais o delivery pelo site.
- Onde: `App.tsx` (rotas `/` = `Entrar.tsx`, `/delivery` = `Home.tsx`)
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-19

## Pontos

### A cliente vê pontos, nunca reais
O site mostra o saldo em pontos e quantos pontos cada cookie custa ("faltam 20 pontos
para um Nutella"). Não aparece valor em reais de cashback.
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-19

### 1 ponto por real pago; o cookie custa o preço ÷ 0,09 em pontos
Equivale a 9% de cashback. Preço em pontos = preço do cookie ÷ 0,09, arredondado para
cima de 5 em 5 (R$ 18 → 200 pontos). Acompanha sozinho a mudança de preço. Pontos por
real e valor do ponto são configuráveis sem mexer no código.
- Onde: `app_settings` (`fidelidade_pontos_por_real`, `fidelidade_valor_ponto`,
  `fidelidade_validade_dias`), `fidelidade_pontos_do_cookie()`
- Por quê: 9% leva a cliente típica a um cookie grátis em uns 4 meses, sem pesar na
  margem; o dono achou 10% alto. Não equivale a 9% de desconto: o cookie resgatado
  não gera pontos (no máximo ~8,3%) e parte dos pontos vence ou sobra sem uso.
- Fonte: dono (9%, pontos) · Status: confirmado (9%) / a confirmar (escala de 1 ponto por real) · Atualizado: 2026-10-19

### Só venda do fiado paga e feita a partir do lançamento gera pontos
Compras anteriores ao lançamento não contam (o programa começa do zero). O lançamento
vale desde o início de 19/10/2026: as vendas desse dia contam. Venda em
aberto não gera até ser quitada (assim fiado não pago não vira ponto, e os pontos
"a liberar" puxam o pagamento). O lançamento é o instante gravado em
`app_settings.fidelidade_inicio`: sem ele, nada gera pontos. Conta a venda registrada
depois desse instante e com data de venda a partir desse dia. Pagamento parcial em
dinheiro não gera; gera ao quitar. Desfazer a baixa ou excluir a venda tira os pontos;
corrigir o dia do pagamento move a data no extrato. Pedido que vira fiado segue a venda
criada (editar ou excluir o pedido depois não mexe nela nem nos pontos).
- Onde: triggers `tab_sales_fidelidade` e `tab_sales_fidelidade_vencer`,
  `fidelidade_venda_mudou()`, `fidelidade_venda_conta()`, extrato `fidelidade_movimentos`
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-19

### O resgate é de um cookie inteiro, escolhido ao registrar a venda do fiado
No formulário da venda, ao lado de "Já pagou", o dono marca qual cookie sai por pontos;
só aparecem os sabores que o saldo dela já paga (com pontos para um Tradicional, só o
Tradicional). O cookie entra na venda de graça e não gera pontos; não existe desconto
parcial. Desfazer a baixa ou excluir a venda devolve os pontos.
- Por quê: o resgate acontece na hora em que ela pega o cookie, não ao pagar.
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-19

### A aba Pontos resume os pontos de cada cliente
Terceira aba do grupo do fiado (Fiado, Clientes, Pontos): saldo, pontos pendentes, acesso
e vencimento de cada cliente do principal.
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-19

### Os pontos aparecem no Histórico
Ganho, troca, perda (baixa desfeita ou venda excluída) e vencimento de pontos ficam no
Histórico do painel.
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-19

### Os pontos zeram depois de 90 dias sem comprar
Quem compra pelo menos uma vez a cada 90 dias nunca perde os pontos. Conta como
atividade o dia da venda e o dia do pagamento. O vencimento é gravado no extrato
("vencido") quando alguém olha o saldo ou antes de entrar ponto novo.
- Por quê: limita o saldo parado de quem deixou de comprar.
- Onde: `fidelidade_vencer()`, `fidelidade_ultima_atividade()`
- Fonte: dono · Status: confirmado · Atualizado: 2026-10-19
