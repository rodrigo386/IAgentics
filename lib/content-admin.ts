/**
 * Strings do painel (/admin). Arquivo separado de content.ts porque nada aqui
 * é público: não entra em sitemap, não é indexado, e o tom é de ferramenta
 * interna, não de site.
 */
export const admin = {
  meta: { titulo: "Painel" },
  titulo: "Painel",
  lead: "Visitas do site, vendas do catálogo e lista de espera do lançamento na Solution.",

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
} as const;
