/**
 * Nexo Demo (2026-11-27, pedido do Rodrigo: "uma versão do Nexo dentro do
 * site para demonstração de vendas ... breve cadastro (e-mail, empresa,
 * celular e LinkedIn), logue no Nexo Demo e acesse um ambiente de demo com
 * dados fictícios, que ele possa clicar e avançar com todo o processo do
 * começo ao fim").
 *
 * Textos e dados fictícios da demo. Reexportado por lib/content.ts (a regra
 * de "toda string visível em content.ts" continua valendo; o arquivo é à
 * parte só pelo tamanho, como o content-admin.ts). NÃO importe content.ts
 * daqui: ele importa este arquivo.
 *
 * As telas foram levantadas do Nexo de verdade (dentro do Space do Desk
 * Manager) em 2026-11-27: os rótulos de menu, abas, etapas e botões são os
 * do produto. Empresas, pessoas, itens e valores são INVENTADOS.
 */

export type ItemCatalogo = {
  id: string;
  nome: string;
  tipo: string;
  categoria: string;
  unidade: string;
  /** Valor de referência por unidade, em centavos: vira o "valor estimado" da RC. */
  referenciaCentavos: number;
  /** Quem a base de fornecedores sugere para a categoria. `fator` multiplica a referência na 1ª proposta. */
  fornecedores: { id: string; fator: number; prazoDias: number; responde: boolean }[];
};

export const nexoDemo = {
  meta: {
    titulo: "Nexo Demo: teste o fluxo de Compras | IAgentics",
    descricao: "Abra uma requisição, cote com fornecedores, compare propostas com a MIA e gere a ordem de compra em um ambiente de demonstração do Nexo, com dados fictícios.",
  },

  entrada: {
    eyebrow: "Nexo Demo",
    titulo: "Teste o Nexo com as suas mãos.",
    lead: "Um ambiente de demonstração do Nexo, com dados fictícios. Você abre uma requisição de compra e leva o processo até a ordem de compra, clicando como no sistema de verdade.",
    passos: [
      { titulo: "Requisição", texto: "Abra uma RC sozinho ou deixe a MIA preencher." },
      { titulo: "Cotação", texto: "Convide fornecedores e receba as propostas." },
      { titulo: "Mapa comparativo", texto: "A MIA compara preço e prazo e aponta os riscos." },
      { titulo: "Ordem de compra", texto: "Selecione, aprove pela alçada e envie ao ERP." },
    ],
    tempo: "Leva cerca de 5 minutos. Funciona no computador e no celular.",
    aviso: "Empresas, pessoas, itens e valores da demonstração são fictícios.",
  },

  formulario: {
    titulo: "Entrar no Nexo Demo",
    nome: "Nome",
    email: "E-mail corporativo",
    empresa: "Empresa",
    celular: "Celular, com DDD",
    linkedin: "LinkedIn",
    linkedinExemplo: "linkedin.com/in/seu-nome ou só o nome de usuário",
    ciencia: "Estou ciente de que os meus dados e o meu avanço na demonstração serão usados pela IAgentics para liberar o acesso e para contato comercial, conforme a",
    privacidade: "Política de Privacidade",
    botao: "Entrar no Nexo Demo",
    enviando: "Entrando...",
    erros: {
      nome: "Informe o seu nome.",
      email: "Confira o e-mail.",
      empresa: "Informe a empresa.",
      celular: "Confira o celular, com DDD.",
      linkedin: "Confira o LinkedIn: o endereço do perfil ou o nome de usuário.",
      ciencia: "Marque a caixa de ciência para entrar.",
      limite: "Muitas tentativas a partir deste endereço. Tente de novo em uma hora.",
      falha: "Não foi possível entrar agora. Tente de novo em instantes.",
    } as Record<string, string>,
    acessoInvalido: "Este link de acesso não vale mais. Faça o cadastro ou peça um link novo.",
    jaTenho: "Já tem cadastro?",
    jaTenhoLink: "Entrar com o seu e-mail",
  },

  /** Login de quem já se cadastrou: sem senha, o link de acesso vai para o e-mail. */
  login: {
    titulo: "Já tenho cadastro",
    texto: "Digite o e-mail do seu cadastro. Enviamos para ele o link que abre o Nexo Demo onde você parou.",
    email: "E-mail do cadastro",
    botao: "Enviar o link de acesso",
    enviando: "Enviando...",
    enviadoTitulo: "Confira o seu e-mail",
    enviado: (email: string) => `Se ${email} tem cadastro no Nexo Demo, o link de acesso acabou de ser enviado. Ele chega em instantes; confira também o spam.`,
    outro: "Usar outro e-mail",
    semCadastro: "Ainda não tem cadastro?",
    semCadastroLink: "Cadastre-se para entrar",
  },

  /** Moldura do aplicativo. */
  app: {
    marca: "Nexo",
    selo: "Demo",
    faixa: "Ambiente de demonstração. Dados fictícios.",
    perfil: "Master · Sala de comando",
    sair: "Sair da demo",
    falar: "Falar com o time",
    reiniciar: "Recomeçar",
    menuAbrir: "Abrir o menu",
    menuFechar: "Fechar o menu",
    completa: "Na versão completa",
    menu: [
      { grupo: "Início", itens: [{ id: "mia", rotulo: "Início · MIA" }] },
      {
        grupo: "Requisições",
        itens: [
          { id: "abrir", rotulo: "Abrir RC" },
          { id: "minhas", rotulo: "Minhas requisições" },
          { id: "aprovacoes", rotulo: "Minhas aprovações" },
        ],
      },
      {
        grupo: "Compras",
        itens: [
          { id: "requisicoes", rotulo: "Requisições (RCs)" },
          { id: "cotacoes", rotulo: "Cotações e negociação" },
        ],
      },
    ],
    /** Fora da demo: aparecem apagados, para mostrar o tamanho do produto. */
    menuCompleto: [
      { grupo: "Compras", itens: ["Spend"] },
      { grupo: "Sala de comando", itens: ["Visão geral e dashboards"] },
      { grupo: "Administração", itens: ["Equipe e acessos", "Base de fornecedores", "Centros de custo", "Alçada de compra"] },
    ],
  },

  /** O guia no topo: diz o papel da vez e leva à tela certa. Um por fase (lib/nexo-demo/regras.ts). */
  guia: {
    rotulo: (n: number, total: number) => `Passo ${n} de ${total}`,
    ir: "Ir para a tela",
    fases: {
      inicio: { papel: "Você é o solicitante", texto: "Abra uma requisição de compra. A MIA pode preencher para você.", tela: "abrir" },
      analise: { papel: "Você é o comprador", texto: "A MIA já classificou a requisição. Veja a análise dela.", tela: "requisicoes" },
      aprovarRc: { papel: "Você é o gestor", texto: "A requisição espera a sua aprovação.", tela: "aprovacoes" },
      convidar: { papel: "Você é o comprador", texto: "A RC virou cotação. Convide os fornecedores.", tela: "cotacoes" },
      mapa: { papel: "Você é o comprador", texto: "As propostas chegaram. Gere o mapa comparativo com a MIA.", tela: "cotacoes" },
      selecionar: { papel: "Você é o comprador", texto: "Negocie mais uma rodada ou selecione o vencedor.", tela: "cotacoes" },
      aprovarSelecao: { papel: "Você é o aprovador da alçada", texto: "A seleção do vencedor espera a sua aprovação.", tela: "aprovacoes" },
      fim: { papel: "Processo concluído", texto: "A ordem de compra foi gerada e enviada ao ERP.", tela: "fecho" },
    },
  },

  mia: {
    ola: (nome: string) => `Olá, ${nome}. Eu sou a MIA.`,
    sub: "Sua assistente de IA de compras: gráficos, listas, status de RCs e cotações, spend e abertura de requisições.",
    fala: "Oi! Sou a MIA, a IA do Nexo. Posso listar RCs e cotações, mostrar o status de uma RC, montar gráficos de spend, abrir e preencher uma requisição e te levar para qualquer tela. Eu só leio os dados: nada é enviado sem você.",
    atalhos: { abrir: "Quero abrir uma requisição de compra", grafico: "Gráfico do gasto por categoria", listar: "Liste minhas RCs em aprovação" },
    respostaAbrir: "Preenchi a requisição com um pedido comum da operação. Confira à direita e clique em Abrir chamado.",
    respostaGrafico: "Gasto dos últimos 12 meses por categoria (dados fictícios):",
    respostaListarVazia: "Você ainda não tem RC em aprovação. Quer abrir uma?",
    respostaListar: "Esta é a sua RC em andamento:",
    campo: "Pergunte à MIA, peça um gráfico ou digite / para comandos...",
    campoAviso: "Na demonstração a MIA responde pelos atalhos acima.",
    gasto: [
      { categoria: "TI e Equipamentos", centavos: 184_300_000 },
      { categoria: "Manutenção", centavos: 126_750_000 },
      { categoria: "Administrativo e Escritório", centavos: 73_420_000 },
      { categoria: "EPI e Segurança", centavos: 41_980_000 },
      { categoria: "Fretes", centavos: 28_610_000 },
    ],
  },

  rc: {
    titulo: "Nova requisição de compras",
    sub: "Preencha à esquerda e acompanhe o resumo ao vivo à direita. A MIA pode preencher e ajustar para você.",
    preencherMia: "Preencher com a MIA",
    passo1: "O que você precisa?",
    passo2: "Item",
    passo3: "Entrega e responsáveis",
    item: "Item ou serviço",
    itemEscolha: "Escolha no catálogo",
    qtd: "Qtd",
    unidade: "Unidade",
    valor: "Valor estimado (R$)",
    valorAjuda: "Vem do preço de referência do catálogo.",
    urgencia: "Urgência",
    urgencias: ["Baixa", "Média", "Alta", "Crítica"],
    necessarioAte: "Necessário até",
    centro: "Centro de custo",
    centros: ["TI-001 · Tecnologia", "ADM-010 · Administrativo", "OPS-020 · Operações", "FAC-030 · Facilities"],
    centroEscolha: "Escolha o centro de custo",
    resumo: "Resumo da requisição",
    tipo: "Tipo",
    naoEscolhido: "não escolhido",
    solicitante: "Solicitante",
    faltaPreencher: (n: number) => `Falta preencher (${n})`,
    faltas: { item: "Escolher o item", qtd: "Informar a quantidade", urgencia: "Escolher a urgência", data: "Informar a data necessária", centro: "Informar o centro de custo" },
    abrir: "Abrir chamado",
    limpar: "Limpar",
    aberta: (codigo: string) => `Requisição ${codigo} aberta. A MIA já está classificando.`,
    jaAberta: "A demonstração acompanha uma requisição por vez. A sua já está em andamento.",
  },

  minhas: {
    titulo: "Minhas requisições",
    vazio: "Você ainda não abriu nenhuma requisição.",
    abrir: "Abrir RC",
    abertaEm: "Aberta agora",
    cadeia: "Cadeia de aprovação",
    status: { analise: "Em análise", aguardando: "Aguardando gestor", cotacao: "Em cotação", selecao: "Aguardando alçada", aprovado: "Aprovado" },
    cadeiaPassos: { gestor: "Gestor da área", alcada: "Alçada de valor", pendente: "Pendente", aprovado: "Aprovado", naFila: "Na fila" },
  },

  requisicoes: {
    titulo: "Requisições e alçada",
    vazio: "Nenhuma requisição na fila do comprador.",
    verAnalise: "Ver análise",
    fechar: "Fechar",
    relatorio: "Relatório de classificação",
    classificacao: "Classificação automática · Agente de Compras",
    valida: "Válida, pronta para aprovação",
    categoria: "Categoria",
    urgenciaAvaliada: "Urgência avaliada",
    sugeridos: "Fornecedores sugeridos",
    riscos: "Riscos identificados",
    pendencias: "Pendências para o comprador",
    resumo: "Resumo para o comprador",
    cadeia: "Cadeia de aprovação (escalonamento)",
    aprovadorIndicado: "Aprovador indicado",
    gestor: "Gestor da área (você, na demonstração)",
    risco: {
      concentracao: "Um dos fornecedores sugeridos costuma não responder convites desta categoria.",
      prazoCurto: "Prazo de entrega pedido é menor que o prazo médio da categoria.",
      valorAlto: "Valor acima da alçada do gestor: a seleção do vencedor passa por aprovação de alçada.",
      semRisco: "Nenhum risco relevante: item de catálogo, com fornecedores homologados.",
    },
    pendenciasItens: ["Confirmar a especificação com o solicitante antes de enviar os convites.", "Pedir no mínimo três cotações (regra de cotação da categoria)."],
    resumoTexto: (item: string, qtd: number, unidade: string, n: number) =>
      `Requisição clara e completa: ${qtd} ${unidade} de ${item}. A base tem ${n} fornecedores homologados para a categoria. Recomendo abrir cotação com todos assim que o gestor aprovar.`,
  },

  aprovacoes: {
    titulo: "Minhas aprovações",
    sub: "RCs pendentes em que você é o aprovador indicado. Aprovar libera a RC para a fila do comprador da categoria; reprovar devolve ao solicitante com o motivo.",
    selecoes: "Seleções para aprovar",
    selecoesSub: "Seleções de vencedores de RFQ que dependem da sua aprovação por alçada de valor.",
    selecoesVazio: "Nenhuma seleção aguardando sua aprovação.",
    rcs: "RCs pendentes (aprovador indicado)",
    rcsVazio: "Nenhuma RC pendente de aprovação.",
    aprovar: "Aprovar",
    reprovar: "Reprovar",
    reprovarAviso: "Na demonstração a reprovação fica desligada, para o processo seguir até o fim.",
    aprovarSelecao: "Aprovar e gerar a OC",
    vencedor: "Vencedor",
    economia: "Economia sobre o estimado",
    rcAprovada: "RC aprovada. Ela virou uma cotação na fila do comprador.",
  },

  cotacoes: {
    titulo: "Central de Compras · Cotações RFQ",
    lista: "Cotações (RFQs)",
    vazio: "Nenhuma cotação aberta. A cotação nasce quando o gestor aprova a RC.",
    indicadores: { abertas: "RFQs abertas", criticos: "Itens críticos", prazo: "Prazo médio (dias)", total: "Total de RFQs" },
    abrirRfq: "Abrir cotação",
    status: { setup: "Em setup", convites: "Convites enviados", propostas: "Propostas preenchidas", aprovacao: "Em aprovação", concluida: "OC gerada" },
    rodada: (n: number) => `Rodada ${n}`,
    etapas: ["Fornecedores", "Propostas", "Aprovação", "OC gerada", "Enviada ao ERP"],
    abas: { fornecedores: "Fornecedores", propostas: "Propostas", mapa: "Mapa", selecao: "Seleção", rodada: "Rodada de Negociação" },
    cabecalho: { item: "Item", quantidade: "Quantidade", estimado: "Valor estimado (BRL)", categoria: "Categoria", centro: "Centro de custo", necessario: "Necessário até", convidados: "Convidados", propostas: "Propostas" },

    caixa: "Caixa de convites",
    caixaVazia: "Nenhum fornecedor na caixa. Clique em + Adicionar nos sugeridos abaixo.",
    sugeridos: "Fornecedores da base para a categoria",
    homologado: "homologado",
    adicionar: "+ Adicionar",
    remover: "Remover",
    adicionarTodos: "Adicionar todos",
    enviarConvites: (n: number) => (n === 1 ? "Enviar 1 convite" : `Enviar ${n} convites`),
    minimo: "Adicione pelo menos dois fornecedores para comparar.",
    jaConvidados: "Já convidados",
    respondido: "Respondido",
    semResposta: "Sem resposta",
    aguardando: "Aguardando",

    propostasVazio: "As propostas aparecem aqui depois que os convites forem enviados.",
    chegando: "Convites enviados. As propostas estão chegando...",
    resumoPropostas: { convidados: "Convidados", responderam: "Responderam", melhor: "Melhor preço" },
    colunas: { fornecedor: "Fornecedor", status: "Status", unitario: "Preço unitário", total: "Total", prazo: "Prazo", pagamento: "Pagamento" },
    dias: (n: number) => `${n} dias`,
    gerarMapa: "Gerar mapa comparativo (IA)",

    mapaVazio: "Gere o mapa na aba Propostas para comparar os fornecedores.",
    mapaTitulo: "Mapa comparativo: item × fornecedor",
    melhorPreco: "melhor preço",
    melhorPrazo: "melhor prazo",
    insights: "Insights da MIA",
    insightMelhor: "Melhor combinação por linha",
    insightOutliers: "Outliers de preço",
    insightRiscos: "Riscos",
    novaRodada: "Abrir nova rodada",
    novaRodadaFeita: "Rodada 2 em vigor: os fornecedores revisaram os preços.",
    irSelecao: "Ir para a seleção",

    selecaoVazia: "A seleção abre depois do mapa comparativo.",
    selecaoTitulo: "Seleção de vencedores por linha",
    totalGeral: "Total geral",
    economia: "Economia sobre o estimado",
    acima: "Acima do estimado",
    concluir: "Concluir (enviar para aprovação)",
    escolha: "Escolha um fornecedor para concluir.",
    emAprovacao: (total: string) => `Seleção concluída (em aprovação). Total: ${total}. Aguardando aprovação por alçada.`,
    aprovada: (oc: string) => `Seleção aprovada. Ordem de compra ${oc} gerada e enviada ao ERP.`,

    rodadaTitulo: "Rodada de Negociação",
    rodadaSub: "Acompanhe em qual rodada de negociação cada fornecedor está nesta cotação.",
    vigente: "Vigente",
    encerrada: "Encerrada",
    melhorDaRodada: "Melhor preço",
  },

  fecho: {
    eyebrow: "Processo concluído",
    titulo: "Da requisição à ordem de compra, sem sair do Nexo.",
    lead: "Você acabou de fazer, em minutos, o que costuma levar dias entre e-mails e planilhas. No Nexo de verdade, os convites, as propostas e a integração com o ERP são reais.",
    numeros: { oc: "Ordem de compra", fornecedores: "Fornecedores convidados", propostas: "Propostas comparadas", rodadas: "Rodadas de negociação", economia: "Economia sobre o estimado" },
    ctaTitulo: "Quer ver com os dados da sua empresa?",
    ctaTexto: "O time mostra o Nexo com as suas categorias, as suas alçadas e a integração com o seu ERP.",
    whatsapp: "Conversar no WhatsApp",
    whatsappHref: "https://wa.me/5515998714091?text=Ol%C3%A1%21%20Testei%20o%20Nexo%20Demo%20e%20quero%20conversar.",
    formulario: "Enviar uma mensagem",
    formularioHref: "/#contato",
    conhecer: "Conhecer o Nexo",
    conhecerHref: "/nexo",
    refazer: "Refazer a demonstração",
    naoViu: "O que a demonstração não mostra",
    naoViuItens: ["Spend e notas fiscais", "Sala de comando e dashboards", "Alçadas, regras de cotação e master data", "Integração com o ERP e com o e-mail dos fornecedores"],
  },

  /** Dados fictícios. Fornecedores inventados; os domínios terminam em .example, que não existe. */
  fornecedores: [
    { id: "alfa", nome: "Alfa Suprimentos Ltda", email: "comercial@alfasuprimentos.example", pagamento: "28 dias" },
    { id: "horizonte", nome: "Distribuidora Horizonte", email: "vendas@horizonte.example", pagamento: "30 dias" },
    { id: "prisma", nome: "Prisma Comércio e Serviços", email: "cotacao@prisma.example", pagamento: "45 dias" },
    { id: "nortesul", nome: "Norte Sul Atacado", email: "propostas@nortesul.example", pagamento: "21 dias" },
  ],

  catalogo: [
    {
      id: "notebook",
      nome: "Notebook 14 polegadas, i7, 32 GB",
      tipo: "Ativo",
      categoria: "TI e Equipamentos",
      unidade: "UN",
      referenciaCentavos: 720_000,
      fornecedores: [
        { id: "alfa", fator: 0.968, prazoDias: 12, responde: true },
        { id: "horizonte", fator: 0.942, prazoDias: 20, responde: true },
        { id: "prisma", fator: 1.035, prazoDias: 7, responde: true },
        { id: "nortesul", fator: 1, prazoDias: 15, responde: false },
      ],
    },
    {
      id: "cadeira",
      nome: "Cadeira ergonômica com apoio lombar",
      tipo: "Ativo",
      categoria: "Administrativo e Escritório",
      unidade: "UN",
      referenciaCentavos: 145_000,
      fornecedores: [
        { id: "alfa", fator: 0.985, prazoDias: 10, responde: true },
        { id: "horizonte", fator: 1.04, prazoDias: 6, responde: true },
        { id: "prisma", fator: 1, prazoDias: 14, responde: false },
        { id: "nortesul", fator: 0.931, prazoDias: 18, responde: true },
      ],
    },
    {
      id: "luva",
      nome: "Luva de segurança nitrílica (par)",
      tipo: "Uso e Consumo",
      categoria: "EPI e Segurança",
      unidade: "PAR",
      referenciaCentavos: 1_890,
      fornecedores: [
        { id: "alfa", fator: 1.02, prazoDias: 5, responde: true },
        { id: "horizonte", fator: 1, prazoDias: 9, responde: false },
        { id: "prisma", fator: 0.915, prazoDias: 12, responde: true },
        { id: "nortesul", fator: 0.957, prazoDias: 8, responde: true },
      ],
    },
    {
      id: "toner",
      nome: "Toner para impressora laser, ciano",
      tipo: "Uso e Consumo",
      categoria: "Administrativo e Escritório",
      unidade: "UN",
      referenciaCentavos: 68_900,
      fornecedores: [
        { id: "alfa", fator: 0.949, prazoDias: 9, responde: true },
        { id: "horizonte", fator: 0.992, prazoDias: 4, responde: true },
        { id: "prisma", fator: 1.06, prazoDias: 11, responde: true },
        { id: "nortesul", fator: 1, prazoDias: 10, responde: false },
      ],
    },
  ] satisfies ItemCatalogo[] as ItemCatalogo[],

  /** O que a MIA preenche quando a pessoa pede. */
  preenchimentoMia: { item: "notebook", qtd: 10, urgencia: "Alta", centro: "TI-001 · Tecnologia", diasAteNecessario: 20 },

  /** Textos dos insights, montados com os números do mapa. */
  insightsTextos: {
    melhor: (item: string, fornecedor: string, unitario: string) => `${item} → ${fornecedor} (${unitario} por unidade): menor preço cotado.`,
    prazo: (fornecedor: string, dias: number, extra: string) => `${fornecedor} entrega em ${dias} dias, o menor prazo, por ${extra} a mais no total.`,
    prazoIgual: (fornecedor: string, dias: number) => `${fornecedor} tem o menor preço e o menor prazo (${dias} dias).`,
    outlier: (fornecedor: string, pct: string) => `${fornecedor} cotou ${pct} acima do menor preço.`,
    semOutlier: "Nenhuma proposta destoa das demais.",
    semResposta: (fornecedor: string) => `${fornecedor} foi convidado e não respondeu: a comparação segue sem ele.`,
    poucas: "Só uma proposta recebida: sem concorrência, o poder de negociação cai.",
    rodada: "Ainda há espaço para uma rodada de negociação antes de selecionar.",
    rodada2: (pct: string) => `A rodada 2 baixou o melhor preço em ${pct}.`,
  },

  email: {
    assunto: "Seu acesso ao Nexo Demo",
    ola: (nome: string) => `Olá, ${nome}.`,
    texto: "O seu acesso ao Nexo Demo está liberado. É um ambiente de demonstração com dados fictícios: você abre uma requisição de compra e leva o processo até a ordem de compra.",
    botao: "Abrir o Nexo Demo",
    volta: "Guarde este e-mail: o botão leva você de volta à demonstração quando quiser.",
    conversa: "Quer ver o Nexo com os dados da sua empresa? Responda este e-mail ou fale com o time:",
  },
} as const;
