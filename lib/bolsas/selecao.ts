/**
 * Seleção do Desafio Prova Real (painel /admin/bolsas). Puro, para os testes
 * cobrirem sem banco.
 *
 * A régua é a do regulamento: clareza do problema e entendimento da solução
 * em 30 dias, as duas em nota pela resposta; seguir a @iagenticsacademy e
 * publicar o post, em sim ou não pelo perfil público. Quem não cumpriu os dois
 * últimos não concorre. O desempate é a data da inscrição (rascunho do
 * regulamento, a confirmar pelo advogado).
 */
export const NOTA_MAX = 10;
export const VAGAS = 50;

export type Avaliacao = {
  clareza: number | null;
  solucao30Dias: number | null;
  seguiuAcademy: boolean | null;
  publicouPost: boolean | null;
};

/** Tudo preenchido: só linha avaliada entra numa decisão. */
export function avaliada(a: Avaliacao): boolean {
  return a.clareza !== null && a.solucao30Dias !== null && a.seguiuAcademy !== null && a.publicouPost !== null;
}

/** Cumpriu os dois critérios de perfil. */
export function elegivel(a: Avaliacao): boolean {
  return a.seguiuAcademy === true && a.publicouPost === true;
}

/** Soma das duas notas, ou null enquanto faltar uma. */
export function pontuacao(a: Avaliacao): number | null {
  return a.clareza !== null && a.solucao30Dias !== null ? a.clareza + a.solucao30Dias : null;
}

/** Nota que veio do formulário: inteiro de 0 a 10, ou null (vazio ou inválido). */
export function lerNota(v: unknown): number | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= NOTA_MAX ? n : null;
}

/** "sim" / "nao" do formulário; qualquer outra coisa é "ainda não avaliado". */
export function lerSimNao(v: unknown): boolean | null {
  return v === "sim" ? true : v === "nao" ? false : null;
}

type Linha = Avaliacao & { id: string; criadaEm: Date };

/** Maior pontuação primeiro; empate pela inscrição mais antiga; o id fecha o empate total. */
function porMerito(a: Linha, b: Linha): number {
  return (pontuacao(b) ?? 0) - (pontuacao(a) ?? 0) || a.criadaEm.getTime() - b.criadaEm.getTime() || a.id.localeCompare(b.id);
}

/**
 * Quem sobe e quem não sobe, entre as linhas ainda "inscrito". Só decide as
 * avaliadas; as incompletas ficam como estão. Das avaliadas, as elegíveis
 * mais bem pontuadas ocupam as vagas que restam; o resto vira não
 * selecionado.
 */
export function decidir(linhas: Linha[], vagasRestantes: number): { selecionar: string[]; naoSelecionar: string[] } {
  const prontas = linhas.filter(avaliada);
  const ranking = prontas.filter(elegivel).sort(porMerito);
  const vagas = Math.max(0, vagasRestantes);
  const sobem = new Set(ranking.slice(0, vagas).map((l) => l.id));
  return {
    selecionar: [...sobem],
    naoSelecionar: prontas.filter((l) => !sobem.has(l.id)).map((l) => l.id),
  };
}

/** Ordem do painel: ranking de quem concorre, depois o restante por data. */
export function ordenarPainel<T extends Linha>(linhas: T[]): T[] {
  const concorre = linhas.filter((l) => avaliada(l) && elegivel(l)).sort(porMerito);
  const resto = linhas.filter((l) => !(avaliada(l) && elegivel(l))).sort((a, b) => a.criadaEm.getTime() - b.criadaEm.getTime());
  return [...concorre, ...resto];
}
