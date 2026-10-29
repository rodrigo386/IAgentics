/**
 * Os eventos medidos dentro da /cursos (2026-10-29). A lista é FECHADA: o
 * endpoint é público (como o de visitas), então o que ele aceita define
 * quantas linhas o banco ganha por dia. Evento novo = entra aqui, no painel
 * (/admin/cursos) e na política de privacidade.
 */
export const EVENTOS_CURSOS = [
  "rolagem_50", // rolou até a metade da página
  "rolagem_100", // chegou ao fim da página
  "cta_topo", // clicou em "Assinar" no topo
  "cta_fixo", // clicou no botão fixo que acompanha a rolagem
  "formulario_inicio", // começou a preencher o formulário
  "formulario_envio", // apertou "Ir para o pagamento"
  "formulario_erro", // o envio voltou com erro (campo inválido, Asaas fora, etc.)
  "formulario_ok", // foi levado para a fatura
] as const;

export type EventoCursos = (typeof EVENTOS_CURSOS)[number];

export function eventoValido(e: unknown): e is EventoCursos {
  return typeof e === "string" && (EVENTOS_CURSOS as readonly string[]).includes(e);
}
