/**
 * A folha de tempo dos filmes dos módulos do Nexo (o exemplo abaixo é o Spend via NF). Filme mudo, então o tempo vem de uma
 * grade escolhida, não de uma música: 120 BPM, compasso de 4 tempos = 2 s.
 * Nenhuma cena guarda número de quadro: tudo é `b(compasso, tempo)`.
 *
 *   0-2 s   frase 1  "Recebe a nota fiscal"
 *   2-6 s   a NF é lida e os campos voam para o banco de notas (42 → 43)
 *   6-8 s   frase 2  "Classifica cada gasto"
 *   8-12 s  categoria, país e cadência se preenchem; a visão geral se monta
 *  12-14 s  frase 3  "Gera insights de economia"
 *  14-18 s  as recomendações com o score enchendo
 *  18-21 s  a prova: "$216k" e a unidade da página
 *  21-22 s  papel vazio, igual ao quadro 0: o loop fecha sem emenda
 */
export const BPM = 120;
const TEMPO = 60 / BPM;

/** Segundos no compasso `c` (a partir de 0) e no tempo `tempo` (1 a 4, aceita fração). */
export const b = (c: number, tempo = 1) => (c * 4 + (tempo - 1)) * TEMPO;

export const CENAS = {
  frase1: { de: b(0, 1), ate: b(1, 1) - 0.1 },
  nota: { de: b(1, 1), ate: b(3, 1) - 0.1 },
  frase2: { de: b(3, 1), ate: b(4, 1) - 0.1 },
  classifica: { de: b(4, 1), ate: b(6, 1) - 0.1 },
  frase3: { de: b(6, 1), ate: b(7, 1) - 0.1 },
  recomenda: { de: b(7, 1), ate: b(9, 1) - 0.1 },
  prova: { de: b(9, 1), ate: b(10, 3) - 0.1 },
};

export const DURACAO = b(11, 1); // 22 s
