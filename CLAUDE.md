# IAgentics — Memória do Projeto

Site institucional + plataforma de cursos (IAgentics Academy) + admin. Tudo em **pt-BR**.

- **Produção**: https://iagentics.com.br (Cloudflare → Railway). A URL antiga `iagentics-production.up.railway.app` está MORTA. `www.iagentics.com.br` já resolve com CNAME para o apex e proxy do Cloudflare ligado (certificado válido), mas **falta a Redirect Rule 301** — hoje responde 404 com `x-railway-fallback`.
- **GitHub**: rodrigo386/IAgentics · **Railway**: serviço IAgentics.
- **Design e brand**: ver [docs/DESIGN.md](docs/DESIGN.md) — é a fonte de verdade visual; não repetir aqui.
- **Roadmap do produto**: ver [docs/ROADMAP-ACADEMY.md](docs/ROADMAP-ACADEMY.md) — ordem aprovada, e o registro do que ficou de fora com o motivo. Antes de propor feature nova para a Academy, conferir se ela já foi descartada lá.

## Stack

Next.js 15 App Router · React 19 · Tailwind v4 · Drizzle + Postgres · Auth.js (Credentials + bcryptjs) · Resend (condicionado a chave) · Remotion (vídeos) · vitest + Playwright.

## Mapa de rotas

- Público: `/` (home), `/nexo`, `/academy`, `/cursos`, `/spend-lab`, `/privacidade`, `/artigos`, `/artigos/[slug]`, `/certificados/[codigo]`. `/planos` redireciona 308 para `/cursos`; **`/certificados` sem código é 404** (não existe índice).
- Aluno: `/app` (entrar, criar-conta, curso, conta, assinar, confirmar-email, recuperar-senha, redefinir-senha)
- Admin: `/admin` (alunos, **empresas**, conteudo, configuracoes, metricas-csv)

## Convenções que valem sempre

- **Toda string visível vive em `lib/content.ts`** (+ `content-plataforma.ts`, `content-admin.ts`), copiada verbatim do deck `IAgentics_Clientes_V2.pptx`. Nunca hardcodar copy em componente. **Exceção deliberada: o corpo dos artigos** mora em `content/artigos/*.md` — a regra cobre copy de interface, não texto longo autoral, que tem ciclo de revisão próprio e ganha diff legível em arquivo separado. A moldura da listagem (`artigos` em `content.ts`) segue a regra.
- **Artigos**: Markdown com frontmatter em `content/artigos/`, lidos no build por `lib/artigos.ts` (`server-only`, usa `node:fs`). Decisão do Rodrigo em 2026-08-20: **sem editor no admin**, ele escreve pelo repositório. Markdown puro, não MDX — os textos são prosa e não precisam de componente React; MDX só somaria toolchain a um build que já tem armadilha demais.
  - **`status: "publicado"` é o portão.** Todo artigo nasce `rascunho`; rascunho não aparece na listagem, não entra no sitemap e responde **404** por URL direta (`dynamicParams = false`). Publicar é trocar uma palavra.
  - `/artigos` só entra no sitemap quando existe ao menos um publicado — listagem vazia anunciada ao Google é rastreamento gasto à toa.
  - O link "Artigos" está no menu desde a primeira publicação (2026-08-20). `nav.links` alimenta o menu E o rodapé.
  - `slug` do frontmatter tem que ser igual ao nome do arquivo, e a validação completa do frontmatter roda em `lib/artigos.test.ts` para **todos** os arquivos, inclusive rascunhos — o build só valida os publicados, então o teste é quem avisa cedo.
- **"Nexo" em caixa mista nas strings** — em caps o leitor de tela soletra N-E-X-O. Peso visual vem da tipografia, não de maiúsculas.
- Datas relativas viram absolutas em docs; commits em pt-BR no padrão `feat:`/`fix:`.

## SEO (ver [docs/PLANO-SEO.md](docs/PLANO-SEO.md))

- **Endereço canônico é o apex** `https://iagentics.com.br` (`site.url`); o www redireciona 301 para ele.
- **`canonical` e `openGraph` são declarados por página, nunca no layout** — metadata do Next é herdada: um valor no layout faz toda rota se declarar como sendo a home (o `og:url` estava exatamente assim até 2026-08-18). Use `ogDaPagina()` de `lib/seo.ts`.
- **Dado estruturado sai de `lib/seo.ts`**, sempre derivado de `lib/content.ts` ou do catálogo do banco — JSON-LD que não bate com a página é penalizado. O componente `JsonLd` escapa `<` (título de curso é texto do admin: `</script>` fecharia a tag).
- **Página nova pública?** Entra em `ROTAS_SITEMAP`. Página com dado pessoal (certificado tem nome de aluno) leva `robots: noindex` na própria página — nunca `Disallow` no robots.txt, que mataria a prévia do LinkedIn.
- O **robots.txt que o robô lê não é só o nosso**: o Cloudflare injeta o "Managed Content Signals" na frente, hoje com `Disallow: /` para ClaudeBot/GPTBot/Google-Extended.

## Testes

- `npm run test:unit` (vitest) · `npm run test:e2e` (Playwright, **workers: 1** — os specs dividem um banco só e correm em corrida se paralelos) · `npm run test:e2e:email` (config própria, porta 3100, caixa de e-mail em arquivo).
- Banco local: `npm run db:local` / `db:migrar` / `db:gerar`.

## Deploy (Railway)

- `scripts/deploy-railway.sh` — build local → upload de `next-build/`. Poll de status via GraphQL `backboard.railway.com/graphql/v2`.
- O token em `.env.local` chamado `RAILWAY_TOKEN` funciona como **RAILWAY_API_TOKEN** (token de conta): `export RAILWAY_API_TOKEN=$(grep "^RAILWAY_TOKEN=" .env.local | cut -d= -f2-)` habilita `npx @railway/cli ssh/up`.
- **Migração nova em produção**: o container roda o artefato antigo até o upload terminar, e o `migrar.mjs` de lá é no-op para o `.sql` novo. Aplique **antes** do deploy: `railway ssh` ACEITA STDIN, então o SQL viaja em texto puro (`cat drizzle/000N_*.sql | railway ssh ... "node -e '…'"`) — nada de base64 ofuscado. Rode tudo numa transação, com guarda de idempotência, e insira a linha em `drizzle.__drizzle_migrations` (schema `drizzle`, colunas `hash` + `created_at`). O `hash` é o **sha256 do conteúdo do arquivo** e o `created_at` é o `when` do journal — confira contra a linha gravada no banco local antes de inserir.
- Migração local exige a entrada no `drizzle/meta/_journal.json` — `migrate()` ignora `.sql` fora do journal em silêncio.

## E-mail e auth (regras de segurança)

- Canal transacional: `emailTransacionalAtivo()` = `EMAIL_CAIXA_TESTE` (precedência) `|| RESEND_API_KEY`. **`EMAIL_CAIXA_TESTE` NUNCA vai para o Railway** — bloquearia cadastro e desviaria todo e-mail para arquivo.
- **`RESEND_API_KEY` está ATIVA em produção desde 2026-08-22.** Domínio `iagentics.com.br` verificado e entrega confirmada em caixa real. A chave é **envio-apenas** (não lista domínios nem consulta status). Consequência: **conta nova nasce com `emailConfirmadoEm: null` e não loga até confirmar** — quem não receber o e-mail não entra. Reverter é remover a variável (+ `railway up`, ver armadilha 14): volta a nascer confirmada, sem migração.
- **A chave fica COMENTADA no `.env.local`, de propósito.** `vitest.config.mts` lê o `.env.local` e o `next start` do Playwright também; descomentar faria os testes criarem contas bloqueadas e tentarem enviar e-mail real para endereços `@teste.invalido`. Para exercitar o fluxo de confirmação use `npm run test:e2e:email` (config própria, injeta `EMAIL_CAIXA_TESTE`). Se a porta 3100 estiver ocupada pelo projeto `interview-ready`, copie a config trocando a porta — **não mate o servidor alheio**.
- Confirmação de e-mail **bloqueia login** (invariante em `verificarCredenciais`, depois do bcrypt). Tokens em `auth_tokens` com hash SHA-256, uso único, confirmação 7d / reset 60min.
- Tokens e URLs de reset **nunca aparecem em log** (só userId+tipo). URL de reset só na resposta da ação do admin.
- Timing uniforme: `HASH_DUMMY` + `after()` — não remover achando que é código morto.

## Segredos

- `.env.local` nunca vai para git/docker/railway. Valores de chave **nunca no chat** — "no arquivo, nunca no chat".
- `ASAAS` é chave de **PRODUÇÃO** (cobrança real): nunca chamar a API em teste automatizado. Webhook em `https://iagentics.com.br/api/asaas/webhook`.
- CPF nunca persiste nem vai a log (`redigirCpfs`).

## Armadilhas que já quebraram o build (não repetir)

1. `npx next build` com `next dev` rodando clobbera o `.next` compartilhado — página sem estilo, 404 em chunks. Nunca buildar com dev de pé.
2. Tailwind v4 **abandonou** o shorthand v3 `bg-[--token]` — falha em silêncio. Usar token de tema (`bg-brand-paper`) ou `var(--token)`.
3. Trocar imagem mantendo o nome do arquivo serve a antiga (cache do otimizador por URL). Apagar `.next/cache/images` depois.
4. Antes de rebuild/restart: matar `next start` **e** `next-server` **e** `lsof -ti:3000` — um server velho servindo chunk velho faz o fix parecer quebrado.
5. `initial={{opacity:0}}` do Motion faz SSR de página em branco — entrada é CSS puro com fill `backwards`/`both` (ver DESIGN.md).
6. **Server action com resposta descartada (React 19)**: sob carga, useActionState fica preso em pending com POST 200 e banco gravado — até o redirect da action se perde. Ações de admin usam **form HTML nativo + route handler 303** (`app/admin/alunos/[id]/acoes/route.ts`); não voltar para server action nesses botões sem stress-testar 15+ cliques.
7. **Navegação só-de-querystring via `<Link>` abortava fetch RSC de forma intermitente** (Next 15.5, cresce com o payload da página). Filtros do `/admin` (aba/período/curso) são `<a>` nativos de propósito.
8. O pool do Postgres está em **20** (lib/db/index.ts) porque o painel dispara ~16 queries paralelas; com 5, actions na fila estouravam timeout. `prefetch={false}` na sidebar do admin pelo mesmo motivo (o prefetch do painel disparava a rajada em toda página).
9. **Verificar deploy novo por `BUILD_ID`** (`.next/BUILD_ID` local vs container via ssh) — hash de chunk é por CONTEÚDO e não muda se aquele arquivo não mudou.
10. **O projeto mora dentro do `~/Documents` sincronizado pelo iCloud.** Isso já produziu 73 arquivos duplicados (`* 2.json`) dentro do `.next` e faz `cp -R` estourar com `fcopyfile: Operation timed out`. Nenhum arquivo de código foi atingido até hoje (2026-08-19) — só artefato de build. Se um `cp`/build falhar por timeout, apagar `.next` inteiro e refazer. Mover o repositório para fora do `~/Documents` resolveria de vez.
11. **`.railwayignore` SUBSTITUI o `.gitignore` no `railway up`.** O `.next` inteiro está excluído (2026-08-19): o Dockerfile faz `rm -rf .next && mv next-build .next`, ou seja, o `.next` enviado é descartado — subia como peso morto, com o cache local chegando a 943 MB.
12. **`next-build/` NÃO pode entrar em NENHUM dos três arquivos de ignore** (`.gitignore`, `.dockerignore`, `.railwayignore`). É o artefato que o `deploy-railway.sh` monta e o Dockerfile consome (`rm -rf .next && mv next-build .next`). Adicioná-lo ao `.gitignore` "por higiene" — porque aparece como untracked no `git status` — derruba o deploy com `mv: cannot stat 'next-build': No such file or directory`, e o erro só aparece nos **buildLogs**, não no `configErrors`. Aconteceu em 2026-08-20. O `.railwayignore` não protege disso: ele existe para deixar o `next-build/` passar, não para reintroduzi-lo. Conviva com o untracked no `git status` — é de propósito.
13. **O serviço do Railway está ligado ao repo `rodrigo386/IAgentics`**, então TODO deploy (inclusive `railway up`) passa por um snapshot do repositório. Quando esse passo falha, a mensagem é `Failed to snapshot repository` / `Repository snapshot operation timed out` e aparece **só** em `deployment(id){meta}` → `configErrors` — `buildLogs` volta com **zero linhas**. É transitório: **retentar espaçado resolve** (em 2026-08-22 passou na 1ª retentativa; em 2026-08-19 foram 6 falhas até passar na 3ª). Não insista em sequência. Um `git push` dispara um deploy paralelo que costuma FALHAR e pode ficar preso em QUEUED; cancelar com a mutation `deploymentCancel`.
14. **Mudar variável de ambiente no Railway dispara um deploy que NÃO PODE dar certo** (2026-08-22). O deploy automático nasce do **repositório**, e o repositório não tem `next-build/` — o artefato é construído localmente e enviado pelo `railway up`. Falha sempre com `mv: cannot stat 'next-build'`. O sintoma engana: a variável aparece salva, o site continua no ar (container antigo segue servindo) e nada denuncia que o processo ainda roda a configuração antiga. **Toda mudança de variável exige um `railway up` em seguida**; use `railway variables --set-from-stdin CHAVE --skip-deploys` para nem gerar o deploy inútil. `--set-from-stdin` também evita o valor aparecer na linha de comando.
    - **Oportunidade de manutenção**: desconectar o repo trigger (`service(id){repoTriggers}`, hoje `rodrigo386/IAgentics`/`main`) provavelmente elimina as armadilhas 13 e 14 de uma vez. Antes de fazer, confirmar que `railway up` continua funcionando sem o vínculo — senão o projeto fica sem caminho de deploy.

## Pendências em aberto (com o Rodrigo)

- **DNS do www** → em correção pelo Rodrigo (CNAME `www` → apex, proxy ligado, + Redirect Rule 301). `site.url` já é o apex, então o canonical não depende mais disso.
- **Fogo real Asaas**: R$ 39,90 via Pix em /planos para validar a cobrança ponta a ponta.
