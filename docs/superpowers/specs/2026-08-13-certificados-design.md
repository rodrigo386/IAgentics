# Certificados de conclusão — Design

**Data:** 2026-08-13
**Status:** aprovado em conversa (3 seções), aguardando revisão do spec escrito
**Ciclos anteriores:** plataforma, admin, Asaas, redesign editorial (encaixes prontos: selo "Curso concluído" no hero do curso, selo "Concluída" no card)

## Objetivo

Certificado de conclusão por formação: emitido automaticamente ao completar 100% das aulas, com página pública de validação que é o próprio certificado, e compartilhamento no LinkedIn (Adicionar ao perfil + post) sem API nem parceria.

## Decisões aprovadas

1. **Válido para sempre**: uma vez emitido, o certificado permanece válido mesmo se a assinatura for cancelada. A página pública não checa assinatura.
2. **Assinatura institucional**: emitido por "IAgentics Academy" (logo + nome), sem pessoa física.
3. **Abordagem A**: página-certificado viva (a própria URL é a validação) + código único + LinkedIn por URL pré-preenchida. Sem PDF no servidor (imprimir do navegador) e sem assinatura criptográfica (a validação é servida pelo nosso banco).

## Fora de escopo (v1)

PDF gerado no servidor; certificado do acervo inteiro (é por formação); revogação de certificado; e-mail ao emitir (ciclo do Resend); certificado para curso sem aulas.

## Dados e emissão

Tabela nova `certificates` (migração 0004 — só a tabela, sem backfill):

- `id` uuid pk; `user_id` → users (cascade); `course_id` → courses (cascade); `codigo` text unique; `emitido_em` timestamptz default now.
- Unique `(user_id, course_id)` — um certificado por aluno por formação.

**Código de validação**: gerado com `crypto` do Node (zero dependência nova), alfabeto sem ambíguos (`23456789ABCDEFGHJKMNPQRSTUVWXYZ` — sem 0/O, 1/I/L), formato `XXXX-XXXX-XX` (10 caracteres úteis, ~10^15 combinações; chute de URL impraticável). Colisão (improvável): re-gera e tenta de novo; unique do banco é a rede.

**Emissão automática, idempotente, sem backfill**:
- `emitirSeConcluido(userId, courseId)`: se o aluno tem TODAS as aulas do curso concluídas (mesma derivação do selo "Curso concluído": `derivarProgresso`, `pct === 100`, `total > 0`) e não existe linha em `certificates`, insere. Idempotente por construção (unique + verificação).
- Chamada em dois pontos: (a) `gravarProgresso` quando a marcação fecha 100% do curso da aula; (b) página do curso quando o aluno está 100% sem certificado — **emissão preguiçosa que cobre os retroativos** (quem já concluiu antes do deploy ganha o certificado ao abrir o curso).
- `emitido_em` é o momento da emissão real (para retroativos, o dia em que a página emitiu — aceito; o dado histórico de conclusão continua em `lesson_progress.concluida_em`).
- Curso que ganhar aulas novas depois: certificado já emitido permanece; o progresso volta a <100% só para as aulas novas.

## Camada de dados — `lib/plataforma/certificados.ts`

- `emitirSeConcluido(userId: string, courseId: string): Promise<void>`
- `buscarPorCodigo(codigo: string): Promise<{ codigo: string; emitidoEm: Date; alunoId: string; alunoNome: string; cursoTitulo: string; cursoSlug: string; cargaHoras: number } | null>` — página pública; código normalizado (trim/uppercase) antes da busca. `alunoId` existe para a página comparar com a sessão e decidir se mostra os botões do dono (nunca é renderizado).
- `listarDoAluno(userId: string): Promise<Array<{ codigo: string; emitidoEm: Date; cursoTitulo: string }>>` — conta.
- `doAlunoNoCurso(userId: string, courseId: string): Promise<{ codigo: string } | null>` — botão da página do curso.
- Padrões da casa: `server-only`, `userId` explícito onde há dono, joins diretos.

## Página pública `/certificados/[codigo]`

- Rota top-level fora do middleware (pública por construção); `export const dynamic = "force-dynamic"` (consulta banco; build do Railway sem rede de banco).
- Visual no design system: moldura editorial com o véu da rampa da marca, logo IAgentics Academy + wordmark, "Certificado de conclusão", **nome do aluno** em destaque tipográfico, formação, carga horária, data de emissão (pt-BR por extenso) e o **código** em mono. Selo "✓ Certificado válido" com o texto: emitido por IAgentics Academy; este endereço confirma a autenticidade.
- Código inexistente/malformado → `notFound()` (404 com mensagem neutra).
- `@media print`: esconde shell/botões, ajusta para A4 paisagem — "salvar PDF" é o imprimir do navegador.
- Metatags OG via `generateMetadata`: título "Certificado — {formação} · IAgentics Academy", descrição com o nome do aluno, imagem OG estática da marca.
- **Imagem OG**: still 1200×630 renderizado de uma variação estática da composição Remotion do banner (logo + "Certificado de conclusão"), asset versionado em `public/plataforma/og-certificado-v1.png`, mesmo esquema de versionamento manual do vídeo do banner.

## Botões (só para o dono logado; visitante vê só o certificado)

- **Adicionar ao LinkedIn** (Licenças e certificados, URL oficial pré-preenchida):
  `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name={formação}&organizationName=IAgentics&issueYear={ano}&issueMonth={mês}&certUrl={URL da página}&certId={código}` (valores URL-encoded).
- **Compartilhar no LinkedIn** (post): `https://www.linkedin.com/sharing/share-offsite/?url={URL da página}`.
- **Imprimir / salvar PDF**: `window.print()` (client component mínimo só para o botão).
- A URL absoluta da página usa a origem da requisição (headers) — funciona em local e produção sem env nova.

## Pontos de acesso do aluno

- **Página do curso**: quando existe certificado do aluno no curso, o selo estático "Curso concluído" vira link/botão **"Ver certificado"** → `/certificados/{codigo}` (o encaixe do redesign).
- **`/app/conta`**: seção "Certificados" listando os emitidos (formação, data, link).
- Card "Concluída" no painel: sem mudança (leva ao curso, que tem o botão).

## Conteúdo (`lib/content-plataforma.ts`)

Bloco novo `certificado`: título da página, "Certificado de conclusão", selo de validade e texto de autenticidade, rótulos (formação, carga horária, emitido em, código de validação), botões (Adicionar ao LinkedIn, Compartilhar no LinkedIn, Imprimir / salvar PDF), "Ver certificado", e o bloco da conta (`conta.certificados`, estado vazio "Nenhum certificado ainda — conclua uma formação."). Strings exatas no plano. pt-BR; nunca "PMEs".

## Testes

**Integração** (`lib/plataforma/certificados.test.ts`, Postgres real, prefixado, limpo no afterAll):
- Emite ao fechar 100% via `gravarProgresso`; chamar de novo não duplica (idempotente).
- 99% (uma aula faltando) não emite.
- Lazy: aluno 100% sem certificado → `emitirSeConcluido` emite; `emitido_em` presente.
- `buscarPorCodigo`: código válido devolve nome/curso; inválido → null; normalização (minúsculas/espaços) funciona.
- Unique `(user, course)` real no banco.
- Curso oculto (publicado=false) não emite.

**e2e** (`e2e/certificado.spec.ts`, mesmo arranjo do painel.spec com liberação via admin):
- Concluir a formação → página do curso mostra "Ver certificado" → página pública com nome do aluno, formação e código.
- Deslogar → a mesma URL continua mostrando o certificado válido (decisão "para sempre").
- Código forjado → 404.
- `/app/conta` lista o certificado.
- Href do "Adicionar ao LinkedIn" contém `certUrl` e `certId` corretos (assert no atributo, sem navegar para fora).

## Follow-ups aceitos no review final (fora deste ciclo)

- `excluirCurso` no admin cascateia `certificates` — despublicar + excluir apaga certificados emitidos e as URLs públicas passam a 404 (porta dos fundos do "válido para sempre"). Estender o guard existente com `curso_com_certificados` num ciclo futuro.
- `cache()` do React em `buscarPorCodigo` (hoje 2 queries por view: generateMetadata + page).
- Testes: estado vazio `semCertificados` na conta; `@media print`/`@page` e o catch de banco da conta sem cobertura automatizada (verificados visualmente/por leitura).
- Nomenclatura `metaTitulo/metaDescricao` invertida vs `descricaoMeta` do arquivo de conteúdo.

## Entrega

Branch própria → SDD → review final → merge → migração 0004 em produção (via `railway ssh`, como a 0003) → deploy (`scripts/deploy-railway.sh`) → smoke: código forjado → 404; abrir o curso concluído da sua conta → certificado retroativo emitido e página pública no ar. Sem env nova.
