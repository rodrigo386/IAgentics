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
  domain: "www.iagentics.com.br",
  url: "https://www.iagentics.com.br",
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

export const nav = {
  links: [
    { label: "Soluções", href: "/#solucoes" },
    { label: "Nexo", href: "/nexo" },
    { label: "Academy", href: "/academy" },
    { label: "Spend Lab", href: "/spend-lab" },
  ],
} as const;

export const hero = {
  /** Split so both lines are close in length, which keeps the hero at exactly 2 lines. */
  headline: ["Automações Inteligentes para", "Compras e Gestão de Gastos"],
  /** 19 words. Hero subtext cap is 20. */
  subtext:
    "Agentes de IA que assumem o trabalho operacional de suprimentos rodando dentro da plataforma que sua empresa já usa.",
  imageAlt:
    "Edifício corporativo iluminado à noite, com dezenas de estações de trabalho visíveis pelas janelas",
  /**
   * O nome do produto, sob o grafo. Só o nome: a frase que dizia onde o Nexo roda
   * saiu daqui a pedido do time. O fato não se perdeu da landing - ele continua em
   * solutions.items[0].platform ("Microsoft · Desk Manager") e nos selos de parceria
   * logo abaixo da hero.
   *
   * Guardado em caixa mista de propósito, mesmo aparecendo em CAIXA ALTA na tela: a
   * caixa é decisão de tipografia e vive no CSS (text-transform). String em caixa alta
   * no conteúdo faz alguns leitores de tela soletrarem "N-E-X-O".
   */
  product: "Nexo App",
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
      name: "Nexo",
      promise: "Agentes de IA para Compras",
      platform: "Microsoft · Desk Manager",
      scope: ["RC", "RFP", "Spend", "Onboarding", "Contratos"],
      href: "/nexo",
      image: "/agent-contratos.jpg",
      imageAlt: "Mãos revisando e anotando um documento impresso",
    },
    {
      id: "academy",
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
  headline: "Entrega embarcada",
  lead: "Os 5 agentes rodam dentro da plataforma escolhida.",
  assurance:
    "Seus dados se mantêm protegidos dentro do servidor da sua empresa.",
  /** A plataforma onde o Nexo roda embarcado. Badge oficial do cliente. */
  platforms: [
    { name: "Desk Manager Partners", src: "/partner-deskmanager.png", w: 1057, h: 347 },
  ],
  /** Certificações de segurança da informação da Desk Manager, a plataforma
   *  onde o Nexo roda embarcado. Selos oficiais fornecidos pelo cliente. */
  certificacoes: {
    intro:
      "A Desk Manager, plataforma onde o Nexo roda, é certificada em segurança da informação:",
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
  agents: [
    { code: "RC", name: "Requisição de Compra" },
    { code: "RFP", name: "Cotação e concorrência" },
    { code: "Spend", name: "Análise de gastos" },
    { code: "Onboarding", name: "Homologação de fornecedor" },
    { code: "Contratos", name: "Ciclo contratual" },
  ],
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
   * `href` APONTA PARA A SEÇÃO DE CURSOS DESTA PÁGINA, não para a plataforma.
   * Procurei o endereço da plataforma online em todos os links do site de vocês e
   * ele não existe lá. Assim que tiver a URL, troque aqui - é uma linha, e o
   * destino passa a ser o certo.
   */
  platform: {
    label: "Plataforma online de cursos",
    body: "Formações no seu ritmo, conteúdo exclusivo IAgentics.",
    cta: "Ver os cursos",
    href: "#cursos",
    /**
     * O botão da plataforma. `appHref: null` = ainda sem endereço, e o botão
     * aparece desabilitado com a marca "em breve" em vez de fingir que leva a
     * algum lugar. Preencha aqui e ele vira link de verdade sozinho - mesmo
     * padrão dos quadros de mídia do /nexo.
     */
    appLabel: "Acessar plataforma",
    appHref: "/app" as string | null,
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
} as const;

export const contact = {
  headline: "Vamos conversar",
  lead: "Conte onde o time de suprimentos perde mais tempo hoje. Respondemos com um próximo passo concreto.",
  social: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/iagentics/" },
    { label: "Instagram", href: "https://www.instagram.com/iagentics/" },
  ],
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
  hero: {
    /**
     * A capa virou o lockup da marca: o ícone do app ao lado desta palavra, os dois
     * em escala de display (ver Cover.tsx). Substituiu a antiga headline em duas
     * linhas ("Agentes de IA / para Compras") a pedido do time - a frase que
     * descrevia o produto continua abaixo, em `subtext`.
     *
     * Caixa mista de propósito, mesmo grande na tela: é a mesma grafia usada no
     * resto do site (título da página, sidebar), não um SHOUT em caixa alta.
     */
    marca: "Nexo",
    subtext:
      "Cinco agentes que assumem o trabalho operacional de suprimentos rodando dentro da plataforma que sua empresa já usa.",
    /**
     * Esta capa usava a mesma frase da hero da home. Quando a home passou a exibir
     * só "Nexo", a frase ficou morando aqui em vez de sumir junto: a instrução era
     * sobre a hero, e esta é outra página. Se quiser tirar daqui também, é só apagar
     * esta linha e o <p> em Cover.tsx.
     */
    platform: "Nexo, o app de Compras, dentro do Desk Manager",
  },

  /**
   * O palco de telas da capa: três prints reais do produto, empilhados em perspectiva
   * com deriva lenta (ver .palco-nexo em globals.css e o bloco correspondente em
   * Cover.tsx). Puramente decorativo - a manchete carrega o significado, então o
   * conjunto inteiro é aria-hidden e os `alt` ficam vazios de propósito.
   *
   * Ordem de empilhamento (fundo -> frente): classificação (lista) -> RFQ (central de
   * cotações) -> relatório (modal com a recomendação verde, a tela mais "viva").
   */
  heroStage: {
    prints: [
      { src: "/nexo-hero-classificacao-v1.png", alt: "" },
      { src: "/nexo-hero-rfq-v1.png", alt: "" },
      { src: "/nexo-hero-relatorio-v1.png", alt: "" },
    ],
  },

  /* As telas do produto aparecem em UM lugar só: o painel do índice "Entrega
     embarcada". A sequência de pranchas que existia abaixo do vídeo mostrava
     exatamente as mesmas imagens e foi removida. `agent` amarra cada tela ao código
     do agente em nexo.agents; preencha `src` e a tela entra no painel sozinha. */
  gallery: {
    slots: [
      {
        kind: "image" as const,
        agent: "RC",
        label: "Requisição de Compra",
        /* v2, entregue 13/08/2026: capturas reais do produto, substituindo as prévias de
           10/08. PNG e não JPG de propósito: é uma captura de interface, cheia de texto
           pequeno, e o JPEG suja as bordas das letras. A 1917px de largura a lupa continua
           útil, só que com ampliação efetiva menor do que os 3360px anteriores permitiam.
           O Next reencoda para WebP/AVIF na entrega. */
        spec: "1917x1078 · PNG",
        file: "/nexo-print-rc-v2.png",
        src: "/nexo-print-rc-v2.png" as string | null,
      },
      {
        kind: "image" as const,
        agent: "RFP",
        label: "Cotação e concorrência",
        spec: "1917x1078 · PNG",
        file: "/nexo-print-rfp-v2.png",
        src: "/nexo-print-rfp-v2.png" as string | null,
      },
      {
        kind: "image" as const,
        agent: "Spend",
        label: "Análise de gastos",
        spec: "1917x1078 · PNG",
        file: "/nexo-print-spend-v2.png",
        src: "/nexo-print-spend-v2.png" as string | null,
      },
      {
        kind: "image" as const,
        agent: "Onboarding",
        label: "Homologação de fornecedor",
        spec: "1920x1080 · JPG",
        file: "/nexo-print-onboarding.jpg",
        src: null as string | null,
      },
      {
        kind: "image" as const,
        agent: "Contratos",
        label: "Ciclo contratual",
        spec: "1920x1080 · JPG",
        file: "/nexo-print-contratos.jpg",
        src: null as string | null,
      },
    ],
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
} as const;
