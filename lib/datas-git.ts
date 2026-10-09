import "server-only";
import { execFileSync } from "node:child_process";

/**
 * A data REAL da última modificação de um arquivo ou pasta, lida do git no
 * build (2026-10-09, `lastmod` do sitemap e `dateModified` dos artigos).
 *
 * Por que git e não a data do build: carimbar o build faria todo endereço
 * parecer modificado a cada deploy — sinal falso que o Google aprende a
 * ignorar. O commit diz quando aquele conteúdo mudou de verdade.
 *
 * O build roda na máquina (scripts/deploy-railway.sh), onde o git existe. Se
 * um dia não existir, cai na data do build, como o Prompt 1 do Rodrigo prevê.
 */
const BUILD = new Date().toISOString().slice(0, 10);
const cache = new Map<string, string>();

export function dataDoGit(...caminhos: string[]): string {
  const chave = caminhos.join("|");
  const guardada = cache.get(chave);
  if (guardada) return guardada;
  let data = BUILD;
  try {
    const saida = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...caminhos], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(saida)) data = saida;
  } catch {
    /* sem git: fica a data do build */
  }
  cache.set(chave, data);
  return data;
}
