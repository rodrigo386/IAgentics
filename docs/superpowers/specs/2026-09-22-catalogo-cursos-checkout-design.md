# Catálogo de cursos com carrinho e checkout Asaas — design

Data: 2026-09-22 · Aprovado pelo Rodrigo na mesma data.

## Objetivo

Uma página de catálogo "estilo Hotmart" onde a pessoa monta o próprio pacote de
cursos, vê o desconto crescer a cada curso adicionado e paga pelo Asaas. Nasce
**escondida** em `/preview/catalogo` para teste com dinheiro real (preço de
teste) e, aprovada, substitui a `/cursos`.

## Decisões (perguntas e respostas de 2026-09-22)

| # | Pergunta | Decisão |
|---|---|---|
| 1 | Onde o curso é assistido | Na **Solution (Pecege)**. A IAgentics vende e recebe; o Pecege libera o acesso. |
| 2 | Como o Pecege sabe da venda | **Lista de vendas no /admin + CSV.** Sem aviso automático. |
| 3 | Regra do desconto | **Cresce 5% por curso, só no curso novo, teto de 25%.** |
| 4 | 10% da lista de espera | Lista sem inscritos — a promessa sai com a publicação. |
| 5 | Onde se paga | **Fatura do Asaas** (a pessoa sai do site para pagar). |
| 6 | Quais cursos | **Só cursos online.** A lista real vem do Pecege; até lá, os OnDemand da Academy. |
| 7 | Catálogo pequeno demais | O Rodrigo manda a lista da Solution; ela substitui a provisória em `content.ts`. |
| 8 | Dados do comprador | Nome, e-mail, CPF, telefone. **CPF vai ao Asaas e não é gravado.** |
| 9 | Como testar | **Chave de produção**, com preço base de teste de R$ 5. |

Assumidos por falta de resposta (corrigíveis): Pix, boleto e cartão; cartão em
até 3× sem juros para o comprador; card no catálogo sem página por curso.

## 1. Rota e acesso

- `app/preview/catalogo/page.tsx` e `app/preview/catalogo/pedido/[id]/page.tsx`
  (retorno do Asaas).
- Herda as travas de prévia já existentes: `robots: noindex`, `/preview/` no
  Disallow, fora de `ROTAS_SITEMAP`, ignorada pelo beacon.
- **Atrás do mesmo Basic Auth do /admin** (`middleware.ts` passa a cobrir
  `/preview/catalogo` e `/api/checkout`). Motivo: a prévia cobra de verdade a
  R$ 5; sem senha, quem achasse o link compraria curso por R$ 5.
- O webhook (`/api/asaas/webhook`) **não** fica atrás do Basic Auth — o Asaas
  não tem a senha. Ele se autentica pelo token (seção 4).

## 2. Preço e desconto

`lib/catalogo/preco.ts`, função pura, sem I/O:

```ts
calcularCarrinho(slugs: string[], precoBaseCentavos: number): {
  itens: { slug: string; descontoPct: number; precoCentavos: number }[];
  totalCentavos: number;
  proximo: { descontoPct: number; precoCentavos: number } | null;
}
```

- O curso na posição `i` (0-based) tem desconto `min(5 * i, 25)`%.
- Tabela com base R$ 200: 200, 190, 180, 170, 160, 150, 150…
- Tudo em **centavos inteiros**; arredondamento por `Math.round` no preço de cada
  item, e o total é a soma dos itens (o que o carrinho mostra é o que se cobra).
- `proximo` alimenta o gatilho "adicione mais um e ele sai por R$ X" (sempre
  existe enquanto houver curso fora do carrinho; `null` quando o catálogo inteiro
  já está nele).
- Slug duplicado ou inexistente é descartado — o servidor nunca confia na lista
  que chega.
- **Preço base**: `catalogo.precoBaseCentavos = 20000` em `content.ts`. Na prévia,
  o servidor usa `PRECO_TESTE_CENTAVOS = 500` (constante no código da prévia, não
  variável de ambiente: não existe caminho em que a página pública cobre R$ 5).
  Com base R$ 5 o carrinho vai de R$ 5,00 a R$ 3,75 por curso; o total mínimo de
  uma cobrança (R$ 5,00) é sempre respeitado.
- **O navegador manda só os slugs.** O preço é recalculado no servidor antes de
  gravar a venda e de criar a cobrança.

## 3. Catálogo e carrinho

- Lista em `lib/content.ts` (`catalogo.cursos`): slug, nome, carga horária, frase,
  capa. Provisória: os cursos OnDemand da Academy (Fundamentos de IA aplicado aos
  Negócios, Fundamentos de IA com Copilot). Troca pela lista do Pecege sem mexer
  em código.
- Toda string visível em `content.ts` (regra do projeto).
- Layout: grade de cards à esquerda; resumo do carrinho fixo à direita no desktop
  e barra inferior expansível no celular. Cada card: capa, nome, carga horária,
  frase, botão "Adicionar"/"Remover" e, se ainda não está no carrinho, o preço que
  ele teria se entrasse agora.
- Resumo: cada curso com preço cheio riscado e preço com desconto, total, economia
  total e o gatilho do próximo curso. Botão "Finalizar compra" abre o formulário.
- Estado do carrinho: client component, persistido em `localStorage` (conveniência
  por navegador, com try/catch; a página funciona sem ele). O cálculo exibido usa a
  mesma `calcularCarrinho` do servidor.
- Visual segue `docs/DESIGN.md` (tokens, formas, motion em CSS puro).

## 4. Checkout e pagamento

**Formulário** (no próprio resumo): nome, e-mail, CPF, telefone e caixa de
consentimento obrigatória — "Seus dados serão compartilhados com o Pecege,
responsável pela plataforma Solution, para liberar seu acesso aos cursos."

**`POST /api/checkout`** (Route Handler, `server-only`):

1. Valida nome, e-mail, telefone, consentimento e CPF (dígitos verificadores;
   `lib/asaas/cpf.ts` recuperado do histórico, commit `8b59eea`).
2. Recalcula o carrinho com `calcularCarrinho`.
3. Grava a venda `pendente` (sem CPF), com os itens e preços do momento.
4. No Asaas: cria o cliente (`POST /customers`) e a cobrança, com
   `externalReference = venda.id`. Guarda os ids do Asaas na venda.
5. Responde com a URL da fatura; o navegador redireciona.

Erro do Asaas: a venda fica `falhou`, o log recebe o corpo **redigido**
(`redigirCpfs`, recuperado do histórico) e a tela mostra mensagem genérica.

**Parcelamento — a confirmar na implementação.** Cobrança simples do Asaas nasce
com número de parcelas fixo. Para o comprador escolher "até 3×", provavelmente é
preciso o recurso de link de pagamento (`maxInstallmentCount`). A primeira tarefa
do plano verifica na documentação do Asaas qual recurso permite: valor por
pedido, `externalReference` (ou equivalente rastreável no webhook), Pix/boleto/
cartão e escolha de parcelas. Se nenhum permitir tudo, o Rodrigo decide o que
cede.

**`POST /api/asaas/webhook`** — mesmo caminho do webhook antigo, que continua
registrado no Asaas:

- Autentica pelo header `asaas-access-token` contra `ASAAS_WEBHOOK_TOKEN`.
- `PAYMENT_RECEIVED`/`PAYMENT_CONFIRMED` → venda `pago` (com `pago_em`).
  `PAYMENT_REFUNDED` → `estornado`. `PAYMENT_OVERDUE`/`PAYMENT_DELETED` →
  `cancelado`.
- Idempotente: evento repetido não muda nada nem duplica.
- Venda desconhecida (`externalReference` que não existe): responde 200 e loga,
  para o Asaas não pausar a fila.
- Sempre 200 para evento que não interessa.

**Retorno**: `/preview/catalogo/pedido/[id]` mostra os cursos, o status atual da
venda e o texto "o acesso na Solution é liberado pelo Pecege em até N dias
úteis" (N em `content.ts`, a definir pelo Rodrigo antes da publicação). O id é
UUID aleatório — não se adivinha pedido de outro.

## 5. Banco — tabela `vendas`

Migração aditiva `drizzle/0011_vendas.sql`, aplicada em produção **antes** do
deploy (procedimento do CLAUDE.md).

| coluna | tipo | nota |
|---|---|---|
| id | uuid pk | aleatório |
| criada_em | timestamptz | |
| nome, email, telefone | text | |
| itens | jsonb | `[{slug, nome, descontoPct, precoCentavos}]` congelado no momento |
| total_centavos | integer | |
| modo | text | `teste` \| `real` |
| status | text | `pendente` \| `pago` \| `cancelado` \| `estornado` \| `falhou` |
| asaas_cliente_id, asaas_cobranca_id | text | |
| url_fatura | text | |
| consentimento_em | timestamptz | não nulo |
| pago_em, acesso_liberado_em | timestamptz | nulos até acontecer |

Sem CPF, em nenhuma coluna.

## 6. /admin — seção Vendas

- Contador em destaque: **pagas aguardando liberação** (`status = pago` e
  `acesso_liberado_em` nulo).
- Tabela: data, nome, e-mail, cursos, total, status, selo teste/real, liberado em.
  Filtro teste/real (padrão: real).
- Botão **"Marcar acesso liberado"** por venda paga (server action, atrás do Basic
  Auth).
- `/admin/vendas.csv`, no molde de `/admin/lista-espera.csv`.
- Textos em `lib/content-admin.ts`.

## 7. Privacidade, segredos, testes

- **Política de privacidade**: item novo "Dados da compra" — o que é gravado, o
  compartilhamento com o Pecege, CPF só no Asaas. Data de atualização muda junto.
- **Segredos**: `ASAAS` (chave de produção, já está no Railway como órfã) e
  `ASAAS_WEBHOOK_TOKEN` (idem). Conferir se ainda existem; se não,
  `railway variables --set-from-stdin ... --skip-deploys` e `railway up` depois.
  Valores nunca no chat nem em argumento de linha de comando.
- **Antes do primeiro teste real**: consultar no Asaas o estado da fila do webhook
  (`GET /webhook`). O endpoint respondeu 404 desde 2026-08-28; se a fila estiver
  pausada (`interrupted`), reativar.
- **Testes automatizados nunca chamam o Asaas real.** O cliente HTTP lê a URL base
  de `ASAAS_URL_BASE` (padrão `https://api.asaas.com/v3`), e o e2e aponta para um
  Asaas falso local. Unitários: `calcularCarrinho` (tabela inteira, teto,
  duplicados, inexistentes, arredondamento), CPF, redação de CPF, transições do
  webhook. E2E: adicionar/remover e ver o preço mudar, carrinho sobrevive ao
  reload, checkout sem consentimento é recusado, checkout válido redireciona para
  a fatura falsa, webhook falso marca como paga, venda aparece no /admin, CSV,
  prévia pede senha, preço cobrado ignora valor forjado no corpo.

## Fica para a publicação em /cursos (fora deste escopo)

- Preço base R$ 200 e remoção do Basic Auth.
- Limite de tentativas no `/api/checkout` (sem senha, qualquer um cria clientes
  no Asaas).
- Saída da lista de espera e da promessa de 10%.
- Prazo de liberação definido com o Pecege; `canonical`, sitemap, JSON-LD de
  oferta (se houver).
