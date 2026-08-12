/**
 * Fonte única de texto da plataforma (/app), irmã de lib/content.ts.
 * Mesma regra do site: nenhuma string visível mora em componente.
 */
export const plataforma = {
  nome: "IAgentics Academy",
  shell: {
    meusCursos: "Meus cursos",
    conta: "Conta",
    /* Só aparece para admin, conferido no banco (nunca no JWT). */
    administracao: "Administração",
    sair: "Sair",
  },
  entrar: {
    titulo: "Entrar na plataforma",
    email: "E-mail",
    senha: "Senha",
    botao: "Entrar",
    semConta: "Ainda não tem conta?",
    criarConta: "Criar conta",
    erroCredenciais: "E-mail ou senha incorretos",
    sessaoExpirada: "Sua sessão expirou. Entre de novo para continuar.",
  },
  criarConta: {
    titulo: "Criar conta",
    nome: "Nome",
    email: "E-mail",
    senha: "Senha",
    botao: "Criar conta",
    jaTem: "Já tem conta?",
    entrar: "Entrar",
    emailExiste: "Este e-mail já tem conta. Entre com sua senha ou peça um link de acesso.",
    nomeCurto: "Informe seu nome completo.",
    senhaCurta: "A senha precisa de pelo menos 8 caracteres.",
  },
  painel: {
    continuar: "Continue de onde parou",
    catalogo: "Cursos",
    seloAssine: "Assine para acessar",
    ctaAssinar: "Falar com a IAgentics",
    /* Ciclo 2 troca o CTA acima pelo checkout. */
    horas: "h",
  },
  curso: {
    continuar: "Continuar",
    comecar: "Começar o curso",
    gratis: "Grátis",
    aulas: "aulas",
    concluidaDe: (feitas: number, total: number) => `${feitas} de ${total} aulas concluídas`,
    /* Curso publicado antes das aulas existirem (catálogo espelha o site). */
    emProducao: "As aulas deste curso estão em gravação e chegam em breve.",
  },
  aula: {
    marcarConcluida: "Marcar como concluída",
    proximaAula: "Próxima aula",
    concluida: "Aula concluída",
    bloqueadaTitulo: "Esta aula faz parte da assinatura",
    bloqueadaTexto: "Assine o acervo da Academy para assistir esta e todas as outras aulas.",
    bloqueadaCta: "Falar com a IAgentics",
    semVideo: "Esta aula está em produção. O vídeo chega em breve.",
    videoFalhou: "O vídeo não carregou.",
    recarregar: "Recarregar",
    aulasDoCurso: "Aulas do curso",
  },
  conta: {
    titulo: "Sua conta",
    nome: "Nome",
    email: "E-mail",
    salvar: "Salvar",
    salvo: "Salvo.",
    trocarSenha: "Trocar senha",
    novaSenha: "Nova senha",
    senhaTrocada: "Senha atualizada.",
    assinatura: "Assinatura",
    statusAtiva: (ate: string) => `Ativa até ${ate}`,
    statusManual: "Liberada manualmente",
    statusInadimplente: "Pagamento pendente",
    statusCancelada: "Cancelada",
    statusNenhuma: "Sem assinatura",
  },
} as const;
