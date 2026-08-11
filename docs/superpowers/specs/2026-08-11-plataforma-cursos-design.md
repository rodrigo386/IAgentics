# Plataforma online de cursos — IAgentics Academy

Data: 2026-08-11 · Status: aprovado em conversa, aguardando revisão final
Escopo deste spec: **Ciclo 1 — núcleo do aluno**. Ciclos 2 e 3 estão delimitados ao final e terão specs próprios.

## Contexto e decisões de produto

A página `/academy` do site vende formações e hoje aponta para um botão "Acessar
plataforma" desabilitado (`academy.platform.appHref = null`). Este projeto constrói a
plataforma por trás desse botão.

Decisões tomadas com o Rodrigo nesta conversa:

| tema | decisão |
|---|---|
| Escopo de lançamento | Catálogo + venda self-service (não só vitrine) |
| Cobrança | **Assinatura do acervo** (não compra por curso), via **Asaas** (Pix/cartão/boleto, cobrança recorrente) |
| Vídeos | **YouTube não listado** no lançamento; risco de compartilhamento de link aceito. Aula guarda `provider + video_id` para migrar a Panda/Mux trocando dados, não código |
| Onde vive | Mesmo repo/deploy do site, rota `/app` |
| Backend | Supabase (o mesmo projeto que já recebe leads do site): Postgres + Auth + RLS |
| Catálogo | Exclusivo do online — NÃO herda os 9 cursos do site institucional |
| Conteúdo | Em gravação; lançar com curso-demonstração realista e estrutura pronta para receber o real |
| Admin | **Admin completo** desejado — fica para o Ciclo 3, com modelo de dados já preparado |
| Visual | Design system do site (tokens, raio 0 + pílula, Space Grotesk, claro/escuro). Logo **Academy** na shell da plataforma |

Decomposição acordada (cada ciclo no ar antes do seguinte):

1. **Ciclo 1 — núcleo do aluno** (este spec): login, catálogo, player, progresso; assinatura liberada manualmente no banco.
2. **Ciclo 2 — cobrança**: assinatura self-service via Asaas + webhooks + e-mails transacionais (Resend).
3. **Ciclo 3 — admin completo**: métricas, CRUD de conteúdo, cupons, comunicação com alunos.

## Material da pasta `academy-skill` (Downloads)

21 arquivos: `SKILL.md` + 20 assets. Para a plataforma:

- **9 capas de curso** 3:4 retrato (1468×1824+) → `capa_url` da semente; card de curso padrão `aspect-[3/4]`.
- **Logo Academy** (3 versões) → shell da plataforma usa Academy, não o lockup IAgentics.
- Regras do SKILL.md que seguem valendo: nunca "PMEs" (sempre "empresa"); badge nunca sobre rosto nas capas (`objectPosition: center top`); `prefers-reduced-motion` desliga autoplay/parallax; todo CTA carrega `source_cta` rastreável.

## Arquitetura

Área nova no Next.js existente, com **shell própria** (logo Academy, "Meus cursos",
menu de conta, toggle de tema) — o aluno logado não vê a Nav do site institucional.

| rota | o quê | acesso |
|---|---|---|
| `/app` | painel: "continue de onde parou" + catálogo | logado |
| `/app/entrar` | login (e-mail/senha e link mágico) | público |
| `/app/criar-conta` | cadastro | público |
| `/app/curso/[slug]` | página do curso: módulos, aulas, progresso | logado |
| `/app/curso/[slug]/[aula]` | player + índice lateral | logado (mídia paga exige assinatura) |
| `/app/conta` | dados do aluno, status da assinatura, troca de senha | logado |

- Middleware protege `/app/*`; sem sessão → `/app/entrar` (com retorno à origem após login).
- Sessão via `@supabase/ssr` (cookies); páginas leem dados no servidor; chave de serviço jamais chega ao navegador.
- `/academy`: `academy.platform.appHref` passa de `null` para `/app` na etapa final do ciclo.

## Modelo de dados (Postgres/Supabase)

```
profiles          id (=auth.users), nome, role ('aluno'|'admin')
courses           id, slug, titulo, descricao, capa_url, nivel,
                  carga_horas, publicado (bool), ordem
modules           id, course_id, titulo, ordem
lessons           id, module_id, slug, titulo, descricao, duracao_seg,
                  ordem, gratuita (bool)
lesson_media      lesson_id (PK/FK), video_provider ('youtube'|'panda'|'mux'),
                  video_id
subscriptions     id, user_id, status ('manual'|'ativa'|'inadimplente'|'cancelada'),
                  asaas_customer_id (nulo no c1), asaas_subscription_id (nulo no c1),
                  current_period_end (nulo no c1), created_at
lesson_progress   (user_id, lesson_id) PK, concluida (bool),
                  segundos_assistidos, updated_at
```

**Decisão central: `video_id` mora em `lesson_media`, separada de `lessons`.**
RLS protege por linha, não por coluna. Com YouTube não listado o ID *é* o acesso;
na tabela `lessons` ele vazaria pela API para qualquer aluno logado que lê o índice
do curso. Separado, o banco garante a regra sem depender do front.

### Regras de acesso (RLS)

- `courses`/`modules`/`lessons` com `publicado = true`: leitura para qualquer usuário autenticado (catálogo e índice são visíveis a todos os logados).
- `lesson_media`: leitura somente se `lessons.gratuita = true` **ou** o usuário tem assinatura `ativa`/`manual`.
- `lesson_progress`: cada aluno lê/escreve apenas as próprias linhas.
- `subscriptions`: aluno lê a própria; **escrita apenas pelo servidor** (service role).
- Escrita de conteúdo: apenas `role = 'admin'`.
- A regra de acesso é **uma função SQL única** `tem_acesso(user_id)`, usada pelas policies e pelo servidor — nunca duas implementações com duas opiniões.

Status `manual` é o mecanismo do Ciclo 1: vocês inserem a linha e o aluno tem acesso
ao acervo. O Asaas passará a gerenciar `ativa/inadimplente/cancelada` no Ciclo 2 sem
mudança de modelo.

## Experiência do aluno

**Painel `/app`.** Bloco "Continue de onde parou" (última aula não concluída: capa,
curso, aula, barra de progresso) + catálogo em cards 3:4 com capa, título, carga
horária, nível e anel de progresso. Sem assinatura: mesmos cards com selo "Assine
para acessar"; CTA → conversa com vocês (c1) / checkout (c2). `publicado = false`
não existe para o aluno.

**Curso `/app/curso/[slug]`.** Capa, descrição, índice de módulos e aulas (título,
duração, check). Aula `gratuita` tem etiqueta "Grátis" e abre sem assinatura.
Primeira aula não concluída destacada como "Continuar".

**Player `/app/curso/[slug]/[aula]`.** Desktop em duas colunas: vídeo 16:9
(`youtube-nocookie.com`, `rel=0`) à esquerda; índice do curso à direita com a aula
atual acesa. Abaixo do vídeo: título, descrição, botão "Marcar como concluída".
O evento `ended` do player marca concluída automaticamente; concluída → botão vira
"Próxima aula". Mobile: índice em acordeão sob o vídeo.

**Progresso.** `segundos_assistidos` atualizado a cada 15s via API do player (só
quando muda); `concluida` por `ended` ou botão. Percentual do curso é **derivado**
(`concluídas / total publicadas`), nunca armazenado.

**Conta `/app/conta`.** Nome, e-mail, status da assinatura por extenso ("Ativa até
12/09/2026" · "Liberada manualmente" · "Sem assinatura"), troca de senha. Sem
dados de cartão no Ciclo 1.

## Erros (todos em pt-BR, todos com saída)

- Login errado: "E-mail ou senha incorretos" — sem revelar qual existe.
- Sessão expirada: volta a `/app/entrar` com aviso; após login, retorna à página de origem.
- Aula paga acessada por URL sem assinatura: **não é 404** — página da aula com cartão "Esta aula faz parte da assinatura" + CTA no lugar do vídeo.
- Vídeo falhou: mensagem com "Recarregar", nunca retângulo preto mudo.
- Cadastro com e-mail existente: oferece login e link mágico.

## Testes

1. **RLS primeiro** (protege o negócio): script com sessões reais (aluno sem/com assinatura) verificando: sem assinatura não lê `lesson_media` paga mas lê gratuita; ninguém escreve em `subscriptions` alheia; `publicado=false` invisível.
2. Unidade: função `tem_acesso`, redutor de progresso.
3. Playwright (caminho feliz): criar conta → entrar → abrir curso → assistir gratuita → marcar concluída → recarregar → progresso persiste.

## Semente

- "Fundamentos de IA com Copilot" completo: capa real da pasta, 3 módulos, ~8 aulas.
  Vídeos: não listados que vocês subirem; até lá, vídeo público de vocês como stand-in.
- Demais 8 cursos como cascas `publicado = false` (povoam o admin no Ciclo 3).

## Ordem de entrega do Ciclo 1 (cada etapa no ar antes da seguinte)

1. Tabelas + RLS + semente no Supabase
2. Autenticação e shell (`/app`, entrar, criar conta, conta)
3. Catálogo e página do curso
4. Player + progresso
5. `/academy` ganha o link "Acessar plataforma" — plataforma pública

## Fora do Ciclo 1 (registrado, não construir agora)

- **Ciclo 2:** assinatura self-service Asaas (planos mensal/anual, webhook em `/api/asaas/webhook`, idempotência), e-mails transacionais (Resend), página de checkout, estados de inadimplência.
- **Ciclo 3:** admin completo (métricas, CRUD de conteúdo, cupons, comunicação), usando `role='admin'` e as cascas de curso já semeadas.
- Certificado de conclusão; migração de vídeo para Panda/Mux (troca de `provider/video_id`).
