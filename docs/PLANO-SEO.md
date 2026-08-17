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

## Fase 1 — Fundação técnica (no código; 1 deploy)

- [ ] Trocar `site.url` para `https://iagentics.com.br` (o apex, que é quem
      responde). Quando o DNS do www for corrigido, o www vira 301 para o
      apex e o canonical continua válido.
- [ ] `app/sitemap.ts`: rotas públicas (`/`, `/nexo`, `/academy`, `/cursos`,
      `/spend-lab`, `/certificados`).
- [ ] `app/robots.ts`: allow geral, `Disallow: /app`, `/admin`, `/api`, e a
      linha `Sitemap:`. (O Cloudflare concatena o managed content acima do
      nosso — desligar lá é a Fase 2.)
- [ ] `alternates.canonical` por página via metadata do Next.
- [ ] JSON-LD: `Organization` na home; `Course` + `Offer` (R$ 39,90/mês) em
      /cursos, gerado do catálogo real; `EducationalOrganization` em
      /academy.
- [ ] `opengraph-image` 1200×630 (home no mínimo; ideal uma por seção) —
      seguindo docs/DESIGN.md.
- [ ] Revisar as descriptions com as palavras-chave alvo (Fase 3) sem
      quebrar a regra do copy verbatim: description de meta não é copy de
      página, pode ser otimizada.

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
