# Prontidão para agentes

O que o site faz para ser lido por agentes de IA, e o que decidimos **não**
fazer. Escrito em 2026-09-06, a partir de uma sequência de recomendações do
verificador [isitagentready.com](https://isitagentready.com).

A regra que atravessa todas as decisões abaixo: **não anunciar o que não
existe.** Um verificador automático não distingue "declarou e é verdade" de
"declarou"; um agente que segue o link, sim. É a mesma regra que tirou o
`cursosJsonLd` do site em 2026-08-28, quando a plataforma de cursos foi
desligada — dado estruturado que não bate com a página é penalizado, e link
que não resolve é pior que link ausente.

## Implementado

### `Link` headers (RFC 8288)

Toda página HTML devolve, em `next.config.ts`:

```
Link: </llms.txt>; rel="describedby"; type="text/plain", </privacidade>; rel="privacy-policy"
```

**Um header só, com os valores separados por vírgula.** O Next deduplica por
chave: com dois headers `Link`, só o último sobrevive (medido — a resposta
vinha só com `privacy-policy`). A RFC aceita as duas formas; esta é a que
atravessa o framework.

Os dois `rel` são registrados na IANA e ambos os alvos respondem 200.

### `/llms.txt`

Descrição do site para agentes. Ele **já divergiu uma vez**: por uma semana
depois do desligamento da plataforma continuou anunciando cinco agentes,
assinatura de R$ 39,90, plataforma própria de cursos e um link para
`/certificados` que responde 404. Como o `Link: describedby` aponta para ele,
mandar um agente para um texto desatualizado é pior que não ter header nenhum.
`e2e/descoberta-agentes.spec.ts` verifica que o conteúdo desligado não voltou.

### Negociação de markdown (RFC 9110 §12)

`Accept: text/markdown` na mesma URL devolve a página em markdown, com
`Content-Type: text/markdown` e `x-markdown-tokens`; navegador continua
recebendo HTML. Não usamos o "Markdown for Agents" do Cloudflare: **não existe
no plano free**.

Três coisas que custaram caro e estão no CLAUDE.md:

- **A rota viaja em header (`x-md-rota`), não em query.** Num rewrite o Route
  Handler enxerga a URL ORIGINAL, então a query do destino não chega. O
  sintoma foi silencioso: toda página devolvia a home, com content-type e
  contagem de tokens corretos. Um verificador automático teria aprovado.
- **O fetch interno vai para `http://127.0.0.1:$PORT`.** Com a origem pública
  a chamada morre em `SSL routines: wrong version number` — atrás do Cloudflare
  a URL chega como `https`, mas o processo escuta HTTP na porta interna. Só
  aparece em produção: local os dois endereços coincidem, e os 38 testes
  passaram verdes com o bug presente.
- **`Vary: Accept` nas duas representações**, senão um CDN serve markdown para
  navegador ou HTML para agente.

Artigo é servido do `.md` original (nasceu markdown); o resto converte o
`<main>` com turndown. Escrever markdown à mão por página criaria um segundo
lugar para descrever o site — a armadilha em que o `llms.txt` caiu.

## Recusado

### `api-catalog` (RFC 9727) — 2026-09-06

**O site não tem API pública.** Os quatro endpoints sob `/api/` são plumbing do
próprio site, e três têm efeito colateral que sai dele:

| Endpoint | O que acontece se um agente chamar |
|---|---|
| `/api/contato` | Dispara e-mail para a caixa do Rodrigo |
| `/api/lista-espera` | Grava um inscrito e dispara dois e-mails |
| `/api/estatisticas` | Incrementa o contador de visitas do painel |
| `/api/markdown` | Alvo interno do rewrite; nada útil isolado |

Publicar um catálogo é um convite a chamá-los: spam na caixa de entrada,
inscrições falsas na lista que vai para o Pecege, e números inflados no mesmo
painel que decide se a página funciona. O item não está quebrado — **não se
aplica**. Um verificador genérico cobra de um site institucional a mesma lista
que cobra de um provedor de API.

Confirmado com o Rodrigo em 2026-09-06: não existe API do Nexo para clientes
ou parceiros. **Se um dia existir, o catálogo entra junto com ela** — com
OpenAPI de verdade em `service-desc`, documentação em `service-doc` e um
endpoint de saúde em `status`, que é o que a RFC 9727 espera encontrar.

Pela mesma razão, `api-catalog`, `service-desc` e `service-doc` ficam **fora**
do `Link` header, embora o verificador os aceite e fossem o caminho mais rápido
para passar. `e2e/descoberta-agentes.spec.ts` falha se algum deles aparecer.

## O que continua barrando os assistentes de IA

Nada disto resolve o problema maior: o **robots.txt que os robôs leem não é o
nosso**. O Cloudflare injeta o "Managed Content Signals" na frente, hoje com
`Disallow: /` para ClaudeBot, GPTBot e Google-Extended. O site responde muito
bem a quem chega — esses três continuam impedidos de chegar. É uma chave no
painel do Cloudflare, não código. Ver [PLANO-SEO.md](PLANO-SEO.md).
