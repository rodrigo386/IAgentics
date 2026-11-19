/**
 * Calculadora de custo real do fornecedor na Reforma Tributária (2026-11-18,
 * pedido do Rodrigo: "página para indexação, cliques do Google e leads",
 * inspirada nas calculadoras que a Receita publicou em github.com/ReceitaFederal).
 *
 * Regras puras: o navegador calcula na hora e o servidor refaz a mesma conta
 * antes de mandar o e-mail, com o mesmo código (lib/diagnose.ts faz igual).
 *
 * O que a conta olha: SÓ IBS e CBS. ICMS, ISS, IPI e IS, que convivem com os
 * tributos novos até 2032, ficam de fora, e a página diz isso. O valor de cada
 * cotação é o TOTAL da nota (o que sai do caixa), porque é o número que o
 * comprador tem na mão.
 *
 * - Fornecedor no regime regular (ou do Simples que recolhe IBS e CBS por fora,
 *   LC 214, art. 41, § 3º): o crédito é o IBS e a CBS destacados, ou seja,
 *   total × t / (1 + t), já que os dois são cobrados "por fora".
 * - Fornecedor do Simples que recolhe tudo no DAS: o crédito é o montante
 *   devido no Simples (art. 47, § 9º, II), que a nota informa em percentual.
 *   Sem o percentual, a conta usa zero e avisa.
 * - Comprador fora do regime regular (ou compra de uso pessoal, art. 57):
 *   não há crédito para ninguém.
 */

/** Endereço da página. Na prévia; ao promover, vira "/reforma-tributaria-compras". */
export const ROTA_REFORMA = "/preview/reforma-tributaria-compras";

export const ANOS = [2027, 2028, 2029, 2030, 2031, 2032, 2033] as const;
export type Ano = (typeof ANOS)[number];

/**
 * Alíquota de referência da CBS calculada pelo TCU em 28/10/2026 (o Senado
 * fixa até 15/12/2026). Mudou? Troque aqui e o texto de `reforma.fontes`.
 */
export const CBS_REFERENCIA = 11.3;
/** Estimativa da alíquota de referência do IBS (Resolução CGIBS nº 14/2026). */
export const IBS_REFERENCIA = 18.7;

/** Parcela do IBS cheio em cada ano da transição (arts. 361 a 365, estimativa proporcional). */
const FRACAO_IBS: Record<Ano, number> = { 2027: 0, 2028: 0, 2029: 0.1, 2030: 0.2, 2031: 0.3, 2032: 0.4, 2033: 1 };

export const REDUCOES = [0, 30, 60, 100] as const;
export type Reducao = (typeof REDUCOES)[number];

const arred = (n: number, casas = 2) => Math.round(n * 10 ** casas) / 10 ** casas;

/**
 * CBS e IBS do ano, em pontos percentuais.
 * 2027 e 2028: CBS = referência − 0,1 p.p. (art. 347) e IBS = 0,05% + 0,05% (art. 344).
 * 2029 a 2032: IBS proporcional à saída do ICMS e do ISS. 2033: os dois cheios.
 */
export function aliquotasDoAno(ano: Ano, cbsRef = CBS_REFERENCIA, ibsRef = IBS_REFERENCIA): { cbs: number; ibs: number } {
  if (ano <= 2028) return { cbs: arred(cbsRef - 0.1), ibs: 0.1 };
  return { cbs: arred(cbsRef), ibs: arred(ibsRef * FRACAO_IBS[ano]) };
}

export type Regime = "regular" | "simples_fora" | "simples_das";
export const REGIMES: Regime[] = ["regular", "simples_fora", "simples_das"];

export type Cotacao = {
  nome: string;
  regime: Regime;
  /** Total da nota, em reais. */
  valor: number;
  /** Só no Simples pelo DAS: IBS + CBS devidos no Simples, em % do total da nota. Null = não sei. */
  percentualSimples: number | null;
};

export type Cenario = {
  ano: Ano;
  reducao: Reducao;
  /** A empresa compradora apura no regime regular e a compra não é de uso pessoal. */
  compradorCredita: boolean;
  cbsRef: number;
  ibsRef: number;
  /** Quantas vezes por ano a compra se repete (opcional; 0 ou null = não informado). */
  vezesPorAno: number | null;
  cotacoes: Cotacao[];
};

export type Resultado = {
  nome: string;
  regime: Regime;
  valor: number;
  credito: number;
  liquido: number;
  /** Diferença para a de menor custo líquido (0 na melhor). */
  acimaDaMelhor: number;
  melhor: boolean;
  semPercentual: boolean;
  /** Simples pelo DAS: o total de nota que empata com a melhor cotação do regime regular. */
  empate: number | null;
};

export function taxaEfetiva(c: Pick<Cenario, "ano" | "reducao" | "cbsRef" | "ibsRef">): number {
  const { cbs, ibs } = aliquotasDoAno(c.ano, c.cbsRef, c.ibsRef);
  return ((cbs + ibs) * (100 - c.reducao)) / 100;
}

/**
 * Arredondamento como o da calculadora da Receita (ADR003 dela): a CBS e o IBS
 * da nota são arredondados ao centavo separadamente, "meio para o par" (HALF_EVEN). Contas em BigInt, com a
 * alíquota em milionésimos de ponto percentual, para não herdar erro de ponto
 * flutuante. Conferido em lib/reforma-receita.json (scripts/conferir-receita.ts).
 */
const ESCALA = 1_000_000n;
function centavosDoTributo(baseCentavos: bigint, aliquotaPct: number): bigint {
  const num = baseCentavos * BigInt(Math.round(aliquotaPct * 1_000_000));
  const den = 100n * ESCALA;
  const q = num / den;
  const resto = num - q * den;
  if (resto * 2n > den || (resto * 2n === den && q % 2n === 1n)) return q + 1n;
  return q;
}

/**
 * IBS e CBS destacados numa nota cujo TOTAL é `valor` (o comprador digita o
 * total). Acha a base que, somada aos tributos arredondados um a um, dá o
 * total; o crédito é a soma desses tributos. O IBS entra como um valor só
 * (estadual + municipal), que é o total que a Receita devolve (vIBS).
 */
function impostoDestacado(valor: number, cbsEf: number, ibsEf: number): number {
  const total = BigInt(Math.round(valor * 100));
  const componentes = [cbsEf, ibsEf];
  const imposto = (b: bigint) => componentes.reduce((s, a) => s + centavosDoTributo(b, a), 0n);
  const t = (cbsEf + ibsEf) / 100;
  const chute = BigInt(Math.round(Number(total) / (1 + t)));
  let melhor = { b: chute, erro: -1n };
  for (let d = -3n; d <= 3n; d++) {
    const b = chute + d;
    if (b < 0n) continue;
    const erro = total - b - imposto(b);
    const abs = erro < 0n ? -erro : erro;
    if (melhor.erro < 0n || abs < melhor.erro) melhor = { b, erro: abs };
    if (abs === 0n) break;
  }
  return Number(imposto(melhor.b)) / 100;
}

export function calcular(c: Cenario): { taxa: number; resultados: Resultado[]; diferencaAnual: number | null } {
  const taxa = taxaEfetiva(c);
  const { cbs, ibs } = aliquotasDoAno(c.ano, c.cbsRef, c.ibsRef);
  const fator = (100 - c.reducao) / 100;
  const base = c.cotacoes.map((q) => {
    let credito = 0;
    if (c.compradorCredita) {
      if (q.regime === "simples_das") credito = (q.valor * (q.percentualSimples ?? 0)) / 100;
      else credito = impostoDestacado(q.valor, cbs * fator, ibs * fator);
    }
    credito = arred(credito);
    return { q, credito, liquido: arred(q.valor - credito) };
  });
  const melhor = Math.min(...base.map((b) => b.liquido));
  const regulares = base.filter((b) => b.q.regime !== "simples_das").map((b) => b.liquido);
  const melhorRegular = regulares.length ? Math.min(...regulares) : null;
  const resultados = base.map<Resultado>(({ q, credito, liquido }) => {
    const pct = c.compradorCredita ? (q.percentualSimples ?? 0) : 0;
    return {
      nome: q.nome,
      regime: q.regime,
      valor: q.valor,
      credito,
      liquido,
      acimaDaMelhor: arred(liquido - melhor),
      melhor: liquido === melhor,
      semPercentual: q.regime === "simples_das" && c.compradorCredita && q.percentualSimples === null,
      empate: q.regime === "simples_das" && melhorRegular !== null && pct < 100 ? arred(melhorRegular / (1 - pct / 100)) : null,
    };
  });
  const pior = Math.max(...base.map((b) => b.liquido));
  const diferencaAnual = c.vezesPorAno && c.vezesPorAno > 0 && base.length > 1 ? arred((pior - melhor) * c.vezesPorAno) : null;
  return { taxa: arred(taxa, 4), resultados, diferencaAnual };
}

// ─── Validação (o servidor recebe o cenário e o contato) ───────────────────

export const MAX_COTACOES = 4;
const MAX_VALOR = 1e10;

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : NaN;
  return Number.isFinite(n) ? n : null;
};
const texto = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

export function lerCenario(v: unknown): Cenario | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const ano = num(o.ano);
  const reducao = num(o.reducao);
  if (!ANOS.includes(ano as Ano) || !REDUCOES.includes(reducao as Reducao)) return null;
  const cbsRef = num(o.cbsRef) ?? CBS_REFERENCIA;
  const ibsRef = num(o.ibsRef) ?? IBS_REFERENCIA;
  if (cbsRef < 0.2 || cbsRef > 40 || ibsRef < 0 || ibsRef > 40) return null;
  const vezes = num(o.vezesPorAno);
  if (!Array.isArray(o.cotacoes) || o.cotacoes.length < 1 || o.cotacoes.length > MAX_COTACOES) return null;
  const cotacoes: Cotacao[] = [];
  for (const [i, bruto] of o.cotacoes.entries()) {
    if (!bruto || typeof bruto !== "object") return null;
    const q = bruto as Record<string, unknown>;
    const valor = num(q.valor);
    if (!REGIMES.includes(q.regime as Regime) || valor === null || valor <= 0 || valor > MAX_VALOR) return null;
    const p = q.regime === "simples_das" ? num(q.percentualSimples) : null;
    if (p !== null && (p < 0 || p > 100)) return null;
    cotacoes.push({ nome: texto(q.nome, 60) || `Cotação ${i + 1}`, regime: q.regime as Regime, valor, percentualSimples: p });
  }
  return {
    ano: ano as Ano,
    reducao: reducao as Reducao,
    compradorCredita: o.compradorCredita !== false,
    cbsRef,
    ibsRef,
    vezesPorAno: vezes !== null && vezes > 0 && vezes <= 100_000 ? Math.round(vezes) : null,
    cotacoes,
  };
}

export type Contato = { nome: string; email: string; empresa: string; cargo: string; avisarAliquotas: boolean };
export type MotivoContato = "nome" | "email" | "empresa" | "consentimento" | "cenario";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validarPedido(
  v: unknown,
): { ok: true; contato: Contato; cenario: Cenario } | { ok: false; motivo: MotivoContato } {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const nome = texto(o.nome, 120);
  const email = texto(o.email, 160).toLowerCase();
  const empresa = texto(o.empresa, 120);
  if (nome.length < 2) return { ok: false, motivo: "nome" };
  if (!EMAIL.test(email)) return { ok: false, motivo: "email" };
  if (empresa.length < 2) return { ok: false, motivo: "empresa" };
  if (o.consentimento !== true) return { ok: false, motivo: "consentimento" };
  const cenario = lerCenario(o.cenario);
  if (!cenario) return { ok: false, motivo: "cenario" };
  return { ok: true, contato: { nome, email, empresa, cargo: texto(o.cargo, 120), avisarAliquotas: o.avisarAliquotas === true }, cenario };
}

/** Real brasileiro com centavos, para a tela e para o e-mail. */
export function reais(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
export function pct(n: number): string {
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}
