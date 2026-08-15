import { admin } from "@/lib/content-admin";
import type { ResultadoAcao } from "@/lib/admin/alunos";

/**
 * Mensagens das ações rápidas da ficha do aluno, resolvidas por CHAVE vinda da
 * querystring (?msg= / ?erro=). As ações redirecionam com a chave e a página
 * renderiza o texto NO SERVIDOR - nada de useActionState para esse feedback.
 *
 * Por quê (2026-08-15): sob carga, o React 19 descartava de forma
 * intermitente o resultado da action (POST 200, banco gravado, botão preso em
 * pending para sempre). Redirect é imune: com JS o roteador segue o 303; sem
 * JS (ou com o resultado descartado) o POST nativo do form segue o 303 do
 * mesmo jeito. A chave é validada contra os mapas abaixo - valor desconhecido
 * na URL nunca vira texto na tela.
 */
export type MotivoErro = Exclude<ResultadoAcao, { ok: true }>["motivo"];

export const MENSAGENS_SUCESSO = {
  acessoLiberado: admin.alunos.mensagens.acessoLiberado,
  acessoRevogado: admin.alunos.mensagens.acessoRevogado,
  salvo: admin.alunos.mensagens.salvo,
  contaDesativada: admin.alunos.mensagens.contaDesativada,
  contaReativada: admin.alunos.mensagens.contaReativada,
  emailConfirmadoOk: admin.alunos.mensagens.emailConfirmadoOk,
} as const;

export type ChaveSucesso = keyof typeof MENSAGENS_SUCESSO;

export function ehChaveSucesso(v: string | undefined): v is ChaveSucesso {
  return !!v && v in MENSAGENS_SUCESSO;
}

/** Mapeia o `motivo` tipado de ResultadoAcao para o texto pt-BR do content -
 *  a UI nunca inventa mensagem própria, sempre reflete o que a função decidiu.
 *  Aceita string solta (chave vinda de URL) e cai no genérico se não conhecer. */
export function mensagemErro(motivo: MotivoErro | string): string {
  const t = admin.alunos;
  switch (motivo) {
    case "auto":
      return t.mensagens.erroAuto;
    case "ja_tem_acesso":
      return t.mensagens.jaTemAcesso;
    case "ja_sem_acesso":
      return t.mensagens.jaSemAcesso;
    case "email_nao_confere":
      return t.acoes.emailNaoConfere;
    default:
      return t.mensagens.erroGenerico;
  }
}

export const MOTIVOS_ERRO: readonly string[] = ["auto", "ja_tem_acesso", "ja_sem_acesso", "email_nao_confere", "nao_encontrado"];
