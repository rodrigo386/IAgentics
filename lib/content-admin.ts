/**
 * Strings do painel (/admin). Arquivo separado de content.ts porque nada aqui
 * é público: não entra em sitemap, não é indexado, e o tom é de ferramenta
 * interna, não de site.
 */
export const admin = {
  meta: { titulo: "Painel" },
  titulo: "Painel",
  lead: "Visitas do site, assinaturas da Solution, vendas avulsas antigas e lista de espera.",

  visitas: {
    titulo: "Visitas",
    ultimos7: "Últimos 7 dias",
    anteriores7: "7 dias anteriores",
    ultimos30: "Últimos 30 dias",
    total: "Total acumulado",
    desde: (dia: string) => `Medindo desde ${dia}`,
    semDados: "Ainda não há visitas registradas.",
    porDia: "Visitas por dia (30 dias)",
    porPagina: "Páginas mais visitadas (30 dias)",
    coluna: "Página",
    colunaVisitas: "Visitas",
    /* A ressalva fica NA TELA, não só no código: 'visitas' não é 'visitantes',
       e um painel que não diz isso vira número de apresentação errado. */
    nota: "Contamos visitas, não visitantes únicos — o medidor não identifica ninguém, por decisão de privacidade. Serve para comparar períodos, não como número absoluto de pessoas.",
  },

  /* De onde vêm (2026-09-09). Os rótulos explicam o balde, porque "site" e
     "indicacao" não se explicam sozinhos para quem abre o painel uma vez por
     semana. */
  origem: {
    titulo: "De onde vêm",
    entradas: "Entradas",
    paginasPorEntrada: "Páginas por entrada",
    desde: (dia: string) => `Medindo origem desde ${dia}`,
    semDados:
      "A medição de origem começou agora e ainda não registrou nenhuma chegada. Ela conta a PRIMEIRA página de cada visita, então aparece aqui a partir da próxima pessoa que abrir o site.",
    colunaOrigem: "Origem",
    colunaEntradas: "Entradas",
    porPagina: "Páginas de entrada (30 dias)",
    porPaginaNota:
      "Por onde as pessoas chegam, tirando quem veio de outra página do próprio site. É o que diz qual conteúdo traz gente de fora — diferente da tabela acima, onde um artigo aparece mesmo quando a pessoa chegou pela home.",
    nota: "Entrada é a primeira página de cada visita; a origem sai do hostname de quem indicou, sem caminho nem termo de busca. O balde é fechado: o que não reconhecemos vira Indicação.",
    rotulos: {
      direto: "Direto (sem referência)",
      busca: "Busca",
      ia: "Assistentes de IA",
      social: "Redes sociais",
      indicacao: "Indicação de outro site",
      site: "Do próprio site (recarga)",
      desconhecida: "Antes da medição",
    } as Record<string, string>,
  },

  /* O controle de "não me conte" (2026-09-09). Mora aqui, atrás do Basic Auth,
     porque só quem tem a credencial pode se descontar da medição. */
  interno: {
    titulo: "Este navegador",
    contando: "Suas visitas estão sendo contadas no painel.",
    contandoAviso:
      "A ~30 visitas por dia útil, algumas conferências internas já mexem no número. Desligue aqui se este navegador é da casa.",
    naoContando: "Este navegador não entra na medição.",
    desligar: "Parar de contar este navegador",
    ligar: "Voltar a contar este navegador",
    carregando: "Verificando…",
    nota: "A marca vale só para este navegador e este dispositivo — janela anônima e outra máquina recomeçam contando. Não alcança o Google Analytics, cuja exclusão é filtro de tráfego interno no painel do GA4.",
  },

  /* Assinaturas da Solution (2026-10-14). A liberação e a revogação na
     Solution são manuais (o Pecege faz); a coluna "Fazer" diz a quem. */
  assinaturas: {
    titulo: "Assinaturas da Solution",
    ativas: "Ativas",
    liberar: "A liberar",
    revogar: "A revogar",
    receita: "Receita mensal (ativas)",
    exportar: "Exportar CSV",
    nenhuma: "Nenhuma assinatura ainda.",
    colunaData: "Data",
    colunaAssinante: "Assinante",
    colunaStatus: "Status",
    colunaPagoAte: "Pago até",
    colunaFazer: "Fazer",
    colunaAcesso: "Acesso",
    botaoLiberar: "Marcar acesso liberado",
    botaoRevogar: "Marcar acesso revogado",
    cancelar: "Cancelar assinatura",
    confirmarCancelar: "Confirmar: parar de cobrar",
    liberadoEm: (data: string) => `Liberado em ${data}`,
    revogadoEm: (data: string) => `Revogado em ${data}`,
    canceladaEm: (data: string) => `Cancelada em ${data}`,
    status: {
      pendente: "Aguardando 1º pagamento",
      ativa: "Ativa",
      atrasada: "Atrasada",
      cancelada: "Cancelada",
      contestada: "Contestada",
      estornada: "Estornada",
      falhou: "Falhou",
    } as Record<string, string>,
    lgpd: "Dados pessoais coletados com consentimento para compartilhamento com o Pecege. O CPF não fica aqui: está no painel do Asaas. Cancelar aqui para a cobrança no Asaas; o acesso continua até o fim do mês pago.",
  },

  /* Vendas do catálogo (2026-09-22). Sem aviso automático ao Pecege — decisão
     do Rodrigo —, então o contador de "aguardando liberação" é o que impede
     uma venda paga de ficar sem acesso. */
  vendas: {
    titulo: "Vendas",
    aguardando: "Pagas aguardando liberação",
    pagas: "Vendas pagas",
    recebido: "Recebido",
    verTeste: "Ver vendas de teste",
    verReal: "Ver vendas reais",
    modoTeste: "Mostrando vendas de TESTE (prévia, preço reduzido).",
    exportar: "Exportar CSV",
    nenhuma: "Nenhuma venda ainda.",
    colunaData: "Data",
    colunaComprador: "Comprador",
    colunaCursos: "Cursos",
    colunaTotal: "Total",
    colunaStatus: "Status",
    colunaAcesso: "Acesso",
    liberar: "Marcar acesso liberado",
    liberadoEm: (data: string) => `Liberado em ${data}`,
    status: {
      pendente: "Aguardando pagamento",
      pago: "Pago",
      cancelado: "Cancelado",
      estornado: "Estornado",
      falhou: "Falhou",
    } as Record<string, string>,
    lgpd: "Dados pessoais coletados com consentimento para compartilhamento com o Pecege. O CPF não fica aqui: está no painel do Asaas.",
  },

  lista: {
    titulo: "Lista de espera",
    total: "Inscritos",
    ultimos7: "Nos últimos 7 dias",
    ultimoEm: "Última inscrição",
    nenhum: "Ninguém se inscreveu ainda.",
    exportar: "Exportar CSV",
    colunaNome: "Nome",
    colunaEmail: "E-mail",
    colunaData: "Inscrição",
    lgpd: "Estes dados são pessoais e foram coletados com consentimento para compartilhamento com o Pecege. Trate a exportação com o mesmo cuidado.",
  },

  conversao: {
    titulo: "Conversão da /cursos",
    visitas: "Visitas à /cursos",
    inscricoes: "Inscrições",
    taxa: "Taxa",
    nota: "Inscrições dividido por visitas nos últimos 30 dias. Como visitas não são pessoas, a taxa real por pessoa é maior — compare com o próprio histórico.",
  },

  variacao: {
    subiu: (p: string) => `▲ ${p}% vs. período anterior`,
    caiu: (p: string) => `▼ ${p}% vs. período anterior`,
    igual: "sem variação vs. período anterior",
    semBase: "sem base de comparação",
  },

  /** Link do /admin para o painel de cursos. */
  irParaCursos: "Painel da plataforma de cursos →",

  /** /admin/cursos (2026-10-16, pedido do Rodrigo: "controle mais completo da
   *  plataforma cursos, com dashboard, gráficos e fluxo do cliente"). */
  cursos: {
    meta: { titulo: "Painel de cursos" },
    titulo: "Plataforma de cursos",
    lead: "A assinatura da Solution, da visita na /cursos ao acesso liberado.",
    voltar: "← Painel geral",
    periodo: "Período",
    periodos: [7, 30, 90] as const,
    dias: (n: number) => `${n} dias`,
    /** Rótulo do período: "30 dias" quando pronto, "01/10 a 15/10" quando de/até. */
    rotuloPeriodo: (pronto: number | null, de: string, ate: string) => (pronto ? `${pronto} dias` : `${de} a ${ate}`),
    filtros: {
      titulo: "Filtros",
      personalizado: "De/até",
      de: "De",
      ate: "Até",
      busca: "Nome, e-mail ou telefone",
      etapa: "Etapa do fluxo",
      status: "Status",
      todas: "Todas",
      todos: "Todos",
      soPeriodo: "Só quem assinou no período",
      aplicar: "Aplicar filtros",
      limpar: "Limpar",
      nota: "O período vale para indicadores, funil e gráficos. Busca, etapa, status e \"só do período\" filtram o fluxo do cliente e a tabela.",
      resultado: (n: number, total: number) => (n === total ? `${total} assinaturas` : `${n} de ${total} assinaturas com os filtros`),
    },
    indicadores: {
      ativas: "Assinantes ativos",
      receita: "Receita recorrente mensal",
      receitaNota: "Ativos × R$ 49,90",
      conversao: "Visita → assinatura paga",
      conversaoNota: (pagas: number, visitas: number) => `${pagas} pagas / ${visitas} visitas na /cursos`,
      liberar: "Aguardando liberação",
      liberarNota: (atrasadas: number) => (atrasadas ? `${atrasadas} fora das 24 horas úteis` : "todas dentro das 24 horas úteis"),
      atrasadas: "Pagamento atrasado",
      canceladas: "Cancelamentos no período",
      canceladasNota: (base: number) => `de ${base} que já pagaram`,
    },
    funil: {
      titulo: "Funil do período",
      etapas: ["Visitas na /cursos", "Formulário enviado", "Pagaram", "Acesso liberado"] as const,
      taxa: (p: string) => `${p}% da etapa anterior`,
      nota: "As três últimas etapas contam as mesmas assinaturas: as iniciadas no período. Visitas não são pessoas: a mesma pessoa abrindo a página três vezes conta três.",
    },
    graficos: {
      visitas: "Visitas na /cursos por dia",
      assinaturas: "Assinaturas iniciadas por dia",
      pagas: "pagas",
      naoPagas: "ainda não pagas",
      origens: "De onde chegam as visitas da /cursos",
      semDados: "Sem dados no período.",
      maximo: (n: string) => `máx. ${n}`,
      total: "Total",
      media: "Média por dia",
      melhorDia: "Melhor dia",
      taxaPagas: "Pagaram",
      dicaVisitas: (dia: string, n: number) => `${dia}: ${n} ${n === 1 ? "visita" : "visitas"}`,
      dicaAssinaturas: (dia: string, iniciadas: number, pagas: number) => `${dia}: ${iniciadas} ${iniciadas === 1 ? "iniciada" : "iniciadas"}, ${pagas} ${pagas === 1 ? "paga" : "pagas"}`,
      numerosPorDia: "Ver os números de cada dia",
      colunaDia: "Dia",
      colunaVisitas: "Visitas na /cursos",
      colunaIniciadas: "Assinaturas iniciadas",
      colunaPagas: "Pagas",
      origem: {
        direto: "Direto (link digitado, colado no WhatsApp ou sem origem)",
        busca: "Busca",
        social: "Redes sociais",
        ia: "Assistentes de IA",
        site: "Outra página do site",
        indicacao: "Links em outros sites",
      } as Record<string, string>,
    },
    fluxo: {
      titulo: "Fluxo do cliente",
      lead: "Cada assinatura na etapa em que está. As colunas com ação pedem algo do time hoje.",
      etapas: {
        pagamento: { nome: "Aguardando pagamento", ajuda: "Assinou e não pagou a primeira fatura." },
        liberar: { nome: "Pago · liberar acesso", ajuda: "Pedir ao Pecege a liberação e marcar aqui. Prazo prometido: 24 horas úteis." },
        "com-acesso": { nome: "Com acesso", ajuda: "Pago e liberado na Solution." },
        atrasada: { nome: "Pagamento atrasado", ajuda: "Fatura vencida; o acesso vale até o fim do mês pago." },
        revogar: { nome: "Revogar acesso", ajuda: "Sem mês pago, contestado ou estornado: pedir ao Pecege para tirar o acesso." },
        encerrada: { nome: "Encerradas", ajuda: "Canceladas sem acesso, estornadas ou que falharam." },
      } as Record<string, { nome: string; ajuda: string }>,
      vazio: "Ninguém nesta etapa.",
      maisAntigas: (n: number) => `+ ${n} mais antigas, na tabela abaixo`,
      prazo: {
        "no-prazo": (h: string) => `${h} h úteis de 24`,
        "vence-logo": (h: string) => `${h} h úteis de 24 · vence logo`,
        atrasado: (h: string) => `${h} h úteis · fora do prazo`,
      } as Record<string, (h: string) => string>,
      assinouEm: (d: string) => `Assinou em ${d}`,
      pagoAte: (d: string) => `Pago até ${d}`,
      whatsapp: "WhatsApp",
      boasVindas: "Boas-vindas enviado",
    },
    tabela: { titulo: "Todas as assinaturas", exportar: "Exportar CSV" },
  },
} as const;
