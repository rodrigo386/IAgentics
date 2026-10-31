import { diagnose } from "@/lib/content";

/**
 * As regras da Diagnose de Compras (/diagnose-compras, 2026-10-31): a chave
 * de cada resposta, a média por pilar, o nível da escala e a validação que o
 * servidor faz antes de mandar o e-mail para a equipe.
 *
 * Funções puras, usadas pelo navegador (prévia) e pelo servidor (e-mail): os
 * dois calculam com o MESMO código, então o número que a pessoa vê na prévia é
 * o número que chega à equipe. O servidor nunca aceita o resumo pronto do
 * navegador; recalcula a partir das notas.
 */

export type Papel = "gestor" | "time";

/** As notas de um processo: hoje (h), potencial em 12 meses (p) e impacto (i). */
export type Nota = { h?: number; p?: number; i?: number };

/** Respostas por chave "pilar-processo" (índices a partir de 0). */
export type Respostas = Record<string, Nota>;

export type Identificacao = {
  nome: string;
  email: string;
  empresa: string;
  cargo: string;
  whatsapp: string;
  papel: Papel | "";
  consentimento: boolean;
};

export const chave = (pilar: number, processo: number) => `${pilar}-${processo}`;

export const TOTAL_PROCESSOS = diagnose.pilares.reduce((n, p) => n + p.processos.length, 0);

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const nota = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;

/** O que falta no passo de identificação, na ordem do formulário. */
export function faltasDaIdentificacao(id: Identificacao): (keyof typeof diagnose.identificacao.faltas)[] {
  const faltas: (keyof typeof diagnose.identificacao.faltas)[] = [];
  if (!id.nome.trim()) faltas.push("nome");
  if (!EMAIL.test(id.email.trim())) faltas.push("email");
  if (!id.empresa.trim()) faltas.push("empresa");
  if (!id.cargo.trim()) faltas.push("cargo");
  if (id.papel !== "gestor" && id.papel !== "time") faltas.push("papel");
  if (!id.consentimento) faltas.push("consentimento");
  return faltas;
}

/** O processo está respondido: hoje sempre; potencial e impacto só para gestor. */
export function respondido(n: Nota | undefined, papel: Papel | ""): boolean {
  if (!n || !nota(n.h)) return false;
  return papel !== "gestor" || (nota(n.p) && nota(n.i));
}

/**
 * Marca uma nota mantendo a regra da régua: o potencial em 12 meses nunca fica
 * abaixo de hoje. Subir o hoje acima do potencial puxa o potencial junto;
 * baixar o potencial abaixo de hoje para no hoje.
 */
export function marcar(atual: Nota | undefined, campo: keyof Nota, valor: number): Nota {
  const n: Nota = { ...atual, [campo]: valor };
  if (campo === "h" && n.p !== undefined && n.p < valor) n.p = valor;
  if (campo === "p" && n.h !== undefined && valor < n.h) n.p = n.h;
  return n;
}

const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export type ResumoPilar = { nome: string; curto: string; hoje: number | null; potencial: number | null };
export type Resumo = { geral: number | null; pilares: ResumoPilar[] };

export function resumir(r: Respostas, papel: Papel | ""): Resumo {
  const pilares = diagnose.pilares.map((p, pi) => {
    const ns = p.processos.map((_, ii) => r[chave(pi, ii)] ?? {});
    return {
      nome: p.nome,
      curto: p.curto,
      hoje: media(ns.map((n) => n.h).filter(nota)),
      potencial: papel === "gestor" ? media(ns.map((n) => n.p).filter(nota)) : null,
    };
  });
  const todas = diagnose.pilares.flatMap((p, pi) => p.processos.map((_, ii) => r[chave(pi, ii)]?.h)).filter(nota);
  return { geral: media(todas), pilares };
}

/** O nível da escala para a média geral: a parte inteira (3,8 é "Definido"). */
export function nivel(geral: number) {
  return diagnose.escala[Math.max(0, Math.min(4, Math.floor(geral) - 1))];
}

/** O pilar com a maior distância entre o potencial e hoje (só gestor; null sem salto). */
export function maiorSalto(resumo: Resumo): ResumoPilar | null {
  let melhor: ResumoPilar | null = null;
  for (const p of resumo.pilares) {
    if (p.hoje === null || p.potencial === null) continue;
    const salto = p.potencial - p.hoje;
    if (salto > 0 && (!melhor || salto > melhor.potencial! - melhor.hoje!)) melhor = p;
  }
  return melhor;
}

/** Média com uma casa e vírgula, como se escreve no Brasil. */
export const decimal = (v: number) => v.toFixed(1).replace(".", ",");

export type EnvioValido = Omit<Identificacao, "papel" | "consentimento"> & { papel: Papel; respostas: Respostas };

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Valida o corpo do POST /api/diagnose. Exige a identificação completa, a
 * autorização e TODOS os processos respondidos conforme o papel. Guarda só as
 * chaves que existem no questionário: nada inventado pelo cliente chega ao
 * e-mail.
 */
export function validarEnvio(corpo: unknown): { ok: true; dados: EnvioValido } | { ok: false; motivo: string } {
  const c = (corpo ?? {}) as Record<string, unknown>;
  const id: Identificacao = {
    nome: texto(c.nome, 120),
    email: texto(c.email, 200),
    empresa: texto(c.empresa, 160),
    cargo: texto(c.cargo, 120),
    whatsapp: texto(c.whatsapp, 40),
    papel: c.papel === "gestor" || c.papel === "time" ? c.papel : "",
    consentimento: c.consentimento === true,
  };
  const faltas = faltasDaIdentificacao(id);
  if (faltas.length) return { ok: false, motivo: faltas[0] };

  const brutas = (c.respostas ?? {}) as Record<string, unknown>;
  const respostas: Respostas = {};
  for (const [pi, p] of diagnose.pilares.entries()) {
    for (const ii of p.processos.keys()) {
      const k = chave(pi, ii);
      const b = (brutas[k] ?? {}) as Record<string, unknown>;
      const n: Nota = { h: b.h as number };
      if (id.papel === "gestor") Object.assign(n, { p: b.p as number, i: b.i as number });
      if (!respondido(n, id.papel)) return { ok: false, motivo: "respostas" };
      if (n.p !== undefined && n.p < n.h!) n.p = n.h;
      respostas[k] = n;
    }
  }
  const { consentimento: _, ...resto } = id;
  return { ok: true, dados: { ...resto, papel: id.papel as Papel, respostas } };
}
