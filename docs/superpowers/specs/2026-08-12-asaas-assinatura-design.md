# Assinatura Asaas (R$ 39,90/mês) + página pública /planos — Design

**Data:** 2026-08-12
**Status:** aprovado em conversa (4 seções), aguardando revisão do spec escrito
**Ciclos anteriores:** plataforma de cursos (2026-08-11), admin (2026-08-12)

## Objetivo

Monetizar o acervo do Academy: plano único de assinatura mensal de **R$ 39,90** cobrado pelo Asaas, com página pública de venda em `/planos` e liberação/trava de acesso 100% automática via webhook. O aluno paga na página hospedada do Asaas (Pix, cartão ou boleto) — nenhum dado de pagamento passa pelo nosso servidor.

## Decisões aprovadas

1. **Fluxo "Automático completo"**: aluno logado clica Assinar → criamos cliente + assinatura via API → ele paga na `invoiceUrl` hospedada do Asaas → webhook confirma → acesso liberado na hora. Inadimplência também automática (`PAYMENT_OVERDUE` → trava).
2. **Página pública em `/planos`**: visitante vê preço, benefícios e os 9 cursos sem login; CTA leva a criar conta/entrar. As travas de assinatura do aluno passam a apontar para ela via a configuração `cta_destino` que já existe no admin.
3. **Abordagem A** (das 3 propostas): assinatura criada por NÓS via API (`POST /customers` + `POST /subscriptions`), pagamento na fatura hospedada. O casamento do webhook é por `subscription id` — nunca por e-mail. (B era Payment Link com match por e-mail — frágil; C era checkout transparente — superfície PCI desnecessária no v1.)

## Fora de escopo (v1)

- Cancelamento self-service pelo aluno (v1: aluno pede pelo e-mail de contato; admin revoga em `/admin/alunos` — mecanismo que já existe). A copy "cancele quando quiser" é honesta: o cancelamento é sem multa e atendido manualmente.
- Nota fiscal, cupons, planos anuais, trial.
- E-mails transacionais (Resend) — ciclo futuro.
- Checkout transparente / tokenização de cartão.

## Arquitetura

### Componentes novos

| Unidade | Responsabilidade |
|---|---|
| `app/planos/page.tsx` | Página pública de venda (design system do site) |
| `app/app/assinar/page.tsx` + `actions.ts` | Página logada de contratação: resumo do plano, campo CPF, Server Action que cria a assinatura e redireciona para a fatura |
| `lib/asaas/cliente.ts` | Wrapper fino de `fetch` sobre `https://api.asaas.com/v3`; header `access_token` do env `ASAAS`; server-only |
| `lib/asaas/assinatura.ts` | Lógica de domínio: `iniciarAssinatura(userId, cpf)` e `obterFaturaPendente(asaasSubscriptionId)`; recebe o cliente por injeção (testável com Asaas falso) |
| `app/api/asaas/webhook/route.ts` | Recebe eventos, valida token, aplica transição de status idempotente |
| `drizzle/0003_*.sql` | Amplia o check de `subscriptions.status` para incluir `pendente` |
| `scripts/configurar-webhook.mjs` | Registra o webhook no Asaas uma única vez (`POST /webhooks`) |
| `lib/content-plataforma.ts` (bloco `planos` + `assinar`) | Toda a copy nova, centralizada como o resto |

### Sem SDK de terceiros

São 4 chamadas HTTP (criar cliente, criar assinatura, listar cobranças, registrar webhook). Wrapper próprio de ~40 linhas; nenhuma dependência nova.

## Página /planos (pública)

- Rota top-level fora do middleware (`matcher` cobre só `/app` e `/admin`), logo pública por construção.
- Visual: design system do site (violeta #7607E8 só em preenchimento, superfícies radius 0, controles pill, mesma tipografia das landings).
- Conteúdo: preço em destaque (**R$ 39,90/mês**), benefícios — acesso total ao acervo (as 9 formações e as que chegarem), aulas novas conforme saem da gravação, assista no seu ritmo, cancele quando quiser — e a grade de capas dos 9 cursos publicados — consulta o catálogo real via função nova `buscarCatalogoPublico()` em `lib/plataforma/dados.ts` (só cursos `publicado = true`, sem userId, sem progresso; o `buscarCatalogo` atual exige aluno logado).
- CTA único **"Assinar agora"**:
  - Visitante → `/app/criar-conta?voltar=/app/assinar` (o parâmetro `voltar` já existe e já é sanitizado).
  - Aluno logado sem acesso → `/app/assinar`.
  - Aluno logado com acesso (`temAcesso` true) → o CTA vira o aviso "Você já é assinante" com link para `/app`.
- Copy nasce no bloco `planos` de `lib/content-plataforma.ts`; strings exatas definidas no plano de implementação, rascunhadas sem inventar números que não temos (nunca "PMEs", pt-BR).

## Página /app/assinar (logada) e a ação Assinar

Fluxo da Server Action (em `lib/asaas/assinatura.ts`, chamada por `app/app/assinar/actions.ts`):

1. Guardas: sessão válida + `contaAtiva`. Se `temAcesso` já é true → retorna "já assinante" (a página nem mostra o botão, a guarda é defesa em profundidade).
2. CPF: campo obrigatório na página, validado no servidor (11 dígitos + dígitos verificadores; aceita com ou sem pontuação, normaliza para dígitos). **Não é persistido nem logado** — vai direto ao Asaas e morre ali.
3. Se a última linha de assinatura do aluno é `pendente` e tem `asaas_subscription_id`: **não cria nada** — busca via `GET /subscriptions/{id}/payments` a primeira cobrança `PENDING`/`OVERDUE` e redireciona para a `invoiceUrl` dela (reuso, sem duplicar assinatura no Asaas). Se não houver cobrança aberta (assinatura morta no Asaas), segue para criar nova.
4. Cliente Asaas: reusa `asaas_customer_id` da linha de assinatura mais recente que tiver um; senão `POST /customers` com `name`, `email`, `cpfCnpj`.
5. `POST /subscriptions`: `customer`, `billingType: "UNDEFINED"` (aluno escolhe Pix/cartão/boleto na página do Asaas), `value: 39.90`, `cycle: "MONTHLY"`, `nextDueDate` = hoje + 2 dias, `description: "Assinatura IAgentics Academy"`.
6. `INSERT` em `subscriptions`: `status = 'pendente'`, `asaas_customer_id`, `asaas_subscription_id`. (Linha nova, nunca update de linha antiga — mesmo padrão de histórico do liberar/revogar do admin.)
7. `GET /subscriptions/{id}/payments` → `redirect(invoiceUrl)` da primeira cobrança.

Erros da API do Asaas (timeout, 4xx/5xx): mensagem genérica ao aluno ("Não foi possível iniciar o pagamento. Tente novamente em instantes.") e detalhe apenas em `console.error` do servidor — nunca o corpo da resposta do Asaas na tela.

## Webhook

`POST /api/asaas/webhook`:

- **Autenticação**: header `asaas-access-token` comparado com o env `ASAAS_WEBHOOK_TOKEN` (gerado com `openssl rand -hex 32`). Token ausente/errado → `401` sem corpo.
- **Casamento**: `payment.subscription` (id da assinatura no Asaas) → linha em `subscriptions` por `asaas_subscription_id`. Evento sem `subscription` ou de assinatura desconhecida → `200` e ignora (pode ser cobrança avulsa criada no painel; não é erro).
- **Transições** (sempre `UPDATE` da linha casada, condicionado ao estado — replay é no-op):

| Evento | Efeito |
|---|---|
| `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` | `status = 'ativa'`, `current_period_end` = `dueDate` da cobrança + 1 mês |
| `PAYMENT_OVERDUE` | `status = 'inadimplente'` |
| `PAYMENT_REFUNDED`, `PAYMENT_DELETED` | `status = 'cancelada'` |
| Demais eventos | `200`, sem efeito |

- `PAYMENT_CONFIRMED` chega no Pix/cartão em segundos → como `temAcesso` consulta a última linha a cada request, o acesso libera na hora, sem cache para invalidar.
- Responde `200` rápido (processamento síncrono simples; o Asaas pausa a fila após falhas consecutivas — por isso desconhecido = 200, e erro interno de banco = `500` para o Asaas reentregar).
- Registro no Asaas: `scripts/configurar-webhook.mjs` faz `POST /webhooks` com `url: https://iagentics-production.up.railway.app/api/asaas/webhook`, `authToken: $ASAAS_WEBHOOK_TOKEN`, `sendType: "SEQUENTIALLY"`, `enabled: true` e os 5 eventos da tabela. Roda uma vez, manualmente, com os valores do `.env.local`; idempotente (se já existe webhook com essa URL, atualiza em vez de duplicar).

## Dados

Migração `drizzle/0003`:

```sql
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_status_chk";
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_status_chk"
  CHECK ("status" in ('manual','ativa','inadimplente','cancelada','pendente'));
```

Nenhuma coluna nova — `asaas_customer_id`, `asaas_subscription_id` e `current_period_end` existem desde o ciclo 1. `temAcesso` **não muda**: `pendente` ∉ `('ativa','manual')`, então segue sem acesso por construção. O admin (`/admin/alunos/[id]`) já lista o histórico de linhas e mostra qualquer status como texto; `pendente` aparece sem mudança de código.

## Segurança

- **`trocarSenha` passa a exigir a senha atual** (achado parqueado no ledger do ciclo admin, promovido a obrigatório antes de existir cobrança): a ação recebe `(atual, nova)`, verifica `bcrypt.compare(atual, senhaHash)` antes de aceitar. Sem a atual correta → recusa. A página `/app/conta` ganha o campo "Senha atual". Motivo: com conta paga, cookie de sessão roubado não pode virar takeover permanente.
- Env `ASAAS` (chave de **produção** — cobranças reais): só `.env.local` + variáveis do Railway; nunca em log, erro de tela ou bundle de cliente. `lib/asaas/cliente.ts` importa `server-only`.
- Env `ASAAS_WEBHOOK_TOKEN`: novo, mesmos lugares.
- CPF: transita pela Server Action → Asaas via HTTPS; não persistido, não logado.
- Rótulo da trava: `ctaAssinar` muda de "Falar com a IAgentics" para **"Assinar agora"** junto com o apontamento de `cta_destino` para `/planos` (o fallback hardcoded de `destinoCta()` continua `/academy#contato`; a mudança é no valor da configuração, feita no admin após o deploy).

## Testes

Nenhum teste toca a API real do Asaas (chave de produção = cobrança real).

**Integração (Asaas falso injetado em `lib/asaas/assinatura.ts` e no handler do webhook):**
- CPF inválido (dígito verificador errado, tamanho errado) → recusa antes de qualquer chamada.
- Fluxo feliz: cria cliente + assinatura, insere linha `pendente` com os dois IDs, retorna `invoiceUrl`.
- Reuso: última linha `pendente` → nenhuma criação, retorna `invoiceUrl` da cobrança aberta.
- Já assinante (`ativa`/`manual`) → recusa.
- Falha da API → erro genérico, nenhuma linha inserida.
- Webhook: token errado → 401; `PAYMENT_CONFIRMED` → `ativa` + `current_period_end`; replay do mesmo evento → no-op; `PAYMENT_OVERDUE` → `inadimplente`; `PAYMENT_REFUNDED` → `cancelada`; assinatura desconhecida → 200 sem efeito.
- `trocarSenha`: sem atual / atual errada → recusa; correta → troca (e a antiga deixa de funcionar).

**e2e (browser real, servidor local, sem clicar em nada que chame o Asaas):**
- `/planos` abre sem login: preço "R$ 39,90", grade com 9 capas, CTA levando a `/app/criar-conta?voltar=/app/assinar`.
- Logado sem acesso: `/planos` mostra CTA para `/app/assinar`; `/app/assinar` mostra resumo + campo CPF.
- Trava do curso aponta para o valor de `cta_destino` (teste já existente continua; o valor muda em produção via admin).

## Entrega (ordem)

1. Merge → build local → `scripts/deploy-railway.sh` → `scripts/migrar.mjs` contra o banco de produção (migração 0003).
2. Variáveis no Railway: `ASAAS` (hoje só no `.env.local`) e `ASAAS_WEBHOOK_TOKEN` (novo).
3. `scripts/configurar-webhook.mjs` registra o webhook de produção.
4. `/admin/configuracoes`: `cta_destino` → `/planos`.
5. **Fogo real** (única prova fim-a-fim): Rodrigo assina com o próprio CPF e paga R$ 39,90 via Pix → acesso deve liberar em segundos; estorno depois pelo painel do Asaas (o estorno dispara `PAYMENT_REFUNDED` → `cancelada`, o que também valida a trava).
