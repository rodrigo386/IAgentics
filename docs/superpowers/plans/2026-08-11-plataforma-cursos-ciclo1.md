# Plataforma de cursos — Ciclo 1 (núcleo do aluno) — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Área `/app` no site IAgentics onde um aluno logado com assinatura (liberada manualmente no banco) assiste cursos em vídeo com progresso persistido.

**Architecture:** Next.js 15 App Router no repo existente; Supabase (projeto novo `iagentics-plataforma`) para Postgres + Auth + RLS; sessão via cookies (`@supabase/ssr`); vídeo por aula em tabela separada `lesson_media` protegida por RLS; player YouTube via IFrame API. Spec: `docs/superpowers/specs/2026-08-11-plataforma-cursos-design.md`.

**Tech Stack:** Next 15.5 / React 19 / Tailwind v4 (existentes) · `@supabase/supabase-js` + `@supabase/ssr` · Vitest (unidade) · Playwright (e2e, canal Chrome) · MCP Supabase para migrações/SQL.

## Global Constraints

- Todo texto visível em pt-BR e centralizado em `lib/content-plataforma.ts` (mesma regra do site: nada de string solta em componente).
- Nunca escrever "PMEs" — sempre "empresa".
- Design system do site: apenas tokens semânticos (`bg-bg`, `text-fg`, `text-fg-muted`, `bg-accent`, `text-accent-text`, `border-line`...). Superfícies raio 0 (`rounded-none` implícito), controles pílula (`rounded-control`). Fonte já vem do layout raiz.
- Tailwind v4: NÃO existe `bg-[--token]` — usar token de tema ou `var(--token)`.
- `prefers-reduced-motion` é vinculante (componentes novos não introduzem animação JS).
- Capas de curso: `aspect-[3/4]`, `object-cover`, `objectPosition: "center top"`, badge nunca sobre rosto.
- YouTube sempre via `https://www.youtube-nocookie.com` com `rel=0`.
- `SUPABASE_SERVICE_ROLE_KEY` NUNCA é importada por código de app — somente `scripts/rls.test.mjs` (setup/teardown de teste). Escrita em `subscriptions` no Ciclo 1: manual via Studio/SQL.
- RLS habilitado em TODA tabela nova antes de qualquer dado real.
- Nunca rodar `npm run build` com `next dev` de pé (compartilham `.next`). Servidor local: derrubar por porta (`lsof -tiTCP:3000 -sTCP:LISTEN | xargs kill`).
- Commit ao fim de cada task (o repo git já existe, ramo `main`).
- Erros de login não revelam se o e-mail existe.

---

### Task 1: Projeto Supabase + dependências + assets

**Files:**
- Create: `.env.local` (gitignorado — conferir que `.gitignore` já cobre `.env*`)
- Create: `public/plataforma/academy-logo.png`, `public/plataforma/cursos/*.png` (9 capas)
- Modify: `package.json` (deps + scripts de teste)

**Interfaces:**
- Produces: env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; assets em `/plataforma/...`; pacotes `@supabase/supabase-js`, `@supabase/ssr`, `vitest`, `@playwright/test`.

- [ ] **Step 1: Criar o projeto Supabase via MCP**

Chamar `mcp get_cost` (type: `project`, organization_id: `xclsjicedrxpuccnuped`) → `confirm_cost` com o resultado → `create_project` com `name: "iagentics-plataforma"`, `region: "sa-east-1"` (mesma região do projeto financeiro; alunos estão no Brasil). Aguardar `status: ACTIVE_HEALTHY` via `get_project`.

- [ ] **Step 2: Obter URL e chave anon**

`get_project_url` e `get_publishable_keys` do projeto novo. Escrever `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=<url do passo anterior>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<chave anon/publishable do passo anterior>
# Somente para scripts/rls.test.mjs — código de app NUNCA importa esta:
SUPABASE_SERVICE_ROLE_KEY=<Rodrigo cola do dashboard: Settings → API keys>
```

A service key não sai por MCP; pedir ao Rodrigo que cole (uma vez). Testes de RLS que precisam dela devem falhar com mensagem clara se ausente.

- [ ] **Step 3: Configuração de Auth no dashboard (Rodrigo, 2 min)**

Authentication → Sign In / Up → Email: **desligar "Confirm email"** (cadastro entra direto; e-mail transacional chega no Ciclo 2). Authentication → URL Configuration: Site URL `http://localhost:3000`, Redirect URLs `http://localhost:3000/app/auth/confirm`.

- [ ] **Step 4: Dependências**

```bash
npm i @supabase/supabase-js @supabase/ssr
npm i -D vitest @playwright/test
```

Em `package.json`, adicionar scripts: `"test:unit": "vitest run"`, `"test:rls": "node scripts/rls.test.mjs"`, `"test:e2e": "playwright test"`.

- [ ] **Step 5: Assets**

```bash
mkdir -p public/plataforma/cursos
cp /Users/rodrigocosta/Downloads/academy-skill/assets/logos/academy-logo-main.png public/plataforma/academy-logo.png
cp /Users/rodrigocosta/Downloads/academy-skill/assets/cursos/*.png public/plataforma/cursos/
```

- [ ] **Step 6: Verificar**

`ls public/plataforma/cursos | wc -l` → 9. `node -e "console.log(!!process.env)"` trivial; conferir `.env.local` fora do git: `git status --short` não pode listar `.env.local`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "plataforma: projeto supabase, dependências e assets do ciclo 1"
```

---

### Task 2: Migração (tabelas + funções + RLS) com teste de RLS primeiro

**Files:**
- Create: `scripts/rls.test.mjs`
- Create: `supabase/migrations/0001_plataforma.sql` (cópia versionada do SQL aplicado via MCP `apply_migration`)

**Interfaces:**
- Produces: tabelas `profiles`, `courses`, `modules`, `lessons`, `lesson_media`, `subscriptions`, `lesson_progress`; funções `public.tem_acesso(uuid)`, `public.eh_admin()`; trigger de auto-perfil no signup.

- [ ] **Step 1: Escrever o teste de RLS (falha primeiro)**

`scripts/rls.test.mjs` — usa dois usuários reais criados via signup anon; service key só para semear assinatura e limpar. Estrutura completa:

```js
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// .env.local não é carregado por node puro:
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^([A-Z_]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2];
}
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON) { console.error("Faltam NEXT_PUBLIC_SUPABASE_URL/ANON_KEY em .env.local"); process.exit(1); }
if (!SERVICE) { console.error("Falta SUPABASE_SERVICE_ROLE_KEY em .env.local (só para este teste)"); process.exit(1); }

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });
const stamp = Date.now();
const senha = "Teste-rls-123!";
let falhas = 0;
const ok = (cond, nome) => { console.log((cond ? "  ok " : "FALHA"), nome); if (!cond) falhas++; };

async function novoAluno(rotulo) {
  const cli = createClient(URL_, ANON, { auth: { persistSession: false } });
  const email = `rls-${rotulo}-${stamp}@teste.invalido`;
  const { data, error } = await cli.auth.signUp({ email, password: senha, options: { data: { nome: `Aluno ${rotulo}` } } });
  if (error || !data.session) { console.error("signup falhou:", error?.message); process.exit(1); }
  return { cli, id: data.user.id, email };
}

const semAss = await novoAluno("sem");
const comAss = await novoAluno("com");
// assinatura manual para o segundo (escrita é server-only por design):
await admin.from("subscriptions").insert({ user_id: comAss.id, status: "manual" });

// ids de aulas de referência (semente entra na Task 3; aqui a migração acabou de rodar,
// então semeamos o mínimo com o admin):
const { data: curso } = await admin.from("courses").insert({ slug: `rls-${stamp}`, titulo: "Curso RLS", descricao: "t", capa_url: "/x.png", nivel: "Iniciante", carga_horas: 1, publicado: true, ordem: 999 }).select().single();
const { data: cursoOculto } = await admin.from("courses").insert({ slug: `rls-oculto-${stamp}`, titulo: "Oculto", descricao: "t", capa_url: "/x.png", nivel: "Iniciante", carga_horas: 1, publicado: false, ordem: 998 }).select().single();
const { data: mod } = await admin.from("modules").insert({ course_id: curso.id, titulo: "M1", ordem: 1 }).select().single();
const { data: aulaGratis } = await admin.from("lessons").insert({ module_id: mod.id, slug: "gratis", titulo: "Grátis", descricao: "t", duracao_seg: 60, ordem: 1, gratuita: true }).select().single();
const { data: aulaPaga } = await admin.from("lessons").insert({ module_id: mod.id, slug: "paga", titulo: "Paga", descricao: "t", duracao_seg: 60, ordem: 2, gratuita: false }).select().single();
await admin.from("lesson_media").insert([
  { lesson_id: aulaGratis.id, video_provider: "youtube", video_id: "vid-gratis" },
  { lesson_id: aulaPaga.id, video_provider: "youtube", video_id: "vid-pago" },
]);

// ------- asserções -------
const anon = createClient(URL_, ANON, { auth: { persistSession: false } });
ok((await anon.from("courses").select("id")).data?.length === 0, "anônimo não lê catálogo");

const a = semAss.cli, b = comAss.cli;
ok((await a.from("courses").select("id").eq("id", curso.id)).data?.length === 1, "logado lê curso publicado");
ok((await a.from("courses").select("id").eq("id", cursoOculto.id)).data?.length === 0, "publicado=false invisível");
ok((await a.from("lesson_media").select("*").eq("lesson_id", aulaGratis.id)).data?.length === 1, "sem assinatura lê mídia gratuita");
ok((await a.from("lesson_media").select("*").eq("lesson_id", aulaPaga.id)).data?.length === 0, "sem assinatura NÃO lê mídia paga");
ok((await b.from("lesson_media").select("*").eq("lesson_id", aulaPaga.id)).data?.length === 1, "assinante lê mídia paga");
ok((await a.from("subscriptions").insert({ user_id: semAss.id, status: "ativa" })).error != null, "aluno não cria a própria assinatura");
ok((await a.from("lesson_progress").upsert({ user_id: semAss.id, lesson_id: aulaGratis.id, concluida: true, segundos_assistidos: 60 })).error == null, "aluno grava o próprio progresso");
ok((await a.from("lesson_progress").upsert({ user_id: comAss.id, lesson_id: aulaGratis.id, concluida: true, segundos_assistidos: 1 })).error != null, "aluno não grava progresso alheio");
ok((await b.from("subscriptions").select("status")).data?.length === 1, "aluno lê a própria assinatura");
ok((await a.from("subscriptions").select("status")).data?.length === 0, "aluno não lê assinatura alheia");
ok((await a.from("profiles").update({ role: "admin" }).eq("id", semAss.id)).error != null, "aluno não se promove a admin");

// ------- limpeza -------
await admin.from("courses").delete().in("id", [curso.id, cursoOculto.id]);
await admin.auth.admin.deleteUser(semAss.id);
await admin.auth.admin.deleteUser(comAss.id);
console.log(falhas ? `\n${falhas} FALHAS` : "\nRLS ok");
process.exit(falhas ? 1 : 0);
```

- [ ] **Step 2: Rodar e ver falhar**

`npm run test:rls` → deve falhar com tabelas inexistentes (relation "public.subscriptions" does not exist ou signup sem trigger).

- [ ] **Step 3: Aplicar a migração via MCP `apply_migration`** (name `0001_plataforma`), e salvar o MESMO SQL em `supabase/migrations/0001_plataforma.sql`:

```sql
-- ============ TABELAS ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  role text not null default 'aluno' check (role in ('aluno','admin')),
  created_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  titulo text not null,
  descricao text not null default '',
  capa_url text not null default '',
  nivel text not null default 'Iniciante',
  carga_horas numeric not null default 0,
  publicado boolean not null default false,
  ordem int not null default 0
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  titulo text not null,
  ordem int not null default 0
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  slug text not null,
  titulo text not null,
  descricao text not null default '',
  duracao_seg int not null default 0,
  ordem int not null default 0,
  gratuita boolean not null default false,
  unique (module_id, slug)
);

-- video_id separado de lessons DE PROPÓSITO: RLS é por linha, e com YouTube
-- não listado o ID é o acesso. Ver spec, "decisão central".
create table public.lesson_media (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  video_provider text not null default 'youtube' check (video_provider in ('youtube','panda','mux')),
  video_id text not null
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('manual','ativa','inadimplente','cancelada')),
  asaas_customer_id text,
  asaas_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);

create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  concluida boolean not null default false,
  segundos_assistidos int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ============ FUNÇÕES ============
create function public.tem_acesso(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = uid and status in ('ativa','manual')
  );
$$;

create function public.eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''));
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.toca_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger lesson_progress_updated
  before update on public.lesson_progress
  for each row execute function public.toca_updated_at();

-- ============ RLS ============
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_media enable row level security;
alter table public.subscriptions enable row level security;
alter table public.lesson_progress enable row level security;

-- profiles: lê e edita o próprio; coluna role protegida por grant de coluna
create policy "perfil: le o proprio" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.eh_admin());
create policy "perfil: edita o proprio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke update on public.profiles from authenticated;
grant update (nome) on public.profiles to authenticated;

-- catálogo publicado visível a qualquer logado; escrita só admin
create policy "curso: publicado visivel" on public.courses
  for select to authenticated using (publicado or public.eh_admin());
create policy "curso: admin escreve" on public.courses
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy "modulo: de curso publicado" on public.modules
  for select to authenticated using (
    exists (select 1 from public.courses c where c.id = course_id and (c.publicado or public.eh_admin()))
  );
create policy "modulo: admin escreve" on public.modules
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

create policy "aula: de curso publicado" on public.lessons
  for select to authenticated using (
    exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_id and (c.publicado or public.eh_admin())
    )
  );
create policy "aula: admin escreve" on public.lessons
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- A REGRA QUE PROTEGE O NEGÓCIO: mídia só para aula gratuita ou assinante,
-- e sempre de curso publicado.
create policy "midia: gratuita ou assinante" on public.lesson_media
  for select to authenticated using (
    exists (
      select 1 from public.lessons l
      join public.modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_id
        and c.publicado
        and (l.gratuita or public.tem_acesso((select auth.uid())))
    ) or public.eh_admin()
  );
create policy "midia: admin escreve" on public.lesson_media
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

-- assinaturas: aluno lê a própria; escrita SÓ pelo service role (nenhuma
-- policy de escrita para authenticated = negado; service role ignora RLS)
create policy "assinatura: le a propria" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()) or public.eh_admin());

-- progresso: cada um no seu
create policy "progresso: le o proprio" on public.lesson_progress
  for select to authenticated using (user_id = (select auth.uid()));
create policy "progresso: insere o proprio" on public.lesson_progress
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "progresso: edita o proprio" on public.lesson_progress
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
```

- [ ] **Step 4: Rodar o teste até verde**

`npm run test:rls` → "RLS ok". Qualquer FALHA aqui é bug de policy — corrigir a migração (via nova `apply_migration` incremental `0002_...`), nunca o teste.

- [ ] **Step 5: Conferir advisors**

MCP `get_advisors` (security) no projeto → zero achados de RLS aberto.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "plataforma: schema, RLS e teste de policies com usuários reais"
```

---

### Task 3: Semente — curso demo completo + 8 cascas

**Files:**
- Create: `supabase/seed/0001_semente.sql` (aplicado via MCP `execute_sql`)

**Interfaces:**
- Produces: curso `fundamentos-ia-copilot` publicado com 3 módulos / 8 aulas (1ª gratuita) e mídia stand-in; 8 cursos `publicado=false` com capas reais.

- [ ] **Step 1: Escrever e aplicar o SQL da semente**

Vídeo stand-in até os não listados de vocês existirem: `M7lc1UVf-VE` (vídeo público de demonstração do próprio player do YouTube — neutro e estável). Documentado como stand-in.

```sql
with c as (
  insert into public.courses (slug, titulo, descricao, capa_url, nivel, carga_horas, publicado, ordem)
  values ('fundamentos-ia-copilot', 'Fundamentos de IA com Copilot',
          'Domine o Microsoft Copilot para acelerar tarefas do dia a dia com IA generativa.',
          '/plataforma/cursos/copilot-course.png', 'Iniciante', 6, true, 1)
  returning id
), m1 as (
  insert into public.modules (course_id, titulo, ordem)
  select id, 'Começando com o Copilot', 1 from c returning id
), m2 as (
  insert into public.modules (course_id, titulo, ordem)
  select id, 'Copilot no dia a dia', 2 from c returning id
), m3 as (
  insert into public.modules (course_id, titulo, ordem)
  select id, 'Boas práticas e próximos passos', 3 from c returning id
), aulas as (
  insert into public.lessons (module_id, slug, titulo, descricao, duracao_seg, ordem, gratuita)
  values
  ((select id from m1), 'boas-vindas', 'Boas-vindas e panorama do curso', 'O que você vai aprender e como tirar o máximo das aulas.', 420, 1, true),
  ((select id from m1), 'o-que-e-copilot', 'O que é o Copilot e onde ele vive', 'Word, Excel, Outlook, Teams: onde o Copilot aparece e o que muda em cada um.', 780, 2, false),
  ((select id from m1), 'primeiro-prompt', 'Seu primeiro prompt bem escrito', 'A anatomia de um pedido claro: contexto, tarefa e formato.', 900, 3, false),
  ((select id from m2), 'copilot-word', 'Documentos com o Copilot no Word', 'Rascunhos, resumos e revisão de tom em documentos reais.', 960, 1, false),
  ((select id from m2), 'copilot-excel', 'Análise com o Copilot no Excel', 'Fórmulas explicadas, tabelas e primeiras análises guiadas.', 1080, 2, false),
  ((select id from m2), 'copilot-outlook-teams', 'E-mail e reuniões: Outlook e Teams', 'Resumo de threads, rascunho de respostas e atas de reunião.', 840, 3, false),
  ((select id from m3), 'limites-privacidade', 'Limites, revisão humana e privacidade', 'O que não delegar, como revisar saídas e o que nunca colar num prompt.', 720, 1, false),
  ((select id from m3), 'plano-de-pratica', 'Seu plano de prática de 30 dias', 'Como transformar o curso em hábito na sua rotina de trabalho.', 540, 2, false)
  returning id
)
insert into public.lesson_media (lesson_id, video_provider, video_id)
select id, 'youtube', 'M7lc1UVf-VE' from aulas;

insert into public.courses (slug, titulo, descricao, capa_url, nivel, carga_horas, publicado, ordem) values
('fundamentos-ia-negocios', 'Fundamentos de IA aplicado aos Negócios', 'Base sólida em Inteligência Artificial com foco em aplicações reais no mundo corporativo.', '/plataforma/cursos/fundamentos-ia-negocios.png', 'Iniciante', 8, false, 2),
('imersao-assistentes-ia', 'Imersão de Assistentes de IA para Negócios', 'Crie assistentes de IA sob medida para aumentar a produtividade da sua equipe.', '/plataforma/cursos/imersao-assistentes-ia.png', 'Intermediário', 16, false, 3),
('imersao-analise-dados-ia', 'Imersão de Análise de Dados com IA', 'Transforme dados em decisões estratégicas com o poder da IA aplicada à análise.', '/plataforma/cursos/imersao-analise-dados-ia.png', 'Intermediário', 16, false, 4),
('lean-thinking', 'Lean Thinking — do mapeamento à automação', 'Mapeie processos, elimine desperdícios e automatize com IA seguindo princípios Lean.', '/plataforma/cursos/lean-thinking-course.png', 'Intermediário', 20, false, 5),
('transformacao-digital', 'Imersão de Transformação Digital nos Negócios', 'Lidere a jornada de transformação digital da sua empresa com metodologias de vanguarda.', '/plataforma/cursos/transformacao-digital-course.png', 'Avançado', 20, false, 6),
('design-thinking-ia', 'Design Thinking aplicado com IA', 'Combine Design Thinking e IA para criar soluções centradas no usuário com mais velocidade.', '/plataforma/cursos/design-thinking-ia-course.png', 'Intermediário', 12, false, 7),
('spend-management-ia', 'Imersão de Spend Management com IA', 'Otimize gastos corporativos e a cadeia de suprimentos com agentes de IA especializados.', '/plataforma/cursos/spend-management-course.png', 'Avançado', 16, false, 8),
('neurociencia-produtividade', 'Neurociência & Produtividade', 'Como produzir com eficácia na tríade Pessoas, Processos e Tecnologia à luz da neurociência.', '/plataforma/cursos/neurociencia-produtividade-course.png', 'Intermediário', 12, false, 9);
```

- [ ] **Step 2: Verificar**

Via MCP `execute_sql`: `select count(*) from courses` → 9; `select count(*) from lessons` → 8; `select count(*) from lesson_media` → 8; `select count(*) from courses where publicado` → 1.

- [ ] **Step 3: Re-rodar RLS**

`npm run test:rls` → segue verde (a semente não pode ter aberto nada).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "plataforma: semente com curso demo completo e 8 cascas"
```

---

### Task 4: Clientes Supabase, middleware e autenticação (entrar, criar conta, sair)

**Files:**
- Create: `lib/supabase/cliente-navegador.ts`, `lib/supabase/cliente-servidor.ts`, `lib/supabase/sessao-middleware.ts`, `middleware.ts` (raiz)
- Create: `lib/content-plataforma.ts`
- Create: `app/app/layout.tsx`, `components/plataforma/ShellHeader.tsx`
- Create: `app/app/entrar/page.tsx`, `components/plataforma/FormEntrar.tsx`
- Create: `app/app/criar-conta/page.tsx`, `components/plataforma/FormCriarConta.tsx`
- Create: `app/app/auth/confirm/route.ts`, `app/app/sair/route.ts`
- Test: `e2e/auth.spec.ts`, `playwright.config.ts`

**Interfaces:**
- Consumes: env vars da Task 1.
- Produces: `criarClienteNavegador(): SupabaseClient` · `criarClienteServidor(): Promise<SupabaseClient>` · middleware que redireciona `/app/*` sem sessão para `/app/entrar?voltar=<path>` · strings `plataforma.*` de `lib/content-plataforma.ts` · shell com `<main>` para as páginas seguintes.

- [ ] **Step 1: Teste e2e de auth (falha primeiro)** — `playwright.config.ts`:

```ts
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: { baseURL: "http://localhost:3000", channel: "chrome" },
  webServer: { command: "npm run start", url: "http://localhost:3000", reuseExistingServer: true, timeout: 120_000 },
});
```

`e2e/auth.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

const email = `e2e-${Date.now()}@teste.invalido`;
const senha = "Senha-e2e-123!";

test("visitante sem sessão é levado ao login", async ({ page }) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/app\/entrar/);
});

test("cria conta, sai e entra de novo", async ({ page }) => {
  await page.goto("/app/criar-conta");
  await page.getByLabel("Nome").fill("Aluno E2E");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Criar conta" }).click();
  await expect(page).toHaveURL(/\/app$/);

  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/app\/entrar/);

  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(senha);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/app$/);
});

test("senha errada não revela qual campo falhou", async ({ page }) => {
  await page.goto("/app/entrar");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("errada-123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos")).toBeVisible();
});
```

Rodar: `npx playwright test e2e/auth.spec.ts` (com `npm run build && npm run start` de pé — lembrar: build nunca com dev rodando). Esperado: FALHA (rotas não existem).

- [ ] **Step 2: Clientes Supabase**

`lib/supabase/cliente-navegador.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";

/** Cliente para Client Components. Sessão em cookies, lida pelo servidor. */
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

`lib/supabase/cliente-servidor.ts`:

```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/** Cliente para Server Components e Route Handlers. Next 15: cookies() é async. */
export async function criarClienteServidor() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (lista) => {
          try { lista.forEach(({ name, value, options }) => jar.set(name, value, options)); }
          catch { /* Server Component: o middleware é quem renova */ }
        },
      },
    },
  );
}
```

`lib/supabase/sessao-middleware.ts` + `middleware.ts` (padrão @supabase/ssr):

```ts
// lib/supabase/sessao-middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLICAS = ["/app/entrar", "/app/criar-conta", "/app/auth"];

export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (lista) => {
          lista.forEach(({ name, value }) => request.cookies.set(name, value));
          resposta = NextResponse.next({ request });
          lista.forEach(({ name, value, options }) => resposta.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const rota = request.nextUrl.pathname;
  const ehPublica = PUBLICAS.some((p) => rota.startsWith(p));

  if (!user && !ehPublica) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/app/entrar";
    // Se havia cookie de sessão mas o usuário não resolveu, a sessão EXPIROU —
    // é o gancho do aviso "Sua sessão expirou" no FormEntrar (spec, seção Erros).
    const tinhaSessao = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
    destino.search = `?voltar=${encodeURIComponent(rota)}${tinhaSessao ? "&sessao=expirada" : ""}`;
    return NextResponse.redirect(destino);
  }
  if (user && (rota.startsWith("/app/entrar") || rota.startsWith("/app/criar-conta"))) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/app";
    destino.search = "";
    return NextResponse.redirect(destino);
  }
  return resposta;
}
```

```ts
// middleware.ts (raiz do repo)
import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/sessao-middleware";

export async function middleware(request: NextRequest) {
  return atualizarSessao(request);
}
export const config = { matcher: ["/app/:path*"] };
```

- [ ] **Step 3: Strings** — `lib/content-plataforma.ts` (todas as visíveis deste ciclo; segue a regra da casa: uma fonte, tradução num passe):

```ts
/**
 * Fonte única de texto da plataforma (/app), irmã de lib/content.ts.
 * Mesma regra do site: nenhuma string visível mora em componente.
 */
export const plataforma = {
  nome: "IAgentics Academy",
  shell: {
    meusCursos: "Meus cursos",
    conta: "Conta",
    sair: "Sair",
  },
  entrar: {
    titulo: "Entrar na plataforma",
    email: "E-mail",
    senha: "Senha",
    botao: "Entrar",
    linkMagico: "Ou receba um link de acesso por e-mail",
    linkMagicoEnviado: "Link enviado. Confira sua caixa de entrada.",
    semConta: "Ainda não tem conta?",
    criarConta: "Criar conta",
    erroCredenciais: "E-mail ou senha incorretos",
    sessaoExpirada: "Sua sessão expirou. Entre de novo para continuar.",
  },
  criarConta: {
    titulo: "Criar conta",
    nome: "Nome",
    email: "E-mail",
    senha: "Senha",
    botao: "Criar conta",
    jaTem: "Já tem conta?",
    entrar: "Entrar",
    emailExiste: "Este e-mail já tem conta. Entre com sua senha ou peça um link de acesso.",
  },
  painel: {
    continuar: "Continue de onde parou",
    catalogo: "Cursos",
    seloAssine: "Assine para acessar",
    ctaAssinar: "Falar com a IAgentics",
    /* Ciclo 2 troca o CTA acima pelo checkout. */
    horas: "h",
  },
  curso: {
    continuar: "Continuar",
    comecar: "Começar o curso",
    gratis: "Grátis",
    aulas: "aulas",
    concluidaDe: (feitas: number, total: number) => `${feitas} de ${total} aulas concluídas`,
  },
  aula: {
    marcarConcluida: "Marcar como concluída",
    proximaAula: "Próxima aula",
    concluida: "Aula concluída",
    bloqueadaTitulo: "Esta aula faz parte da assinatura",
    bloqueadaTexto: "Assine o acervo da Academy para assistir esta e todas as outras aulas.",
    bloqueadaCta: "Falar com a IAgentics",
    videoFalhou: "O vídeo não carregou.",
    recarregar: "Recarregar",
  },
  conta: {
    titulo: "Sua conta",
    nome: "Nome",
    email: "E-mail",
    salvar: "Salvar",
    salvo: "Salvo.",
    trocarSenha: "Trocar senha",
    novaSenha: "Nova senha",
    senhaTrocada: "Senha atualizada.",
    assinatura: "Assinatura",
    statusAtiva: (ate: string) => `Ativa até ${ate}`,
    statusManual: "Liberada manualmente",
    statusInadimplente: "Pagamento pendente",
    statusCancelada: "Cancelada",
    statusNenhuma: "Sem assinatura",
  },
} as const;
```

- [ ] **Step 4: Shell** — `app/app/layout.tsx` (Server Component; NÃO renderiza a Nav do site) + `components/plataforma/ShellHeader.tsx`:

```tsx
// app/app/layout.tsx
import type { Metadata } from "next";
import { ShellHeader } from "@/components/plataforma/ShellHeader";

export const metadata: Metadata = {
  title: { default: "Plataforma", template: "%s · IAgentics Academy" },
  robots: { index: false }, // área logada não indexa
};

export default function LayoutPlataforma({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <ShellHeader />
      <main className="mx-auto w-full max-w-[1200px] px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}
```

```tsx
// components/plataforma/ShellHeader.tsx
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { plataforma } from "@/lib/content-plataforma";

/** Header da plataforma: logo Academy (não o lockup IAgentics — quem está
 *  logado está na Academy), navegação mínima e sair. Sem sessão (páginas
 *  públicas de auth), mostra só o logo. */
export async function ShellHeader() {
  const supabase = await criarClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link href={user ? "/app" : "/app/entrar"} aria-label={plataforma.nome}>
          <Image src="/plataforma/academy-logo.png" alt={plataforma.nome} width={893} height={254} className="h-9 w-auto dark:invert-0 invert" priority />
        </Link>
        <nav className="flex items-center gap-5">
          {user ? (
            <>
              <Link href="/app" className="text-sm text-fg-muted transition-colors hover:text-fg">{plataforma.shell.meusCursos}</Link>
              <Link href="/app/conta" className="text-sm text-fg-muted transition-colors hover:text-fg">{plataforma.shell.conta}</Link>
              <form action="/app/sair" method="post">
                <button className="rounded-control border border-line px-4 py-1.5 text-sm transition-colors hover:border-line-strong">{plataforma.shell.sair}</button>
              </form>
            </>
          ) : null}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
```

Nota: o PNG do logo é claro (feito para fundo escuro). No tema claro, `invert` o
torna legível; no escuro, `dark:invert-0` restaura. Se o resultado visual ficar
sujo, trocar por máscara CSS `background-color: currentColor` como o `Logo.tsx`
do site — decisão de quem implementar, com captura de tela nos dois temas.

- [ ] **Step 5: Formulários de auth** (client components; erros vêm de `content-plataforma`):

```tsx
// components/plataforma/FormEntrar.tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/cliente-navegador";
import { plataforma } from "@/lib/content-plataforma";

export function FormEntrar() {
  const t = plataforma.entrar;
  const router = useRouter();
  const busca = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(
    busca.get("sessao") === "expirada" ? t.sessaoExpirada : null,
  );
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true); setErro(null);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) { setErro(t.erroCredenciais); setEnviando(false); return; }
    router.push(busca.get("voltar") ?? "/app");
    router.refresh();
  }

  async function linkMagico() {
    setEnviando(true); setErro(null);
    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/app/auth/confirm` },
    });
    setEnviando(false);
    if (error) { setErro(t.erroCredenciais); return; }
    setAviso(t.linkMagicoEnviado);
  }

  const campo = "w-full border border-line bg-surface px-4 py-3 text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-accent-text";

  return (
    <form onSubmit={entrar} className="flex flex-col gap-4">
      {aviso ? <p className="border border-line bg-surface px-4 py-3 text-sm text-fg-muted">{aviso}</p> : null}
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.email}
        <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={campo} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t.senha}
        <input type="password" required autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} />
      </label>
      {erro ? <p role="alert" className="text-sm text-fg">{erro}</p> : null}
      <button disabled={enviando} className="rounded-control bg-accent px-7 py-3.5 font-medium text-accent-on transition-colors hover:bg-accent-hover disabled:opacity-60">
        {t.botao}
      </button>
      <button type="button" onClick={linkMagico} disabled={enviando || !email} className="text-sm text-accent-text underline-offset-4 hover:underline disabled:opacity-60">
        {t.linkMagico}
      </button>
    </form>
  );
}
```

`FormCriarConta.tsx` é análogo com `nome` e:

```tsx
const { error } = await supabase.auth.signUp({
  email, password: senha, options: { data: { nome } },
});
if (error) {
  setErro(error.message.includes("already registered") ? t.emailExiste : error.message);
  setEnviando(false); return;
}
router.push("/app"); router.refresh();
```

Páginas `app/app/entrar/page.tsx` e `app/app/criar-conta/page.tsx`: Server
Components finas — `<h1>` com `t.titulo`, o form em `<Suspense>` (useSearchParams
exige), e o link cruzado ("Ainda não tem conta? Criar conta" / "Já tem conta?
Entrar"). Largura `max-w-md mx-auto`.

- [ ] **Step 6: Rotas de saída e confirmação**

```ts
// app/app/sair/route.ts
import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";

export async function POST(request: Request) {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/app/entrar", request.url), 303);
}
```

```ts
// app/app/auth/confirm/route.ts — destino do link mágico
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (token_hash && type) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) return NextResponse.redirect(new URL("/app", request.url));
  }
  return NextResponse.redirect(new URL("/app/entrar", request.url));
}
```

- [ ] **Step 7: Placeholder do painel** — `app/app/page.tsx` mínimo para o e2e passar (a Task 5 substitui):

```tsx
export default function Painel() {
  return <h1 className="text-3xl font-medium tracking-[-0.03em]">Meus cursos</h1>;
}
```

- [ ] **Step 8: Build + e2e verde**

`lsof -tiTCP:3000 -sTCP:LISTEN | xargs kill` → `npm run build` → `npm run start &` → `npx playwright test e2e/auth.spec.ts` → 3 passing.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "plataforma: auth completa (entrar, criar conta, link mágico, sair) + shell"
```

---

### Task 5: Tipos, camada de dados, progresso puro (TDD) e painel

**Files:**
- Create: `lib/plataforma/tipos.ts`, `lib/plataforma/progresso.ts`, `lib/plataforma/dados.ts`
- Create: `lib/plataforma/progresso.test.ts`, `vitest.config.ts`
- Create: `components/plataforma/CardCurso.tsx`
- Modify: `app/app/page.tsx` (painel real)
- Test: `e2e/painel.spec.ts`

**Interfaces:**
- Consumes: `criarClienteServidor`, `plataforma.*`.
- Produces (exatas — as Tasks 6-8 dependem):

```ts
// tipos.ts
export type Aula = { id: string; slug: string; titulo: string; descricao: string; duracaoSeg: number; ordem: number; gratuita: boolean };
export type Modulo = { id: string; titulo: string; ordem: number; aulas: Aula[] };
export type Curso = { id: string; slug: string; titulo: string; descricao: string; capaUrl: string; nivel: string; cargaHoras: number; ordem: number };
export type CursoComIndice = Curso & { modulos: Modulo[] };
export type StatusAssinatura = "manual" | "ativa" | "inadimplente" | "cancelada" | null;

// progresso.ts (funções puras)
export function derivarProgresso(aulaIds: string[], concluidas: Set<string>): { feitas: number; total: number; pct: number };
export function proximaAula(modulos: Modulo[], concluidas: Set<string>): Aula | null;

// dados.ts (server-only; cada função cria o cliente e mapeia snake_case → camelCase)
export async function buscarCatalogo(): Promise<Curso[]>;                    // publicado, ordem asc
export async function buscarCurso(slug: string): Promise<CursoComIndice | null>;
export async function buscarConcluidas(): Promise<Set<string>>; // lesson_progress do usuário logado (concluida=true); RLS já limita ao próprio
export async function buscarAssinatura(): Promise<StatusAssinatura>;
export async function buscarMidia(lessonId: string): Promise<{ provider: string; videoId: string } | null>; // null = RLS negou = sem acesso
```

- [ ] **Step 1: Teste unitário primeiro** — `vitest.config.ts` padrão (`test: { include: ["lib/**/*.test.ts"] }`). `lib/plataforma/progresso.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { derivarProgresso, proximaAula } from "./progresso";
import type { Modulo } from "./tipos";

const aula = (id: string, ordem: number): Modulo["aulas"][number] =>
  ({ id, slug: id, titulo: id, descricao: "", duracaoSeg: 60, ordem, gratuita: false });

const modulos: Modulo[] = [
  { id: "m1", titulo: "M1", ordem: 1, aulas: [aula("a1", 1), aula("a2", 2)] },
  { id: "m2", titulo: "M2", ordem: 2, aulas: [aula("a3", 1)] },
];

describe("derivarProgresso", () => {
  it("zero concluídas", () => {
    expect(derivarProgresso(["a1", "a2", "a3"], new Set())).toEqual({ feitas: 0, total: 3, pct: 0 });
  });
  it("parcial arredonda para inteiro", () => {
    expect(derivarProgresso(["a1", "a2", "a3"], new Set(["a1"]))).toEqual({ feitas: 1, total: 3, pct: 33 });
  });
  it("completo", () => {
    expect(derivarProgresso(["a1"], new Set(["a1"])).pct).toBe(100);
  });
  it("catálogo vazio não divide por zero", () => {
    expect(derivarProgresso([], new Set()).pct).toBe(0);
  });
  it("concluída fora do curso não conta", () => {
    expect(derivarProgresso(["a1"], new Set(["x"])).feitas).toBe(0);
  });
});

describe("proximaAula", () => {
  it("nada concluído → primeira aula do primeiro módulo", () => {
    expect(proximaAula(modulos, new Set())?.id).toBe("a1");
  });
  it("pula concluídas e cruza módulos", () => {
    expect(proximaAula(modulos, new Set(["a1", "a2"]))?.id).toBe("a3");
  });
  it("tudo concluído → null", () => {
    expect(proximaAula(modulos, new Set(["a1", "a2", "a3"]))).toBeNull();
  });
});
```

`npm run test:unit` → FALHA (módulo não existe).

- [ ] **Step 2: Implementar `progresso.ts`**

```ts
import type { Aula, Modulo } from "./tipos";

export function derivarProgresso(aulaIds: string[], concluidas: Set<string>) {
  const total = aulaIds.length;
  const feitas = aulaIds.filter((id) => concluidas.has(id)).length;
  return { feitas, total, pct: total === 0 ? 0 : Math.round((feitas / total) * 100) };
}

export function proximaAula(modulos: Modulo[], concluidas: Set<string>): Aula | null {
  const ordenados = [...modulos].sort((a, b) => a.ordem - b.ordem);
  for (const m of ordenados) {
    for (const a of [...m.aulas].sort((x, y) => x.ordem - y.ordem)) {
      if (!concluidas.has(a.id)) return a;
    }
  }
  return null;
}
```

`npm run test:unit` → verde.

- [ ] **Step 3: `dados.ts`** — código completo (server-only; "sem acesso" chega às páginas como `null`, nunca como exceção):

```ts
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { Aula, Curso, CursoComIndice, Modulo, StatusAssinatura } from "./tipos";

/* Mapeamento snake_case (banco) → camelCase (app), explícito por campo. */
const paraCurso = (r: any): Curso => ({
  id: r.id, slug: r.slug, titulo: r.titulo, descricao: r.descricao,
  capaUrl: r.capa_url, nivel: r.nivel, cargaHoras: Number(r.carga_horas), ordem: r.ordem,
});
const paraAula = (r: any): Aula => ({
  id: r.id, slug: r.slug, titulo: r.titulo, descricao: r.descricao,
  duracaoSeg: r.duracao_seg, ordem: r.ordem, gratuita: r.gratuita,
});

export async function buscarCatalogo(): Promise<Curso[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("courses").select("*").order("ordem");
  return (data ?? []).map(paraCurso); // RLS já filtra publicado
}

export async function buscarCurso(slug: string): Promise<CursoComIndice | null> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("courses")
    .select("*, modules ( id, titulo, ordem, lessons ( * ) )")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const modulos: Modulo[] = (data.modules ?? [])
    .map((m: any) => ({
      id: m.id, titulo: m.titulo, ordem: m.ordem,
      aulas: (m.lessons ?? []).map(paraAula).sort((a: Aula, b: Aula) => a.ordem - b.ordem),
    }))
    .sort((a: Modulo, b: Modulo) => a.ordem - b.ordem);
  return { ...paraCurso(data), modulos };
}

export async function buscarConcluidas(): Promise<Set<string>> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("lesson_progress").select("lesson_id").eq("concluida", true);
  return new Set((data ?? []).map((r) => r.lesson_id)); // RLS: só as do próprio aluno
}

export async function buscarAssinatura(): Promise<StatusAssinatura> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("subscriptions").select("status, created_at")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  return (data?.status as StatusAssinatura) ?? null;
}

export async function buscarMidia(lessonId: string) {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("lesson_media").select("video_provider, video_id")
    .eq("lesson_id", lessonId).maybeSingle();
  return data ? { provider: data.video_provider, videoId: data.video_id } : null;
}
```

- [ ] **Step 4: Painel real** — `app/app/page.tsx` (Server Component):
  - `buscarCatalogo()` + `buscarConcluidas()` + `buscarAssinatura()`.
  - Bloco "Continue de onde parou": maior curso com progresso > 0 e < 100 → `proximaAula` → link direto `/app/curso/[slug]/[aulaSlug]` com capa, nome do curso, título da aula e barra (`div` com `style={{ width: pct + "%" }}` sobre trilho `bg-line`; a barra é `bg-accent`).
  - Grade de `CardCurso` (3:4): capa via `next/image` `fill` + `sizes="(min-width: 1024px) 360px, 100vw"`, `style={{ objectPosition: "center top" }}`; título, `nivel`, `cargaHoras + "h"`, anel/percentual quando > 0; sem assinatura → selo `plataforma.painel.seloAssine` e o card todo continua levando ao curso (a página do curso vende).
  - `CardCurso` recebe props `{ curso: Curso; pct: number; temAcesso: boolean }`.

- [ ] **Step 5: e2e** — `e2e/painel.spec.ts`: login com usuário criado no teste (signup via UI), painel mostra o card "Fundamentos de IA com Copilot" e NÃO mostra "Imersão de Assistentes" (publicado=false). Rodar contra build. Verde.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "plataforma: camada de dados, progresso puro testado e painel"
```

---

### Task 6: Página do curso

**Files:**
- Create: `app/app/curso/[slug]/page.tsx`, `components/plataforma/IndiceCurso.tsx`
- Test: `e2e/curso.spec.ts`

**Interfaces:**
- Consumes: `buscarCurso`, `buscarConcluidas`, `buscarAssinatura`, `derivarProgresso`, `proximaAula`, strings `plataforma.curso.*`.
- Produces: rota `/app/curso/[slug]`; `IndiceCurso` com props `{ cursoSlug: string; modulos: Modulo[]; concluidas: string[]; aulaAtualId?: string }` (client-safe, recebe array e reconstrói o Set — Set não serializa de Server para Client Component).

- [ ] **Step 1: e2e primeiro** — `e2e/curso.spec.ts`: após login, `/app/curso/fundamentos-ia-copilot` mostra o título, "8 aulas", etiqueta "Grátis" na primeira aula, botão "Começar o curso" apontando para `/app/curso/fundamentos-ia-copilot/boas-vindas`. Slug inexistente → 404 (`notFound()`). FALHA primeiro.

- [ ] **Step 2: Página** — Server Component: `buscarCurso(slug)` (null → `notFound()`); cabeçalho com capa pequena (não hero — o aluno veio consumir), título, descrição, `concluidaDe(feitas, total)`; CTA primário: nenhum progresso → `comecar`, senão `continuar`, ambos para a `proximaAula`; tudo concluído → sem CTA, texto `plataforma.aula.concluida` ao lado do título. Índice: `IndiceCurso` — módulos como `<section>` com `<h2>`, aulas como lista com link, duração formatada `mm min`, check `✓` (texto, com `aria-hidden` + estado no `aria-label` do link) nas concluídas, etiqueta `Grátis` (`text-accent-text` mono 11px) nas `gratuita`.

- [ ] **Step 3: e2e verde, commit**

```bash
git add -A && git commit -m "plataforma: página do curso com índice e continuar"
```

---

### Task 7: Player, progresso e trava de assinatura

**Files:**
- Create: `app/app/curso/[slug]/[aula]/page.tsx`, `components/plataforma/PlayerAula.tsx`
- Test: `e2e/aula.spec.ts`

**Interfaces:**
- Consumes: `buscarCurso`, `buscarMidia`, `buscarConcluidas`, `proximaAula`, `IndiceCurso`, strings `plataforma.aula.*`.
- Produces: rota `/app/curso/[slug]/[aula]`; `PlayerAula` client component com props `{ videoId: string; lessonId: string; jaConcluida: boolean; hrefProxima: string | null }`.

- [ ] **Step 1: e2e primeiro** — `e2e/aula.spec.ts`:
  - aluno novo (sem assinatura) abre `/app/curso/fundamentos-ia-copilot/boas-vindas` (gratuita): iframe do player visível (`iframe[src*="youtube-nocookie"]`), clica "Marcar como concluída", botão vira "Próxima aula"; recarrega → página do curso mostra "1 de 8 aulas concluídas".
  - mesmo aluno abre `/app/curso/fundamentos-ia-copilot/o-que-e-copilot` (paga): SEM iframe; cartão com "Esta aula faz parte da assinatura" e CTA. URL direta, não 404.
  FALHA primeiro.

- [ ] **Step 2: Página da aula** — Server Component: resolve curso + aula pelos slugs (aula não achada → `notFound()`); `buscarMidia(aula.id)`:
  - mídia veio → duas colunas `lg:grid-cols-[1fr_360px]`: `PlayerAula` + coluna com `IndiceCurso` (aulaAtualId acesa). Abaixo do vídeo: `<h1>` título, descrição.
  - mídia `null` → mesmo layout, mas no lugar do player um cartão `aspect-video` em `assurance-band`-like (fundo ink, texto papel): `bloqueadaTitulo` + `bloqueadaTexto` + CTA pílula para `/academy#contato` (Ciclo 2 troca para checkout). A página NUNCA é 404 — URL compartilhada é vendedora.
  - Mobile: índice num `<details>` ("Aulas do curso") sob o vídeo.

- [ ] **Step 3: `PlayerAula`** — client component completo:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/cliente-navegador";
import { plataforma } from "@/lib/content-plataforma";

declare global {
  interface Window { YT?: any; onYouTubeIframeAPIReady?: () => void }
}

/**
 * Player da aula com a IFrame API do YouTube (host youtube-nocookie).
 * - `ended` marca a aula concluída sozinho; o botão existe porque nem todo
 *   mundo assiste o último segundo.
 * - A cada 15s de reprodução grava segundos_assistidos (só se mudou).
 * - Falha de carga vira mensagem com recarga, nunca retângulo preto mudo.
 */
export function PlayerAula({ videoId, lessonId, jaConcluida, hrefProxima }: {
  videoId: string; lessonId: string; jaConcluida: boolean; hrefProxima: string | null;
}) {
  const t = plataforma.aula;
  const alvo = useRef<HTMLDivElement | null>(null);
  const player = useRef<any>(null);
  const [concluida, setConcluida] = useState(jaConcluida);
  const [falhou, setFalhou] = useState(false);

  async function gravar(campos: { concluida?: boolean; segundos_assistidos?: number }) {
    const supabase = criarClienteNavegador();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("lesson_progress").upsert({ user_id: user.id, lesson_id: lessonId, ...campos });
  }

  function concluir() { setConcluida(true); void gravar({ concluida: true }); }

  useEffect(() => {
    let batida: ReturnType<typeof setInterval> | null = null;
    let ultimoGravado = -1;

    function criar() {
      player.current = new window.YT!.Player(alvo.current!, {
        host: "https://www.youtube-nocookie.com",
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (e: { data: number }) => {
            if (e.data === window.YT!.PlayerState.ENDED) concluir();
          },
          onError: () => setFalhou(true),
        },
      });
      batida = setInterval(() => {
        const s = Math.floor(player.current?.getCurrentTime?.() ?? 0);
        if (s > 0 && s !== ultimoGravado) { ultimoGravado = s; void gravar({ segundos_assistidos: s }); }
      }, 15_000);
    }

    if (window.YT?.Player) criar();
    else {
      window.onYouTubeIframeAPIReady = criar;
      if (!document.querySelector('script[src*="iframe_api"]')) {
        const s = document.createElement("script");
        s.src = "https://www.youtube.com/iframe_api";
        s.onerror = () => setFalhou(true);
        document.head.appendChild(s);
      }
    }
    return () => { if (batida) clearInterval(batida); player.current?.destroy?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div>
      <div className="aspect-video w-full border border-line bg-brand-ink">
        {falhou ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-brand-paper">
            <p>{t.videoFalhou}</p>
            <button onClick={() => location.reload()} className="rounded-control border border-current px-5 py-2 text-sm">{t.recarregar}</button>
          </div>
        ) : (
          <div ref={alvo} className="h-full w-full" />
        )}
      </div>
      <div className="mt-4 flex items-center gap-3">
        {concluida && hrefProxima ? (
          <a href={hrefProxima} className="rounded-control bg-accent px-6 py-3 font-medium text-accent-on transition-colors hover:bg-accent-hover">{t.proximaAula}</a>
        ) : concluida ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-text">{t.concluida}</p>
        ) : (
          <button onClick={concluir} className="rounded-control border border-line-strong px-6 py-3 font-medium transition-colors hover:border-fg">{t.marcarConcluida}</button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: e2e verde** (os dois cenários). Rodar também `npm run test:rls` de novo — o player escreve progresso, as policies têm que continuar segurando.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "plataforma: player com progresso automático e trava de assinatura"
```

---

### Task 8: Conta

**Files:**
- Create: `app/app/conta/page.tsx`, `components/plataforma/FormConta.tsx`
- Test: `e2e/conta.spec.ts`

**Interfaces:**
- Consumes: `criarClienteServidor`, `buscarAssinatura`, strings `plataforma.conta.*`.
- Produces: rota `/app/conta`.

- [ ] **Step 1: e2e primeiro** — login → `/app/conta` mostra e-mail do usuário e "Sem assinatura"; troca o nome → recarrega → nome persiste. FALHA primeiro.

- [ ] **Step 2: Página** — Server Component lê `profiles.nome`, e-mail do user e `buscarAssinatura()`; status por extenso via `plataforma.conta.status*` (para `ativa`, formatar `current_period_end` com `Intl.DateTimeFormat("pt-BR")` — no Ciclo 1 aparecerá `statusManual` ou `statusNenhuma`). `FormConta` (client): campo nome (update em `profiles` — RLS só deixa a própria linha e só a coluna `nome`) e nova senha (`supabase.auth.updateUser({ password })`), mensagens `salvo`/`senhaTrocada`.

- [ ] **Step 3: e2e verde, commit**

```bash
git add -A && git commit -m "plataforma: página de conta com nome, senha e status da assinatura"
```

---

### Task 9: Ligação com o site, varredura final e entrega

**Files:**
- Modify: `lib/content.ts` (linha `appHref` do bloco `academy.platform`)
- Test: suítes completas

**Interfaces:**
- Consumes: tudo anterior.
- Produces: plataforma pública a partir do `/academy`.

- [ ] **Step 1: Ligar o botão**

Em `lib/content.ts`, trocar `appHref: null as string | null` por `appHref: "/app" as string | null`. O botão "Acessar plataforma" do `/academy` deixa de ser "em breve" (o componente já trata os dois casos).

- [ ] **Step 2: Varredura completa**

```bash
npx tsc --noEmit
npm run test:unit
npm run test:rls
lsof -tiTCP:3000 -sTCP:LISTEN | xargs kill; npm run build; npm run start &
npm run test:e2e
```

Tudo verde. Conferir a régua de qualidade do site: rotas antigas (/, /nexo, /academy, /spend-lab) respondem 200; `scrollWidth` 390 em viewport 390 nas rotas novas (`/app/entrar`, `/app`, curso, aula — medir com o script Puppeteer do scratchpad); tema claro E escuro nas telas novas com captura; `prefers-reduced-motion` sem animação nova.

- [ ] **Step 3: Advisors finais**

MCP `get_advisors` (security + performance) → tratar o que apontar.

- [ ] **Step 4: Commit final**

```bash
git add -A && git commit -m "plataforma: ciclo 1 no ar — botão Acessar plataforma ativo"
```

---

## Fora deste plano (não fazer)

Checkout/Asaas, e-mails (Resend), admin, certificado, cupons — Ciclos 2 e 3, specs próprios. Migração de vídeo para Panda/Mux: troca de dados em `lesson_media`, sem código novo.
