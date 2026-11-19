/**
 * Confere a conta da calculadora da Reforma (lib/reforma.ts) contra a
 * calculadora OFICIAL da Receita Federal (github.com/ReceitaFederal/
 * calculadora-rtc-regime-regular, MIT), rodando na máquina.
 *
 * Grava lib/reforma-receita.json com o que a API da Receita devolveu para
 * cada ano de 2027 a 2033 e cada redução (0, 30, 60 e 100%), em duas bases.
 * O teste lib/reforma.test.ts lê esse arquivo e exige que o crédito e o
 * custo líquido da nossa conta batam com os da Receita, centavo a centavo.
 *
 * A Receita não traz alíquota de 2027 em diante (apagou as "fictícias", V0015):
 * mandamos as nossas como `aliquotasNominais`, o modo que a própria API prevê
 * (sai "CALCULO_SIMULADO"). O que se confere é a MECÂNICA (base, redução,
 * arredondamento, IBS estadual + municipal), não o valor das alíquotas.
 *
 * Como rodar (Java 21):
 *   git clone https://github.com/ReceitaFederal/calculadora-rtc-regime-regular rr && cd rr
 *   mkdir -p calculadora/db && ./mvnw flyway:migrate -Dflyway.configFiles=./flyway/flyway-pro.conf
 *   ./mvnw -DskipTests package && java -jar target/api-regime-geral.jar --spring.profiles.active=offline --server.port=8099
 *   RECEITA_COMMIT=$(git -C rr log -1 --format=%h) npx tsx scripts/conferir-receita.ts
 */
import { writeFileSync } from "node:fs";
import { ANOS, REDUCOES, aliquotasDoAno, type Ano, type Reducao } from "../lib/reforma";

const API = process.env.RECEITA_API ?? "http://127.0.0.1:8099/api/calculadora";

/** Um item real do banco da Receita para cada redução (CST, cClassTrib e NCM/NBS vinculados). */
const ITEM: Record<Reducao, { cst: string; cClassTrib: string; ncm?: string; nbs?: string; descricao: string }> = {
  0: { cst: "000", cClassTrib: "000001", ncm: "84713012", descricao: "notebook, tributação integral" },
  30: { cst: "200", cClassTrib: "200052", nbs: "113011000", descricao: "serviço de profissão intelectual" },
  60: { cst: "200", cClassTrib: "200035", ncm: "34011190", descricao: "produto de higiene pessoal (Anexo VIII)" },
  100: { cst: "200", cClassTrib: "200003", ncm: "10064000", descricao: "arroz, cesta básica (Anexo I)" },
};
const BASES = [1000, 1234.56];

type Caso = { ano: Ano; reducao: Reducao; base: number; cbs: number; ibs: number; vCBS: number; vIBS: number; estado: string; item: string };

async function main() {
  const casos: Caso[] = [];
  for (const ano of ANOS) {
    const { cbs, ibs } = aliquotasDoAno(ano);
    const itens = REDUCOES.flatMap((reducao) =>
      BASES.map((base) => ({ reducao, base, ...ITEM[reducao] })),
    );
    const corpo = {
      id: `conferencia-${ano}`,
      versao: "1.0.0",
      dhFatoGerador: `${ano}-03-10T10:00:00-03:00`,
      municipio: 3525904,
      uf: "SP",
      itens: itens.map((it, i) => ({
        numero: i + 1,
        ...(it.ncm ? { ncm: it.ncm, quantidade: 1, unidade: "UN" } : { nbs: it.nbs }),
        cst: it.cst,
        cClassTrib: it.cClassTrib,
        baseCalculo: it.base,
        // O IBS é estadual + municipal; a soma é o que a calculadora usa.
        aliquotasNominais: { cbs, ibsEstadual: ibs / 2, ibsMunicipal: ibs / 2 },
      })),
    };
    const r = await fetch(`${API}/observabilidade/regime-geral`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
    if (!r.ok) throw new Error(`API da Receita respondeu ${r.status} em ${ano}`);
    const d = (await r.json()) as { objetos: { nObj: number; estadoItem: string; tribCalc?: { IBSCBS?: { gIBSCBS?: { vIBS: string; gCBS: { vCBS: string } } } }; erros?: unknown }[] };
    for (const o of d.objetos) {
      const it = itens[o.nObj - 1];
      const g = o.tribCalc?.IBSCBS?.gIBSCBS;
      if (!g) throw new Error(`item ${o.nObj} de ${ano} sem cálculo: ${o.estadoItem} ${JSON.stringify(o.erros)}`);
      casos.push({ ano, reducao: it.reducao, base: it.base, cbs, ibs, vCBS: Number(g.gCBS.vCBS), vIBS: Number(g.vIBS), estado: o.estadoItem, item: it.descricao });
    }
  }
  const saida = {
    fonte: "https://github.com/ReceitaFederal/calculadora-rtc-regime-regular",
    commit: process.env.RECEITA_COMMIT ?? "desconhecido",
    geradoEm: new Date().toISOString().slice(0, 10),
    casos,
  };
  writeFileSync("lib/reforma-receita.json", JSON.stringify(saida, null, 2) + "\n");
  console.log(`${casos.length} casos gravados em lib/reforma-receita.json`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
