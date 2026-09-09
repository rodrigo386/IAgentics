# IAgentics — Memória do Projeto

Site institucional em **pt-BR**.

> **Mudança estrutural em 2026-08-28.** A IAgentics fechou parceria com o Pecege
> e a plataforma de ensino própria (rotas `/app`, `/admin`, `/certificados`) foi
> **desligada e removida**, junto com 14 tabelas do banco (migração `0008`). O
> repositório voltou a ser só o site público. `/cursos` sobreviveu como aviso de
> "em breve" da parceria — a URL tinha acabado de ser indexada e um 404 jogaria
> fora a autoridade recém-ganha. O histórico está no git e em
> [docs/ROADMAP-ACADEMY.md](docs/ROADMAP-ACADEMY.md), que ficou como registro de
> decisões, não de planos.

- **Produção**: https://iagentics.com.br (Cloudflare → Railway). A URL antiga `iagentics-production.up.railway.app` está MORTA. `www.iagentics.com.br` resolve com CNAME para o apex, proxy do Cloudflare ligado e certificado válido: desde 2026-08-26 ele **serve o site em 200**. Mas **ainda falta a Redirect Rule 301**, então o site responde em dois endereços. Não é urgente porque o `canonical` de toda página aponta para o apex e o Google consolida por ele — é higiene, não emergência.
- **GitHub**: rodrigo386/IAgentics · **Railway**: serviço IAgentics.
- **Design e brand**: ver [docs/DESIGN.md](docs/DESIGN.md) — é a fonte de verdade visual; não repetir aqui.
- **Posicionamento e copy**: ver [docs/PITCH-HACKTOWN-2026.md](docs/PITCH-HACKTOWN-2026.md) — resumo do pitch de set/2026, que **substitui o deck V2** como fonte. Traz também o mapa do que o site ainda não diz (6 dos 9 módulos do Nexo, time, "90 dias"). O plano aprovado para fechar essa distância, em 4 fases, está em [docs/PLANO-ALINHAMENTO-PITCH.md](docs/PLANO-ALINHAMENTO-PITCH.md) — **Fases 1 e 2 no ar desde 2026-09-04** (home e `/nexo` com o orquestrador de nove módulos); faltam os sócios (fotos) e os metadados.

## Stack

Next.js 15 App Router · React 19 · Tailwind v4 · Drizzle + Postgres (duas tabelas) · Remotion (vídeos) · vitest + Playwright.

Saíram com a plataforma: Auth.js, bcryptjs, o cliente Asaas e o canal transacional de e-mail.

## Mapa de rotas

- Público: `/` (home), `/nexo`, `/academy`, `/cursos`, `/spend-lab`, `/privacidade`, `/artigos`, `/artigos/[slug]`.
- API: `/api/contato` (Resend), `/api/estatisticas` (beacon de visitas) e `/api/lista-espera` (formulário de /cursos).
- **`/admin`** (2026-08-31): painel de visitas + lista de espera, e `/admin/lista-espera.csv` para exportar. **Atrás de Basic Auth no `middleware.ts`** — `ADMIN_USUARIO` e `ADMIN_SENHA`. Sem as variáveis, responde **503**: falha fechada de propósito, porque deploy sem variável não pode virar vazamento de dado pessoal.
- **`/preview/*`** (2026-09-02): páginas em construção esperando aprovação do Rodrigo — pedido dele: "não substitua a atual, crie uma paralela para eu visualizar antes". Três travas para não vazar: `robots: noindex` na página, `/preview/` no Disallow do robots.txt, fora de `ROTAS_SITEMAP` e sem link no site. O beacon de visitas ignora o prefixo (quem visita está aprovando, não visitando). Sem `canonical`: apontá-lo para a página oficial diria ao Google que são a mesma, e ainda não são. Aprovada, o conteúdo vira a página oficial e a prévia some — foi assim com `/preview/nexo` e `/preview/home` (aprovadas e promovidas em 2026-09-04). Hoje não há prévia no ar; o mecanismo (robots, beacon) fica pronto para a próxima.
- `/planos` redireciona 308 para `/cursos`.
- **Não existem mais** `/app`, `/certificados` nem `/api/auth`.

## Convenções que valem sempre

- **Toda string visível vive em `lib/content.ts`**, copiada verbatim do deck — hoje o `IAgentics_Pitch_Hacktown.pdf` (ver docs/PITCH-HACKTOWN-2026.md), que substituiu o `IAgentics_Clientes_V2.pptx` em 2026-09-01. Nunca hardcodar copy em componente. **Exceção deliberada: o corpo dos artigos** mora em `content/artigos/*.md` — a regra cobre copy de interface, não texto longo autoral, que tem ciclo de revisão próprio e ganha diff legível em arquivo separado. A moldura da listagem (`artigos` em `content.ts`) segue a regra.
- **Artigos**: Markdown com frontmatter em `content/artigos/`, lidos no build por `lib/artigos.ts` (`server-only`, usa `node:fs`). Decisão do Rodrigo em 2026-08-20: **sem editor**, ele escreve pelo repositório. Markdown puro, não MDX — os textos são prosa e não precisam de componente React.
  - **`status: "publicado"` é o portão.** Todo artigo nasce `rascunho`; rascunho não aparece na listagem, não entra no sitemap e responde **404** por URL direta (`dynamicParams = false`). Publicar é trocar uma palavra.
  - `/artigos` só entra no sitemap quando existe ao menos um publicado — listagem vazia anunciada ao Google é rastreamento gasto à toa.
  - `slug` do frontmatter tem que ser igual ao nome do arquivo, e a validação completa roda em `lib/artigos.test.ts` para **todos** os arquivos, inclusive rascunhos — o build só valida os publicados, então o teste é quem avisa cedo.
- **Vídeo com voz nunca toca sozinho.** `AutoplayVideo` é para fundo mudo em loop; onde alguém fala, é `<video controls preload="none">` com poster — os megabytes só saem do servidor para quem aperta play, e a duração fica ESCRITA na página, porque até o play o controle mostra "0:00". Os dois vídeos da Academy (2026-09-09) mostram a regra da legenda: o convite do Vinícius chegou sem legenda e ganhou `<track>` VTT (transcrição local com Whisper, nomes próprios revisados); o depoimento da Gabriela chegou com legenda **queimada na imagem** e por isso NÃO leva `<track>` — duas camadas do mesmo texto na tela — e a transcrição vai em `<details>` de texto, que é o que leitor de tela, buscador e o markdown para agentes alcançam. O convite toca a **1,25× por padrão** (`velocidade` em `content.ts`, aplicada por `VideoComVelocidade`, o único client component nisso): `playbackRate` não tem atributo em HTML.
- **"Nexo" em caixa mista nas strings** — em caps o leitor de tela soletra N-E-X-O. Peso visual vem da tipografia, não de maiúsculas.
- Datas relativas viram absolutas em docs; commits em pt-BR no padrão `feat:`/`fix:`.

## SEO (ver [docs/PLANO-SEO.md](docs/PLANO-SEO.md))

- **Endereço canônico é o apex** `https://iagentics.com.br` (`site.url`). O www **ainda não redireciona** (serve 200 igual, falta a Redirect Rule) — quem sustenta a consolidação hoje é o `canonical` de cada página, não o DNS.
- **`canonical` e `openGraph` são declarados por página, nunca no layout** — metadata do Next é herdada: um valor no layout faz toda rota se declarar como sendo a home. Use `ogDaPagina()` de `lib/seo.ts`.
- **Dado estruturado sai de `lib/seo.ts`**, sempre derivado de `lib/content.ts` — JSON-LD que não bate com a página é penalizado. O `cursosJsonLd` foi removido em 2026-08-28 junto com o catálogo: anunciar curso que não está à venda é exatamente o caso que a regra proíbe.
- **Página nova pública?** Entra em `ROTAS_SITEMAP`.
- As 13 URLs do sitemap foram **indexadas pelo Google em 2026-08-28**.
- **Prontidão para agentes**: ver [docs/AGENT-READINESS.md](docs/AGENT-READINESS.md) — o que o site faz, e o que foi **recusado com motivo** (o `api-catalog` da RFC 9727, em 2026-09-06: não há API pública, e os quatro endpoints sob `/api/` disparam e-mail, gravam inscrito ou contam visita — catalogá-los é convidar ao abuso). Antes de atender uma recomendação de verificador automático, conferir lá se já foi decidida.
- **Descoberta por agentes**: as páginas HTML devolvem `Link` header (RFC 8288) com `describedby` → `/llms.txt` e `privacy-policy` → `/privacidade` (`next.config.ts`). **Um header só, valores separados por vírgula** — o Next deduplica por chave e dois headers `Link` fariam o primeiro sumir. **Nunca anunciar `api-catalog`/`service-desc`/`service-doc`**: não há API pública, e rel sem alvo real é a mesma mentira do `cursosJsonLd`. O `/llms.txt` descreve o site ATUAL — ele ficou desatualizado por uma semana depois do desligamento da plataforma (anunciava certificados e assinatura), e `e2e/descoberta-agentes.spec.ts` existe para avisar.
- **Markdown para agentes** (negociação de conteúdo): `Accept: text/markdown` na mesma URL devolve a página em markdown; navegador segue recebendo HTML. O `middleware.ts` reescreve para `/api/markdown`, e **a rota viaja em header (`x-md-rota`), nunca em query**: num rewrite o Route Handler enxerga a URL ORIGINAL, então a query do destino não chega — o sintoma é silencioso e uniforme (toda página devolvendo a home, com content-type e contagem corretos). Artigo é servido do `.md` original; o resto converte o `<main>` com turndown. `Vary: Accept` nos dois lados, senão o CDN serve a representação errada. O fetch interno vai para `http://127.0.0.1:$PORT`, **nunca para a origem pública**: com `https` a chamada morre em `SSL routines: wrong version number` (o processo escuta HTTP na porta interna) — e isso só aparece em produção, porque local os dois endereços coincidem. Não usamos o "Markdown for Agents" do Cloudflare: **não existe no plano free**.
- O **robots.txt que o robô lê não é só o nosso**: o Cloudflare injeta o "Managed Content Signals" na frente, hoje com `Disallow: /` para ClaudeBot/GPTBot/Google-Extended. Isso não afeta o Googlebot, mas bloqueia citação em assistentes de IA.

## Medição de visitas

- `page_views` é agregada por dia+rota, sem cookie, IP ou identificador. O normalizador (`lib/estatisticas.ts`) é quem limita a **cardinalidade** — o endpoint é público, então o que ele aceita define quantas linhas o banco ganha por dia.
- **Cada artigo publicado é rota própria** desde 2026-08-31: saber qual texto traz tráfego decide a próxima pauta. A lista de slugs válidos vem de `slugsPublicados()` e é **injetada** no normalizador — sem ela, um POST forjado inventaria linhas com URLs falsas.
- O painel diz na tela que conta **visitas, não visitantes**. Não remover esse aviso: sem ele o número vira apresentação errada.

## Testes

- `npm run test:unit` (vitest, 75) · `npm run test:e2e` (Playwright, 50, **workers: 1**).
- Banco local: `npm run db:local` / `db:migrar` / `db:gerar`. **O e2e precisa dele de pé** — sem Postgres na 54329, os specs de lista de espera e do painel falham por motivo que não é o código.

## Deploy (Railway)

- `scripts/deploy-railway.sh` — build local → upload de `next-build/`. Poll de status via GraphQL `backboard.railway.com/graphql/v2`.
- O token em `.env.local` chamado `RAILWAY_TOKEN` funciona como **RAILWAY_API_TOKEN** (token de conta): `export RAILWAY_API_TOKEN=$(grep "^RAILWAY_TOKEN=" .env.local | cut -d= -f2-)` habilita `npx @railway/cli ssh/up`.
- **Migração nova em produção**: o container roda o artefato antigo até o upload terminar, e o `migrar.mjs` de lá é no-op para o `.sql` novo. Aplique **antes** do deploy: `railway ssh` ACEITA STDIN, então o SQL viaja em texto puro — nada de base64 ofuscado. Rode tudo numa transação, com guarda de idempotência, e insira a linha em `drizzle.__drizzle_migrations` (schema `drizzle`, colunas `hash` + `created_at`). O `hash` é o **sha256 do conteúdo do arquivo** e o `created_at` é o `when` do journal.
- Migração local exige a entrada no `drizzle/meta/_journal.json` — `migrate()` ignora `.sql` fora do journal em silêncio.
- **A regra acima vale para migração ADITIVA** (o código novo precisa da coluna nova). Migração **destrutiva inverte a ordem**: primeiro o deploy, que tira o código que usa as tabelas, depois o `DROP`. Dropar antes deixaria o container antigo servindo rotas que consultam tabela inexistente — 500 em produção durante a janela. Foi assim na `0008` (2026-08-28).

## Segredos

- `.env.local` nunca vai para git/docker/railway. Valores de chave **nunca no chat** — "no arquivo, nunca no chat".
- **`RESEND_API_KEY` continua ATIVA e necessária**: o formulário de contato e a confirmação da lista de espera enviam por ela.
- **`ADMIN_USUARIO` / `ADMIN_SENHA`**: Basic Auth do painel. Valor no `.env.local` e no Railway, nunca no chat. Definidas com `railway variables --set-from-stdin ... --skip-deploys` — credencial **nunca** em argumento de linha de comando: em 2026-08-31 uma flag inválida ecoou a senha na mensagem de erro e ela teve de ser rotacionada.
- **`EMAIL_CAIXA_TESTE` nunca vai para o Railway.**
- `ASAAS_*` e `AUTH_*` ficaram órfãs em 2026-08-28 (a cobrança e o login saíram com a plataforma). Ainda estão no Railway; removê-las é higiene — e exige `railway up` depois (armadilha 14).
- CPF nunca persiste nem vai a log.

## Armadilhas que já quebraram o build (não repetir)

1. `npx next build` com `next dev` rodando clobbera o `.next` compartilhado — página sem estilo, 404 em chunks. Nunca buildar com dev de pé.
2. Tailwind v4 **abandonou** o shorthand v3 `bg-[--token]` — falha em silêncio. Usar token de tema (`bg-brand-paper`) ou `var(--token)`.
3. Trocar imagem mantendo o nome do arquivo serve a antiga (cache do otimizador por URL). Apagar `.next/cache/images` depois.
4. Antes de rebuild/restart: matar `next start` **e** `next-server` **e** `lsof -ti:3000` — um server velho servindo chunk velho faz o fix parecer quebrado.
5. `initial={{opacity:0}}` do Motion faz SSR de página em branco — entrada é CSS puro com fill `backwards`/`both` (ver DESIGN.md).
6. **O projeto mora dentro do `~/Documents` sincronizado pelo iCloud.** Isso já produziu 73 arquivos duplicados (`* 2.json`) dentro do `.next` e faz `cp -R` estourar com `fcopyfile: Operation timed out`. Nenhum arquivo de código foi atingido — só artefato de build. Se um `cp`/build falhar por timeout, apagar `.next` inteiro e refazer.
7. **`.railwayignore` SUBSTITUI o `.gitignore` no `railway up`.** O `.next` inteiro está excluído: o Dockerfile faz `rm -rf .next && mv next-build .next`.
8. **`next-build/` NÃO pode entrar em NENHUM dos três arquivos de ignore** (`.gitignore`, `.dockerignore`, `.railwayignore`). É o artefato que o `deploy-railway.sh` monta e o Dockerfile consome. Adicioná-lo ao `.gitignore` "por higiene" — porque aparece como untracked no `git status` — derruba o deploy com `mv: cannot stat 'next-build'`, e o erro só aparece nos **buildLogs**, não no `configErrors`. Aconteceu em 2026-08-20. Conviva com o untracked — é de propósito.
9. **Verificar deploy novo por `BUILD_ID`** (`.next/BUILD_ID` local vs container via ssh) — hash de chunk é por CONTEÚDO e não muda se aquele arquivo não mudou.
10. **O serviço do Railway está ligado ao repo `rodrigo386/IAgentics`**, então TODO deploy (inclusive `railway up`) passa por um snapshot do repositório. Quando esse passo falha, a mensagem é `Failed to snapshot repository` e aparece **só** em `deployment(id){meta}` → `configErrors` — `buildLogs` volta com **zero linhas**. É transitório: **retentar espaçado resolve**. Não insista em sequência.
    - **Oportunidade de manutenção**: desconectar o repo trigger (`service(id){repoTriggers}`) provavelmente elimina as armadilhas 10 e 11 de uma vez. Antes, confirmar que `railway up` continua funcionando sem o vínculo.
11. **Mudar variável de ambiente no Railway dispara um deploy que NÃO PODE dar certo.** O deploy automático nasce do repositório, e o repositório não tem `next-build/`. Falha sempre com `mv: cannot stat 'next-build'`. O sintoma engana: a variável aparece salva e o site continua no ar (container antigo). **Toda mudança de variável exige um `railway up` em seguida**; use `railway variables --set-from-stdin CHAVE --skip-deploys`.
12. **`npm run test:e2e` NÃO builda** (2026-08-23). O `webServer` roda `npm run start` com `reuseExistingServer: true`: sobe o `.next` que já está no disco. Rodar o e2e depois de editar código de servidor e ver tudo verde **não prova nada** — o teste exercitou o build anterior. O sintoma é traiçoeiro por ser positivo. Sempre `npx next build` antes do e2e, depois de derrubar servidor velho (armadilha 4).

## Pendências em aberto (com o Rodrigo)

- **Redirect Rule 301 do www** no Cloudflare — higiene, o canonical já protege.
- **Logo do Pecege**: `public/partner-pecege.png` precisa do arquivo real.
- **Variáveis órfãs no Railway** (`ASAAS_*`, `AUTH_*`) — remover quando houver um `railway up` de qualquer forma.
