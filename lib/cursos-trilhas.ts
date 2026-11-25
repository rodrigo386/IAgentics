import { cursos } from "@/lib/content";

/* Dados das páginas por trilha da /cursos (2026-11-25). Separado do
   componente para o teste unitário ler sem JSX. */
const t = cursos.paginasTrilha;
type Curso = { nome: string; professor?: string; capa: string; emBreve?: boolean };

export const BASE_TRILHAS = "/preview/cursos";

/** As perguntas da /cursos que valem para qualquer trilha, pelo texto (o
 *  teste confere que todas existem na FAQ da assinatura). */
export const PERGUNTAS_DA_TRILHA = [
  "O que a assinatura inclui?",
  "Os cursos têm certificado?",
  "Quantas horas de aula tem a assinatura?",
  "Os cursos são da USP?",
  "E se eu não gostar?",
];


export function dadosDaTrilha(slug: string) {
  const pagina = t.itens.find((i) => i.slug === slug);
  if (!pagina) return null;
  const linha = cursos.vitrine.linhas.find((l) => l.titulo === pagina.linha);
  if (!linha) return null;
  const lista: readonly Curso[] = linha.cursos;
  /* Publicados primeiro: quem chega pela busca quer o que já pode assistir. */
  const ordenados = [...lista.filter((c) => !c.emBreve), ...lista.filter((c) => c.emBreve)];
  return {
    pagina,
    cursos: ordenados,
    publicados: lista.filter((c) => !c.emBreve).length,
    emBreve: lista.filter((c) => c.emBreve).length,
  };
}

