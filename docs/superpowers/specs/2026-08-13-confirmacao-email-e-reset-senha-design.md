# Confirmação de e-mail no cadastro + Esqueci minha senha — Design

**Data**: 2026-08-13 · **Decisor**: Rodrigo · **Abordagem**: A (tabela única de tokens + Resend direto)

## Objetivo

Dois fluxos de e-mail transacional para a IAgentics Academy:

1. **Confirmação de cadastro com bloqueio total** (decisão do Rodrigo): quem não
   confirmou o e-mail não entra na plataforma.
2. **Esqueci minha senha**: reset por link enviado ao e-mail, token de uso único.

Ambos dependem do canal Resend. **Sem `RESEND_API_KEY` configurada (produção
hoje), o interruptor mantém o comportamento atual** — cadastro nasce confirmado
e entra direto; o reset público fica inerte (resposta neutra + log) e o suporte
usa a válvula do admin. Com a chave, o bloqueio liga sozinho, sem novo deploy.

## Modelo de dados (migração 0005, `--custom` como as anteriores)

- `users.email_confirmado_em timestamptz` (null = não confirmado).
  **Backfill: todas as contas existentes = `now()`** — ninguém ativo é trancado.
- Tabela `auth_tokens`:
  - `id uuid pk default gen_random_uuid()`
  - `user_id uuid not null` FK `users(id) on delete cascade`
  - `tipo text not null check in ('confirmacao','reset')`
  - `token_hash text not null unique`
  - `expira_em timestamptz not null`
  - `usado_em timestamptz`
  - `criado_em timestamptz not null default now()`
  - índice `(user_id, tipo)`

### Regras de token (lib/plataforma/tokens.ts)

- Segredo: 32 bytes `crypto.randomBytes` → base64url na URL; banco guarda só o
  **SHA-256 hex**. Lookup pelo hash do valor recebido — nunca comparação do
  segredo em claro.
- **Uso único**: validar preenche `usado_em`; expirado ou usado = inválido, com a
  MESMA mensagem pública (sem distinguir).
- Validade: confirmação **7 dias**; reset **60 minutos**.
- Emitir token novo invalida os anteriores do mesmo tipo do mesmo usuário
  (um link vivo por vez).
- Reenvio: folga mínima de **60s** entre emissões do mesmo tipo por usuário
  (checa `criado_em` do último) — resposta pública continua neutra.

## Fluxo 1 — Confirmação de cadastro (bloqueio total)

Interruptor: fluxo bloqueante ativo ⇔ `RESEND_API_KEY` presente.

1. **Cadastro** (`criarContaAction`): com canal ativo, cria a conta com
   `email_confirmado_em = null`, gera token, envia e-mail e **não loga**;
   redireciona para a tela "Enviamos um link para *seu@email*. Confirme para
   entrar." com botão de reenvio. Sem canal: cria confirmada e loga (hoje).
2. **Login não confirmado**: `authorize` recusa com erro próprio; a página de
   login mostra "Confirme seu e-mail antes de entrar" + botão "Reenviar link".
3. **Link** `/app/confirmar-email/[token]`: valida → `email_confirmado_em=now()`
   + consome token → redireciona `/app/entrar?confirmado=1` ("E-mail confirmado —
   entre com sua senha"). **Sem auto-login** (o link não carrega poder de sessão).
4. **Link inválido/expirado**: página com estado de erro + formulário de reenvio
   pelo e-mail (resposta neutra).
5. **Reenvio** (público, também no login): "Se existir uma conta com este
   e-mail, enviamos um novo link" — sempre, exista ou não.
6. **Válvula de suporte** em `/admin/alunos/[id]`: badge "E-mail confirmado:
   sim/não" + ação "Marcar e-mail como confirmado" (aluno que errou o e-mail:
   admin corrige o endereço no cadastro e confirma na mão).

## Fluxo 2 — Esqueci minha senha

1. Link "Esqueci minha senha" em `/app/entrar` → `/app/recuperar-senha`
   (formulário só com e-mail). Resposta sempre neutra. Se a conta existe: token
   `reset` (60 min), e-mail com link, folga de 60s.
2. `/app/redefinir-senha/[token]`: valida → formulário de senha nova (mín. 8,
   regras do cadastro) → grava hash novo + consome token → login com "Senha
   redefinida — entre com a nova senha".
3. **Bônus de posse**: reset concluído com e-mail não confirmado também marca
   `email_confirmado_em` (receber o link provou a posse).
4. Link inválido/expirado: estado de erro + atalho para pedir outro.
5. **Válvula de suporte** em `/admin/alunos/[id]`: "Gerar link de redefinição"
   exibe a URL para o admin copiar (WhatsApp etc.) — funciona sem Resend e é o
   único reset enquanto a chave não existe.
6. **Limitação conhecida** (follow-up já registrado no ciclo Asaas): trocar a
   senha não derruba sessões JWT abertas — `session_version` fica fora deste
   ciclo.

## E-mails

- `lib/plataforma/email.ts`: `enviarEmail({para, assunto, texto, html})` via
  API do Resend (fetch, `AbortSignal.timeout(10_000)` — padrão do contato).
  Remetente env `EMAIL_DE`, padrão `IAgentics Academy <nao-responda@iagentics.com.br>`.
- Dois templates (confirmação, reset): texto puro + HTML simples da marca
  (fundo claro, wordmark em texto, botão violeta, link também em texto puro,
  sem imagens externas). Strings no bloco `emails` de `lib/content-plataforma.ts`.
- Base dos links: env `AUTH_URL` (conferir no Railway que aponta para
  `https://iagentics.com.br`).
- **Costura de teste**: env `EMAIL_CAIXA_TESTE=<arquivo>` faz `enviarEmail`
  escrever a mensagem (JSON por linha) no arquivo em vez de chamar o Resend.
  Usada só no e2e local; nunca no Railway.

## Segurança

- Hash de senha: mesmo utilitário do cadastro atual.
- Nenhuma resposta pública revela existência de conta.
- Logs sem token e sem link — só `user_id` + tipo + resultado.
- Tokens no banco apenas como SHA-256; segredo só existe na URL enviada.

## Testes

- **vitest**: ciclo do token (gerar/validar/expirar/uso único/invalidar
  anteriores/folga 60s); `authorize` recusa não confirmado; reset grava hash e
  confirma e-mail; interruptor sem chave auto-confirma.
- **e2e** (workers 1; liga o bloqueio com `RESEND_API_KEY=fake-e2e` E
  `EMAIL_CAIXA_TESTE` apontando para arquivo em tmp — a caixa tem precedência
  sobre a API, então nada sai para a rede):
  - cadastro → tela de "confirme", login recusado → lê link do arquivo →
    confirma → login entra;
  - esqueci → lê link → senha nova → login com a nova entra (e antiga não);
  - sem a env e sem chave: suíte atual segue verde (auto-confirma).

## Entrega

1. Migração 0005 aditiva local (`npm run db:migrar`) e em produção ANTES do
   deploy (`railway ssh … node scripts/migrar.mjs`, alvo `postgres.railway.internal`).
2. **Pré-requisito do Rodrigo**: `npx @railway/cli@latest login` nesta máquina
   (o ssh do Railway está sem autenticação de conta; token de projeto não serve).
3. Deploy pelo pipeline de sempre; smoke: cadastro sem chave continua entrando
   direto; páginas novas respondem 200.
4. Quando a `RESEND_API_KEY` chegar: setar no Railway (+ `EMAIL_DE` se quiser
   outro remetente), redeploy não é necessário — o interruptor lê a env.

## Fora de escopo

- `session_version` (derrubar sessões após troca de senha) — backlog Asaas.
- Templates de e-mail de marketing/newsletter; e-mail de boas-vindas separado.
- Migrar o formulário de contato (já entregue em ciclo próprio).
