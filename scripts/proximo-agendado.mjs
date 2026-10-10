#!/usr/bin/env node
/**
 * Publica o PRÓXIMO artigo agendado cuja data já chegou (2026-10-09, pedido do
 * Rodrigo: "1 artigo por dia"). Chamado por scripts/publicar-agendado.sh.
 *
 * Agendado = frontmatter `status: "agendado"` + `publicarEm: AAAA-MM-DD`.
 * Publicar = `status: "publicado"`, `data:` vira o dia de hoje (a data que o
 * leitor e o Google veem é a do dia em que foi ao ar) e `publicarEm` sai.
 *
 * NO MÁXIMO UM por execução, o de `publicarEm` mais antigo: se o Mac ficou
 * desligado três dias, a fila anda um por dia em vez de despejar três de uma
 * vez. Recusa artigo com "[VALIDAR]": número sem fonte não vai ao ar.
 *
 * Saída (stdout): o slug publicado, ou nada se não havia o que publicar.
 * Código 2 = o próximo da fila tem [VALIDAR] (o shell avisa o Rodrigo).
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "content", "artigos");
const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());

const fila = readdirSync(DIR)
  .filter((n) => n.endsWith(".md") && n !== "README.md")
  .map((n) => ({ n, s: readFileSync(join(DIR, n), "utf8") }))
  .map((a) => ({ ...a, status: a.s.match(/^status:\s*"?(\w+)"?\s*$/m)?.[1], quando: a.s.match(/^publicarEm:\s*"?(\d{4}-\d{2}-\d{2})"?\s*$/m)?.[1] }))
  .filter((a) => a.status === "agendado" && a.quando && a.quando <= hoje)
  .sort((a, b) => a.quando.localeCompare(b.quando));

if (fila.length === 0) process.exit(0);
const a = fila[0];
if (a.s.includes("[VALIDAR]")) {
  console.error(`${a.n} tem [VALIDAR]: não publiquei.`);
  process.exit(2);
}
const novo = a.s
  .replace(/^status:\s*"?agendado"?\s*$/m, 'status: "publicado"')
  .replace(/^data:\s*.*$/m, `data: ${hoje}`)
  .replace(/^publicarEm:.*\n/m, "");
writeFileSync(join(DIR, a.n), novo);
console.log(a.n.replace(/\.md$/, ""));
