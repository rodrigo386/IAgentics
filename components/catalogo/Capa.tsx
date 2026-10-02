import Image from "next/image";
import type { Tema } from "@/lib/content";
import { catalogo as t } from "@/lib/content";

/**
 * Capa de curso "estilo Netflix" (2026-09-26): foto + título (o nível saiu da capa em 2026-10-02).
 *
 * Qual foto: o curso com `foto` própria em content.ts usa a dele (o assunto
 * casa); os demais recebem as fotos do tema principal (`fotosPorTema`) em
 * rodízio. Tudo determinístico: a mesma capa sempre, no servidor e no cliente.
 *
 * O recorte esconde o logo "IAgentics Academy" que vem impresso no canto
 * superior esquerdo das fotos: repetido em 63 capas ele vira ruído, e brigaria
 * com o rótulo do nível. Na paisagem (16:9) a faixa central de uma foto 4:5 já
 * deixa o logo de fora; no retrato (2:3) a foto é ampliada a partir do pé, e o
 * canto de cima sai do quadro.
 *
 * Substituiu, a pedido do Rodrigo, a primeira versão (desenhos em SVG por tema).
 *
 * CURSO COM FOTO DE GENTE (`fotoDePessoa`, ou `professor`, 2026-09-29): a capa vira
 * cartaz de filme — a foto é de gente, não de cena, então o enquadramento
 * segura o rosto, uma vinheta escura apaga o fundo (o quadro do vídeo-convite
 * tem um mural com letreiro que competiria com o título) e entra o crédito
 * "Com <professor>" sobre o título. Essas fotos não têm o logo impresso das
 * fotos da Academy, então dispensam a ampliação que o esconde.
 */

/** Hash FNV-1a — pequeno, determinístico e sem dependência. */
function hash(texto: string) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type CursoCapa = {
  slug: string;
  nome: string;
  nivel: number;
  temas: readonly Tema[];
  introdutorio?: boolean;
  foto?: string;
  fotoDePessoa?: boolean;
  enquadre?: { retrato?: string; paisagem?: string; banner?: string };
  professor?: string;
  preco?: { cheioCentavos: number; promoCentavos: number };
};

/* Rodízio por tema, na ordem do catálogo: o n-ésimo curso sem foto própria de
   um tema pega a n-ésima foto desse tema. Um sorteio por hash pôs a mesma foto
   em cursos vizinhos (Coleta de Dados e Indicadores, lado a lado) — o rodízio
   garante que cursos seguidos do mesmo tema nunca repitam. Calculado uma vez. */
const FOTO_POR_SLUG = (() => {
  const mapa = new Map<string, string>();
  const contagem = new Map<Tema, number>();
  for (const c of t.cursos) {
    if (c.foto) continue;
    const tema = c.temas[0] ?? "rotina";
    const n = contagem.get(tema) ?? 0;
    const opcoes = t.fotosPorTema[tema];
    mapa.set(c.slug, opcoes[n % opcoes.length]);
    contagem.set(tema, n + 1);
  }
  return mapa;
})();

export function fotoDoCurso(curso: CursoCapa): string {
  return curso.foto ?? FOTO_POR_SLUG.get(curso.slug) ?? t.fotosPorTema[curso.temas[0] ?? "rotina"][0];
}

type Props = {
  curso: CursoCapa;
  /** retrato 2:3 (pôster) ou paisagem 16:9 (miniatura de prateleira). */
  formato?: "retrato" | "paisagem";
  /** Sem título nem rótulo: miniatura ou fundo, quando o nome aparece ao lado. */
  semTitulo?: boolean;
  /** Ocupa o contêiner inteiro, sem proporção fixa. */
  preencher?: boolean;
  /** Largura renderizada, para o next/image escolher o arquivo certo. */
  sizes?: string;
  className?: string;
};

export function Capa({ curso, formato = "retrato", semTitulo = false, preencher = false, sizes, className = "" }: Props) {
  const retrato = formato === "retrato";
  // Cartaz: foto de gente (com ou sem o nome do professor no crédito).
  const professor = curso.fotoDePessoa ?? Boolean(curso.professor);
  // Pequena variação de enquadramento entre cursos que dividem a mesma foto.
  const x = 40 + (hash(curso.slug + "x") % 21);
  const padrao = professor ? (retrato ? "52% 0%" : "50% 30%") : retrato ? `${x}% 100%` : `${x}% 48%`;
  // O curso pode ajustar o recorte da própria foto (cada foto de gente tem o
  // rosto num lugar diferente).
  const enquadre = (retrato ? curso.enquadre?.retrato : curso.enquadre?.paisagem) ?? padrao;

  return (
    <div
      className={`capa relative overflow-hidden bg-brand-ink [container-type:inline-size] ${preencher ? "h-full w-full" : retrato ? "aspect-[2/3]" : "aspect-video"} ${className}`}
      aria-hidden={semTitulo ? true : undefined}
    >
      {/* Professor no retrato: a foto desce 14% e o topo vira tinta. O quadro
          do vídeo tem a cabeça encostada na borda de cima; sem esse respiro, o
          cartaz cortava o alto da cabeça. */}
      <div
        className={`absolute inset-x-0 bottom-0 ${professor && retrato ? "top-[14%]" : "top-0"} ${retrato && !professor ? "origin-[65%_92%] scale-[1.28]" : ""}`}
        // A foto nasce do escuro: sem a máscara, a borda de cima dela fazia uma
        // linha dura contra a tinta do respiro.
        style={professor && retrato ? { maskImage: "linear-gradient(to bottom, transparent, black 18%)", WebkitMaskImage: "linear-gradient(to bottom, transparent, black 18%)" } : undefined}
      >
        <Image
          src={fotoDoCurso(curso)}
          alt=""
          fill
          sizes={sizes ?? (retrato ? "(min-width: 1024px) 220px, 33vw" : "(min-width: 640px) 300px, 72vw")}
          className="capa-arte object-cover"
          style={{ objectPosition: enquadre }}
        />
      </div>

      {/* Vinheta de cartaz: o professor fica na luz, o fundo apaga. Vale até sem
          título (miniatura, estante), porque é o que tira o letreiro do mural. */}
      {professor ? (
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: retrato
              ? "linear-gradient(to bottom, rgb(19 23 35) 12%, transparent 24%), radial-gradient(ellipse 62% 48% at 52% 38%, transparent 30%, rgb(19 23 35 / 0.92) 100%)"
              : "radial-gradient(ellipse 27% 72% at 51% 36%, transparent 40%, rgb(19 23 35 / 0.96) 100%)",
          }}
        />
      ) : null}

      {/* Véus: o de baixo sustenta o título, o de cima o rótulo do nível. */}
      {semTitulo ? null : (
        <>
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-brand-ink via-brand-ink/70 to-transparent" />
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-brand-ink/70 to-transparent" />
          {/* Sem o nível na capa (pedido do Rodrigo, 2026-10-02): só o selo de
              curso introdutório, que diz por onde começar. */}
          {curso.introdutorio ? (
            <span className="absolute left-0 top-0 p-[6%] font-mono text-[10px] uppercase tracking-[0.18em] text-brand-paper/85">
              {t.introdutorio}
            </span>
          ) : null}
          {/* Selo de lançamento: o "Novo" da Netflix, para o curso com preço de
              promoção. Fill violeta é uso sancionado do acento (DESIGN.md §1). */}
          {curso.preco && curso.preco.promoCentavos < curso.preco.cheioCentavos ? (
            <span className="absolute right-[5%] top-[5%] rounded-control bg-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-on">
              {t.lancamento}
            </span>
          ) : null}
          {/* Crédito e título no mesmo bloco, para o crédito subir junto quando
              o título quebra em mais linhas. */}
          <div className="absolute inset-x-0 bottom-0 p-[7%]">
            {curso.professor ? (
              <p className="mb-[3%] font-mono text-[10px] uppercase tracking-[0.18em] text-brand-paper/80">{t.capaCom(curso.professor)}</p>
            ) : null}
            <p
              className={`font-medium leading-[1.05] tracking-[-0.02em] text-brand-paper [text-wrap:balance] ${
                retrato ? "text-[clamp(1rem,7cqw,1.6rem)]" : "text-[clamp(0.95rem,5.5cqw,1.5rem)]"
              }`}
            >
              {curso.nome}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
