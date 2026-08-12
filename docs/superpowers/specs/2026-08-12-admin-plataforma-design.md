# Área de administrador da plataforma — IAgentics Academy

Data: 2026-08-12 · Status: design aprovado em conversa, aguardando revisão final
Base: plataforma do Ciclo 1 (spec `2026-08-11-plataforma-cursos-design.md`, no `main`).
Este é o ciclo "admin" — adiantado em relação ao plano original (era o 3º); o
checkout Asaas segue sendo um ciclo próprio.

## Decisões de produto (respostas do Rodrigo)

| tema | decisão |
|---|---|
| Conteúdo | **CRUD completo** de cursos, módulos e aulas (inclusive `video_id`), publicar/despublicar, reordenar |
| Configurações | Parâmetros da plataforma (tabela `settings`) + gestão de admins (na tela de alunos) + conta própria (já existe em `/app/conta`) |
| Métricas | **Dashboard completo**: cartões, séries temporais com filtro de período, conclusão por curso, funil por aula, export CSV |
| Ações sobre alunos | Liberar/revogar assinatura, promover/rebaixar admin, desativar conta, excluir conta |
| Arquitetura | Abordagem A: `/admin` no mesmo app, server-first, SVG à mão, zero biblioteca nova |

Nota assumida: dashboard completo sobre banco jovem renderiza pouco dado no
início; blocos vazios dizem "Sem dados no período", nunca eixo vazio fingindo
gráfico.

## Acesso e navegação

Gate em três camadas:
1. Middleware existente passa a cobrir `/admin/:path*` (sem sessão → `/app/entrar?voltar=...`).
2. Layout de `/admin` confere `role === "admin"` no servidor; não-admin recebe **404** (nunca 403 — a área não existe para quem não é admin).
3. **Toda** server action e route handler admin revalida via `exigirAdmin()` — helper único em `lib/admin/sessao.ts` que lê `auth()` e **revalida role e ativo no banco** (JWT pode estar defasado após rebaixamento/desativação); falha → `notFound()`.

Shell própria com navegação lateral: Métricas (home `/admin`), Alunos,
Conteúdo, Configurações, link "Ver como aluno" (→ `/app`). Conta do admin
continua em `/app/conta`.

**Primeiro admin:** `node scripts/promover-admin.mjs <email>` — imprime host do
banco + e-mail alvo e promove. Sem seed fixo, sem senha padrão, sem rota
secreta. Os demais são promovidos pela interface.

**Conta desativada** (`users.ativo=false`): `authorize` do login recusa com a
mensagem neutra existente; ações de escrita revalidam no banco — desativou,
parou de agir mesmo com JWT vivo.

## Modelo de dados (migração drizzle nova)

```
users     + ativo boolean not null default true
settings    chave text PK, valor text not null, updated_at timestamptz
            chaves v1: cta_destino, aviso_topo, email_contato
            (ciclo Asaas guardará preço/plano aqui — INSERT, não migração)
```

Acesso tipado a settings num módulo só (`lib/admin/configuracoes.ts`), chaves
como união de literais — chave errada não compila. Métricas não têm tabela:
tudo derivado de `users`/`subscriptions`/`lesson_progress`/`courses`.

Regras de negócio na camada `lib/admin/` (nunca na UI):
- Revogar = **inserir linha `cancelada`**; liberar = inserir `manual`. Nunca UPDATE em assinatura — o histórico é o mecanismo e é como `temAcesso` (linha mais recente) já decide.
- Rebaixar/desativar/excluir **a si mesmo: recusado na função**.
- Excluir usuário: action recebe o e-mail digitado e compara; divergência recusa sem apagar. Cascade leva progresso/assinaturas.
- Métricas em `lib/admin/metricas.ts`, somente leitura, parametrizadas por período.

## Métricas (home `/admin`)

- Filtro de período pela URL (`?periodo=7|30|90|tudo`) — links, não estado client.
- Cartões: alunos totais · novos no período · assinaturas ativas hoje (semântica do `temAcesso`) · alunos ativos no período (gravaram progresso) · aulas concluídas no período.
- Dois gráficos SVG server-rendered, mesma escala temporal: **cadastros por semana** e **atividade por semana** (`lesson_progress.updated_at`). Barras com `<title>`, eixo com valores, tabela acessível oculta com os números.
- **Conclusão por curso** (publicados): começaram · concluíram tudo · %.
- **Funil por aula** (`?curso=slug`): uma linha por aula na ordem, barra de quantos concluíram — a queda entre aulas é a informação.
- **CSV** por bloco: `GET /admin/metricas-csv?bloco=...&periodo=...` com `exigirAdmin()`, `Content-Disposition: attachment`, separador `;`, BOM UTF-8.

## Alunos

`/admin/alunos`: tabela (nome, e-mail, status da assinatura por extenso, cadastro,
último acesso = maior updated_at de progresso, selos Admin/Desativada), busca
`?q=` (ilike em nome/e-mail), paginação de 50 (`?pagina=`), mais recentes primeiro.

`/admin/alunos/[id]`: identidade · assinatura (status atual em destaque +
**histórico completo** das linhas) · progresso por curso (% e aulas concluídas com
data).

Ações (server actions com `exigirAdmin()`; `revalidatePath` após):

| ação | mecânica | trava |
|---|---|---|
| Liberar acesso | insere `manual` | desabilitada se status atual já dá acesso |
| Revogar acesso | insere `cancelada` | desabilitada se já não tem |
| Promover/rebaixar | UPDATE role | a si mesmo: recusado na função |
| Desativar/reativar | UPDATE ativo | a si mesmo: recusado |
| Excluir | DELETE (cascade) | a si mesmo: recusado; confirmação digitando o e-mail |

Exclusão via `<details>` + campo de confirmação — HTML puro, sem modal lib.

## Conteúdo

Três níveis, botões ↑/↓ para `ordem` (sem drag-and-drop), formulários simples:

- `/admin/conteudo`: cursos com selo Publicado/Oculto, contagem de aulas, aviso "aula sem vídeo". Novo curso (nasce `publicado=false`).
- `/admin/conteudo/[slug]`: campos do curso, Publicar/Ocultar, módulos (criar/renomear/reordenar/excluir), aulas em `<details>`: título, slug, descrição, duração, gratuita, e mídia (`provider` youtube|panda|mux + `video_id`).

Regras:
- Slug gerado do título (minúsculas, sem acento, hífens), editável; colisão recusada pelo unique com mensagem clara.
- Excluir curso/módulo/aula mostra na confirmação **os números reais** do que o cascade apaga ("3 alunos têm progresso..."); excluir curso publicado exige despublicar antes.
- Publicar com aulas sem vídeo: **permitido com aviso** (o aluno assinante vê o estado "em produção" que já existe). Despublicar com alunos ativos: permitido com aviso.

Fora do v1: upload de arquivo de capa (capa é URL; storage chega no ciclo Asaas/infra), edição em massa.

## Configurações

`/admin/configuracoes`: formulário das três chaves — `cta_destino` (URL validada;
passa a alimentar os CTAs das travas de assinatura do aluno, hoje fixos em
`/academy#contato`), `aviso_topo` (texto; não-vazio → faixa discreta no layout do
`/app`), `email_contato`. Salvar = upsert por chave.

## Erros

Tudo pt-BR com saída, em `lib/content-admin.ts` (nunca "PMEs"). Não-admin em
`/admin/*` → 404 seco. Action falhou → mensagem no lugar, formulário preservado.
Confirmação divergente → "O e-mail digitado não confere", nada apagado.

## Testes

1. **Autorização admin (integração)**: aluno chamando cada função de `lib/admin/` → recusado; admin desativado → recusado; auto-rebaixamento/desativação/exclusão → recusado; revogar cria linha `cancelada` (nunca UPDATE); `exigirAdmin` revalida no banco.
2. **Métricas**: agregações contra semente conhecida (contagens, funil com queda, período filtrando); CSV com BOM e `;`.
3. **e2e**: aluno em `/admin` → 404; admin (promovido por script) entra, vê métricas, busca aluno, **libera acesso e o aluno passa a ver aula paga** (verificado do lado do aluno), edita `video_id`, publica curso oculto (aparece no painel do aluno), salva `aviso_topo` (faixa aparece no `/app`).

## Entrega (cada etapa no ar antes da seguinte)

1. Migração (`ativo`, `settings`) + `promover-admin.mjs` + `exigirAdmin` + gate/shell
2. Alunos (lista, detalhe, 4 ações) — a dor operacional nº 1
3. Métricas (cartões, gráficos, funil, CSV)
4. Conteúdo (CRUD completo)
5. Configurações + faixa de aviso no `/app` + CTA das travas vindo de settings

## Fora do ciclo (registrado)

Upload de capa · audit log de ações admin · e-mail ao aluno em liberação/revogação
(Resend, ciclo Asaas) · receita nas métricas (ciclo Asaas) · parked do ciclo 1
(`voltar=/\...`, lote M) segue de fora deste escopo.
