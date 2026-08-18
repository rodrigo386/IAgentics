# Plano de SEO — iagentics.com.br

Auditoria feita em 2026-08-17 direto na produção. O que já está certo: title e
description próprios em todas as páginas públicas, h1 real em cada página,
`/planos → /cursos` com redirect permanente, `noindex` na área do aluno,
GA4 e `/llms.txt` no ar.

## O que a auditoria encontrou (do mais grave ao menor)

1. **Canonical aponta para um host morto.** `site.url` é
   `https://www.iagentics.com.br` — o `og:url` de toda página aponta para o
   `www`, que hoje nem responde TLS (serve o site antigo via DNS pendente).
   Para o Google, estamos dizendo "a versão oficial desta página mora num
   endereço quebrado".
2. **O robots.txt em produção não é nosso — e bloqueia crawlers de IA.**
   O Cloudflare está injetando o "Managed Content Signals" com
   `Disallow: /` para GPTBot, Google-Extended e meta-externalagent.
   Isso anula o propósito do `/llms.txt` publicado em 2026-08-17: os
   assistentes de IA são convidados pelo arquivo e barrados pelo robots.
3. **Não existe sitemap.xml** (404). O Google descobre as páginas só por
   links.
4. **Nenhuma página tem `<link rel="canonical">`** — só og:url (errado, ver
   item 1).
5. **Zero dados estruturados (JSON-LD).** Sem Organization, sem Course para
   as formações, sem Offer para a assinatura de R$ 39,90 — nada elegível
   para rich results.
6. **Sem opengraph-image.** Link compartilhado no WhatsApp/LinkedIn aparece
   sem imagem.

## Fase 1 — Fundação técnica — CONCLUÍDA em 2026-08-18

- [x] `site.url` e `site.domain` agora são o apex `iagentics.com.br`.
- [x] `app/sitemap.ts` com as 5 páginas públicas. **`/certificados` ficou de
      fora**: descobrimos na execução que aquele endereço é 404 (a rota é
      `/certificados/[codigo]`), então listá-lo mandaria o Google a uma
      página inexistente.
- [x] `app/robots.ts` com allow geral, `Disallow` em /app, /admin, /api e a
      linha `Sitemap:`.
- [x] `alternates.canonical` por página.
- [x] **`og:url` por página** — não estava no plano. Descoberto ao verificar
      o build: o `openGraph` do layout é herdado por todas as rotas, então
      cada página anunciava a HOME como seu endereço, e o LinkedIn atribuiria
      todo compartilhamento à página inicial. Resolvido com `ogDaPagina()`.
- [x] JSON-LD: `Organization` na home, `EducationalOrganization` na
      /academy, `ItemList` de `Course` + `Offer` na /cursos gerado do
      catálogo real do banco.
- [x] `opengraph-image` 1200×630 gerada no build (next/og + Space Grotesk).
- [x] **`noindex` nos certificados** — não estava no plano. Cada certificado
      estampa o nome do aluno e gera URL infinita; ficam fora do índice por
      meta (não por robots.txt, que quebraria a prévia do LinkedIn).

Validação: 165 testes unit (10 novos em `lib/seo.test.ts`) + 26 e2e.

Fica para depois, quando houver dados do Search Console: revisar as
descriptions com as palavras-chave alvo da Fase 3.

## Fase 2 — Cloudflare e Google (precisa dos acessos do Rodrigo)

- [ ] **Decisão: aparecer em respostas de IA ou não?** Se sim (coerente com
      o llms.txt), desligar no Cloudflare o bloqueio de AI crawlers /
      managed robots.txt. Se não, o llms.txt perde a função.
- [ ] **DNS do www** → apontar para o Railway e responder 301 para o apex.
      Já era pendência; agora é também a correção definitiva do item 1.
- [ ] **Google Search Console**: verificar a propriedade (TXT no DNS),
      enviar o sitemap, acompanhar cobertura e consultas. Idem Bing
      Webmaster Tools (alimenta também ChatGPT/Copilot).
- [ ] Pedir indexação manual das 6 páginas públicas após o sitemap subir.

## Fase 3 — Conteúdo e autoridade (contínuo, decisões de negócio)

- [ ] Mapa palavra-chave → página (pt-BR): "agentes de IA para compras"
      (/nexo), "automação de compras com IA" (/nexo), "IA em procurement"
      (home), "consultoria de IA em compras" (/spend-lab), "curso de IA
      aplicada" (/cursos). Validar volume com o Search Console após 30 dias.
- [ ] Conteúdo que ranqueia: transformar os dois casos publicados (−50% no
      ciclo de contratos, −90% na análise de gastos) em páginas/artigos
      próprios — hoje são só bullets na /nexo.
- [ ] Backlinks dos parceiros já expostos no site (Desk Manager, Sebrae,
      Founders Club, Oracle) e do LinkedIn da empresa apontando para o apex.
- [ ] Medir Core Web Vitals no PageSpeed Insights depois da Fase 1 e tratar
      o que aparecer.

## Ordem sugerida

Fase 1 inteira em um dia de trabalho (tudo código). Fase 2 depende de
acessos (Cloudflare, registro.br/DNS, conta Google) — dá para fazer junto em
uma sessão. Fase 3 começa depois do Search Console ter 30 dias de dados.
