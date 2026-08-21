import { admin } from "@/lib/content-admin";

/**
 * Mensagens das ações de empresa/contrato, resolvidas por CHAVE vinda da
 * querystring — mesmo padrão de mensagens-aluno.ts, e pela mesma razão: as
 * ações do /admin são form nativo + 303, não server action (armadilha 6 do
 * CLAUDE.md). Chave desconhecida na URL nunca vira texto na tela.
 */
const t = admin.empresas.mensagens;

export const SUCESSO_EMPRESA = {
  empresaCriada: t.empresaCriada,
  contratoCriado: t.contratoCriado,
  importados: t.importados,
  membroRemovido: t.membroRemovido,
  membroReadmitido: t.membroReadmitido,
} as const;

export const ERRO_EMPRESA = {
  sem_vagas: t.semVagas,
  lista_vazia: t.listaVazia,
  nao_encontrado: t.naoEncontrado,
  dados_invalidos: t.dadosInvalidos,
} as const;

export type ChaveSucessoEmpresa = keyof typeof SUCESSO_EMPRESA;
export type ChaveErroEmpresa = keyof typeof ERRO_EMPRESA;

export function ehSucessoEmpresa(v: string | undefined): v is ChaveSucessoEmpresa {
  return !!v && v in SUCESSO_EMPRESA;
}

export function ehErroEmpresa(v: string | undefined): v is ChaveErroEmpresa {
  return !!v && v in ERRO_EMPRESA;
}
