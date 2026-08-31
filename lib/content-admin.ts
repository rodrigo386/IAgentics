/**
 * Strings do painel (/admin). Arquivo separado de content.ts porque nada aqui
 * é público: não entra em sitemap, não é indexado, e o tom é de ferramenta
 * interna, não de site.
 */
export const admin = {
  meta: { titulo: "Painel" },
  titulo: "Painel",
  lead: "Visitas do site e lista de espera do lançamento na Solution.",

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
