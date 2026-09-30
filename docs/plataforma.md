# Plataforma

## Onde cada parte roda

### Frontend no Cloudflare Pages, backend no Supabase
- Site: projeto `nemycookies` no Cloudflare Pages (https://nemycookies.pages.dev).
- Banco, funções SQL e Edge Functions (`admin`, `planilha`, `checkout`,
  `payment-status`, `mp-webhook`): Supabase, projeto `psnytvofbmrxrvofycds`.
- GitHub: só o código. Nenhum dado do negócio fica no repositório.
- Fonte: banco/código · Status: inferido · Atualizado: 2026-09-29

### Edge Functions e migrações não estão no git
Existem só no Supabase. Antes de alterar uma Edge Function, baixar a versão publicada
e reenviar o arquivo inteiro.
- Fonte: banco · Status: inferido · Atualizado: 2026-09-29

## Publicação

### O deploy do site é manual
O Cloudflare Pages não está ligado ao GitHub: `git push` não publica nada. Publicar:

```
cd frontend && npm run build && npx wrangler pages deploy dist --project-name=nemycookies
```

Conferir: o `/assets/index-*.js` citado em `https://nemycookies.pages.dev/` deve ser o
gerado pelo build (a troca pode levar alguns segundos).
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-04

### Banco vale na hora; frontend só depois do deploy
Migração ou Edge Function entra em produção ao ser aplicada. Mudança no frontend só
aparece após o deploy acima.
- Fonte: código · Status: inferido · Atualizado: 2026-09-04

### Toda mudança vai ao ar junto com a entrega
Mudança pronta é publicada no mesmo momento, sem esperar pedido.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-03

### Mexer no banco sem bagunçar dados
Mudanças no banco devem ser aditivas. Conferir contagens das tabelas antes e depois.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-08

## Segurança do banco

### Toda função nova revoga o EXECUTE público
`revoke execute on function ... from public, anon, authenticated` na mesma migração.
- Por quê: no Postgres, EXECUTE vem liberado para PUBLIC por padrão. Quem chama as
  funções é a Edge Function com a service role.
- Fonte: banco · Status: inferido · Atualizado: 2026-09-08

### Toda view: security_invoker e revoke, na mesma migração do create
```
alter view public.<v> set (security_invoker = on);
revoke all on public.<v> from anon, authenticated;
```
Recriar a view (`create or replace`) perde essas configurações.
- Por quê: view nasce como SECURITY DEFINER e o Supabase dá SELECT ao anon; já expôs
  vendas e custos uma vez.
- Fonte: banco · Status: inferido · Atualizado: 2026-09-10

### RLS ligado em todas as tabelas; só produtos e categorias são públicos
Tabela com RLS e sem policy nega tudo ao anon. Só `products` e `categories` têm
policy de SELECT.
- Fonte: banco · Status: inferido · Atualizado: 2026-09-08

### O painel autentica pela Edge Function admin
Login com senha em hash bcrypt, limite de tentativas por usuário e IP, e token
assinado no servidor. Toda rota do painel exige o token.
- Onde: Edge Function `admin`, `verify_admin()`, `login_bloqueado()`
- Fonte: código · Status: inferido · Atualizado: 2026-09-08

### Segredos ficam fora do código
Chaves do Supabase e do Mercado Pago no `frontend/.env` (fora do git) e nos secrets das
Edge Functions (painel do Supabase). Chave e nome do Pix em `app_settings`. Só a chave
anon do Supabase vai para o navegador.
- Fonte: código · Status: inferido · Atualizado: 2026-09-08

## Frontend

### A CSP libera um único script inline, por hash
O script que aplica o tema antes da página pintar é liberado pelo hash sha256 em
`frontend/public/_headers`. `npm run build` roda `scripts/verificar-csp.cjs` e quebra
se o hash não bater, mostrando o novo.
- Por quê: sem o hash, o navegador bloqueia o script e o tema escuro pisca branco.
- Fonte: código · Status: inferido · Atualizado: 2026-09-08

### Datas usam `hoje()` e `dataBR()` de `src/data.ts`
Nunca `new Date().toISOString()` para "hoje". Ver vendas.md → "Datas".
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

### Regras repetidas viram um módulo só
Regra usada em mais de uma tela vira arquivo próprio (`entrega.ts`, `data.ts`) em
vez de ser copiada.
- Fonte: código · Status: inferido · Atualizado: 2026-09-04

### Campo com sugestões usa `CampoComSugestoes`, não `<datalist>`
- Por quê: `<datalist>` não mostra seta nem lista antes de digitar; ninguém descobre que
  a lista existe.
- Fonte: dono · Status: confirmado · Atualizado: 2026-09-05

## Desenvolvimento local

### Rodar localmente
`.\start.ps1` sobe o site (porta 5173) e abre o navegador; `.\stop.ps1` derruba.
Precisa de `frontend/.env` (copiar de `.env.example`). O banco é sempre o do Supabase.
- Fonte: código · Status: inferido · Atualizado: 2026-09-29
