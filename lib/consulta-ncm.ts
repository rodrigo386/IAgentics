/**
 * Consulta de NCM na Reforma Tributária (2026-11-19, pedido do Rodrigo: "siga
 * com a consulta de NCM"). Lê lib/receita/tabela-ncm.json, exportado da base
 * da calculadora oficial da Receita Federal (licença MIT) por
 * scripts/tabela-receita.py.
 *
 * Usado só no servidor (a página renderiza o resultado): o JSON tem 1,2 MB e
 * não vai para o navegador.
 *
 * Como um NCM chega a um tratamento: a Receita liga PREFIXOS de NCM (2 a 8
 * dígitos) a classificações especiais, cada uma com a condição do anexo da LC
 * 214; exceções tiram NCMs (também por prefixo) de um vínculo. Um NCM pode ter
 * mais de um tratamento possível: qual vale depende da condição e da operação.
 */
import tabela from "./receita/tabela-ncm.json";

type Classe = {
  cClassTrib: string;
  cst: string;
  situacao: string;
  descricao: string;
  seletivo: boolean;
  reducao: { cbs?: number; ibs?: number };
  fundamento: { referencia: string; texto: string }[];
};
type Vinculo = { prefixo: string; classe: string; anexo: string | null; condicao: string; excecoes: string[] };
type Tabela = { commit: string; versaoBase: string | null; geradoEm: string; ncm: Record<string, string>; classes: Record<string, Classe>; vinculos: Vinculo[] };

const T = tabela as unknown as Tabela;

export const VERSAO_TABELA = { commit: T.commit, versaoBase: T.versaoBase, geradoEm: T.geradoEm };

/** "34011190" → "3401.11.90"; códigos curtos ficam nos níveis que têm. */
export function formatarNcm(c: string): string {
  if (c.length <= 4) return c;
  if (c.length <= 6) return `${c.slice(0, 4)}.${c.slice(4)}`;
  return `${c.slice(0, 4)}.${c.slice(4, 6)}.${c.slice(6)}`;
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** A hierarquia de um NCM de 8 dígitos: capítulo, posição, subposições, item. */
export function caminho(codigo: string): { codigo: string; descricao: string }[] {
  const niveis = [2, 4, 5, 6, 7, 8];
  return niveis.map((n) => codigo.slice(0, n)).filter((c, i, a) => a.indexOf(c) === i && T.ncm[c] !== undefined).map((c) => ({ codigo: c, descricao: T.ncm[c] }));
}

/** As palavras de um texto, sem acento e sem pontuação. */
const palavras = (s: string) => semAcento(s).split(/[^a-z0-9]+/).filter(Boolean);

let indice: { codigo: string; proprio: string[]; tudo: string[] }[] | null = null;
function oIndice() {
  if (!indice) {
    indice = Object.keys(T.ncm)
      .filter((c) => c.length === 8)
      .sort()
      .map((c) => ({ codigo: c, proprio: palavras(T.ncm[c]), tudo: palavras(caminho(c).map((n) => n.descricao).join(" ")) }));
  }
  return indice;
}

/** O termo casa com o COMEÇO de uma palavra: "cimento" acha "cimentos", não "fornecimento". */
const tem = (lista: string[], termo: string) => lista.some((p) => p.startsWith(termo));

export type Achado = { codigo: string; descricao: string; contexto: string };
export const MAX_RESULTADOS = 40;

/**
 * Busca por código (só dígitos, a partir de 2) ou por palavras. Por palavras,
 * cada termo tem de aparecer na descrição do NCM OU dos níveis acima dele
 * ("Outros" sozinho não diz nada: o contexto vem da posição). Quem tem os
 * termos na própria descrição vem primeiro.
 */
export function buscar(q: string): { achados: Achado[]; total: number } {
  const limpo = q.trim();
  if (!limpo) return { achados: [], total: 0 };
  const digitos = limpo.replace(/[.\s-]/g, "");
  let lista: { codigo: string; peso: number }[];
  if (/^\d{2,8}$/.test(digitos)) {
    lista = oIndice().filter((n) => n.codigo.startsWith(digitos)).map((n) => ({ codigo: n.codigo, peso: 0 }));
  } else {
    const termos = palavras(limpo).filter((t) => t.length >= 2).slice(0, 6);
    if (!termos.length) return { achados: [], total: 0 };
    lista = oIndice()
      .filter((n) => termos.every((t) => tem(n.tudo, t)))
      .map((n) => ({ codigo: n.codigo, peso: termos.filter((t) => tem(n.proprio, t)).length }))
      .sort((a, b) => b.peso - a.peso || a.codigo.localeCompare(b.codigo));
  }
  return {
    total: lista.length,
    achados: lista.slice(0, MAX_RESULTADOS).map(({ codigo }) => {
      const cam = caminho(codigo);
      return { codigo, descricao: T.ncm[codigo], contexto: cam.find((n) => n.codigo.length === 4)?.descricao ?? "" };
    }),
  };
}

export type Tratamento = Classe & { anexo: string | null; condicao: string; prefixo: string };
export type Consulta = {
  codigo: string;
  descricao: string;
  caminho: { codigo: string; descricao: string }[];
  tratamentos: Tratamento[];
  seletivo: Tratamento[];
  integral: Classe;
};

/**
 * A regra da Receita para "este NCM pode usar esta classificação", copiada da
 * tabela-verdade de NcmAplicavelService (calculadora-rtc-regime-regular):
 * A = algum vínculo da classificação cobre o NCM;
 * E = alguma exceção desses vínculos cobre o NCM;
 * S = algum vínculo que cobre o NCM não tem exceção nenhuma.
 * Vale quando A e (não E ou S). O anexo modela "vínculo genérico duplicado, um
 * por exceção", por isso a regra olha os vínculos juntos, por classificação.
 */
function aplicaveis(c: string): Tratamento[] {
  const porClasse = new Map<string, Vinculo[]>();
  for (const v of T.vinculos) {
    if (!c.startsWith(v.prefixo)) continue;
    porClasse.set(v.classe, [...(porClasse.get(v.classe) ?? []), v]);
  }
  const lista: Tratamento[] = [];
  for (const [classe, vs] of porClasse) {
    const E = vs.some((v) => v.excecoes.some((e) => c.startsWith(e)));
    const S = vs.some((v) => v.excecoes.length === 0);
    if (E && !S) continue;
    // A condição mostrada é a do vínculo mais específico (prefixo mais longo).
    const v = [...vs].sort((a, b) => b.prefixo.length - a.prefixo.length)[0];
    const cl = T.classes[classe];
    if (cl) lista.push({ ...cl, anexo: v.anexo, condicao: v.condicao, prefixo: v.prefixo });
  }
  return lista.sort((a, b) => a.cClassTrib.localeCompare(b.cClassTrib));
}

export function consultar(codigo: string): Consulta | null {
  const c = codigo.replace(/\D/g, "");
  if (c.length !== 8 || T.ncm[c] === undefined) return null;
  const todos = aplicaveis(c);
  return {
    codigo: c,
    descricao: T.ncm[c],
    caminho: caminho(c),
    tratamentos: todos.filter((t) => !t.seletivo),
    seletivo: todos.filter((t) => t.seletivo),
    integral: T.classes["000001"],
  };
}
