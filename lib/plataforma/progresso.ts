import type { Aula, Modulo } from "./tipos";

export function derivarProgresso(aulaIds: string[], concluidas: Set<string>) {
  const total = aulaIds.length;
  const feitas = aulaIds.filter((id) => concluidas.has(id)).length;
  return { feitas, total, pct: total === 0 ? 0 : Math.round((feitas / total) * 100) };
}

export function proximaAula(modulos: Modulo[], concluidas: Set<string>): Aula | null {
  const ordenados = [...modulos].sort((a, b) => a.ordem - b.ordem);
  for (const m of ordenados) {
    for (const a of [...m.aulas].sort((x, y) => x.ordem - y.ordem)) {
      if (!concluidas.has(a.id)) return a;
    }
  }
  return null;
}
