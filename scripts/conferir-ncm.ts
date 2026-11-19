/**
 * Confere a consulta de NCM do site (lib/consulta-ncm.ts) contra a calculadora
 * OFICIAL da Receita (calculadora-rtc-regime-regular, MIT), rodando na máquina
 * (como subir: ver scripts/conferir-receita.ts).
 *
 * Para cada NCM de 8 dígitos coberto por algum vínculo especial de IBS/CBS, e
 * para cada classificação candidata (alguma linha da tabela cobre o NCM),
 * pergunta à Receita se ela aceita o par: a API recusa com REG-011 ("NCM não
 * vinculada à Classificação Tributária"). Grava lib/receita/consulta-receita.json;
 * lib/consulta-ncm.test.ts exige que a consulta do site diga o mesmo em todos.
 *
 * Imposto Seletivo fica de fora: a validação dele é outra.
 */
import { writeFileSync } from "node:fs";
import tabela from "../lib/receita/tabela-ncm.json";

const API = process.env.RECEITA_API ?? "http://127.0.0.1:8099/api/calculadora";
type V = { prefixo: string; classe: string };
const T = tabela as unknown as { ncm: Record<string, string>; classes: Record<string, { cst: string; seletivo: boolean }>; vinculos: V[]; commit: string; versaoBase: string };

const pares: { ncm: string; cClassTrib: string }[] = [];
const vistos = new Set<string>();
const ncms = Object.keys(T.ncm).filter((c) => c.length === 8);
for (const ncm of ncms) {
  for (const v of T.vinculos) {
    if (v.classe.endsWith(":is") || !ncm.startsWith(v.prefixo)) continue;
    const k = `${ncm}|${v.classe}`;
    if (!vistos.has(k)) {
      vistos.add(k);
      pares.push({ ncm, cClassTrib: v.classe });
    }
  }
}

async function main() {
  const resultado: { ncm: string; cClassTrib: string; aceito: boolean }[] = [];
  let indeterminados = 0;
  for (let i = 0; i < pares.length; i += 50) {
    const lote = pares.slice(i, i + 50);
    const corpo = {
      id: `ncm-${i}`,
      versao: "1.0.0",
      dhFatoGerador: "2027-03-10T10:00:00-03:00",
      municipio: 3525904,
      uf: "SP",
      itens: lote.map((p, j) => ({
        numero: j + 1,
        ncm: p.ncm,
        cst: T.classes[p.cClassTrib].cst,
        cClassTrib: p.cClassTrib,
        baseCalculo: 100,
        quantidade: 1,
        unidade: "UN",
        aliquotasNominais: { cbs: 11.2, ibsEstadual: 0.05, ibsMunicipal: 0.05 },
      })),
    };
    const r = await fetch(`${API}/observabilidade/regime-geral`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
    if (!r.ok) throw new Error(`Receita respondeu ${r.status}`);
    const d = (await r.json()) as { objetos: { nObj: number; estadoItem: string; erros?: { code: string }[] }[] };
    for (const o of d.objetos) {
      const p = lote[o.nObj - 1];
      const codigos = (o.erros ?? []).map((e) => e.code);
      if (o.estadoItem.startsWith("CALCULO")) resultado.push({ ...p, aceito: true });
      else if (codigos.includes("REG-011")) resultado.push({ ...p, aceito: false });
      else indeterminados++;
    }
  }
  writeFileSync(
    "lib/receita/consulta-receita.json",
    JSON.stringify({ commit: T.commit, versaoBase: T.versaoBase, pares: resultado.map((p) => [p.ncm, p.cClassTrib, p.aceito ? 1 : 0]) }) + "\n",
  );
  console.log(`${resultado.length} pares conferidos (${resultado.filter((p) => p.aceito).length} aceitos), ${indeterminados} indeterminados`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
