export type Aula = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  duracaoSeg: number;
  ordem: number;
  gratuita: boolean;
};

export type Modulo = {
  id: string;
  titulo: string;
  ordem: number;
  aulas: Aula[];
};

export type Curso = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  capaUrl: string;
  nivel: string;
  cargaHoras: number;
  ordem: number;
};

export type CursoComIndice = Curso & { modulos: Modulo[] };

export type StatusAssinatura = "manual" | "ativa" | "inadimplente" | "cancelada" | null;
