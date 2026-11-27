/**
 * Os eventos medidos dentro das páginas (a /cursos desde 2026-10-29; a
 * /bolsas desde 2026-11-23, no dia do lançamento do Desafio Prova Real, com
 * 41 visitas e nenhuma inscrição até as 10h). A lista é FECHADA: o endpoint é
 * público (como o de visitas), então o que ele aceita define quantas linhas o
 * banco ganha por dia. Evento novo = entra aqui, no painel (/admin/cursos ou
 * /admin/bolsas) e na política de privacidade.
 *
 * Os da /bolsas vão na mesma tabela (eventos_cursos, dia + evento), com o
 * prefixo "bolsas_": é ele que separa os dois painéis.
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

/** Campos do formulário da /bolsas que o NAVEGADOR pode barrar (required, type=email…). */
export const CAMPOS_BOLSAS = ["nome", "empresa", "email", "whatsapp", "instagram", "linkedin", "problema", "regulamento", "cienciaDados"] as const;
/** Motivos com que o SERVIDOR recusa a inscrição (as chaves de bolsas.formulario.erros). */
export const MOTIVOS_BOLSAS = ["nome", "email", "whatsapp", "perfis", "problema", "regulamento", "cienciaDados", "fechadas", "limite", "falha"] as const;

export const EVENTOS_BOLSAS = [
  "bolsas_rolagem_50",
  "bolsas_rolagem_100",
  "bolsas_cta_topo", // "Quero participar" da capa (#cta-bolsas)
  "bolsas_cta_fixo", // o botão fixo (BarraBolsas)
  "bolsas_formulario_inicio", // tocou no primeiro campo
  "bolsas_formulario_envio", // o envio saiu do navegador para o servidor
  "bolsas_formulario_ok", // inscrição registrada
  ...CAMPOS_BOLSAS.map((c) => `bolsas_bloqueio_${c}` as const), // o navegador barrou o envio neste campo
  ...MOTIVOS_BOLSAS.map((m) => `bolsas_erro_${m}` as const), // o servidor recusou por este motivo
] as const;

/** Motivos com que o pedido do comparativo da calculadora é barrado, no navegador
 *  ou no servidor (as chaves de reforma.lead.erros que o formulário usa). */
export const MOTIVOS_REFORMA = ["cenario", "nome", "email", "consentimento", "limite", "falha"] as const;

/** A calculadora da Reforma Tributária (/reforma-tributaria-compras), medida desde
 *  2026-11-27: de 210 visitas em 30 dias saiu 1 pedido de comparativo, e sem estes
 *  eventos não dá para saber em que etapa as pessoas saem. */
export const EVENTOS_REFORMA = [
  "reforma_rolagem_50",
  "reforma_rolagem_100",
  "reforma_cta_topo", // "Comparar cotações" da capa (#cta-reforma)
  "reforma_calculo", // montou uma comparação com resultado (uma vez por visita)
  "reforma_formulario_inicio", // tocou num campo do pedido por e-mail
  "reforma_formulario_envio", // o pedido saiu do navegador para o servidor
  "reforma_formulario_ok", // pedido registrado
  ...MOTIVOS_REFORMA.map((m) => `reforma_erro_${m}` as const), // o pedido foi barrado por este motivo
] as const;

export const EVENTOS = [...EVENTOS_CURSOS, ...EVENTOS_BOLSAS, ...EVENTOS_REFORMA] as const;
export type EventoCursos = (typeof EVENTOS_CURSOS)[number];
export type EventoBolsas = (typeof EVENTOS_BOLSAS)[number];
export type EventoReforma = (typeof EVENTOS_REFORMA)[number];
export type Evento = (typeof EVENTOS)[number];

export function eventoValido(e: unknown): e is Evento {
  return typeof e === "string" && (EVENTOS as readonly string[]).includes(e);
}
