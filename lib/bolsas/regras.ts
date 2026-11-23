/**
 * Regras do Desafio Prova Real (/bolsas, docs/PLANO-BOLSAS.md). Puras: o
 * formulário e o servidor validam com o mesmo código, e os testes cobrem sem
 * banco.
 *
 * As datas são instantes com fuso de São Paulo escrito, para "5 de dezembro às
 * 23h59" significar o mesmo no container em UTC e no navegador.
 *
 * Refeita em 2026-11-18 (mapa da campanha): saíram o vídeo de entrada, as
 * cotas por nível e os campos de cargo, nível, área e tamanho do time.
 */
export const INSCRICOES_ABREM = new Date("2026-11-23T00:00:00-03:00");
export const INSCRICOES_FECHAM = new Date("2026-12-05T23:59:59-03:00");

export type Fase = "antes" | "abertas" | "encerradas";

export function faseDasInscricoes(agora: Date): Fase {
  if (agora < INSCRICOES_ABREM) return "antes";
  if (agora > INSCRICOES_FECHAM) return "encerradas";
  return "abertas";
}

/**
 * A hora do servidor. `BOLSAS_RELOGIO` existe para o e2e testar a janela
 * aberta fora das datas reais (playwright.config.ts); em produção não é
 * definida.
 */
export function agoraBolsas(): Date {
  const fixo = process.env.BOLSAS_RELOGIO;
  return fixo ? new Date(fixo) : new Date();
}

export const PROBLEMA_MIN = 20;
export const PROBLEMA_MAX = 600;

export type InscricaoValida = {
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  instagram: string | null;
  linkedin: string | null;
  problema: string;
  contatoComercial: boolean;
  grupoWhatsapp: boolean;
  usoImagem: boolean;
};

export type Motivo = "nome" | "email" | "whatsapp" | "perfis" | "problema" | "regulamento" | "cienciaDados";

const texto = (v: unknown, max = 160) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

/**
 * Instagram: aceita "@perfil", "perfil" ou o endereço do perfil, e guarda
 * sempre o endereço, que é o que a equipe abre. Devolve null se não der para
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
  /* Opcional desde 2026-11-23: a primeira inscrição do lançamento travou no
     campo de quem não está trabalhando. Vazio é gravado como "". */
  const empresa = texto(c.empresa, 120);

  /* Os dois campos vazios, ou algum preenchido com algo que não é perfil:
     melhor avisar agora do que a equipe achar um link quebrado. */
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
      empresa,
      instagram,
      linkedin,
      problema,
      contatoComercial: c.contatoComercial === true,
      grupoWhatsapp: c.grupoWhatsapp === true,
      usoImagem: c.usoImagem === true,
    },
  };
}

/** Token da inscrição: 32 bytes aleatórios em base64url. A coluna é única e
 *  obrigatória; desde 2026-11-18 nenhum link o usa (o vídeo saiu), mas ele
 *  fica como identificador que não é o e-mail. */
export function novoToken(): string {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return Buffer.from(b).toString("base64url");
}

/** Preço de fundador (R$ 29,90 por 12 meses; decisão do Rodrigo, 2026-11-03,
 *  confirmada para o Prova Real em 2026-11-18). O texto está em
 *  `PRECO_FUNDADOR` (content.ts); o teste confere os dois. */
export const VALOR_FUNDADOR_CENTAVOS = 2990;
export const MESES_FUNDADOR = 12;

/** Desconto do preço de fundador sobre o preço público, arredondado. */
export function descontoFundador(publicoCentavos: number): number {
  return Math.round((1 - VALOR_FUNDADOR_CENTAVOS / publicoCentavos) * 100);
}
