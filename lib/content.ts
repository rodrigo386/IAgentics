/**
 * SINGLE SOURCE OF COPY
 *
 * Every visible string on the site lives here, so translating the page to EN is a
 * one-file swap (an EN twin of the deck already exists as IAgentics_Clientes_V2_ENG.pptx).
 *
 * Source of truth: IAgentics_Clientes_V2.pptx (Documentos/IAgentics/PPTS).
 * Copy is taken from the deck as written. Nothing here is invented marketing.
 *
 * CTA INTENT LOCK - one label per intent, used identically everywhere:
 *   contact intent   -> "Vamos conversar"
 *   solutions intent -> "Ver as soluções"
 */

export const site = {
  name: "IAgentics",
  /* O APEX é o endereço canônico (2026-08-18). Era `www`, que não respondia:
     todo canonical/og:url do site apontava para um host morto. O www agora
     redireciona 301 para cá, então há UM endereço oficial - o que o Google
     precisa para não dividir a autoridade entre duas versões da mesma página. */
  domain: "iagentics.com.br",
  url: "https://iagentics.com.br",
  tagline: "Automações Inteligentes para Compras e Gestão de Gastos",
  description:
    "A IAgentics coloca agentes de IA para rodar dentro da plataforma que sua empresa já usa, em Compras e Gestão de Gastos. Seus dados permanecem no servidor da sua empresa.",
} as const;

export const cta = {
  contact: "Vamos conversar",
  solutions: "Ver as soluções",
} as const;

/** 404 global (app/not-found.tsx): endereços inexistentes e códigos de
 *  certificado inválidos caem aqui — antes era o 404 cru do Next, sem marca. */
export const naoEncontrada = {
  eyebrow: "Erro 404",
  titulo: "Esta página não existe.",
  texto: "O endereço pode ter mudado ou o código digitado não confere. Verifique o link e tente de novo.",
  voltar: "Ir para o início",
} as const;

/**
 * Política de privacidade (/privacidade).
 *
 * ESTE TEXTO DESCREVE O QUE O CÓDIGO REALMENTE FAZ — foi escrito lendo o
 * schema do banco e os formulários do site, não um
 * modelo genérico. Se o comportamento mudar, o texto muda junto — foi
 * exatamente o que aconteceu em 2026-08-29, quando a plataforma de ensino saiu
 * e a política ainda declarava senha, CPF e cobrança que já não existiam:
 *
 *   - `lista_espera` guarda nome, e-mail e a data do consentimento (schema.ts)
 *   - o formulário de contato não persiste: entrega por e-mail e acabou
 *   - `page_views` agrega dia + rota, sem cookie, IP ou identificador
 *   - `entradas` agrega dia + rota + BALDE de origem (2026-09-09): o navegador
 *     manda só o hostname de quem indicou, e o servidor o reduz a uma de seis
 *     categorias antes de gravar — a URL nunca é persistida
 *
 * A URL existe também por um motivo de campo: /privacidade era a segunda
 * página mais exibida do domínio no Google (19 impressões em 7 dias) e
 * respondia 404, herança do site antigo.
 */
export const privacidade = {
  meta: {
    titulo: "Política de Privacidade",
    descricao:
      "Como a IAgentics trata dados pessoais no site e na lista de espera do lançamento com o Pecege, conforme a LGPD.",
  },
  hero: {
    eyebrow: "Privacidade",
    titulo: "Política de Privacidade",
    atualizado: "Atualizada em 22 de setembro de 2026",
    lead: "Esta página explica quais dados a IAgentics coleta, por que coleta, com quem compartilha e como você pede para removê-los. Está escrita em português direto, sem juridiquês desnecessário.",
  },
  secoes: [
    {
      titulo: "Quem é responsável pelos seus dados",
      paragrafos: [
        "A controladora dos dados pessoais tratados neste site é a IAgentics LTDA, inscrita no CNPJ sob o nº 56.920.339/0001-60, com sede na Rua Barão de Teffé, 160, conjunto 505, anexo V140, Jardim Ana Maria, Jundiaí/SP, CEP 13.208-760.",
        "Qualquer dúvida ou pedido sobre seus dados pode ser enviado pelos canais no fim desta página.",
      ],
      itens: [],
    },
    {
      titulo: "O que coletamos, e só isso",
      paragrafos: [
        "Coletamos o mínimo necessário para cada finalidade. Nada é vendido, e nada é usado para publicidade de terceiros.",
      ],
      itens: [
        {
          termo: "Formulário de contato",
          texto:
            "Nome, e-mail corporativo e a mensagem que você escreve. Servem para responder você, e chegam até nós por e-mail. Sem contato iniciado por você, não há coleta.",
        },
        {
          termo: "Lista de espera do lançamento",
          texto:
            "Nome e e-mail, informados por você no formulário de /cursos, e a data em que você autorizou o compartilhamento. Servem para avisar você do lançamento das formações na Solution e garantir o desconto prometido. Sem a autorização marcada, nada é gravado.",
        },
        {
          termo: "Compra de cursos",
          texto:
            "Nome, e-mail, celular, os cursos escolhidos, o valor e a situação do pagamento, além da data em que você autorizou o compartilhamento com o Pecege. Servem para liberar seu acesso na plataforma Solution. O CPF é pedido porque o Asaas, que emite a cobrança, exige: ele vai direto para o Asaas e não é gravado no nosso site.",
        },
        {
          termo: "Medição de visitas do site",
          texto:
            "Contamos quantas visitas cada página pública recebe por dia. Esse contador registra apenas a data e o endereço da página — sem cookie, sem endereço IP e sem qualquer identificador de pessoa.",
        },
        {
          termo: "De onde você chegou",
          texto:
            "Na primeira página de cada visita, registramos o TIPO de site que trouxe você — busca, rede social, assistente de IA, indicação de outro site, ou nenhum. Seu navegador nos envia apenas o domínio de quem indicou (por exemplo, google.com), nunca o endereço completo nem o termo que você pesquisou, e esse domínio vira categoria antes de ser gravado. É a categoria que fica; o domínio, não.",
        },
        {
          termo: "Google Analytics",
          texto:
            "Usamos o Google Analytics nas páginas públicas para entender o uso do site. Ele grava cookies no seu navegador e trata dados conforme a política do Google.",
        },
      ],
    },
    {
      titulo: "Com quem compartilhamos",
      paragrafos: [
        "Compartilhamos dados apenas com os serviços necessários para o site funcionar, e apenas o que cada um precisa para cumprir sua função:",
      ],
      itens: [
        {
          termo: "Pecege e plataforma Solution",
          texto:
            "Se você comprou um curso, seu nome, e-mail, celular e os cursos comprados são compartilhados com o Pecege para liberar seu acesso na Solution. Se você entrou na lista de espera, seu nome e e-mail são compartilhados com o Pecege, responsável pela plataforma Solution, onde as formações serão oferecidas. É por causa desse compartilhamento que o formulário pede uma autorização explícita: sem ela marcada, não gravamos nem compartilhamos nada. A autorização pode ser revogada a qualquer momento pelos canais no fim desta página.",
        },
        {
          termo: "Asaas",
          texto: "Emissão e processamento das cobranças dos cursos: recebe nome, e-mail, celular e CPF para gerar a cobrança, e os dados de pagamento que você informa na fatura.",
        },
        { termo: "Resend", texto: "Envio dos e-mails do site: mensagem de contato e confirmação de inscrição na lista de espera." },
        { termo: "Google Analytics", texto: "Medição de uso das páginas públicas." },
        { termo: "Railway e Cloudflare", texto: "Hospedagem da aplicação e entrega do site, com tráfego sempre em HTTPS." },
      ],
    },
    {
      titulo: "Por quanto tempo guardamos",
      paragrafos: [
        "Dados da sua conta e do seu progresso ficam enquanto a conta existir. Certificados emitidos são preservados enquanto a verificação pública fizer sentido — é ela que permite a alguém conferir a autenticidade do documento. Mensagens do formulário de contato ficam na nossa caixa de e-mail pelo tempo do atendimento e do relacionamento comercial. Registros de cobrança seguem os prazos legais e as regras do processador de pagamentos.",
      ],
      itens: [],
    },
    {
      titulo: "Como protegemos",
      paragrafos: [
        "Todo o tráfego do site é cifrado por HTTPS. Os dados da lista de espera ficam em banco de acesso restrito, e o site não guarda senha alguma — não existe área de login. Endereços de e-mail não aparecem em registros técnicos.",
      ],
      itens: [],
    },
    {
      titulo: "Seus direitos",
      paragrafos: [
        "A Lei Geral de Proteção de Dados garante a você, a qualquer momento e sem custo, o direito de confirmar se tratamos seus dados, acessá-los, corrigi-los, pedir a anonimização ou a eliminação dos dados desnecessários, solicitar a portabilidade, saber com quem compartilhamos e revogar consentimento.",
        "Para exercer qualquer um desses direitos, fale com a gente pelos canais abaixo. Respondemos no menor prazo possível.",
      ],
      itens: [],
    },
    {
      titulo: "Cookies",
      paragrafos: [
        "O site usa cookies em um caso só: os do Google Analytics, nas páginas públicas. Não existe área de login e, portanto, nenhum cookie de sessão. Você pode bloquear cookies nas configurações do seu navegador, sem prejuízo algum ao uso do site.",
      ],
      itens: [],
    },
    {
      titulo: "Mudanças nesta política",
      paragrafos: [
        "Se o que fazemos com dados mudar, esta página muda junto, e a data de atualização no topo passa a refletir a revisão mais recente.",
      ],
      itens: [],
    },
  ],
  contato: {
    titulo: "Falar sobre seus dados",
    texto: "Para qualquer pedido relacionado a dados pessoais, use um destes canais:",
    /* O endereço eletrônico que a própria empresa declarou à Receita Federal
       no CNPJ, e de onde o site já envia as mensagens do formulário. Fica em
       primeiro lugar entre os canais: pedido de LGPD costuma pedir registro
       escrito, e e-mail deixa trilha dos dois lados. */
    email: "contato@iagentics.com.br",
  },
} as const;

export const nav = {
  links: [
    { label: "Soluções", href: "/#solucoes" },
    { label: "Nexo", href: "/nexo" },
    { label: "Academy", href: "/academy" },
    { label: "Cursos", href: "/cursos" },
    { label: "Spend Lab", href: "/spend-lab" },
    /* Entrou junto com a primeira publicação (2026-08-20). Fica por último de
       propósito: os quatro anteriores são produto, artigo é o que sustenta a
       visita — vem depois do que a pessoa veio procurar. Este array alimenta o
       menu E o rodapé. */
    { label: "Artigos", href: "/artigos" },
  ],
} as const;

export const hero = {
  /** Split so both lines are close in length, which keeps the hero at exactly 2 lines. */
  headline: ["Automações Inteligentes para", "Compras e Gestão de Gastos"],
  /* Reescrito em 2026-09-22, ditado pelo Rodrigo. Passou de 19 para 34 palavras
     e de uma afirmação de produto para uma de POSIÇÃO DE MERCADO ("primeira
     empresa brasileira"), que é uma reivindicação que alguém pode cobrar —
     diferente de "nove módulos", que se verifica na própria página.

     Três correções de concordância sobre o ditado: "multi agêntica" →
     "multiagênticas", "integrado" → "integradas" (concordam com "soluções") e
     "ISO27001" → "ISO/IEC 27001", que é como o resto do site escreve. */
  subtext:
    "Primeira empresa brasileira de soluções multiagênticas de IA para gestão de gastos, integradas ao seu ERP e dentro do ambiente Microsoft e do Space da Desk Manager, oferecendo segurança certificada ISO/IEC 27001 e governança de dados.",
  /** Description da home (title vem do layout: nome · tagline, que é o título do pitch).
   *
   *  CABE NO QUE O BUSCADOR MOSTRA. A versão anterior tinha 192 caracteres e
   *  terminava em "certificação ISO/IEC 27001" — que era exatamente a parte
   *  cortada nos ~160 que o Google e o Bing exibem. O selo continua na página,
   *  onde a pessoa chega; aqui fica o que a faz clicar. */
  descricao:
    "O Nexo orquestra nove módulos de agentes de IA em Compras e Gestão de Gastos, dentro da plataforma que sua empresa já usa. Dados no servidor da sua empresa.",
  imageAlt:
    "Edifício corporativo iluminado à noite, com dezenas de estações de trabalho visíveis pelas janelas",
  /* O "NEXO APP" sob o grafo SAIU em 2026-09-22, a pedido do Rodrigo. Com ele
     foi embora o único link da hero para /nexo — o caminho para o produto
     agora é o "Nexo" do menu e o cartão em "Ver as soluções". */
} as const;

/**
 * "O problema" (pitch Hacktown, slides 3 e 4) — seção nova da home, entre a
 * hero e as soluções. Dois painéis, cada um com o número, a fonte e as três
 * dores. Tudo verbatim do deck; a fonte fica VISÍVEL, não em nota de rodapé —
 * número sem fonte na tela é o que a regra de copy proíbe.
 */
export const problema = {
  eyebrow: "O problema",
  paineis: [
    {
      numero: "57%",
      legenda: "das horas de trabalho já podem ser automatizadas com a tecnologia atual",
      fonte: "McKinsey Global Institute — “Agents, robots, and us” (2025)",
      titulo: ["As áreas de Compras estão", "presas no operacional"],
      lead: "Horas gastas todos os dias em tarefas manuais e repetitivas",
      itens: [
        { nome: "Atendimento", texto: "Cliente interno solicita atualizações constantes" },
        { nome: "Gerenciamento no Excel", texto: "Requisições, pedidos, contratos, savings" },
        { nome: "Disparo manual", texto: "E-mails, cotações, cobranças" },
      ],
    },
    {
      numero: "70%",
      legenda: "do custo total de uma empresa pode estar em gastos externos com fornecedores",
      fonte: "McKinsey & Company — Procurement insights (2017, 2019)",
      titulo: ["Gestão de gastos é a", "maior alavanca de valor"],
      lead: "Gerir bem os gastos é a oportunidade mais subestimada da organização",
      itens: [
        { nome: "Baixa visibilidade", texto: "Gastos fragmentados em planilhas, sem visão por categoria" },
        { nome: "Impacto direto na margem", texto: "Cada 1% economizado em compras vai direto para o resultado" },
        { nome: "Potencial não capturado", texto: "Soluções digitais destravam de 3% a 10% de economia anual" },
      ],
    },
  ],
} as const;

export const partners = {
  /** The strip carries a single label now; the badges do the talking. */
  label: "Parcerias",
  /**
   * Official partner badges supplied by the client, extracted from slide 3 of the deck.
   * These are trademarked lockups, so they are never recolored or redrawn - they render
   * at their official colors on a neutral brand plate.
   */
  logos: [
    { name: "Microsoft AI Cloud Partner", src: "/partner-microsoft.png", w: 922, h: 235 },
    { name: "Oracle Partner", src: "/partner-oracle.png", w: 721, h: 233 },
    { name: "SAP Partner", src: "/partner-sap.jpg", w: 600, h: 600 },
    { name: "Desk Manager Partners", src: "/partner-deskmanager.png", w: 1057, h: 347 },
  ],
  /** Anthropic ships a clean single-color mark via simple-icons, so it renders as SVG. */
  anthropic: { name: "Anthropic" },
} as const;

export const solutions = {
  eyebrow: "Modelos de negócio",
  headline: "As 3 soluções da IAgentics",
  items: [
    {
      id: "nexo",
      /** Loop do palco da home (remotion/home-solucoes, 2026-10-07). */
      filme: "/solucoes/solucao-nexo.mp4",
      capa: "/solucoes/solucao-nexo-poster.jpg",
      name: "Nexo",
      /* 2026-09-04: era "Agentes de IA para Compras" com os cinco agentes em
         chips. O Nexo é o orquestrador; os nove módulos entram em nome curto. */
      promise: "Orquestrador de gestão de gastos",
      platform: "Microsoft · Desk Manager",
      scope: ["Compras", "Ativos", "Logístico", "NF", "Contas a Pagar", "Varejo", "Orçamento", "Contratos", "Homologação"],
      href: "/nexo",
      image: "/agent-contratos.jpg",
      imageAlt: "Mãos revisando e anotando um documento impresso",
    },
    {
      id: "academy",
      /** Loop do palco da home (remotion/home-solucoes, 2026-10-07). */
      filme: "/solucoes/solucao-academy.mp4",
      capa: "/solucoes/solucao-academy-poster.jpg",
      name: "Academy",
      promise: "Capacitação para você e sua equipe",
      platform: "Escola de negócios de IA",
      scope: ["In Company", "Mentorias", "Online"],
      href: "/academy",
      image: "/academy-formacao.jpg",
      imageAlt: "Quatro profissionais reunidos analisando a tela de um notebook",
    },
    {
      id: "spend-lab",
      /** Loop do palco da home (remotion/home-solucoes, 2026-10-07). */
      filme: "/solucoes/solucao-spend-lab.mp4",
      capa: "/solucoes/solucao-spend-lab-poster.jpg",
      name: "IA Spend Lab",
      promise: "Consultoria de Implementação de IA em Compras",
      platform: "Da maturidade ao resultado",
      scope: ["Diagnóstico", "Consultoria", "Formação"],
      href: "/spend-lab",
      image: "/agent-spend.jpg",
      imageAlt: "Mãos examinando relatórios de gastos impressos com o apoio de uma lupa",
    },
  ],
} as const;

export const nexo = {
  kicker: "IAgentics Nexo",
  assurance:
    "Seus dados se mantêm protegidos dentro do servidor da sua empresa.",
  /** A plataforma onde o Nexo roda embarcado. Badge oficial do cliente. */
  platforms: [
    { name: "Desk Manager Partners", src: "/partner-deskmanager.png", w: 1057, h: 347 },
  ],
  /** Certificações de segurança da informação da Desk Manager, a plataforma
   *  onde o Nexo roda embarcado. Selos oficiais fornecidos pelo cliente. */
  certificacoes: {
    selos: [
      {
        name: "Certified Company ISO/IEC 27001 · QMS Certification",
        src: "/selo-iso27001-v1.jpg",
        w: 800,
        h: 1080,
      },
      {
        name: "ITIL Accredited Tool Vendor Assessor · by PeopleCert",
        src: "/selo-itil-v1.jpg",
        w: 587,
        h: 307,
      },
    ],
  },
  /** Captura real do Nexo. Fora de uso: o time vai fornecer prints melhores. */
  product: {
    src: "/nexo-deskmanager.jpg",
    alt: "Tela do Nexo aberta dentro do Desk Manager, com a abertura de requisição de compra e os agentes na navegação lateral",
    caption: "Nexo rodando dentro do Desk Manager",
  },
  /** O processo de compras de ponta a ponta (deck IAgentics_DeskManager_Promo,
   *  slide 3), com um print real por passo (slides 4-13). Substituiu o índice
   *  de agentes como seção principal da página em 2026-08-14. */
  fluxo: {
    /* "Nexo" em caixa mista de propósito (mesma regra do hero): caixa alta na
       string faz leitor de tela soletrar N-E-X-O. */
    titulo: "Processo de Compras no Nexo",
    lead: "Da requisição ao pedido no ERP: sete passos conduzidos pelos agentes do Nexo.",
    passos: [
      {
        n: "01",
        nome: "Abertura da Requisição de Compras",
        texto: "O chatbot MIA abre a RC a partir de uma descrição em linguagem natural — e a IA confere os dados antes de enviar para Compras.",
        src: "/nexo-print-rc-v2.png", w: 1917, h: 1078, inicio: 5.6,
      },
      {
        n: "02",
        nome: "Triagem e aprovação",
        texto: "A IA classifica por categoria, define a cadeia de aprovação por alçada e audita a requisição sozinha.",
        src: "/nexo-fluxo-triagem-v1.png", w: 1917, h: 1078, inicio: 21.6,
      },
      {
        n: "03",
        nome: "RFQ — seleção de fornecedores",
        texto: "A IA busca fornecedores na base cadastrada e novos na internet, e dispara a solicitação de cotação.",
        src: "/nexo-print-rfp-v2.png", w: 1917, h: 1078, inicio: 37.6,
      },
      {
        n: "04",
        nome: "Propostas via formulário web",
        texto: "Convite por link, sem senha e sem conta: o Portal do Fornecedor recebe proposta e anexo.",
        src: "/nexo-fluxo-portal-v1.jpg", w: 1568, h: 688, inicio: 46.6,
      },
      {
        n: "05",
        nome: "Negociação com suporte de IA",
        texto: "A IA lê os anexos, monta o mapa comparativo com scores e sugere a próxima mensagem de negociação.",
        src: "/nexo-fluxo-mapa-v1.jpg", w: 1568, h: 688, inicio: 55.6,
      },
      {
        n: "06",
        nome: "Seleção e aprovação final",
        texto: "A proposta vencedora é aprovada com nome e motivo registrados — a trilha fica no histórico.",
        src: "/nexo-fluxo-aprovacao-v1.jpg", w: 1568, h: 688, inicio: 65.6,
      },
      {
        n: "07",
        nome: "Pedido de compras no ERP",
        texto: "A OC nasce sozinha: RC, RFQ e proposta vencedora consolidadas, prontas para o ERP do cliente.",
        src: "/nexo-fluxo-oc-v1.jpg", w: 1568, h: 688, inicio: 72.6,
      },
    ],
    /** O passo a passo em vídeo (Nexo_Compras_v11_passo_a_passo, 2026-10-06)
     *  SUBSTITUIU os prints no palco do fluxo (pedido do Rodrigo, 2026-10-07).
     *  O `inicio` de cada passo acima é o segundo do vídeo em que o capítulo
     *  correspondente começa (medido quadro a quadro): o passo acende conforme
     *  o vídeo anda, e clicar num passo leva o vídeo até ele. Os `src` dos
     *  prints ficam como registro, mas não aparecem mais na página. */
    video: {
      legenda: "Passo a passo · 1min29 · 100 notebooks para o time de TI, da conversa com a MIA à ordem de compra",
      irPara: "Ver no vídeo:",
      src: "/nexo/nexo-passo-a-passo.mp4",
      label: "Vídeo do passo a passo do Nexo Compras: abertura, triagem, gestor, cotação, mapa, aprovação e ordem de compra.",
    },
  },
  /** Botões dos vídeos da /nexo (VideoVitrine). */
  controlesVideo: {
    pausar: "Pausar vídeo",
    continuar: "Continuar vídeo",
    ligarSom: "Assistir do começo com som",
    desligarSom: "Desligar o som",
  },
} as const;

/* ---------------------------------------------------------------------------
   ACADEMY

   Transcrito do DOM de www.iagentics.com.br/academy, não de um resumo.

   O hero de vocês é um CARROSSEL de três slides, cada um com título e subtítulo
   próprios. Ler a página uma vez só captura um deles - foi o que aconteceu na
   primeira versão desta seção, que ficou com o slide 1 achando que era o hero
   inteiro. Os três estão abaixo.

   Uma frase aqui era realmente minha e foi removida: o lead dos cursos. O texto
   de vocês é "Para profissionais que desejam ser protagonistas...".

   O que está aqui é texto. O site atual também tem marquees, dois carrosséis,
   um vídeo de fundo e uma imagem por curso - ver o levantamento entregue ao
   time em 10/08 e as decisões pendentes sobre cada um.
--------------------------------------------------------------------------- */

export const academy = {
  /**
   * Os três slides do carrossel do hero, observados ao vivo por 60s. Qual deles
   * vira o H1 desta página - ou se os três giram - é decisão do time; hoje a
   * página usa o slide marcado com `primary`.
   */
  hero: {
    /* Sem kicker: o time pediu para tirar "Trilhas em destaque". O título já diz
       o que a página é, e um kicker acima de um carrossel de três títulos era
       uma etiqueta que servia a só um deles. */
    slides: [
      {
        primary: false,
        headline: "Escola de experiências com IA",
        subtext:
          "Uma escola de negócio feita para despertar novos olhares, perspectivas, métodos e aplicabilidade imediata.",
      },
      {
        primary: true,
        headline: "IA onde o negócio precisa evoluir",
        subtext:
          "Fundamentos, Assistentes e Agentes de IA — trilhas práticas que saem do slide e entram na operação.",
      },
      {
        primary: false,
        headline: "Desenhe junto conosco a solução",
        subtext:
          "Cursos, imersões, palestras e mentorias sob medida para transformar pessoas, processos e negócios.",
      },
    ],
  },

  /**
   * Os três números da capa (9+ empresas, 5 áreas, 100% foco) saíram a pedido do
   * time, trocados por este CTA. O fato das 9 empresas não se perdeu: continua em
   * `clients.lead`, na faixa de clientes.
   *
   * O botão "Ver os cursos" saiu da capa a pedido (2026-08-14) - ficou só o
   * "Acessar plataforma"; a landing /cursos segue no nav.
   */
  platform: {
    label: "Plataforma online de cursos",
    /* Reescrito em 2026-08-28: a plataforma própria saiu e o que vem é a
       construída com o Pecege. O quadro continua na home porque a educação
       segue sendo oferta da casa — o que mudou é com quem. */
    body: "Em construção com o Pecege: formações de IA aplicada a Compras e Gestão de Gastos.",
    /**
     * O botão da plataforma. `appHref: null` = ainda sem endereço, e o botão
     * aparece desabilitado com a marca "em breve" em vez de fingir que leva a
     * algum lugar. Preencha aqui e ele vira link de verdade sozinho - mesmo
     * padrão dos quadros de mídia do /nexo.
     */
    appLabel: "Saiba mais",
    /* Aponta para /cursos, que desde 2026-08-28 é o aviso de "em breve" da
       parceria. O rótulo deixou de ser "Acessar plataforma" no mesmo dia: não
       há mais plataforma para acessar, e botão que promete o que não entrega
       gasta a confiança de quem clica. */
    appHref: "/cursos" as string | null,
  },

  /** Apoiadores. No site atual passam em marquee, repetidos 3x. */
  supporters: {
    kicker: "Apoiadores",
    title: "Empresas e instituições que acreditam em nós",
    logos: [
      { name: "Founders Club", src: "/academy/founders-club-logo.png", w: 600, h: 339 },
      { name: "Oracle", src: "/academy/oracle-logo.png", w: 600, h: 78 },
      { name: "Microsoft AI Cloud Partner", src: "/academy/microsoft-ai-cloud-partner.png", w: 600, h: 188 },
      { name: "Desk Manager", src: "/academy/deskmanager-logo.png", w: 600, h: 253 },
      { name: "Claude Partner Network", src: "/academy/claude-partner-network.png", w: 600, h: 232 },
      /* 600x215 depois de aparar: o arquivo original era 77% de margem branca, e
         sobre a placa branca isso fazia o Sebrae parecer menor que os outros. */
      { name: "Sebrae for Startups", src: "/academy/sebrae-for-startups.png", w: 600, h: 215 },
    ],
  },

  pillars: {
    kicker: "Nossos pilares",
    title: "Por que IAgentics Academy",
    items: [
      {
        name: "Tudo é coconstruído",
        body: "O ensino do futuro deve ser criado com todos.",
        list: null,
      },
      {
        name: "Fazemos o que falamos",
        body: "Trazemos a realidade para cada aula, pois lecionamos tudo aquilo que testamos e aplicamos em nosso dia a dia.",
        list: null,
      },
      {
        /* No site é uma LISTA de cinco itens, não um parágrafo. A primeira versão
           daqui juntou tudo numa frase só e perdeu a forma. */
        name: "Prazer em ensinar",
        body: null,
        list: [
          "Amar o que faz",
          "Amar o processo",
          "Amar pessoas",
          "Amar mudanças",
          "Amar a transformação",
        ],
      },
      {
        name: "100% prático",
        body: "Facilitamos o aprendizado através da andragogia e das melhores práticas educacionais.",
        list: null,
      },
    ],
  },

  /** As quatro frases que correm em marquee entre os pilares e "Para empresas". */
  manifesto: [
    "Transformamos aprendizagem em ação",
    "IA aplicada ao mundo corporativo",
    "Pessoas, processos & negócios",
    "Aplicabilidade imediata",
  ],

  enterprise: {
    kicker: "Para empresas",
    title: "Desenhe junto conosco a solução",
    cta: "Falar com um especialista",
  },

  formats: {
    kicker: "Formatos de experiência",
    title: "Uma experiência para transformar pessoas, processos & negócios",
    cta: "Quero saber mais sobre isso",
    items: [
      {
        name: "Cursos",
        body: "Conteúdos personalizados para áreas de negócio que desejam promover pessoas, processos e tecnologia com as melhores práticas e metodologias de vanguarda.",
      },
      {
        name: "Imersões",
        body: "São experiências imersivas e práticas que estimulam a criatividade, a colaboração e a inovação. Cocriar faz parte deste momento com nossos facilitadores e entusiastas da educação corporativa.",
      },
      {
        name: "Palestras",
        body: "Encontros com provocações, reflexões profundas e desejo genuíno de despertar da consciência. Momentos que conectam pessoas a pensamentos, sempre apresentando conteúdo de forma empática, envolvente, estimulando a atitude de fazer e mudar.",
      },
      {
        name: "Mentoria",
        body: "Programa especial para grupos de executivos e especialistas de diversas áreas de negócio que ajudam a tornar iniciativas em resultados reais ao negócio. Além disso, conseguimos entregar conhecimento em IA para que líderes consigam tomar decisões e dar sustentação ao negócio.",
      },
    ],
  },

  /**
   * Clientes. No site atual são logotipos correndo em marquee, sobre um vídeo de
   * fundo (empresas-bg.mp4, 1280x720, autoplay mudo em loop). Os logotipos foram
   * baixados do site de vocês e reduzidos a 600px de largura - eles rendem a
   * ~150px na tela, então mais que isso é peso sem ganho.
   */
  clients: {
    title:
      "Empresas que já transformaram suas equipes com a IAgentics Academy",
    lead: "Mais de 9 empresas e centenas de profissionais impactados",
    logos: [
      { name: "Tenda", src: "/academy/tenda.png", w: 600, h: 148 },
      { name: "Marluvas", src: "/academy/marluvas.png", w: 600, h: 96 },
      { name: "CTC", src: "/academy/ctc.png", w: 600, h: 334 },
      { name: "Santa Helena", src: "/academy/santa-helena.png", w: 600, h: 315 },
      { name: "Abreu & Silva", src: "/academy/abreu-silva.png", w: 600, h: 383 },
      { name: "Sebrae", src: "/academy/sebrae.png", w: 600, h: 424 },
      { name: "Britânia", src: "/academy/britania.png", w: 600, h: 600 },
    ],
  },

  courses: {
    kicker: "Portfólio de cursos",
    title: "Cursos em destaque",
    lead: "Para profissionais que desejam ser protagonistas e que sonham com um ensino diferente e envolvente.",
    cta: "Falar com um consultor",
    /** `tags` são as etiquetas do site. As fotos vieram de lá também, convertidas
     *  de PNG para JPEG: são fotografia, e em PNG pesavam ~2,5 MB cada contra
     *  ~130 KB agora, sem diferença visível no tamanho em que aparecem. */
    items: [
      {
        hours: "8 horas",
        mode: "OnDemand",
        tags: ["Iniciante", "OnDemand", "Negócios"],
        name: "Fundamentos de IA aplicado aos Negócios",
        image: "/academy/fundamentos-ia-negocios.jpg",
        body: "Base sólida em Inteligência Artificial com foco em aplicações reais no mundo corporativo.",
      },
      {
        hours: "6 horas",
        mode: "OnDemand",
        tags: ["Iniciante", "Copilot", "Prático"],
        name: "Fundamentos de IA com Copilot",
        image: "/academy/copilot-course.jpg",
        body: "Domine o Microsoft Copilot para acelerar tarefas do dia a dia com IA generativa.",
      },
      {
        hours: "16 horas",
        mode: "Presencial",
        tags: ["Intermediário", "Imersão", "Hands-on"],
        name: "Imersão de Assistentes de IA para Negócios",
        image: "/academy/imersao-assistentes-ia.jpg",
        body: "Crie assistentes de IA sob medida para aumentar a produtividade da sua equipe.",
      },
      {
        hours: "16 horas",
        mode: "Presencial",
        tags: ["Intermediário", "Dados", "Estratégia"],
        name: "Imersão de Análise de Dados com IA",
        image: "/academy/imersao-analise-dados-ia.jpg",
        body: "Transforme dados em decisões estratégicas com o poder da IA aplicada à análise.",
      },
      {
        hours: "20 horas",
        mode: "Híbrido",
        tags: ["Processos", "Lean", "Automação"],
        name: "Lean Thinking — do mapeamento à automação",
        image: "/academy/lean-thinking-course.jpg",
        body: "Mapeie processos, elimine desperdícios e automatize com IA seguindo princípios Lean.",
      },
      {
        hours: "20 horas",
        mode: "Presencial",
        tags: ["Liderança", "Digital", "Estratégia"],
        name: "Imersão de Transformação Digital nos Negócios",
        image: "/academy/transformacao-digital-course.jpg",
        body: "Lidere a jornada de transformação digital da sua empresa com metodologias de vanguarda.",
      },
      {
        hours: "12 horas",
        mode: "Presencial",
        tags: ["Inovação", "UX", "Criatividade"],
        name: "Design Thinking aplicado com IA",
        image: "/academy/design-thinking-ia-course.jpg",
        body: "Combine Design Thinking e IA para criar soluções centradas no usuário com mais velocidade.",
      },
      {
        hours: "16 horas",
        mode: "Presencial",
        tags: ["Compras", "Finanças", "IA"],
        name: "Imersão de Spend Management com IA",
        image: "/academy/spend-management-course.jpg",
        body: "Otimize gastos corporativos e a cadeia de suprimentos com agentes de IA especializados.",
      },
      {
        hours: "12 horas",
        mode: "OnDemand + Presencial",
        tags: ["Pessoas", "Produtividade", "Comportamento"],
        name: "Neurociência & Produtividade",
        image: "/academy/neurociencia-produtividade-course.jpg",
        body: "Como produzir com eficácia na tríade Pessoas, Processos e Tecnologia à luz da neurociência.",
      },
    ],
  },

  /**
   * Depoimentos REAIS e anônimos, entregues pelo time em 11/08/2026. Substituíram
   * três fictícios que vieram do site antigo e cujas empresas (Nova Vertent, Órion
   * Logística, Marlin Ventures) não existiam em nenhum material da IAgentics.
   *
   * Escolhidos entre oito por um critério: dizer O QUE MUDOU, não elogiar. Ficaram
   * de fora "Afetou de forma positiva", "Muito boa! Conteúdo de fácil acesso" e
   * "Oportunidades do amanhã para agora" - elogio e slogan, que qualquer curso
   * poderia receber. Também ficou de fora um depoimento forte que nomeia a empresa
   * (Nitro) e o projeto interno dela: não cabe numa seção anônima sem que alguém
   * confirme que a Nitro topa aparecer.
   *
   * EDIÇÃO: só erro de digitação evidente. No segundo, "na área de compras da foi"
   * perdeu o "da" solto. Nada mais foi tocado - inclusive o "diferencial" repetido
   * no primeiro, que é a voz de quem escreveu.
   *
   * A atribuição sai da própria fala: quem diz "a Imersão" é atribuído à Imersão,
   * quem diz "o curso de IA na área de compras" ao curso. Nenhum cargo inventado.
   */
  testimonials: {
    kicker: "Quem já aprendeu com a gente",
    title: "Quem aprendeu conosco, vira fã",
    items: [
      {
        quote:
          "A Imersão mostrou como a IA aplicada a compras pode fazer com que a área funcione de uma forma muito mais automatizada, entretanto o maior diferencial foi a ênfase de que o diferencial está no conhecimento do profissional, e não necessariamente na IA utilizada.",
        role: "Participante · Imersão",
      },
      {
        quote:
          "Participar do curso de IA na área de compras foi uma experiência extremamente enriquecedora. O conteúdo é prático, atual e totalmente alinhado com a realidade de quem atua em suprimentos. Saio do curso com uma nova mentalidade, mais preparado(a) para inovar e gerar valor na área de compras.",
        role: "Participante · Curso de IA em Compras",
      },
      {
        quote:
          "Com a Imersão ficou bem mais claro como posso aplicar IA na rotina de compras de forma simples e eficaz.",
        role: "Participante · Imersão",
      },
    ],
  },

  /**
   * O depoimento em vídeo da Gabriela Junqueira, Head de Compras na Santa Helena
   * (gravado em 2026-08-29, 2min30, vertical). Fica na faixa de clientes, e a
   * Santa Helena já está entre os logotipos que correm ali — o vídeo põe rosto e
   * nome em cima de um logotipo que o visitante acabou de ver passar.
   *
   * É O ÚNICO DEPOIMENTO NOMEADO. Os três de `testimonials` são anônimos de
   * propósito, e continuam. A diferença não é hierarquia: é que uma pessoa
   * identificável falando com o rosto na câmera pesa diferente de uma frase sem
   * dono, e por isso ele vem primeiro e maior, com os anônimos abaixo.
   *
   * AS LEGENDAS DESTE VÍDEO ESTÃO QUEIMADAS NA IMAGEM — o arquivo chegou assim,
   * de uma edição para redes. Isso resolve para quem enxerga e não resolve para
   * máquina nenhuma, então a transcrição vai em TEXTO na página. Não colocamos
   * `<track>`: as legendas do navegador apareceriam por cima das gravadas, duas
   * camadas do mesmo texto na mesma tela. É o oposto da escolha do convite, onde
   * o arquivo não tinha legenda e o VTT era o jeito certo.
   */
  depoimento: {
    eyebrow: "Depoimento",
    nome: "Gabriela Junqueira",
    cargo: "Head de Compras",
    empresa: "Santa Helena",
    /* Verbatim, a primeira frase do vídeo — ela abre dizendo exatamente o que o
       resto dos 2min30 sustenta. */
    citacao:
      "Realmente é um treinamento que transforma e que foi construído dentro da nossa necessidade.",
    duracao: "Vídeo · 2 min 30",
    src: "/academy/depoimento-gabriela.mp4",
    poster: "/academy/depoimento-gabriela-poster.jpg",
    label:
      "Depoimento em vídeo de Gabriela Junqueira, Head de Compras na Santa Helena, com 2 minutos e 30 segundos e legendas gravadas na imagem",
    transcricaoLabel: "Ler a transcrição",
    notaTranscricao:
      "Transcrição gerada por reconhecimento de fala, com os nomes próprios revisados. As legendas deste vídeo estão gravadas na imagem.",
    transcricao: [
      "Realmente é um treinamento que transforma e que foi construído dentro da nossa necessidade. Eu tive o prazer de conhecer os meninos da IAgentics num treinamento aprofundado para compras, que foi incrível. E dali pra frente passei a ter bastante contato ali com Rodrigo, com Vinícius.",
      "Eu tava começando um desafio aqui na Santa Helena, como head da área de suprimentos. E quando fiz o meu mapeamento, meu diagnóstico aqui da área, eu entendi que eu precisava trabalhar a parte de formação dos meus compradores com um olhar mais estratégico — um time que tava muito focado em emitir pedido. Meu time aqui brincava que era a padaria, achava que tinha que sair na hora ali a compra, e não tinha um olhar estratégico para como entregar isso de forma melhor para a empresa.",
      "Nesse contexto, o Vinícius veio para dar uma trilha de formação para os nossos compradores, que tá só começando e que a gente já tá colhendo os benefícios. A gente tá desenvolvendo toda a parte de procedimento da área, documentando os procedimentos para poder otimizar os nossos processos e facilitar a forma como a gente trabalha no dia a dia. A gente tá contratando sistemas, o time tá trabalhando em projetos maiores, mais estratégicos, já com entregas de resultados muito bons em termos de redução de custo.",
      "Tudo muito direcionado nessa primeira conversa que a gente teve com o Vinícius. Foi um dia de treinamento, de seis dias que a gente ainda tem pela frente, e já tá sendo transformador. É o reconhecimento para o time, da gente tá investindo no desenvolvimento deles, e como que isso vai impactar também a empresa.",
      "Eu acho que uma coisa muito legal do treinamento foi trazer para a prática: como que o que a gente tá aprendendo aqui a gente leva para a transformação na prática, porque não adianta nada a gente ter o conceito e não trazer para o dia a dia. O Vinícius fez todo um processo de mapeamento, de conhecer cada um dos compradores para entender a necessidade, os pontos de oportunidade de desenvolvimento, e trabalhou a trilha em cima disso, alinhada comigo, para que a gente pudesse gerar o melhor resultado para a empresa e entregar algo que fizesse sentido, e não algo de prateleira. Foi realmente pensado e desenvolvido para a nossa necessidade.",
      "Obrigada, meninos. E se precisarem trocar ideia aí, os novos clientes que tiverem interesse em contratar, estou à disposição para conversar também.",
    ],
  },

  /** Os quatro artigos ainda não têm destino neste site - falta o blog. */
  articles: {
    kicker: "Degustação livre",
    title: "Ideias para aplicar amanhã",
    cta: "Mais artigos",
    items: [
      { tag: "IA aplicada", name: "3 padrões de agentes que já funcionam em Compras" },
      { tag: "Liderança", name: "Como preparar sua liderança para a era da IA" },
      { tag: "Operações", name: "Do piloto ao processo: escalando IA sem drama" },
      { tag: "Cultura", name: "Aprendizagem contínua: o novo diferencial competitivo" },
    ],
  },

  closing: {
    title: "Quer falar com a gente?",
    body: "A gente está à disposição pra conversar, ouvir suas ideias e te ajudar a descobrir o curso ou experiência perfeita para você, sua empresa ou sua equipe.",
    quote:
      "Acreditamos que um bom café e uma boa conversa iluminam as possibilidades",
  },

  /** Perguntas e respostas da lâmina "IAgentics Academy" do deck
   *  IAgentics_Clientes_V3.pptx. Mesmas regras do FAQ do Nexo: resposta que se
   *  sustenta sozinha, em uma ou duas frases, sem accordion. */
  /**
   * O convite em vídeo (2026-09-09). Gravação de 7min31 em que a escola se
   * apresenta: a pergunta que abre ("quanto custa não ter conhecimento?"), o
   * método co-construído com RH e liderança, os formatos, os clientes e o
   * convite para conversar.
   *
   * Fica LOGO ABAIXO DA CAPA desde 2026-09-09, a pedido do Rodrigo — logo
   * depois da faixa da plataforma online, que é o último bloco do hero. Ele
   * nasceu colado ao contato porque termina literalmente com "contate a gente";
   * esse encaixe foi trocado pela primeira dobra. O custo de subir sete minutos
   * e meio é competir com as seções que dizem o mesmo em texto escaneável, e o
   * que o compensa é `preload="none"`: quem só varre a página não baixa um byte
   * do vídeo.
   *
   * TOCA A 1,25× POR PADRÃO, a pedido do Rodrigo. O arquivo continua com 7min31
   * de mídia; o visitante gasta ~6min01. Nem esse número nem a velocidade
   * aparecem na tela — o Rodrigo pediu as duas linhas fora em 2026-09-09, junto
   * com a nota das legendas. Quem quiser 1× troca no menu do próprio player, e
   * quem quiser o tempo devolvido à página tem só que devolver `duracao` aqui e
   * a linha correspondente em Convite.tsx.
   *
   * O TÍTULO É O QUE SOBROU DIZENDO O TAMANHO: "em seis minutos". Sem a linha
   * de duração, e com `preload="none"` fazendo o controle mostrar "0:00" até
   * alguém apertar play, ele é a única pista de quanto o vídeo dura antes do
   * clique. Quem mexer no título, saiba que está mexendo nisso também.
   */
  convite: {
    eyebrow: "Convite",
    titulo: "A escola, em seis minutos",
    lead: "Como a IAgentics Academy monta um programa com a sua empresa: o diagnóstico com RH e liderança, os formatos que saem disso, e o que acontece depois da aula.",
    /* O player nasce nesta velocidade; o visitante pode trocar no menu dele. */
    velocidade: 1.25,
    src: "/academy/academy-convite.mp4",
    poster: "/academy/academy-convite-poster.jpg",
    legendas: "/academy/academy-convite.vtt",
    label: "Convite em vídeo da IAgentics Academy, 7 minutos e 31 segundos, com legendas em português",
  },

  faq: {
    eyebrow: "Perguntas frequentes",
    titulo: "O que perguntam sobre a Academy",
    itens: [
      {
        pergunta: "Para quem é a IAgentics Academy?",
        resposta:
          "A Academy é uma escola de negócios para quem precisa de resultados imediatos com IA no dia a dia: lideranças e C-level, times de negócio e operação, empresas sem estrutura de dados madura e orçamentos enxutos.",
      },
      {
        pergunta: "Precisamos ter uma estrutura de dados madura para começar?",
        resposta:
          "Não. Empresas sem estrutura de dados madura estão entre o público da Academy — os programas conectam estratégia, cultura e ferramenta prática, sem exigir uma base pronta.",
      },
      {
        pergunta: "O que a Academy ensina, na prática?",
        resposta:
          "Fundamentos de IA aplicados ao negócio, análise de dados com IA, automações com assistentes e agentes de IA, uso seguro e governança, e cultura e gestão da mudança.",
      },
      {
        pergunta: "Em quais formatos a capacitação acontece?",
        resposta:
          "Da imersão executiva à capacitação de times inteiros: trilhas in company, workshops práticos, plataforma online e mentoria executiva.",
      },
      {
        pergunta: "A formação termina em teoria ou em algo aplicado?",
        resposta:
          "Toda trilha termina em projeto aplicado — a Academy existe para quem precisa de resultado no dia a dia, não de conteúdo para assistir.",
      },
      {
        pergunta: "Dá para estudar sem contratar uma trilha para a empresa?",
        resposta:
          "Sim. A plataforma online é um dos formatos da Academy: assinatura mensal com acesso a todo o acervo de formações, no seu ritmo e com certificado ao concluir.",
      },
    ],
  },
} as const;

/* ---------------------------------------------------------------------------
   IA SPEND LAB

   Transcrito do DOM de www.iagentics.com.br/academy/ai-spend-lab. As palavras
   são as de vocês.

   Uma correção de semântica: no site atual o <h1> é "IA Spend Lab" e a frase
   "Implemente IA com Mente, Método e Cultura" não é cabeçalho nenhum. Aqui o
   nome do produto virou kicker e a frase virou o h1 - é ela que diz o que a
   página oferece, e é ela que um buscador precisa ler.

   O hero NÃO gira: observado por 45s, um título só.
--------------------------------------------------------------------------- */

export const spendLab = {
  hero: {
    kicker: "IA Spend Lab",
    headline: "Implemente IA com Mente, Método e Cultura",
    subtext:
      "Uma solução da IAgentics Academy que combina aprendizagem, consultoria, diagnóstico de maturidade e formação aplicada para usar IA com propriedade, governança e resultados.",
    ctaPrimary: "Diagnose de maturidade de IA",
    ctaSecondary: "Fale conosco",
    /** O lockup da Academy fica acima do H1 no site de vocês: o Spend Lab é um
     *  produto da Academy, e a capa diz isso antes de dizer qualquer outra coisa. */
    logo: "/spend-lab/academy-lockup.png",
    /** Decorativo, em loop mudo atrás do véu. Medido no site de vocês: este vídeo
     *  está em y=-25, ACIMA do h1 - é mesmo o cabeçalho, não outra seção. */
    videoSrc: "/spend-lab/ai-spend-lab-header-video.mp4",
    videoPoster: "/spend-lab/ai-spend-lab-header-poster.jpg",
  },

  /** Os quatro pilares. Aqui a numeração diz algo verdadeiro: é uma sequência. */
  pillars: {
    title: "IA é um pilar da Transformação Digital",
    items: [
      { name: "Diagnose & Maturidade", body: "Entrevistas, questionários e visão estratégica do negócio" },
      { name: "Design & Mapeamento", body: "Fluxos, procedimentos, desperdícios e Cultura" },
      { name: "Transformação Digital", body: "Dados, repositórios, modelos estatísticos e novos processos" },
      { name: "AI First", body: "Automação, mentoria, assistências e formação" },
    ],
  },

  syllabus: {
    kicker: "Ementa",
    title: "O que você aprende nas 8 semanas",
    lead: "Cada semana combina aula ao vivo, mentoria individual e entrega concreta aplicada ao seu contexto real.",
    items: [
      {
        name: "Diagnóstico de maturidade e governança de IA",
        body: "Avaliar o estágio atual de IA na sua empresa: usos ativos, riscos operacionais, nível de literacia do time e prontidão cultural.",
        deliverable: "Diagnóstico de maturidade em IA",
      },
      {
        name: "Inventário e critério de ferramentas e riscos",
        body: "Mapear e classificar ferramentas em uso, identificar duplicidades, avaliar custo, risco jurídico e critérios de adoção responsável.",
        deliverable: "Inventário e critérios de ferramentas",
      },
      {
        name: "Casos de uso e priorização de valor",
        body: "Selecionar iniciativas de IA com maior potencial de ROI, alinhadas à estratégia e à capacidade de execução do time.",
        deliverable: "Portfólio priorizado de casos de uso",
      },
      {
        name: "Dados, prompts e engenharia de contexto",
        body: "Estruturar bases de dados, bibliotecas de prompts e padrões de contexto para uso consistente e seguro da IA.",
        deliverable: "Biblioteca de prompts e padrões",
      },
      {
        name: "Automação de fluxos e agentes de IA",
        body: "Desenhar e implementar agentes e automações que resolvem gargalos reais dos processos e áreas de negócio.",
        deliverable: "Piloto de agente ou automação",
      },
      {
        name: "Métricas, ROI e governança contínua",
        body: "Definir indicadores, políticas de uso, comitês e ritos que sustentam a adoção de IA com segurança e resultado.",
        deliverable: "Painel de métricas e política de uso",
      },
      {
        name: "Cultura, capacitação e liderança em IA",
        body: "Formar lideranças e times para atuar com IA no dia a dia, com mentalidade experimental e responsabilidade.",
        deliverable: "Plano de capacitação e comunicação",
      },
      {
        name: "Roadmap 12 meses e plano de escala",
        body: "Consolidar aprendizados em um roadmap acionável de IA para os próximos 12 meses, com metas e responsáveis.",
        deliverable: "Roadmap de IA 12 meses",
      },
    ],
  },

  /**
   * "Veja o IA Spend Lab na prática" - a seção que faltava.
   *
   * Eu tinha apontado esta seção para o vídeo do cabeçalho, o que era errado: no
   * site de vocês ela carrega OUTRO vídeo, um embed do Google Drive com 2min37 de
   * apresentação falada, legendas queimadas e áudio. Baixei o arquivo (452 MB de
   * master em 4K) e recomprimi para 720p, 16 MB.
   *
   * Este NÃO toca sozinho. Os outros vídeos do site são decoração muda em loop;
   * este é conteúdo com narração, e vídeo com voz que começa sem ser pedido é
   * hostil. Vai com controles, poster e preload="none": zero byte até alguém
   * apertar o play.
   */
  practice: {
    title: "Veja o IA Spend Lab na prática",
    lead: "Método, governança e cultura: entenda como transformamos o uso de IA na sua empresa em resultado mensurável.",
    src: "/spend-lab/spend-lab-na-pratica.mp4",
    poster: "/spend-lab/spend-lab-na-pratica-poster.jpg",
    label: "Apresentação do IA Spend Lab em vídeo, 2 minutos e 37 segundos",
  },

  partners: {
    title: "Parceiros que fomentam e agregam",
    logos: [
      { name: "Desk Manager", src: "/spend-lab/deskmanager.png", w: 600, h: 253 },
      { name: "Claude Partner Network", src: "/spend-lab/claude-partner-network.png", w: 600, h: 232 },
      { name: "Microsoft AI Cloud Partner", src: "/spend-lab/microsoft.png", w: 600, h: 600 },
      { name: "Oracle", src: "/spend-lab/oracle.png", w: 600, h: 78 },
    ],
  },

  method: {
    title: "Como funciona IA Spend Lab?",
    cta: "Quero o diagnóstico",
    items: [
      { name: "Diagnóstico de maturidade de IA", body: "Avaliar a situação atual da aplicabilidade de IA em sua empresa, entendendo os recursos utilizados, riscos existentes, nível de conhecimento do Capital Humano e custeios gerais." },
      { name: "Políticas e Procedimentos", body: "Desenvolver uma política com boas práticas descrevendo o que deve ser usado, o que não deve ser usado, responsáveis e procedimentos de aplicação." },
      { name: "Formação e Cultura AI First", body: "Desenhar trilhas de aprendizagem por áreas de negócio que realmente promova a adoção com senso de pertencimento e governança." },
      { name: "Ferramentas e Riscos", body: "Mapear e classificar ferramentas em uso, identificar duplicidades, avaliar custos, riscos jurídicos e critérios de adoção responsável." },
      { name: "Comitê de Priorização", body: "Criar critérios para definir as iniciativas a serem priorizadas com o nível de viabilidade, nível de esforço, nível de risco e nível de alinhamento estratégico." },
      { name: "Mentoria de implantação de cases", body: "Promover mentoria para as iniciativas reais de IA oriundas do comitê de priorização e da formação nas trilhas de aprendizagem." },
      { name: "Roadmap 100 dias com IA", body: "Transformar aprendizados em plano de execução das iniciativas de IA com cronograma, responsáveis e indicadores de performance." },
      { name: "Summit IA – Pitch de Projetos & Resultados", body: "Consolidar os projetos priorizados numa apresentação executiva aos stakeholders." },
    ],
  },

  /** A tabela comparativa - o argumento de venda mais direto da página. */
  comparison: {
    title: "Começamos pelo contexto, processos e pessoas.",
    subtitle: "Ferramenta é importante, mas método é essencial.",
    columnA: "Formatos existentes",
    columnB: "IA Spend Lab",
    rows: [
      ["Treinamento genérico de ferramentas", "Formação personalizada aplicada a área de negócio"],
      ["Pilotos iniciados sem continuidade", "Continuidade de iniciativas válidas"],
      ["Uso individual e sem governança", "Governança e política para prática coletiva"],
      ["Foco em prompt e cases de outras empresas", "Foco nos desafios e dificuldades"],
      ["Engajamento inicial", "Motivação não se perde, assistimos até o fim"],
    ],
  },

  audience: {
    title: "Nasceu pra quem o IA Spend Lab",
    lead: "Áreas que precisam obter consciência e que precisam implementar método de aplicação da IA sem improviso",
    items: [
      "Gente & T&D",
      "TI & TD",
      "Finanças, Gestão de Gastos & Suprimentos",
      "Áreas de Negócios",
      "Liderança & Executivos",
    ],
  },

  closing: {
    title: "Quer falar com a gente?",
    body: "A gente está a disposição pra conversar, ouvir suas ideias e te ajudar a descobrir a forma ou a experiência perfeita para você, sua empresa ou sua equipe.",
    quote: "Acreditamos que um bom café e uma boa conversa ilumina as possibilidades",
  },

  /** Perguntas e respostas da lâmina "IA Spend Lab" do deck
   *  IAgentics_Clientes_V3.pptx (as três frentes: diagnóstico, consultoria
   *  aplicada e formação aplicada). Mesmas regras dos outros FAQs. */
  faq: {
    eyebrow: "Perguntas frequentes",
    titulo: "O que perguntam sobre o IA Spend Lab",
    itens: [
      {
        pergunta: "Por onde começa um projeto do IA Spend Lab?",
        resposta:
          "Pelo diagnóstico de maturidade: mapeamento de processos, avaliação da qualidade e disponibilidade dos dados e da prontidão de time e tecnologia, com entrega de um relatório de quick wins priorizados.",
      },
      {
        pergunta: "Como o IA Spend Lab escolhe onde aplicar IA primeiro?",
        resposta:
          "Os casos de uso são desenhados por ROI e organizados num roadmap de implantação por ondas — começa pelo que paga a conta mais rápido, não pelo que é mais bonito de demonstrar.",
      },
      {
        pergunta: "Quem cuida das regras de uso e da governança da IA?",
        resposta:
          "O IA Spend Lab entrega um modelo de governança e políticas de uso junto com a implantação, porque uso seguro é parte do método, não um anexo no fim do projeto.",
      },
      {
        pergunta: "Como saber se a implantação deu resultado?",
        resposta:
          "O projeto define indicadores de economia e produtividade — o resultado é medido nos números da operação, não na percepção do time.",
      },
      {
        pergunta: "O que acontece depois que a IA entra em operação?",
        resposta:
          "Vem a formação aplicada: capacitação hands-on por perfil, playbooks e prompts de compras, acompanhamento pós-implantação e evolução contínua dos agentes.",
      },
      {
        pergunta: "O IA Spend Lab é consultoria ou treinamento?",
        resposta:
          "Os dois, na mesma frente: diagnóstico e consultoria aplicada desenham o caminho, e a formação coloca o time de suprimentos operando com IA no dia a dia.",
      },
    ],
  },
} as const;

export const contact = {
  headline: "Vamos conversar",
  lead: "Conte onde o time de suprimentos perde mais tempo hoje. Respondemos com um próximo passo concreto.",
  /* WhatsApp PRIMEIRO (2026-08-19): o Search Console mostrou três das oito
     consultas do período procurando telefone ("tem algum telefone", "preciso
     telefone") — chegava gente querendo falar agora e o site só oferecia
     formulário. O texto do link já vai preenchido para sabermos que a conversa
     veio do site. */
  social: [
    { label: "WhatsApp", href: "https://wa.me/5515998714091?text=Ol%C3%A1%21%20Vim%20pelo%20site%20da%20IAgentics." },
    { label: "LinkedIn", href: "https://www.linkedin.com/company/iagentics/" },
    { label: "Instagram", href: "https://www.instagram.com/iagentics/" },
  ],
  /** O número em forma legível, para quem prefere ligar ou salvar o contato. */
  whatsapp: { label: "WhatsApp", numero: "(15) 99871-4091" },
  form: {
    name: { label: "Nome", placeholder: "Como podemos te chamar" },
    email: { label: "E-mail corporativo", placeholder: "voce@suaempresa.com.br" },
    company: { label: "Empresa", placeholder: "Nome da empresa" },
    message: {
      label: "Onde o time perde mais tempo",
      placeholder: "Cotações, contratos, análise de gastos, homologação de fornecedores",
      helper: "Quanto mais específico, mais direto conseguimos responder.",
    },
    submit: "Vamos conversar",
    sending: "Enviando",
    success: "Mensagem recebida. Retornamos em até um dia útil.",
    errors: {
      name: "Informe seu nome.",
      email: "Informe um e-mail válido.",
      message: "Conte brevemente onde o time perde tempo hoje.",
      submit: "Não foi possível enviar agora. Tente novamente em instantes.",
    },
  },
} as const;

export const footer = {
  note: "Agentes de IA para Compras e Gestão de Gastos.",
} as const;

/* ---------------------------------------------------------------------------
   ARTIGOS

   O corpo de cada artigo NÃO mora aqui — mora em `content/artigos/*.md`, e a
   regra de "toda string visível em content.ts" continua valendo para o que ela
   sempre cobriu: a copy da interface. Texto longo autoral é outra categoria de
   conteúdo, tem ciclo de revisão próprio e ganha diff legível em arquivo
   separado.

   O que está aqui é a moldura: título da listagem, rótulos e estado vazio.
--------------------------------------------------------------------------- */

/** Explicações animadas dentro dos artigos (2026-10-07, pedido do Rodrigo,
 *  estilo "explainer" do prompt-motion.com). Entram no corpo pelo marcador
 *  `<!-- explicador:<id> -->` no markdown. O texto de cada passo é texto de
 *  verdade na página: buscador e leitor de tela leem tudo, a animação só
 *  acende um passo de cada vez. */
export const explicadores = {
  pausar: "Pausar explicação",
  continuar: "Continuar explicação",
  mapaDeCotacao: {
    titulo: "Mapa de cotação em 30 segundos",
    rotuloPasso: (n: number, total: number) => `${n} de ${total}`,
    passos: [
      "Tudo começa numa requisição: três itens, com quantidade.",
      "Cada fornecedor responde a mesma lista. Quem não tem o item deixa em branco.",
      "O mapa põe as propostas lado a lado e destaca o melhor preço de cada linha.",
      "Só o fornecedor C cotou tudo: R$ 500.280. O melhor de cada linha soma R$ 485.280, R$ 15.000 a menos.",
      "Preço não decide sozinho: o prazo entra no mapa, e o motivo da escolha fica registrado.",
    ],
    colunas: { item: "Item", qtd: "Qtd", fornecedores: ["Fornecedor A", "Fornecedor B", "Fornecedor C"] },
    itens: [
      { nome: "Notebook 14\"", qtd: "100", precos: ["4.380", "4.410", "4.520"], melhor: 0 },
      { nome: "Monitor 24\"", qtd: "40", precos: ["899", "—", "872"], melhor: 2 },
      { nome: "Dock USB-C", qtd: "40", precos: ["—", "310", "335"], melhor: 1 },
    ],
    totais: { rotulo: "Total cotado", valores: ["R$ 473.960", "R$ 453.400", "R$ 500.280"], completo: 2, nota: "cotou todos os itens" },
    combinacao: { rotulo: "Melhor de cada linha", valor: "R$ 485.280", economia: "R$ 15.000 a menos que o único fornecedor completo" },
    prazo: { rotulo: "Prazo", valores: ["15 dias", "7 dias", "25 dias"] },
    motivo: "Motivo registrado: o monitor do fornecedor C chega em 25 dias e cabe no prazo da RC, de 30.",
    notaUnidade: "Preços unitários em R$.",
  },
} as const;

export const artigos = {
  /* `meta` é o que vai para <title> e <meta description>; `hero.titulo` é o
     H1 na tela, e os dois NÃO são a mesma coisa. Na página, "Artigos" basta:
     a pessoa já sabe onde está. No resultado de busca ela não sabe, e foi por
     isso que o Bing marcou os dois como curtos em 2026-09-14. */
  meta: {
    titulo: "Artigos sobre IA aplicada a Compras",
    descricao:
      "Textos sobre IA aplicada a Compras: processo, análise de gastos, tail spend, ROI e governança. O que aprendemos implantando, sem promessa que não se sustenta.",
  },
  hero: {
    eyebrow: "IAgentics",
    titulo: "Artigos",
    lead: "O que aprendemos implantando IA em Compras — processo, análise de gastos e governança, sem promessa que não se sustenta.",
  },
  rotulos: {
    /* "3 min de leitura" — o número vem calculado do próprio texto. */
    leitura: "min de leitura",
    por: "por",
    voltar: "Todos os artigos",
    publicadoEm: "Publicado em",
  },
  /* A listagem só é linkada quando existe artigo publicado, então este texto
     é rede de segurança: se alguém chegar por URL direta antes da primeira
     publicação, encontra uma frase honesta em vez de uma página em branco. */
  vazio: "Ainda não há artigos publicados. Em breve.",
} as const;

/**
 * Fotografia: Pexels (licença livre, atribuição não obrigatória).
 * Registrada aqui para rastreabilidade, e deliberadamente NÃO exibida como legenda
 * decorativa sobre as imagens.
 *   /hero-operations.jpg ... Angelyn Sanjorjo
 *   /agent-contratos.jpg ... Biekir Litovchenko
 *   /academy-formacao.jpg .. Yan Krukau
 *   /agent-spend.jpg ....... Yan Krukau
 */
export const photoCredits = [
  { file: "/hero-operations.jpg", photographer: "Angelyn Sanjorjo", source: "Pexels" },
  { file: "/agent-contratos.jpg", photographer: "Biekir Litovchenko", source: "Pexels" },
  { file: "/academy-formacao.jpg", photographer: "Yan Krukau", source: "Pexels" },
  { file: "/agent-spend.jpg", photographer: "Yan Krukau", source: "Pexels" },
] as const;

/* ---------------------------------------------------------------------------
   PÁGINA DE PRODUTO DO NEXO (/nexo)

   Os slots de mídia abaixo estão RESERVADOS. Para publicar um asset real, basta
   preencher `src` - o componente MediaSlot troca sozinho do quadro reservado para
   a imagem ou o vídeo. Nenhum componente precisa ser editado.

   Origem do conteúdo: IAgentics_Clientes_V2.pptx (slide 5) para a entrega embarcada
   e os 5 agentes; IAgentics_Presentation 2026.pptx (slides 6 a 9) para diferenciais,
   os 4 passos e os dois casos. Os números dos casos são da própria apresentação de
   vocês - confirmem antes de publicar.
--------------------------------------------------------------------------- */

export const nexoPage = {
  /** Vídeo comercial logo depois da capa (Nexo_Compras_v11_Comercial_60s,
   *  2026-10-06). Título com as palavras do próprio vídeo. */
  videoComercial: {
    eyebrow: "Nexo Compras em 1 minuto",
    titulo: "Peça. Cote. Autorize.",
    lead: "A compra inteira em um minuto: o pedido feito em conversa com a MIA, a cotação respondida como no Excel e a aprovação pela faixa de valor. Ninguém aprova a própria demanda.",
    src: "/nexo/nexo-comercial.mp4",
    label: "Vídeo comercial do Nexo Compras, com um minuto de duração.",
  },
  differentiators: {
    title: "Por que o Nexo é diferente",
    items: [
      {
        title: "Roda dentro do seu ambiente",
        body: "Os agentes operam no Desk Manager que sua empresa já usa. Não é mais um sistema para o time aprender.",
      },
      {
        title: "Dados sensíveis não saem",
        body: "As informações permanecem no servidor da sua empresa durante toda a operação dos agentes.",
      },
      {
        title: "Integra ao que já existe",
        body: "Conecta ao ERP e ao e-procurement em uso, sem reescrever a operação de suprimentos.",
      },
      {
        title: "Vertical em Compras",
        body: "Construído para requisição, cotação, gastos, fornecedores e contratos. Não é um assistente genérico.",
      },
    ],
  },

  steps: {
    title: "Como começamos",
    lead: "Da primeira conversa à operação em quatro passos.",
    closing: "Semanas, não anos. Sem reescrever a operação da empresa.",
    items: [
      { name: "Diagnóstico", body: "Mapeamos onde o tempo se perde hoje." },
      { name: "Configuração", body: "Desenhamos os agentes sob medida." },
      { name: "Integração", body: "Conectamos aos sistemas atuais." },
      { name: "Operação", body: "Os agentes assumem e passam a gerar dados." },
    ],
  },

  results: {
    title: "Resultados em produção",
    /** Números da apresentação da IAgentics. Confirmar antes de publicar. */
    items: [
      {
        metric: "−50%",
        unit: "no ciclo de contratos",
        client: "Indústria química brasileira",
        area: "Compras e Jurídico",
        before: "Conferência manual de contratos com centenas de fornecedores.",
        after:
          "O agente revisa e sinaliza cláusulas, analisa riscos pela política interna e sugere melhorias.",
      },
      {
        metric: "−90%",
        unit: "do tempo na análise de gastos",
        client: "Indústria de alimentos brasileira",
        area: "Compras",
        before: "Relatório mensal revisando mais de 10 mil linhas em planilha.",
        after:
          "O agente classifica as linhas por categoria no modelo UNSPSC e aprende com o feedback do time.",
      },
    ],
  },

  /* ------------------------------------------------------------------------
     Fase 1 do alinhamento ao pitch Hacktown (docs/PLANO-ALINHAMENTO-PITCH.md).
     Três blocos novos, verbatim dos slides 5, 6 e 8–11. Nasceram em /preview/nexo
     para aprovação do Rodrigo e viraram a /nexo oficial em 2026-09-04.
     ------------------------------------------------------------------------ */

  /**
   * Capa (oficial desde 2026-09-04; nasceu como prévia a pedido do Rodrigo:
   * "o mapa do orquestrador com layout e animação similar à home, na hero, e o
   * texto refletindo o orquestrador, não só o módulo de Compras").
   *
   * A headline é o título do slide 5, em duas linhas como a da home; o subtexto
   * é composto só com fatos do pitch (nove módulos, governança, ambiente do
   * cliente); a linha de plataforma é a Camada 3 do slide 6.
   */
  hero: {
    headline: ["Nexo orquestra", "toda a gestão de gastos"],
    /* 22 palavras. Teto da hero é 20; aqui a marca entra na frase e vale a
       exceção — sem "Nexo" no subtexto a headline seria a única menção. */
    subtext:
      "Nove módulos de agentes de IA, de Compras a Orçamento, operando dentro do ambiente da sua empresa — com governança, segurança e gestão dos dados.",
    platform: "Entrega embarcada, integrada ao ERP do cliente. Certificação ISO/IEC 27001.",
    ctaSecundario: "Ver na prática",
    /* O que o leitor de tela recebe pelo grafo inteiro. */
    grafoAlt: "Nexo, o orquestrador, conectado aos nove módulos: Compras, Gestão de Ativos, Spend Logístico, Spend via NF, Contas a Pagar, Benchmark de Preços Varejo, Orçamento, Contratos e Homologação de Fornecedores.",
  },

  /** Slide 5: Nexo no centro, NOVE módulos ao redor. `compras` aponta para o
   *  fluxo que a página já conta (#fluxo-compras) em vez de repeti-lo — foi o
   *  Rodrigo quem lembrou que "Compras" é o Nexo Compras atual. Os demais não
   *  têm descrição no pitch e entram só com nome, como no slide. */
  orquestrador: {
    eyebrow: "A plataforma",
    titulo: ["Nexo orquestra", "toda a gestão de gastos"],
    centro: { nome: "Nexo", papel: "Orquestrador" },
    modulos: [
      { id: "compras", nome: "Compras", href: "#fluxo-compras" },
      { id: "ativos", nome: "Gestão de Ativos" },
      { id: "logistico", nome: "Otimização Spend Logístico", href: "#na-pratica-logistico" },
      { id: "nf", nome: "Spend via dados da NF", href: "#na-pratica-nf" },
      { id: "contas", nome: "Contas a Pagar" },
      { id: "varejo", nome: "Benchmark de Preços Varejo", href: "#na-pratica-varejo" },
      { id: "orcamento", nome: "Orçamento", href: "#na-pratica-orcamento" },
      { id: "contratos", nome: "Contratos" },
      { id: "homologacao", nome: "Homologação Fornecedores" },
    ],
  },

  /** Slide 6: as três camadas do Nexo Compras. */
  camadas: {
    eyebrow: "Como o Nexo é construído",
    titulo: "Três camadas",
    itens: [
      {
        numero: "Camada 1",
        nome: "Agentes",
        /* Reescrito em 2026-09-04 a pedido do Rodrigo: a versão anterior
           listava os cinco agentes do Nexo Compras (RC, RFP, Contratos,
           Onboarding, Spend) como se fossem a camada inteira. A camada de
           agentes é o conjunto dos NOVE módulos — Compras é um deles, e os
           cinco agentes vivem dentro dele.

           O `papel` de cada módulo vem do pitch (slides 6 e 8–11). Gestão de
           Ativos e Contas a Pagar não têm descrição em slide nenhum e entram
           só com o nome: papel inventado aqui seria copy sem fonte. */
        texto:
          "Nove módulos de agentes de IA, um para cada frente da gestão de gastos — de Compras a Orçamento. Em todos, a IA suporta o humano durante o processo: a decisão continua com uma pessoa.",
        modulos: [
          { nome: "Compras", papel: "Requisição, cotação, contratos, homologação e análise de gastos" },
          { nome: "Gestão de Ativos" },
          { nome: "Otimização Spend Logístico", papel: "Rotas, veículo e modal otimizados por carga" },
          { nome: "Spend via dados da NF", papel: "Cada nota fiscal vira inteligência de compras" },
          { nome: "Contas a Pagar" },
          { nome: "Benchmark de Preços Varejo", papel: "Referência real de mercado por produto" },
          { nome: "Orçamento", papel: "Fonte única, sem planilhas paralelas" },
          { nome: "Contratos", papel: "Ciclo contratual de ponta a ponta" },
          { nome: "Homologação Fornecedores", papel: "Onboarding e homologação de fornecedor" },
        ],
      },
      {
        numero: "Camada 2",
        nome: "Orquestração",
        texto: "Motor de raciocínio Anthropic. O Nexo usa o Claude para ler, classificar e recomendar — a decisão continua com uma pessoa.",
        selo: "Claude · Anthropic",
      },
      {
        numero: "Camada 3",
        nome: "Ambiente do cliente",
        texto: "Entrega embarcada, integrada ao ERP do cliente. Certificação ISO/IEC 27001.",
        placas: [
          { src: "/partner-microsoft.png", alt: "Microsoft AI Cloud Partner", w: 640, h: 200 },
          { src: "/partner-deskmanager.png", alt: "Desk Manager", w: 640, h: 200 },
          { src: "/selo-iso27001-v1.jpg", alt: "Certificação ISO/IEC 27001", w: 400, h: 400 },
        ],
      },
    ],
  },

  /** Slides 8–11: um módulo por seção, no formato do pitch — três passos, um
   *  número de prova, uma frase. As telas são prints reais do produto
   *  (~/Documents/Prints, 2026-09-01), convertidas em public/nexo/. Orçamento
   *  não tem print: a seção sai com número e texto, e a tela entra quando
   *  existir. */
  naPratica: {
    eyebrow: "Na prática",
    itens: [
      {
        id: "logistico",
        nome: ["Nexo", "Spend Logístico"],
        passos: [
          { nome: "Recebe os inputs das cargas", texto: "Pedidos, pesos, cidades e SLA de cada entrega" },
          { nome: "Otimiza rotas, veículo e modal", texto: "Mais de 900 cenários de rota, ocupação e FTL vs. LTL calculados em minutos" },
          { nome: "Entrega a carga mais lucrativa", texto: "Otimizando o custo de frete para sua empresa" },
        ],
        prova: {
          rotulo: "Saving por otimização",
          numero: "+900",
          unidade: "cenários comparados por corte",
          texto: "O motor escolhe o cenário de menor custo total e maior margem, respeitando SLA e restrições adicionadas pelo cliente.",
        },
        /** Filme do módulo (remotion/nexo-logistico, 2026-10-07): SUBSTITUI as
         *  telas abaixo na página, que ficam como registro e fonte dos dados. */
        video: {
          src: "/nexo/nexo-logistico.mp4",
          label: "Vídeo do Spend Logístico: os pedidos do corte chegam, o motor compara mais de 900 cenários e desenha a rota da Carga 22, e as cargas FTL aparecem com a ocupação de cada uma.",
          legenda: "Spend Logístico em 22 segundos",
        },
        telas: [
          { src: "/nexo/logistico-rota.jpg", alt: "Malha desenhada pelo motor: rota otimizada com 6 paradas e 3.107 km", w: 1800, h: 1154, legenda: "Rota otimizada · 6 paradas · 3.107 km" },
          { src: "/nexo/logistico-ocupacao.jpg", alt: "Gráfico de ocupação das cargas FTL, com média de 86,6%", w: 1800, h: 1718, legenda: "Ocupação das cargas FTL" },
        ],
      },
      {
        id: "varejo",
        nome: ["Nexo", "Benchmarking Preços Varejo"],
        passos: [
          { nome: "Recebe o preço de compra", texto: "SKUs, fabricantes e custo de aquisição do cliente" },
          { nome: "Varre os grandes e-commerces", texto: "Coleta ofertas nas lojas consagradas e calcula menor preço, mediana e teto por produto" },
          { nome: "Aponta onde está o ganho", texto: "Compara mercado x preço de compra e revela margem e oportunidades" },
        ],
        prova: {
          rotulo: "Economia identificada",
          numero: "28%",
          unidade: "de dispersão de preço no mesmo produto",
          texto: "O motor mostra a referência real de mercado e quanto o cliente pode economizar por SKU. Ideal para varejistas, distribuidores e e-commerces.",
        },
        /** Filme do módulo (remotion/nexo-varejo, 2026-10-07): SUBSTITUI as
         *  telas abaixo na página, que ficam como registro e fonte dos dados. */
        video: {
          src: "/nexo/nexo-varejo.mp4",
          label: "Vídeo do Benchmarking de Preços Varejo: o preço de compra chega, o motor varre as ofertas e mostra menor preço, mediana e maior preço, e aponta a economia possível e a dispersão de 28%.",
          legenda: "Benchmarking de Preços Varejo em 22 segundos",
        },
        telas: [
          { src: "/nexo/varejo-painel.jpg", alt: "Painel de benchmarking com menor preço, mediana e maior preço por produto", w: 1800, h: 925, legenda: "Painel de benchmarking · menor, mediana e maior preço" },
          { src: "/nexo/varejo-faixa.jpg", alt: "Faixa de preço por produto, do menor ao maior encontrado", w: 1800, h: 754, legenda: "Faixa de preço por produto" },
        ],
      },
      {
        id: "nf",
        nome: ["Nexo", "Spend via NF"],
        passos: [
          { nome: "Recebe a nota fiscal", texto: "Lê os dados da NF e cadastra fornecedor, itens e valores no banco de dados" },
          { nome: "Classifica cada gasto", texto: "Define categoria, subcategoria, país e cadência de compra automaticamente" },
          { nome: "Gera insights de economia", texto: "Detecta consolidação e recorrência e recomenda ações de sourcing priorizadas" },
        ],
        prova: {
          rotulo: "Oportunidade mapeada",
          numero: "$216k",
          unidade: "de gasto endereçável em 6 oportunidades de consolidação",
          texto: "O agente transforma NFs em inteligência de compras: consolida fornecedores, formaliza contratos e reduz o custo de processo.",
        },
        /** Filme do módulo (remotion/nexo-nf, 2026-10-07): SUBSTITUI as duas
         *  telas abaixo na página, que ficam como registro e fonte dos dados. */
        video: {
          src: "/nexo/nexo-spend-nf.mp4",
          label: "Vídeo do Spend via NF: a nota fiscal é lida, cada gasto é classificado, surgem as recomendações de sourcing e o total de $216k em oportunidades.",
          legenda: "Spend via NF em 22 segundos",
        },
        telas: [
          { src: "/nexo/nf-visao-geral.jpg", alt: "Visão geral do spend por país, categoria e fornecedor", w: 1800, h: 793, legenda: "Visão geral · spend por país, categoria e fornecedor" },
          { src: "/nexo/nf-recomendacoes.jpg", alt: "Recomendações de sourcing ordenadas por score de oportunidade", w: 1800, h: 800, legenda: "Recomendações de sourcing por score" },
        ],
      },
      {
        id: "orcamento",
        nome: ["Nexo", "Orçamento"],
        passos: [
          { nome: "Organiza o fluxo anual", texto: "Coleta estruturada por área, com prazos, versões e aprovações em um só lugar" },
          { nome: "Elimina planilhas", texto: "Consolidação automática substitui planilhas e o retrabalho manual do time financeiro" },
          { nome: "Dá visibilidade à liderança", texto: "Painéis com insights e analytics por IA: desvios, tendências e recomendações" },
        ],
        prova: {
          rotulo: "Fonte única",
          numero: "100%",
          unidade: "do orçamento consolidado sem planilhas paralelas",
          texto: "A IA lê o orçamento consolidado e entrega insights e analytics para a liderança: desvios, tendências e recomendações em tempo real.",
        },
        /** Filme do módulo (remotion/nexo-orcamento, 2026-10-07, pedido do
         *  Rodrigo): o orçamento saindo do Excel para o sistema. O módulo não
         *  tem telas, então os números do filme são ilustrativos. */
        video: {
          src: "/nexo/nexo-orcamento.mp4",
          label: "Vídeo do Orçamento: as planilhas de cada área dão lugar a um formulário no sistema, o orçamento passa pela aprovação, chega consolidado e Finanças vê o painel por área com o alerta da IA.",
          legenda: "Orçamento em 22 segundos · números ilustrativos",
        },
        telas: [],
      },
    ],
  },

  /**
   * Comparativo (pitch Hacktown, slide 12). Fase 2 do plano; o Rodrigo decidiu
   * em 2026-09-04 que fica só na /nexo, não na home.
   *
   * Duas decisões de copy registradas em docs/PLANO-ALINHAMENTO-PITCH.md:
   *  - a coluna da esquerda é "SaaS de Compras", sem nomear GEP, Coupa, Ariba,
   *    ME e Nimbi — afirmar "ROI não demonstrado" sobre empresa nomeada é
   *    propaganda comparativa contestável;
   *  - ISO 27001 vira "Certificada", não "única no mercado" — exclusividade
   *    pública é difícil de sustentar se um concorrente certificar amanhã.
   * A linha "Tempo até valor" carrega o "90 dias", publicado como está.
   */
  comparativo: {
    eyebrow: "Concorrência e diferenciais",
    titulo: ["Eles vendem software.", "Nós entregamos os agentes operando."],
    colunas: ["SaaS de Compras", "IAgentics Nexo"],
    linhas: [
      { criterio: "Onde ficam os dados", saas: "Na base do fornecedor, fora da empresa", nexo: "No ERP e no servidor do cliente" },
      { criterio: "Custo de entrada", saas: "Licença anual e implantação longa", nexo: "Sem licença de plataforma" },
      { criterio: "Tempo até valor", saas: "12 a 18 meses de implantação", nexo: "Agente operando em 90 dias" },
      { criterio: "ROI comprovado", saas: "Não demonstrado", nexo: "Horas de redução de trabalho manual" },
      { criterio: "ISO/IEC 27001", saas: "Não", nexo: "Certificada" },
    ],
  },

  /**
   * Perguntas e respostas, transcritas do deck IAgentics_DeskManager_Promo.pptx
   * (Documentos/IAgentics/PPTS) — cada resposta usa os fatos da lâmina indicada,
   * nada inventado aqui.
   *
   * O formato não é decoração: é o que faz o conteúdo ser citável. Buscadores e
   * assistentes de IA extraem trechos, então cada resposta tem que se sustentar
   * SOZINHA, fora do contexto da página — por isso repetem "o Nexo" em vez de
   * "ele", e cabem em uma ou duas frases.
   *
   * Renderizadas abertas, nunca em accordion: conteúdo escondido atrás de
   * clique pode não ser lido por quem extrai a resposta.
   */
  faq: {
    eyebrow: "Perguntas frequentes",
    titulo: "O que perguntam sobre o Nexo",
    itens: [
      {
        pergunta: "O Nexo é mais um sistema para o time de Compras aprender?",
        resposta:
          "Não. O Nexo roda dentro da Desk Manager que a empresa já usa, e o pedido final sai no ERP do cliente — o time trabalha nas mesmas telas de sempre.",
      },
      {
        pergunta: "Como uma requisição de compra é aberta no Nexo?",
        resposta:
          "O chatbot MIA abre a requisição a partir de uma descrição em linguagem natural, por um formulário simples, e a IA confere se a RC está correta antes de enviá-la para Compras.",
      },
      {
        pergunta: "A IA aprova a compra sozinha?",
        resposta:
          "Não. A IA classifica o pedido por categoria, define a cadeia de aprovação por alçada e audita os dados; a aprovação final é de uma pessoa, e o sistema exige quem aprovou e por quê, com a trilha registrada no histórico.",
      },
      {
        pergunta: "O fornecedor precisa criar conta ou senha para cotar?",
        resposta:
          "Não. Cada fornecedor recebe um link único e rastreável para o Portal do Fornecedor, sem senha e sem conta, e responde preço, prazo e condições ali mesmo, com anexo.",
      },
      {
        pergunta: "Como o Nexo compara as propostas dos fornecedores?",
        resposta:
          "A IA lê os anexos e monta o mapa comparativo sozinha, pontuando cada fornecedor por preço, prazo e condições — e ainda sugere a próxima mensagem de negociação.",
      },
      {
        pergunta: "É preciso redigitar o pedido no ERP no fim do processo?",
        resposta:
          "Não. Um clique em Empacotar OC consolida requisição, cotação e proposta vencedora numa ordem de compra pronta para o ERP do cliente.",
      },
      {
        pergunta: "O Nexo mostra o gasto consolidado da empresa?",
        resposta:
          "Sim. O Spend Analysis consolida gasto total, ticket médio e concentração por fornecedor, por categoria e período, e aponta oportunidades e riscos para a próxima negociação.",
      },
      {
        pergunta: "Qual IA está por trás do Nexo?",
        resposta: "O Nexo usa o Claude, da Anthropic, e opera dentro da Desk Manager.",
      },
    ],
  },
} as const;
/**
 * /cursos - página de "Em breve" da parceria IAgentics + Pecege (2026-08-28).
 *
 * Esta rota ERA a landing da plataforma própria, que foi desligada quando a
 * parceria fechou. A URL foi mantida de propósito: ela tinha acabado de ser
 * indexada pelo Google, e transformar a visita em expectativa preserva a
 * autoridade que 404 jogaria fora.
 *
 * O layout do hero é o mesmo de antes ("prateleira viva"), por pedido do
 * Rodrigo - trocam o texto e os logos, somem os botões. As capas da estante
 * agora são estáticas (CAPAS_ESTANTE): o catálogo saiu do banco junto com a
 * plataforma, e a estante é decorativa de qualquer forma.
 */
export const cursos = {
  meta: {
    titulo: "Em breve na Solution — IAgentics e Pecege",
    descricao:
      "As formações de IA aplicada a Compras e Gestão de Gastos da IAgentics passam a ser oferecidas na Solution, a plataforma de educação online do Pecege.",
  },
  hero: {
    logoIagenticsAlt: "IAgentics",
    logoPecegeAlt: "Pecege",
    logoSolutionAlt: "Solution",
    /* Três marcas na abertura, e a ordem conta uma frase: QUEM produz
       (IAgentics), COM QUEM (Pecege) e ONDE vai estar (Solution). O eyebrow
       nomeia só as duas organizações porque a parceria é entre elas — a
       Solution é o destino, e quem diz isso é o h1.

       "e" em texto, não "+": o símbolo vira ruído em leitor de tela. */
    eyebrow: "IAgentics e Pecege",
    headline: "Em breve",
    /* Texto do Rodrigo (2026-08-29), verbatim. Vem em dois parágrafos: o
       primeiro informa, o segundo posiciona. */
    /* Quebrado em três partes para o nome da plataforma virar link sem
       dangerouslySetInnerHTML: a string continua inteira e revisável aqui, e o
       componente monta o <a> no meio. */
    subtextAntes: "As formações online da IAgentics serão disponibilizadas na ",
    subtextLink: "Solution",
    subtextDepois:
      ", a plataforma de educação online do Pecege, a mesma organização por trás dos MBAs USP/Esalq.",
    urlSolution: "https://plataformasolution.com.br/",
    subtextDois: "Uma parceria que traz o melhor da IA com o melhor do mundo acadêmico para nossos clientes!",
    estanteAlt: "Capas das formações de IA aplicada da IAgentics",
  },
  /* Lista de espera (2026-08-29). O desconto de 10% no lançamento foi acertado
     com o Pecege — decisão do Rodrigo na mesma data.

     O texto do consentimento nomeia o Pecege EXPLICITAMENTE porque a lista vai
     ser compartilhada com ele. Consentimento para compartilhar dado pessoal
     com terceiro precisa dizer com quem, antes — "parceiros" no genérico não
     serve, e avisar depois não conserta. Se este texto mudar, a coluna
     consentimento_em é quem diz quem aceitou sob qual versão. */
  listaEspera: {
    titulo: "Entre na lista de espera",
    lead: "Quem entrar na lista recebe 10% de desconto no lançamento e é avisado em primeiro lugar.",
    nome: "Nome",
    email: "E-mail",
    consentimento:
      "Aceito receber novidades sobre o lançamento e que meus dados sejam compartilhados com o Pecege, responsável pela plataforma Solution.",
    botao: "Quero 10% de desconto",
    enviando: "Enviando…",
    sucessoTitulo: "Pronto, você está na lista.",
    sucessoTexto: "Avisamos você assim que as formações entrarem no ar, com o desconto garantido.",
    erroNome: "Escreva seu nome.",
    erroEmail: "Confira o e-mail digitado.",
    erroConsentimento: "Marque a autorização para entrar na lista.",
    erroGeral: "Não foi possível concluir agora. Tente de novo em instantes.",
    privacidade: "Ver política de privacidade",
  },
  /* Estática desde o desligamento da plataforma: a estante é decorativa
     (aria-hidden) e não vale manter uma consulta ao banco viva só por ela. */
  capasEstante: [
    "/academy/copilot-course.jpg",
    "/academy/design-thinking-ia-course.jpg",
    "/academy/fundamentos-ia-negocios.jpg",
    "/academy/imersao-analise-dados-ia.jpg",
    "/academy/imersao-assistentes-ia.jpg",
    "/academy/lean-thinking-course.jpg",
    "/academy/neurociencia-produtividade-course.jpg",
    "/academy/spend-management-course.jpg",
    "/academy/transformacao-digital-course.jpg",
  ],
} as const;

/**
 * Catálogo de cursos com checkout (2026-09-22) — hoje só na prévia
 * /preview/catalogo, escondida (sem senha desde 2026-09-22).
 *
 * A lista é a do Pecege desde 2026-09-26 (antes, dois cursos OnDemand da
 * Academy como provisórios). O `slug` é o que viaja no carrinho e fica gravado
 * na venda — não renomeie um slug de curso que já foi vendido.
 */
export type Tema = "rotina" | "dados" | "custos" | "estrategia" | "pessoas" | "ia";

export const catalogo = {
  precoBaseCentavos: 20000,
  /* Catálogo enxuto (2026-10-02, pedido do Rodrigo): só dois cursos. A lista
     de 62 cursos do Pecege (2026-09-26 a 2026-10-02), os packs por nível e o
     questionário "Monte sua trilha" saíram — estão no histórico do git.

     O `slug` é o que viaja no carrinho e fica gravado na venda — não renomeie
     um slug de curso que já foi vendido.

     `preco` é o preço de cada curso (cheio e o cobrado). Quando os dois são
     iguais não há promoção: sem riscado e sem selo de lançamento. */
  cursos: [
    /* "Fundamentos de IA para Negócios": nasceu "Fundamentos de IA aplicado aos
       Negócios" na Academy, com o mesmo slug. Capa com o professor (o quadro
       do vídeo-convite do Vinícius) desde 2026-09-29; R$ 49,90, por R$ 19,90
       no lançamento, desde 2026-10-02. */
    {
      slug: "fundamentos-ia-negocios",
      nome: "Fundamentos de IA para Negócios",
      nivel: 0,
      temas: ["ia"],
      introdutorio: true,
      foto: "/academy/academy-convite-poster.jpg",
      fotoDePessoa: true,
      enquadre: { banner: "50% 24%" },
      professor: "Vinícius",
      preco: { cheioCentavos: 4990, promoCentavos: 1990 },
    },
    /* "Marketing com IA" (2026-10-02): R$ 59,90, sem promoção. A capa parte da
       foto da professora, a Carol, enviada pelo Rodrigo. */
    {
      slug: "marketing-com-ia",
      nome: "Marketing com IA",
      nivel: 0,
      temas: ["ia"],
      foto: "/academy/marketing-com-ia-capa.jpg",
      fotoDePessoa: true,
      // Foto quase quadrada, rosto no alto: na paisagem o recorte sobe para
      // não cortar a cabeça.
      enquadre: { paisagem: "50% 6%", banner: "50% 8%" },
      professor: "Carol",
      preco: { cheioCentavos: 5990, promoCentavos: 5990 },
    },
  ] as {
    slug: string;
    nome: string;
    nivel: 0 | 1 | 2 | 3;
    temas: Tema[];
    introdutorio?: boolean;
    foto?: string;
    /** Foto de gente (professor): a capa vira cartaz, com vinheta e respiro. */
    fotoDePessoa?: boolean;
    /** Ajuste fino do recorte (object-position) quando o padrão não serve à foto. */
    enquadre?: { retrato?: string; paisagem?: string; banner?: string };
    professor?: string;
    preco?: { cheioCentavos: number; promoCentavos: number };
  }[],
  introdutorio: "Curso introdutório",
  // Crédito na capa de curso com professor em destaque (ver Capa.tsx).
  capaCom: (nome: string) => `Com ${nome}`,
  // Selo do curso de preço próprio em promoção (capa e card).
  lancamento: "Lançamento",
  /* Capas (2026-09-26, pedido do Rodrigo): as fotos dos cursos da /academy.
     Hoje os dois cursos têm foto própria; o rodízio por tema abaixo só vale
     para curso novo sem `foto`.
     Curso com `foto` própria usa ela (o assunto casa: Lean, Design Thinking,
     Spend Analysis…); os demais recebem as fotos do tema principal em RODÍZIO,
     na ordem do catálogo — cursos vizinhos na prateleira não repetem foto.
     Nove fotos para 63 cursos repetem — para variar mais, é acrescentar
     arquivos aqui (mesmo estilo e proporção 4:5, 724×900). */
  fotosPorTema: {
    rotina: ["/academy/lean-thinking-course.jpg", "/academy/neurociencia-produtividade-course.jpg", "/academy/copilot-course.jpg", "/academy/design-thinking-ia-course.jpg"],
    dados: ["/academy/imersao-analise-dados-ia.jpg", "/academy/spend-management-course.jpg", "/academy/lean-thinking-course.jpg", "/academy/copilot-course.jpg"],
    custos: ["/academy/spend-management-course.jpg", "/academy/transformacao-digital-course.jpg", "/academy/imersao-assistentes-ia.jpg", "/academy/design-thinking-ia-course.jpg"],
    estrategia: ["/academy/transformacao-digital-course.jpg", "/academy/design-thinking-ia-course.jpg", "/academy/fundamentos-ia-negocios.jpg", "/academy/imersao-analise-dados-ia.jpg"],
    pessoas: ["/academy/design-thinking-ia-course.jpg", "/academy/neurociencia-produtividade-course.jpg", "/academy/fundamentos-ia-negocios.jpg"],
    ia: ["/academy/fundamentos-ia-negocios.jpg", "/academy/imersao-assistentes-ia.jpg", "/academy/copilot-course.jpg"],
  } as Record<Tema, string[]>,
  niveis: ["Iniciante", "Intermediário", "Especialista", "Avançado"],
  temas: {
    rotina: "Processo e rotina",
    dados: "Dados e análise de gastos",
    custos: "Negociação, custos e fornecedores",
    estrategia: "Estratégia e gestão",
    pessoas: "Comunicação e liderança",
    ia: "IA e tecnologia",
  } as Record<Tema, string>,
  meta: {
    titulo: "Catálogo de cursos (prévia)",
    descricao: "Prévia de teste do catálogo de formações online da IAgentics na Solution.",
  },
  /* Na tela, não só no código: quem abre a prévia precisa saber que a
     cobrança é real, só que pequena. */
  avisoTeste: "Prévia: preços reais, cobrança real pelo Asaas.",
  barra: {
    rotulo: "Resumo do carrinho",
    vazio: "Escolha um curso para começar.",
    cursos: (n: number) => (n === 1 ? "1 curso" : `${n} cursos`),
    ver: "Ver carrinho",
  },
  gaveta: { fechar: "Fechar", carrinho: "Seu carrinho" },
  /* Vitrine (2026-09-26; enxugada em 2026-10-02 para dois cursos): hero com
     as três marcas e os pôsteres, "Como funciona" em quatro passos e a grade
     de cursos. */
  vitrine: {
    hero: {
      logoIagenticsAlt: "IAgentics",
      logoPecegeAlt: "Pecege",
      logoSolutionAlt: "Solution",
      eyebrow: "IAgentics e Pecege · cursos online",
      titulo: "IA aplicada aos negócios, para começar agora.",
      lead: "Cursos online criados pela IAgentics, na Solution, a plataforma de educação online do Pecege, a mesma organização por trás dos MBAs USP/Esalq.",
      conceitoRotulo: "Como funciona",
      passos: [
        { titulo: "Escolha o curso", texto: "Cursos online de IA aplicada aos negócios, criados pela IAgentics." },
        { titulo: "Pague como preferir", texto: "Pix, boleto ou cartão, numa fatura segura do Asaas." },
        { titulo: "Receba o acesso", texto: "O Pecege libera seu acesso de 30 dias na plataforma Solution e avisa você por e-mail." },
        { titulo: "Estude no seu ritmo", texto: "São 30 dias de acesso na Solution, a plataforma online do Pecege, para estudar quando e onde quiser." },
      ],
      verCursos: "Ver os cursos",
      postersAlt: "Capas dos cursos do catálogo",
    },
    cursosTitulo: "Cursos",
    /* Prazo de acesso (2026-10-02, pedido do Rodrigo): a compra dá 30 dias na
       plataforma. Aparece onde a pessoa decide — banner e carrinho — e de novo
       no pedido, depois de pagar. */
    acesso: "30 dias de acesso na plataforma Solution",
    noCarrinho: "No carrinho",
  },

  card: {
    adicionar: "Adicionar",
    remover: "Remover",
  },
  carrinho: {
    titulo: "Seu carrinho",
    vazio: "Escolha um curso para começar.",
    total: "Total",
    economia: (valor: string) => `Você economiza ${valor}`,
    acesso: "Cada curso dá 30 dias de acesso na plataforma Solution, contados a partir da liberação.",
    finalizar: "Finalizar compra",
  },
  checkout: {
    titulo: "Seus dados",
    nome: "Nome completo",
    email: "E-mail",
    cpf: "CPF",
    telefone: "Celular com DDD",
    notaCpf: "O CPF é exigido pelo Asaas para emitir a cobrança. Ele vai direto para o Asaas e não fica guardado no nosso site.",
    consentimento:
      "Autorizo que meus dados sejam compartilhados com o Pecege, responsável pela plataforma Solution, para liberar meu acesso aos cursos.",
    pagar: "Ir para o pagamento",
    enviando: "Gerando a cobrança…",
    voltar: "Voltar ao carrinho",
    privacidade: "Ver política de privacidade",
    erros: {
      nome: "Escreva seu nome completo.",
      email: "Confira o e-mail digitado.",
      telefone: "Informe o celular com DDD.",
      cpf: "Confira o CPF digitado.",
      cursos: "Seu carrinho está vazio.",
      consentimento: "Marque a autorização para continuar.",
      geral: "Não foi possível gerar a cobrança agora. Tente de novo em instantes.",
    } as Record<string, string>,
  },
  pedido: {
    titulo: "Pedido recebido",
    status: {
      pendente: "Aguardando pagamento",
      pago: "Pagamento confirmado",
      cancelado: "Cobrança cancelada",
      estornado: "Pagamento estornado",
      falhou: "Não foi possível gerar a cobrança",
    } as Record<string, string>,
    proximos: "O Pecege libera seu acesso de 30 dias na plataforma Solution e avisa você no e-mail informado.",
    abrirFatura: "Abrir a fatura",
    cursos: "Cursos",
    total: "Total",
    voltar: "Voltar ao catálogo",
  },
} as const;
