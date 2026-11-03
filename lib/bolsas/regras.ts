import { bolsas } from "@/lib/content";

/**
 * Regras do Desafio das 50 Bolsas (2026-11-03, docs/PLANO-BOLSAS.md). Puras:
 * o formulário e o servidor validam com o mesmo código, e os testes cobrem
 * sem banco.
 *
 * As datas são instantes com fuso de São Paulo escrito, para "11 de novembro
 * às 23h59" significar o mesmo no container em UTC e no navegador.
 */
export const INSCRICOES_ABREM = new Date("2026-11-05T00:00:00-03:00");
export const INSCRICOES_FECHAM = new Date("2026-11-11T23:59:59-03:00");
export const PRAZO_VIDEO = new Date("2026-11-15T23:59:59-03:00");

export type Fase = "antes" | "abertas" | "encerradas";

export function faseDasInscricoes(agora: Date): Fase {
  if (agora < INSCRICOES_ABREM) return "antes";
  if (agora > INSCRICOES_FECHAM) return "encerradas";
  return "abertas";
}

export function videoAberto(agora: Date): boolean {
  return agora >= INSCRICOES_ABREM && agora <= PRAZO_VIDEO;
}

/**
 * A hora do servidor. `BOLSAS_RELOGIO` existe para o e2e testar a janela
 * aberta antes de 05/11 (playwright.config.ts); em produção não é definida.
 */
export function agoraBolsas(): Date {
  const fixo = process.env.BOLSAS_RELOGIO;
  return fixo ? new Date(fixo) : new Date();
}

export type Nivel = keyof typeof bolsas.formulario.niveis;
export type Area = keyof typeof bolsas.formulario.areas;
export type TamanhoTime = keyof typeof bolsas.formulario.tamanhos;

export const NIVEIS = Object.keys(bolsas.formulario.niveis) as Nivel[];
export const AREAS = Object.keys(bolsas.formulario.areas) as Area[];
export const TAMANHOS = Object.keys(bolsas.formulario.tamanhos) as TamanhoTime[];

/** O grupo de cota de cada nível (seção 6 do regulamento). "Outro" concorre
 *  só pela lista geral. */
export type Grupo = "praticantes" | "gestores" | "vozes" | "geral";
export function grupoDoNivel(n: Nivel): Grupo {
  if (n === "analista" || n === "coordenador") return "praticantes";
  if (n === "gerente" || n === "diretor") return "gestores";
  if (n === "voz") return "vozes";
  return "geral";
}

export const PROBLEMA_MIN = 20;
export const PROBLEMA_MAX = 600;

export type InscricaoValida = {
  nome: string;
  email: string;
  whatsapp: string;
  cargo: string;
  nivel: Nivel;
  empresa: string;
  area: Area;
  tamanhoTime: TamanhoTime;
  instagram: string | null;
  linkedin: string | null;
  problema: string;
  contatoComercial: boolean;
  usoImagem: boolean;
};

export type Motivo =
  | "nome"
  | "email"
  | "whatsapp"
  | "cargo"
  | "nivel"
  | "empresa"
  | "area"
  | "tamanhoTime"
  | "perfis"
  | "problema"
  | "regulamento"
  | "cienciaDados";

const texto = (v: unknown, max = 160) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/**
 * Instagram: aceita "@perfil", "perfil" ou o endereço do perfil, e guarda
 * sempre o endereço, que é o que a banca abre. Devolve null se não der para
 * ler um perfil.
 */
export function normalizarInstagram(v: unknown): string | null {
  const s = texto(v, 200);
  if (!s) return null;
  const m = s.match(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:\?.*)?$/i) ?? s.match(/^@?([A-Za-z0-9._]{1,30})$/);
  return m ? `https://www.instagram.com/${m[1]}` : null;
}

/** LinkedIn: só o endereço de um perfil (/in/...) ou de uma página. */
export function normalizarLinkedin(v: unknown): string | null {
  const s = texto(v, 300);
  if (!s) return null;
  const m = s.match(/^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(in|company)\/([^/?#\s]{2,100})\/?(?:[?#].*)?$/i);
  return m ? `https://www.linkedin.com/${m[1].toLowerCase()}/${m[2]}` : null;
}

export function validarInscricao(corpo: unknown): { ok: true; dados: InscricaoValida } | { ok: false; motivo: Motivo } {
  const c = (corpo && typeof corpo === "object" ? corpo : {}) as Record<string, unknown>;

  const nome = texto(c.nome, 120);
  if (nome.length < 3 || !nome.includes(" ")) return { ok: false, motivo: "nome" };
  const email = texto(c.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, motivo: "email" };
  const whatsapp = texto(c.whatsapp, 40).replace(/\D/g, "");
  if (whatsapp.length < 10 || whatsapp.length > 13) return { ok: false, motivo: "whatsapp" };
  const cargo = texto(c.cargo, 120);
  if (cargo.length < 2) return { ok: false, motivo: "cargo" };
  if (!NIVEIS.includes(c.nivel as Nivel)) return { ok: false, motivo: "nivel" };
  const empresa = texto(c.empresa, 120);
  if (empresa.length < 2) return { ok: false, motivo: "empresa" };
  if (!AREAS.includes(c.area as Area)) return { ok: false, motivo: "area" };
  if (!TAMANHOS.includes(c.tamanhoTime as TamanhoTime)) return { ok: false, motivo: "tamanhoTime" };

  /* Os dois campos vazios, ou algum preenchido com algo que não é perfil:
     melhor avisar agora do que a banca achar um link quebrado. */
  const instagram = normalizarInstagram(c.instagram);
  const linkedin = normalizarLinkedin(c.linkedin);
  const preencheuIg = texto(c.instagram) !== "";
  const preencheuLi = texto(c.linkedin) !== "";
  if ((!instagram && !linkedin) || (preencheuIg && !instagram) || (preencheuLi && !linkedin)) return { ok: false, motivo: "perfis" };

  /* O problema guarda as quebras de linha (são "5 linhas"), mas não brancos
     sobrando. */
  const problema = typeof c.problema === "string" ? c.problema.trim().replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n") : "";
  if (problema.length < PROBLEMA_MIN || problema.length > PROBLEMA_MAX) return { ok: false, motivo: "problema" };

  if (c.regulamento !== true) return { ok: false, motivo: "regulamento" };
  if (c.cienciaDados !== true) return { ok: false, motivo: "cienciaDados" };

  return {
    ok: true,
    dados: {
      nome,
      email,
      whatsapp,
      cargo,
      nivel: c.nivel as Nivel,
      empresa,
      area: c.area as Area,
      tamanhoTime: c.tamanhoTime as TamanhoTime,
      instagram,
      linkedin,
      problema,
      contatoComercial: c.contatoComercial === true,
      usoImagem: c.usoImagem === true,
    },
  };
}

/**
 * O link do vídeo: https, de uma das redes que o regulamento cita (Instagram
 * ou LinkedIn para post público; YouTube ou Google Drive para link privado).
 * Lista fechada porque a banca vai abrir 200 links: endereço desconhecido é
 * mais provável erro de colagem do que vídeo.
 */
const HOSTS_VIDEO = ["instagram.com", "linkedin.com", "youtube.com", "youtu.be", "drive.google.com"];

export function validarVideo(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s.length > 500) return null;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.toLowerCase();
  const permitido = HOSTS_VIDEO.some((h) => host === h || host.endsWith(`.${h}`));
  if (!permitido || u.pathname.length < 2) return null;
  return u.toString();
}

/** Token do link pessoal: 32 bytes aleatórios em base64url. */
export function novoToken(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Buffer.from(b).toString("base64url");
}

export function tokenValido(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_-]{43}$/.test(v);
}

/** Preço de fundador (R$ 29,90 por 12 meses; decisão do Rodrigo, 2026-11-03).
 *  O texto está em `PRECO_FUNDADOR` (content.ts); o teste confere os dois. */
export const VALOR_FUNDADOR_CENTAVOS = 2990;
export const MESES_FUNDADOR = 12;

/** Desconto do preço de fundador sobre o preço público, arredondado. */
export function descontoFundador(publicoCentavos: number): number {
  return Math.round((1 - VALOR_FUNDADOR_CENTAVOS / publicoCentavos) * 100);
}
